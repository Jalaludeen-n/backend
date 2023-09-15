const {
  createCopy,
  deleteAllFiles,
  listFiles,
  convertToPDF,
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

async function getPDF(id, name) {
  await convertToPDF(
    "1zjHBgRgjv3XEFc8WAX6dTRaKBOgoCUw0CBBJmR_hTa4",
    "tdsdest.pdf",
  );
}
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
};
