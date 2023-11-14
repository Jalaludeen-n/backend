const fs = require("fs").promises;
const path = require("path");
const util = require("util");

const readFileAsync = util.promisify(fs.readFile);
const { PDFDocument, rgb } = require("pdf-lib");

const getChart = async (name, pageNumber) => {
  const pdfFilePath = path.join(__dirname, "../fullSheet", name);
  // const outputPath = path.join(__dirname, "../fullSheet/test.pdf"); // Set the output path and file name

  try {
    const pdfData = await fs.readFile(pdfFilePath);
    const pdfDoc = await PDFDocument.load(pdfData);

    if (pageNumber < 1 || pageNumber > pdfDoc.getPageCount()) {
      throw new Error("Invalid page number");
    }

    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
    const originalWidth = copiedPage.getWidth();
    const originalHeight = copiedPage.getHeight();
    const cropBox = [50, 380, originalWidth - 100, originalHeight - 435];

    if (
      cropBox &&
      cropBox.length === 4 &&
      cropBox.every((value) => typeof value === "number")
    ) {
      console.log("Setting CropBox:", cropBox);
      copiedPage.setCropBox(...cropBox);
    } else {
      console.log("Invalid CropBox values:", cropBox);
    }

    newPdfDoc.addPage(copiedPage);

    const newPdfBytes = await newPdfDoc.save();

    // await fs.writeFile(outputPath, newPdfBytes);
    const base64Page = Buffer.from(newPdfBytes).toString("base64");

    return base64Page;
  } catch (err) {
    console.error("Error reading or processing PDF file:", err);

    if (err instanceof PDFDocument.PDFInvalidObjectError) {
      console.error(
        "This is a PDFDocument.PDFInvalidObjectError, which may be caused by malformed PDF data.",
      );
    }

    throw err;
  }
};
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
function extractFieldsForMember(records, fieldNames) {
  return records.map((record) => {
    const extractedFields = {};
    fieldNames.forEach((fieldName) => {
      extractedFields[fieldName] = record.get(fieldName);
    });
    return extractedFields;
  });
}

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
  extractFieldsForMember,
};
