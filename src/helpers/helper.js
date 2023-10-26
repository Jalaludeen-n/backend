const fs = require("fs");
const path = require("path");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
const { PDFDocument, rgb } = require("pdf-lib");

const storeFile = (pdfArray, name) => {
  for (const file of pdfArray) {
    if (file.originalname === name) {
      const uploadsPath = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`Created directory: ${uploadsPath}`);
      } else {
        console.log(`Directory already exists: ${uploadsPath}`);
      }
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
    throw err;
  }
};
const getChart = async (name, pageNumber) => {
  const pdfFilePath = path.join(__dirname, "../fullSheet", name);

  try {
    const pdfData = await readFileAsync(pdfFilePath);
    const pdfDoc = await PDFDocument.load(pdfData);

    if (pageNumber < 1 || pageNumber > pdfDoc.getPageCount()) {
      throw new Error("Invalid page number");
    }

    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
    newPdfDoc.addPage(copiedPage);

    const newPdfBytes = await newPdfDoc.save();
    const base64Page = Buffer.from(newPdfBytes).toString("base64");

    return base64Page;
  } catch (err) {
    console.error("Error reading or processing PDF file:", err);

    if (err instanceof PDFLib.PDFInvalidObjectError) {
      console.error(
        "This is a PDFLib.PDFInvalidObjectError, which may be caused by malformed PDF data.",
      );
    }

    throw err;
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
  getChart,
};
