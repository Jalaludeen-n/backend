const { fetchWithContion } = require("./../../controller/airtable");

const fetchRolesAutoSelection = async (GameID) => {
  const condition = `{GameID} = "${GameID}"`;
  const fields = [
    "RolesAutoSelection",
    "ResultsSubbmision",
    "GoogleSheet",
    "GameName",
    "NumberOfRounds",
    "ResultsSubbmision",
    "ScoreVisibilityForPlayers",
    "RolesAutoSelection",
    "IndividualInstructionsPerRound",
    "Instruction",
    "Date",
  ];
  const response = await fetchWithContion("Games", condition, fields);
  return response;
};

const getGameInitiatedResponse = async (roomNumber) => {
  const filed = ["Players", "Status", "GameID"];
  const condition = `{RoomNumber} = "${roomNumber}"`;
  return await fetchWithContion("GameInitiated", condition, filed);
};
const isPlayerAlreadyExists = async (data) => {
  const condition = `AND({RoomNumber} = "${data.roomNumber}",{EmailID} = "${data.email}")`;
  const fields = ["EmailID"];
  const response = await fetchWithContion("RunningGames", condition, fields);
  return response;
};
const fetchGroupSize = async (GameID, roomNumber, group) => {
  const condition = `AND({GameID} = "${GameID}",{RoomNumber} = "${roomNumber}",{GroupName} = "${group}" )`;
  const filed = ["Size"];
  return await fetchWithContion("Group", condition, filed);
};
const fetchGroupSheetResponse = async (roomNumber, groupName) => {
  const condition = `AND({RoomNumber} = "${roomNumber}",{GroupName} = "${groupName}")`;
  const filed = ["GoogleSheetID"];
  return await fetchWithContion("GroupSheet", condition, filed);
};

module.exports = {
  fetchRolesAutoSelection,
  getGameInitiatedResponse,
  isPlayerAlreadyExists,
  fetchGroupSize,
  fetchGroupSheetResponse,
};
