const { extractSpreadsheetId, getSheetIdFromUrl } = require("../util/helper");
const {
  createCopy,
  deleteAllFiles,
  listFiles,
  getSheetValues,
  updateCellValue,
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
  const sheetName = "test";

  const data = await getSheetValues(ID, sheetName);
  const formattedData = formatData(data);
  formattedData.splice(0, 1);
  return formattedData;

  // await updateCellValue(ID, formattedQuestions);

  // console.log(JSON.stringify(formattedData, null, 2)); // Display formatted data

  // console.log(ID);
  // await deleteCopy("16DONfjHt-fqtuRJ4fWmg5MdujQCG3AZfhoOgOjz-2Jw");
  // await deleteAllFiles();
  // await listFiles();
};

const createCopySheet = async (id, name) => {
  const response = await createCopy(id, name);
  return response;
};
module.exports = {
  fetchQustions,
  createCopySheet,
};
