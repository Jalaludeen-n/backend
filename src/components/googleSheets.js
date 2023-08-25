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

const test = async (email) => {
  const link =
    "https://docs.google.com/spreadsheets/d/1zjHBgRgjv3XEFc8WAX6dTRaKBOgoCUw0CBBJmR_hTa4/edit#gid=0";
  const spreadsheetId = extractSpreadsheetId(link);
  // const res = await getChartImageUrl(ID);
  const sheetId = getSheetIdFromUrl(link);

  // const data = await getSheetValues(ID);
  // const formattedData = formatData(rawData);
  // await updateCellValue(ID, formattedQuestions);

  // console.log(JSON.stringify(formattedData, null, 2)); // Display formatted data

  // console.log(ID);
  const response = await createCopy(spreadsheetId, "for view");
  // await deleteCopy("16DONfjHt-fqtuRJ4fWmg5MdujQCG3AZfhoOgOjz-2Jw");
  // await deleteAllFiles();
  // await listFiles();
};

module.exports = {
  test,
};
