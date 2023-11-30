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
const { getCurrentLevelStatus, createUpdatedData } = require("./level/level");
const { sendEmailWithPDF } = require("./mail/send");
const fs = require("fs");
const path = require("path");
const util = require("util");
const access = util.promisify(fs.access);

const MAX_DOWNLOAD_RETRIES = 3;

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
    let data;
    if (parseInt(level) != 0) {
      data = await fetchQustionsAndAnswers(sheetID, level);
    } else {
      return {
        success: true,
        data: [],
        message: "Data fetched",
      };
    }

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
    const { level, sheetID, email, name } = dataFromClient;
    const pdfName = `${sheetID}.pdf`;
    let result;
    result = await getChart(pdfName, parseInt(level) - 1);

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
    if (submissionType == "Each member does their own submission") {
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
  // await getP/DF("ds", "1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf");
  // getChart("1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf", 1)
  //   .then((outputPath) => console.log("PDF saved to:", outputPath))
  //   .catch((error) => console.error("Error:", error));
};
const checkFileExists = async (filePath) => {
  try {
    await access(filePath, fs.constants.F_OK);
    console.log(`File exists at path: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`File does not exist at path: ${filePath}`);
    return false;
  }
};
const waitForFile = async (filePath, maxAttempts = 5, interval = 2000) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await checkFileExists(filePath)) {
      return true;
    } else {
      attempts++;
      console.log(
        `File not found, attempt ${attempts}/${maxAttempts}. Waiting for ${interval}ms.`,
      );
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  console.error(`File not found after ${maxAttempts} attempts.`);
  return false;
};

function findObjectByEmail(email, array) {
  return array.find((obj) => obj.email === email);
}
function allFieldsCompleted(records, lastLevel) {
  for (const record of records) {
    const currentLevel = record.fields["CurrentLevel"];
    if (currentLevel != "completed") {
      return false;
    }
  }
  return true;
}
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

  try {
    let res;
    await storeAnsweresInSheet(sheetID, answers, level);
    const pdfname = `${sheetID}.pdf`;
    const pdfDirectory = path.join(__dirname, "../fullSheet");
    const filePath = path.join(pdfDirectory, pdfname);

    await getPDF(sheetID, pdfname);

    if (numberOfRounds != parseInt(level)) {
      let filed = [
        "GameID",
        "Role",
        "ParticipantEmail",
        "Name",
        "CurrentLevel",
      ];
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
          const newData = {
            CurrentLevel: updatedData.CurrentLevel,
          };
          await updateGameInitiatedRecord("Participant", id, newData);
          return { ...updatedData, started: data, completed: false };
        }),
      );
      res = findObjectByEmail(email, updatedParticipants);
    } else {
      let filed = [
        "GameID",
        "Role",
        "ParticipantEmail",
        "Name",
        "CurrentLevel",
      ];
      let condition;
      if (resultsSubmission == "Each member does their own submission") {
        condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}", {ParticipantEmail} = "${email}")`;
      } else {
        condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}")`;
      }
      let response = await fetchWithCondition("Participant", condition, filed);
      updatedParticipants = await Promise.all(
        response.map(async (participant) => {
          const { id, updatedData } = createUpdatedData(
            participant.id,
            participant.fields,
          );
          const newData = { CurrentLevel: "completed" };

          await updateGameInitiatedRecord("Participant", id, newData);
          if (resultsSubmission != "Each member does their own submission") {
            condition = `AND({GroupName} = "${groupName}", {GameID} = "${gameId}", {RoomNumber} = "${roomNumber}")`;
            response = await fetchWithCondition(
              "Participant",
              condition,
              filed,
            );
          }
          condition = `AND({GameID} = "${gameId}", {RoomNumber} = "${roomNumber}")`;
          filed = ["GameID", "Status", "RoomNumber"];
          if (allFieldsCompleted(response, level)) {
            response = await fetchWithCondition(
              "GameInitiated",
              condition,
              filed,
            );
            const update = { Status: "completed" };
            const id = response[0].id;

            await updateGameInitiatedRecord("GameInitiated", id, update);
          }
          const updatedNewData = {
            CurrentLevel: level,
            email: updatedData.email,
          };
        }),
      );

      res = {
        CurrentLevel: level,
        started: false,
        completed: true,
        groupName,
        email,
      };
      wss.sockets.emit("completed", res);
    }
    wss.sockets.emit("newplayer", res);
    if (!(resultsSubmission == "Each member does their own submission")) {
      wss.sockets.emit("Movelevel", { ...res, name, email, groupName });
    }
    const result = await getChart(pdfname, parseInt(level));
    sendEmailWithPDF(email, name, result, level);

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

module.exports = {
  getQustions,
  storeAnsweres,
  getResults,
  getResult,
  test,
  getIndividualResult,
};
