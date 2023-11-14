const { getChart } = require("../helpers/helper");
const {
  fetchQustions,
  storeAnsweresInSheet,
  fetchQustionsAndAnswers,
  getPDF,
} = require("./googleSheets");
const { updateRound } = require("./level");

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
    const result = await getChart(name, level);

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
  getChart("firsttry.pdf", 10)
    .then((outputPath) => console.log("PDF saved to:", outputPath))
    .catch((error) => console.error("Error:", error));
};

const storeAnsweres = async (data) => {
  const { sheetID, answers, level } = data;
  try {
    const name = `${sheetID}.pdf`;
    await storeAnsweresInSheet(sheetID, answers, level);
    await updateRound(data);
    await getPDF(sheetID, name);

    return {
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
