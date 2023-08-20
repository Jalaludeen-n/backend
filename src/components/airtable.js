const {
  createRecord,
  getIdForUpdate,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
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
const updateInitiateGames = async (roomNumber) => {
  try {
    const filed = ["Players", "Status"];
    const condition = `{RoomNumber} = "${roomNumber}"`;
    const response = await getIdForUpdate("GameInitiated", condition, filed);
    const updatedFields = {
      Status: "Running",
      Players: response.fields.Players + 1,
    };
    await updateGameInitiatedRecord(
      "GameInitiated",
      response.id,
      updatedFields,
    );
  } catch (error) {
    console.error("Error joining game:", error);
  }
};
const getRunningAndPastGame = async () => {
  try {
    const filed = ["Players", "Status", "Date", "RoomNumber", "GameID"];
    const condition = `OR({Status} = "Running", {Status} = "Successfull")`;
    const response = await getIdForUpdate("GameInitiated", condition, filed);
    console.log(response);
    return response;
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
module.exports = {
  startGame,
  joinGame,
  createGame,
  updateInitiateGames,
  getRunningAndPastGame,
};
