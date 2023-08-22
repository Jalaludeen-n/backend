const {
  createRecord,
  fetchWithContion,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
const {
  parseAndFormatGameData,
  parseAndFormatLevelData,
  parseAndFormatRoleData,
  parseJoinGameData,
  parseGameData,
} = require("../util/parse");
const { getRole, getRemainingRoles } = require("../components/gameDetails");

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

const createRunningGameRecord = async (formattedData) => {
  await createRecord(formattedData, "RunningGames");
};

const incrementPlayerCount = async (response) => {
  const Id = response[0].id;
  const updatedFields = {
    Status: "Running",
    Players: response[0].fields.Players + 1,
  };
  await updateGameInitiatedRecord("GameInitiated", Id, updatedFields);
};

const fetchRolesAutoSelection = async (GameID) => {
  const condition = `AND({GameID} = "${GameID}",{RolesAutoSelection} = 1)`;
  const fields = ["RolesAutoSelection"];
  const response = await fetchWithContion("Games", condition, fields);
  return response;
};
const joinParticipantToGame = async (
  GameID,
  roomNumber,
  group,
  email,
  role,
) => {
  const formattedData = {
    GameID: GameID,
    RoomNumber: roomNumber,
    GroupName: group,
    ParticipantEmail: email,
    Role: role,
    CurrentLevel: 0,
  };
  await createRecord(formattedData, "Participant");
};
const updateGroupSize = async (GameID, roomNumber, group) => {
  const condition = `AND({GameID} = "${GameID}",{RoomNumber} = "${roomNumber}",{GroupName} = "${group}" )`;
  const filed = ["Size"];
  const response = await fetchWithContion("Group", condition, filed);

  if (response) {
    const formattedData = {
      Size: response[0].fields.Size + 1,
    };
    await updateGameInitiatedRecord(
      "GameInitiated",
      response[0].id,
      formattedData,
    );
  } else {
    const formattedData = {
      GameID: GameID,
      RoomNumber: roomNumber,
      GroupName: group,
      Size: 1,
    };
    await createRecord(formattedData, "Group");
  }
};
const isPlayerAlreadyExists = async (data) => {
  const condition = `AND({RoomNumber} = "${data.roomNumber}",{EmailID} = "${data.email}")`;
  const fields = ["EmailID"];
  const response = await fetchWithContion("RunningGames", condition, fields);
  return response;
};
const joinGame = async (data) => {
  try {
    const formattedData = parseJoinGameData(data);
    const isPlayerExists = await isPlayerAlreadyExists(data);
    if (!isPlayerExists) {
      await createRunningGameRecord(formattedData);
      const filed = ["Players", "Status", "GameID"];
      const condition = `{RoomNumber} = "${data.roomNumber}"`;
      const response = await fetchWithContion(
        "GameInitiated",
        condition,
        filed,
      );

      await incrementPlayerCount(response);

      const GameID = response[0].fields.GameID;

      const roleSelectionResponse = await fetchRolesAutoSelection(GameID);

      if (roleSelectionResponse) {
        const role = await getRole(data);
        if (role) {
          await joinParticipantToGame(
            GameID,
            data.roomNumber,
            data.group,
            data.email,
            role,
          );
          console.log(await getRemainingRoles(data.group));
          await updateGroupSize(GameID, data.roomNumber, data.group);
        }
      }
      console.log("Data successfully sent to Airtable");
      return { success: true, message: "Game joined successfully" };
    } else {
      return {
        success: false,
        message: "Player already exists in the game",
      };
    }
  } catch (error) {
    console.error("Error joining game:", error);
  }
};

const storeParticipant = async (data, role) => {
  try {
    const formattedData = {
      RoomNumber: data.roomNumber,
      GroupName: data.group,
      ParticipantEmail: data.email,
      Role: role,
      CurrentLevel: 0,
    };
    await createRecord(formattedData, "Participant");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error joining game:", error);
  }
};

const getRunningAndPastGame = async () => {
  try {
    const filed = ["Players", "Status", "Date", "RoomNumber", "GameID"];
    const condition = `OR({Status} = "Running", {Status} = "Successfull")`;
    const response = await fetchWithContion("GameInitiated", condition, filed);
    return response[0];
  } catch (error) {
    console.error("Error getting  games:", error);
    throw error;
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

const fetchParticipantDetails = async (data) => {
  try {
    let filed = [
      "Role",
      "RoomNumber",
      "GroupName",
      "ParticipantEmail",
      "GameID",
    ];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}")`;
    let response = await fetchWithContion("Participant", condition, filed);
    let responseData = {};

    if (response) {
      responseData = {
        role: response[0].fields.Role,
        roomNumber: data.roomNumber,
      };
      const GameID = response[0].fields.GameID;
      filed = ["NumberOfRounds", "GameName", "Instruction"];
      condition = `{GameID} = "${GameID}"`;
      response = await fetchWithContion("Games", condition, filed);
    } else {
      filed = ["GameID"];
      condition = `{RoomNumber} = "${data.roomNumber}"`;
      response = await fetchWithContion("GameInitiated", condition, filed);
      filed = ["NumberOfRounds", "GameName", "Instruction"];
      condition = `{GameID} = "${response[0].fields.GameID}"`;
      response = await fetchWithContion("Games", condition, filed);
      const Roles = getRoles(response[0].fields.GameID);
    }
    responseData = {
      ...responseData,
      numberOfRounds: response[0].fields.NumberOfRounds,
      gameName: response[0].fields.GameName,
      email: data.email,
      roomNumber: data.roomNumber,
    };

    return {
      success: true,
      data: responseData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

module.exports = {
  startGame,
  joinGame,
  createGame,
  getRunningAndPastGame,
  storeParticipant,
  fetchParticipantDetails,
};
