const { createRecord } = require("../controller/airtable");
const {
  parseAndFormatGameData,
  parseAndFormatLevelData,
  parseAndFormatRoleData,
  parseJoinGameData,
  parseGameData,
} = require("../util/parse");

const { generateUniqueCode } = require("../util/helper");

const startGame = async (data) => {
  try {
    const formattedData = parseGameData(data);

    await createRecord(formattedData, "GameInitiated");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

const joinGame = async (data) => {
  try {
    const formattedData = parseJoinGameData(data);
    await createRecord(formattedData, "RunningGames");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error joining game:", error);
  }
};

const createGame = async (pdf, data, roles) => {
  try {
    const uniqueCode = generateUniqueCode(7);
    const gameData = parseAndFormatGameData(data, uniqueCode, pdf);
    const roleData = parseAndFormatRoleData(roles, uniqueCode, pdf);
    const levelData = parseAndFormatLevelData(roles, pdf, gameData);

    await createRecord(gameData, "Games");
    await createRecord(roleData, "Role");
    await createRecord(levelData, "Instructions");
  } catch (error) {
    console.error("Error creating game:", error);
  }
};
module.exports = {
  startGame,
  joinGame,
  createGame,
};
