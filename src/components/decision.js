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
} = require("./level");
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
    const { level, sheetID } = dataFromClient;
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

const test = async () => {
  await getPDF("ds", "1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf");

  // getChart("1bsXUHh3uC65CYvxvdrTwby9Rj-SAqdRKIPskLaQgXbU.pdf", 1)
  //   .then((outputPath) => console.log("PDF saved to:", outputPath))
  //   .catch((error) => console.error("Error:", error));
};

const storeAnsweres = async (data, wss) => {
  const {
    sheetID,
    groupName,
    gameId,
    roomNumber,
    answers,
    level,
    email,
    resultsSubmission,
  } = data;

  try {
    const name = `${sheetID}.pdf`;
    await storeAnsweresInSheet(sheetID, answers, level);

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
        const { status } = await getCurrentLevelStatus(
          roomNumber,
          gameId,
          parseInt(updatedData.CurrentLevel),
        );

        await updateGameInitiatedRecord("Participant", id, updatedData);
        return { ...updatedData, started: status };
      }),
    );

    const res = updatedParticipants[0];
    if (!(resultsSubmission == "Each member does  their own submission")) {
      wss.sockets.emit("Movelevel", { ...res });
    }

    await getPDF(sheetID, name);

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
};
