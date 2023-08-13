const Airtable = require("airtable");
const { json } = require("express");
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const base = new Airtable({ apiKey }).base(baseId);
const fs = require("fs");
const path = require("path");

const createRecord = async (data, Table) => {
  try {
    const createdRecord = await base(Table).create(data);
    return createdRecord;
  } catch (error) {
    console.log(error);
    throw error; // Throw the error to be caught by the caller
  }
};

const fetchGameData = async () => {
  try {
    const records = await base("Games")
      .select({
        fields: ["GameID", "GameName"],
      })
      .all();
    const gameData = records.map((record) => ({
      id: record.get("GameID"),
      name: record.get("GameName"),
    }));
    return gameData;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

const getFile = (pdfArray, name) => {
  for (const file of pdfArray) {
    if (file.originalname === name) {
      const uploadsPath = path.join(__dirname, "./../../uploads"); // Adjust the path as needed
      const filePath = path.join(uploadsPath, name);
      fs.writeFileSync(filePath, file.buffer);
      return filePath;
    }
  }
  return null;
};

const formatedDataformatGameData = (data, GameId) => {
  return {
    GameID: GameId,
    GameName: data.GameName,
    GoogleSheet: data.GoogleSheet,
    NumberOfRounds: parseInt(data.NumberOfRounds),
    ResultsSubbmision: data.ResultsSubbmision,
    ScoreVisibilityForPlayers: data.ScoreVisibility,
    RolesAutoSelection: data.RoleSelection,
    IndividualInstructionsPerRound: data.IndividualInstructions,
  };
};

const formatRoleData = (data, GameId, LevelDescription) => {
  const records = data.map((datum) => ({
    fields: {
      GameID: GameId, // Update with the actual GameID
      Role: JSON.parse(datum).role,
      Submit: JSON.parse(datum).checked,
      Description: LevelDescription,
    },
  }));
  return records;
};

const formatLevelData = (
  data,
  GameId,
  pdfArray,
  NumberOfRounds,
  IndividualInstructionsPerRound,
) => {
  const records = data.map((datum) => {
    const parsedDatum = JSON.parse(datum);
    const role = parsedDatum.role;

    if (IndividualInstructionsPerRound) {
      const levelRecords = [];
      for (let i = 1; i <= NumberOfRounds; i++) {
        levelRecords.push({
          fields: {
            GameID: GameId,
            Role: role,
            Level: i,
            LevelDescription: getFile(pdfArray, `${role}_Level${i}.pdf`),
          },
        });
      }
      return levelRecords;
    } else {
      return {
        fields: {
          GameID: GameId,
          Role: role,
          Level: 0,
          LevelDescription: "No",
        },
      };
    }
  });

  // Flatten the nested arrays into a single array of records
  return records.flat();
};

const startGame = async (data) => {
  try {
    const formatedData = {
      GameID: data.gameId,
      RoomNumber: data.roomNumber,
      TotalPlayers: parseInt(data.numberOfPlayers),
      GroupSize: parseInt(data.playersPerGroup),
      TotalGrops: parseInt(data.numbersOfGroups),
    };
    await createRecord(formatedData, "GameInitiated");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error creating game:", error);
  }
};

const createGame = async (pdf, data, roles) => {
  try {
    let LevelDescription = "";
    const UniqueCode = generateUniqueCode(7);
    const GameData = formatGameData(JSON.parse(data), UniqueCode);
    if (!GameData.IndividualInstructionsPerRound) {
      LevelDescription = getFile(pdf, "individualPdf.pdf");
    }
    const RoleData = formatRoleData(roles, UniqueCode, LevelDescription);
    const LevelData = formatLevelData(
      roles,
      UniqueCode,
      pdf,
      GameData.NumberOfRounds,
      GameData.IndividualInstructionsPerRound,
    );
    await createRecord(GameData, "Games");
    await createRecord(RoleData, "Role");
    await createRecord(LevelData, "Level");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error creating game:", error);
  }
};

function generateUniqueCode(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  const timestamp = Date.now().toString(36).toUpperCase(); // Convert timestamp to base36 and uppercase
  code = timestamp + code;

  return code.substring(0, length); // Return only the desired length
}

// Generate a code of length 7

// Export the functions
module.exports = {
  createGame,
  fetchGameData,
  startGame,
};
