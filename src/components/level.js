const {
  fetchWithCondition,
  createRecord,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
const { extractFieldsForMember, getFile } = require("../helpers/helper");
const { parseLevelData } = require("../helpers/parse");
const { fetchParticipants } = require("./airtable");

const getLevelStatus = async (data) => {
  const { RoomNumber, GameID, Level } = data;
  try {
    let filed = ["Level", "Status"];
    let condition = `AND({gameID} = "${GameID}",{RoomNumber} = "${RoomNumber}")`;
    let response = await fetchWithCondition("Level", condition, filed);
    let extractedData = [{}];
    if (response) {
      extractedData = extractFieldsForMember(response, filed);
    }

    return {
      success: true,
      levelStatus: extractedData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error Fetching member:", error);
    throw error;
  }
};

const startLevel = async (data) => {
  try {
    const formattedData = parseLevelData(data);

    await createRecord(formattedData, "Level");

    return {
      success: true,
      message: "Data stored",
    };
  } catch (error) {
    console.error("Error Fetching member:", error);
    throw error;
  }
};

const getRoundPdf = async (data) => {
  try {
    console.log("ds");
    const fileName = `${data.GameName}_Level${data.level}.pdf`;
    const gameInstruction = await getFile(fileName);
    return {
      success: true,
      data: gameInstruction,
      message: "PDF Fetched",
    };
  } catch (error) {
    console.error("Error getting roles", error);
    throw error;
  }
};

const updateRound = async (data) => {
  const { groupName, gameId, roomNumber, email, resultsSubmission } = data;

  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name", "CurrentLevel"];
    let condition = `AND({GroupName} = "${groupName}",{GameID} = "${gameId}",{RoomNumber} = "${roomNumber}",{ParticipantEmail} = "${email}")`;
    let response = await fetchWithCondition("Participant", condition, filed);
    const { id, updatedData } = createUpdatedData(response[0]);

    await updateGameInitiatedRecord("Participant", id, updatedData);

    return {
      success: true,
      data: { updatedData },
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error updating all the user round:", error);
    throw error;
  }
};
const updateAlltheUserRounds = async (GroupName, GameID, RoomNumber, round) => {
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name"];
    let condition = `AND({GroupName} = "${GroupName}",{GameID} = "${GameID}",{RoomNumber} = "${RoomNumber}")`;
    let response = await fetchWithCondition("Participant", condition, filed);
    const { id, updatedData } = formatAndReturnUpdatedData(response, round);

    await updateGameInitiatedRecord("Participant", id, updatedData);

    return {
      success: true,
      data: {},
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error updating all the user round:", error);
    throw error;
  }
};
function createUpdatedData(data) {
  if (!data || !data.id || !data.fields || !data.fields.CurrentLevel) {
    return null;
  }
  const { id, fields } = data;
  const currentLevel = String(Number(fields.CurrentLevel) + 1);

  const updatedData = {
    CurrentLevel: currentLevel,
  };

  return { id, updatedData };
}

const formatUpdatedData = (records, level) => {
  const updatedData = records.map((record) => ({
    id: record.id,
    fields: {
      CurrentLevel: record.level.toString(),
    },
  }));

  return { records: updatedData };
};

const formatAndReturnUpdatedData = (records, level) => {
  const updatedData = records.map((record) => ({
    id: record.id,
    fields: {
      CurrentLevel: record.level.toString(),
    },
  }));

  return { records: updatedData };
};

module.exports = {
  getLevelStatus,
  startLevel,
  getRoundPdf,
  updateRound,
};
