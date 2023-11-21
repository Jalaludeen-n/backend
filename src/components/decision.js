const {
  fetchWithCondition,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
const { getChart } = require("../helpers/pdfConverter");
const {
  fetchQustions,
  storeAnsweresInSheet,
  fetchQustionsAndAnswers,
  getPDF,
} = require("./googleSheets");
const {
  updateRound,
  getCurrentLevelStatus,
  createUpdatedData,
} = require("./level/level");
const { sendEmailWithPDF } = require("./mail/send");
const getQustions = async (data) => {
  try {
    const qustions = await fetchQustions(data.sheetID, data.level);
    return {
      success: true,
      data: qustions,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};

const getResults = async (dataFromClient) => {
  try {
    const { level, sheetID, completed } = dataFromClient;
    const data = await fetchQustionsAndAnswers(sheetID, level);

    return {
      success: true,
      data,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};
const getResult = async (dataFromClient) => {
  try {
    const { level, sheetID } = dataFromClient;
    const name = `${sheetID}.pdf`;
    const result = await getChart(name, level - 1);

    return {
      success: true,
      data: result,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};

const getIndividualResult = async (dataFromClient) => {
  try {
    const { level, gameID, email, roomNumber, groupName } = dataFromClient;

    let filed = ["ResultsSubmission"];
    let condition = `{gameID} = "${gameID}"`;
    let response = await fetchWithCondition("Games", condition, filed);
    const submissionType = response[0].fields.ResultsSubmission;
    let sheetID;
    if (submissionType == "Each member does  their own submission") {
      let filed = ["GoogleSheetID"];
      let condition = `AND({ParticipantEmail} = "${email}",{RoomNumber} = "${roomNumber}",{GroupName} = "${groupName}")`;
      let response = await fetchWithCondition(
        "IndividualSheet",
        condition,
        filed,
      );
      sheetID = response[0].fields.GoogleSheetID;
    } else {
      let filed = ["GoogleSheetID"];
      let condition = `AND({RoomNumber} = "${roomNumber}",{GroupName} = "${groupName}")`;
      let response = await fetchWithCondition("GroupSheet", condition, filed);
      sheetID = response[0].fields.GoogleSheetID;
    }

    const name = `${sheetID}.pdf`;
    const result = await getChart(name, parseInt(level));

    return {
      success: true,
      data: result,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};

const test = async () => {
  await getPDF("ds", "1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf");

  // getChart("1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf", 1)
  //   .then((outputPath) => console.log("PDF saved to:", outputPath))
  //   .catch((error) => console.error("Error:", error));
};

const storeAnsweres = async (clientData, wss) => {
  const {
    sheetID,
    groupName,
    gameId,
    roomNumber,
    answers,
    level,
    email,
    resultsSubmission,
    numberOfRounds,
    name,
  } = clientData;
  const pdfname = `${sheetID}.pdf`;
  await getPDF(sheetID, pdfname);
  const result = await getChart(pdfname, parseInt(level));

  sendEmailWithPDF(email, name, result);

  try {
    let res;
    await storeAnsweresInSheet(sheetID, answers, level);

    if (numberOfRounds != parseInt(level)) {
      let filed = [
        "GameID",
        "Role",
        "ParticipantEmail",
        "Name",
        "CurrentLevel",
      ];
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

          await updateGameInitiatedRecord("Participant", id, updatedData);
          return { ...updatedData, started: data, completed: false };
        }),
      );

      res = updatedParticipants[0];
    } else {
      let filed = ["CurrentLevel", "Role"];
      let condition = `AND({RoomNumber} = "${roomNumber}",{GroupName} = "${groupName}")`;
      let response = await fetchWithCondition("Participant", condition, filed);
      if (allFieldsCompleted(response, level)) {
        filed = ["Status"];
        let condition = `AND({RoomNumber} = "${roomNumber}",{GameID} = "${gameId}")`;
        response = await fetchWithCondition("GameInitiated", condition, filed);
        const Id = response[0].id;
        const updatedFields = {
          Status: "Completed",
        };
        await updateGameInitiatedRecord("GameInitiated", Id, updatedFields);
      }

      res = {
        CurrentLevel: level,
        started: false,
        completed: true,
      };
    }
    if (!(resultsSubmission == "Each member does  their own submission")) {
      wss.sockets.emit("Movelevel", { ...res });
    }

    return {
      data: res,
      success: true,
      message: "Answers Stored",
    };
  } catch (error) {
    console.error("Error Storing ans", error);
    throw error;
  }
};
function allFieldsCompleted(records, lastLevel) {
  for (const record of records) {
    const currentLevel = parseInt(record.fields["CurrentLevel"]);
    if (currentLevel != lastLevel) {
      return false;
    }
  }
  return true;
}

module.exports = {
  getQustions,
  storeAnsweres,
  getResults,
  getResult,
  test,
  getIndividualResult,
};
