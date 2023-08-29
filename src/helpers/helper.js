const fs = require("fs");
const path = require("path");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);

const storeFile = (pdfArray, name) => {
  for (const file of pdfArray) {
    if (file.originalname === name) {
      const uploadsPath = path.join(__dirname, "../uploads");
      const filePath = path.join(uploadsPath, name);
      fs.writeFileSync(filePath, file.buffer);
      return filePath;
    }
  }
  return null;
};

const getFile = async (name) => {
  const pdfFilePath = path.join(__dirname, "../uploads", name);

  try {
    const pdfData = await readFileAsync(pdfFilePath);
    const base64Pdf = Buffer.from(pdfData).toString("base64");
    return base64Pdf;
  } catch (err) {
    console.error("Error reading PDF file:", err);
    throw new Error("Error reading PDF file");
  }
};

const extractSpreadsheetId = (url) => {
  const regex = /\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
};
function getSheetIdFromUrl(url) {
  const regex = /\/d\/([a-zA-Z0-9-_]+)\/edit#gid=([0-9]+)/;
  const match = url.match(regex);

  if (match && match.length >= 3) {
    const sheetId = match[2];
    return sheetId;
  } else {
    return null;
  }
}


const generateUniqueCode = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  code = timestamp + code;

  return code.substring(0, length);
};
const getDate = () => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
    new Date(),
  );
  return formattedDate;
};

module.exports = {
  storeFile,
  generateUniqueCode,
  getDate,
  getFile,
  extractSpreadsheetId,
  getSheetIdFromUrl,
};
