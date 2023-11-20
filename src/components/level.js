const {
  fetchWithCondition,
  createRecord,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
const { extractFieldsForMember, getFile } = require("../helpers/helper");
const { parseLevelData } = require("../helpers/parse");

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

const startLevel = async (data, wss) => {
  try {
    const formattedData = parseLevelData(data);
    const res = { CurrentLevel: data.level, started: true };
    wss.sockets.emit("updatelevel", res);
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

const updateRound = async (clientData, wss) => {
  const { groupName, gameId, roomNumber, email, resultsSubmission } =
    clientData;

  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name", "CurrentLevel"];
    let condition;
    if (resultsSubmission == "Each member does  their own submission") {
      condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}", {ParticipantEmail} = "${email}")`;
    } else {
      condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}")`;
    }

    let updatedParticipants;

    let response = await fetchWithCondition("Participant", condition, filed);
    updatedParticipants = await Promise.all(
      response.map(async (participant) => {
        const { id, updatedData } = createUpdatedData(participant);
        const { data } = await getCurrentLevelStatus(
          roomNumber,
          gameId,
          parseInt(updatedData.CurrentLevel),
        );
        if (data) {
          await updateGameInitiatedRecord("Participant", id, updatedData);
          return { ...updatedData, started: data };
        } else {
          return { ...updatedData, started: data };
        }
      }),
    );

    const res = updatedParticipants[0];
    wss.sockets.emit("updatelevel", res);

    return {
      success: true,
      data: res,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error updating all the user round:", error);
    throw error;
  }
};

const getCurrentLevelStatus = async (roomNumber, gameId, level) => {
  try {
    let started = false;
    let filed = ["Level", "Status"];
    let condition = `AND({gameID} = "${gameId}",{Level} = "${level}",{RoomNumber} = "${roomNumber}", {Status} = "Started")`;
    let response = await fetchWithCondition("Level", condition, filed);
    if (response) {
      started = true;
    }

    return {
      success: true,
      data: started,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error Fetching member:", error);
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
  getCurrentLevelStatus,
  createUpdatedData,
};
