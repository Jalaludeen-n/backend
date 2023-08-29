const {
  extractSpreadsheetId,
  getSheetIdFromUrl,
} = require("../helpers/helper");
const {
  createCopy,
  deleteAllFiles,
  listFiles,
  getSheetValues,
  updateCellValues,
} = require("../controller/google");
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

const fetchQustions = async (ID, level) => {
  const sheetName = `Level ${level}`;

  const data = await getSheetValues(ID, sheetName);
  const formattedData = formatData(data);
  formattedData.splice(0, 1);
  return formattedData;
};
const storeAnsweresInSheet = async (ID, values, level) => {
  await updateCellValues(ID, values, level);
};
function generateRangeAndColumn(level, questionLength) {
  if (level >= 1 && level <= 26) {
    const column = String.fromCharCode(64 + (level + 1)); // A=1, B=2, ..., Z=26
    return column;
  } else {
    throw new Error("Invalid level");
  }
}

const createCopySheet = async (id, name) => {
  const response = await createCopy(id, name);
  return response;
};
module.exports = {
  fetchQustions,
  createCopySheet,
  storeAnsweresInSheet,
};
