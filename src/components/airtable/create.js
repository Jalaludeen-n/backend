const { createRecord } = require("../../controller/airtable");

const createNewGroup = async (GameID, roomNumber, group) => {
  const formattedData = {
    GameID: GameID,
    RoomNumber: roomNumber,
    GroupName: group,
    Size: 1,
  };
  await createRecord(formattedData, "Group");
};

const createRunningGameRecord = async (formattedData) => {
  await createRecord(formattedData, "RunningGames");
};

const joinParticipantToGame = async (
  GameID,
  roomNumber,
  group,
  email,
  role,
  name,
) => {
  const formattedData = {
    GameID: GameID,
    RoomNumber: roomNumber,
    GroupName: group,
    ParticipantEmail: email,
    Role: role,
    Name: name,
    CurrentLevel: "0",
  };
  await createRecord(formattedData, "Participant");
};

const createGroupSheet = async (roomNumber, groupName, copySheetLink) => {
  const groupSheetSheetData = {
    RoomNumber: roomNumber,
    GroupName: groupName,
    GoogleSheetID: copySheetLink,
  };
  await createRecord(groupSheetSheetData, "GroupSheet");
};

const createIndividualSheet = async (
  email,
  roomNumber,
  groupName,
  copySheetLink,
) => {
  const individualSheetData = {
    ParticipantEmail: email,
    RoomNumber: roomNumber,
    GroupName: groupName,
    GoogleSheetID: copySheetLink,
  };
  await createRecord(individualSheetData, "IndividualSheet");
};

module.exports = {
  createNewGroup,
  createRunningGameRecord,
  joinParticipantToGame,
  createGroupSheet,
  createIndividualSheet,
};
