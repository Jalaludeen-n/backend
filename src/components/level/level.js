const {
  fetchWithCondition,
  createRecord,
  updateGameInitiatedRecord,
} = require("../../controller/airtable");
const { extractFieldsForMember, getFile } = require("../../helpers/helper");
const { parseLevelData } = require("../../helpers/parse");

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
    const res = {
      CurrentLevel: parseInt(data.level),
      started: true,
      update: true,
    };
    wss.sockets.emit("gameStarted", res);
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
    let fileName;
    if (data.individualInstructionsPerRound) {
      fileName = `${data.GameName}_${data.role}_Level${data.level}.pdf`;
    } else {
      fileName = `${data.GameName}_Level${data.level}.pdf`;
    }
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

const updateIndivitualRound = async (clientData, wss) => {
  const { groupName, gameId, roomNumber, email } = clientData;
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name", "CurrentLevel"];
    const condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}", {ParticipantEmail} = "${email}")`;
    let response = await fetchWithCondition("Participant", condition, filed);

    const { id, updatedData } = createUpdatedData(
      response[0].id,
      response[0].fields,
    );
    const { data } = await getCurrentLevelStatus(
      roomNumber,
      gameId,
      parseInt(updatedData.CurrentLevel),
    );
    if (data) await updateGameInitiatedRecord("Participant", id, updatedData);
    const res = {
      started: data,
      level: updatedData.CurrentLevel,
    };

    console.log("update indivitual record");
    console.log(res);
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
function createUpdatedData(id, fields) {
  const currentLevel = String(Number(fields.CurrentLevel) + 1);
  const updatedData = {
    CurrentLevel: currentLevel,
  };
  return { id, updatedData };
}
const updateRound = async (clientData, wss) => {
  const { groupName, gameId, roomNumber, email, resultsSubmission, level } =
    clientData;

  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name", "CurrentLevel"];
    let condition;
    if (resultsSubmission == "Each member does their own submission") {
      condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}", {ParticipantEmail} = "${email}")`;
    } else {
      condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}")`;
    }

    let updatedParticipants;

    let response = await fetchWithCondition("Participant", condition, filed);
    updatedParticipants = await Promise.all(
      response.map(async (participant) => {
        const { id, updatedData } = createUpdatedData(
          participant.id,
          participant.fields,
        );
        const { data } = await getCurrentLevelStatus(
          roomNumber,
          gameId,
          parseInt(updatedData.CurrentLevel),
        );

        await updateGameInitiatedRecord("Participant", id, updatedData);
        return { ...updatedData, started: data };
      }),
    );
    const playerClick = true;
    const res = {
      ...updatedParticipants[0],
      groupName,
      email,
      roomNumber,
      playerClick,
    };
    if (resultsSubmission != "Each member does their own submission") {
      wss.sockets.emit("updatelevel", res);
    }
    console.log("update round");
    console.log(res);

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
  updateIndivitualRound,
};
