const { error } = require("pdf-lib");
const {
  createCopy,
  deleteAllFiles,
  listFiles,
  convertToPDF,
  getSheetValues,
  updateCellValues,
  getStoredAnswers,
  fetchStoredQustionsAndAnswers,
} = require("../controller/google");
const { getChart } = require("../helpers/pdfConverter");
function formatData(data) {
  const formattedData = [];
  let currentQuestion = {};

  for (const row of data) {
    const [question, type, options] = row;

    if (question && type) {
      if (currentQuestion.question) {
        formattedData.push({ ...currentQuestion });
        currentQuestion = {};
      }

      currentQuestion.question = question;
      currentQuestion.type = type;

      if (options && options.startsWith("Options")) {
        const numOptions = parseInt(options.split("(")[1].split(")")[0], 10);
        currentQuestion.choices = [];
        for (let i = 1; i <= numOptions; i++) {
          currentQuestion.choices.push(data[data.indexOf(row) + i][2]);
        }
      }
    }
  }

  if (currentQuestion.question) {
    formattedData.push({ ...currentQuestion });
  }

  return formattedData;
}

function extractQuestions(data) {
  const formattedData = [];
  let currentQuestion = {};

  for (const row of data) {
    const [question, type, options] = row;

    if (question && type && question !== "Question") {
      if (currentQuestion.question) {
        formattedData.push(currentQuestion.question);
        currentQuestion = {};
      }

      currentQuestion.question = question;
    }
  }

  if (currentQuestion.question) {
    formattedData.push(currentQuestion.question);
  }

  return formattedData;
}

const fetchAnswers = async (ID, level) => {
  const sheetName = `Output`;

  const data = await getStoredAnswers(ID, sheetName, level);

  return data;
};
const fetchQustionsAndAnswers = async (ID, level) => {
  const data = [];

  const ranges = generateRanges(level);
  for (const range of ranges) {
    const result = await fetchStoredQustionsAndAnswers(range, ID);
    data.push(extractQuestions(result));
  }

  const results = await fetchStoredQustionsAndAnswers("Output!A:Z", ID);
  const result = results.splice(0, level);

  const output = combineQuestionsAndAnswers(data, result);
  return output;
};

function combineQuestionsAndAnswers(questionsArray, answersArray) {
  if (questionsArray.length !== answersArray.length) {
    throw new Error("Questions and answers arrays must have the same length.");
  }

  const combinedArray = [];

  for (let i = 0; i < questionsArray.length; i++) {
    const questions = questionsArray[i];
    const answers = answersArray[i];
    const combinedObject = {};

    for (let j = 0; j < questions.length; j++) {
      combinedObject[questions[j]] = answers[j];
    }

    combinedArray.push(combinedObject);
  }

  return combinedArray;
}

function generateRanges(level) {
  // Assuming the level sheets are named "Level 1", "Level 2", ..., "Output"
  const ranges = [];
  for (let i = 1; i <= level; i++) {
    ranges.push(`Level ${i}!A1:C`);
  }

  return ranges;
}
const fetchQustions = async (ID, level) => {
  const sheetName = `Level ${level}`;

  const data = await getSheetValues(ID, sheetName);
  const formattedData = formatData(data);
  formattedData.splice(0, 1);
  return formattedData;
};
const fetchScore = async (ID) => {
  const sheetName = `Answer details`;

  const data = await getSheetValues(ID, sheetName);
  const formattedData = formatSheetData(data);
  return formattedData;
};

function formatSheetData(sheetData) {
  const formattedData = {};

  for (let i = 1; i < sheetData.length; i++) {
    const [level, type, value] = sheetData[i];

    if (!formattedData[level]) {
      formattedData[level] = {};
    }

    if (!formattedData[level][type]) {
      formattedData[level][type] = {};
    }

    formattedData[level][type] = value;
  }

  return formattedData;
}

const storeAnsweresInSheet = async (ID, values, level) => {
  await updateCellValues(ID, values, level);
};

const getPDF = async (id, name, level) => {
  await convertToPDF(id, name);
};

async function deleteAllPDF() {
  await deleteAllFiles();
}

const createCopySheet = async (id, name) => {
  const response = await createCopy(id, name);
  return response;
};
module.exports = {
  fetchQustions,
  createCopySheet,
  storeAnsweresInSheet,
  fetchScore,
  getPDF,
  deleteAllPDF,
  fetchAnswers,
  fetchQustionsAndAnswers,
};
