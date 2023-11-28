const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");

const getChart = async (name, pageNumber) => {
  try {
    const pdfFilePath = path.join(__dirname, "../fullSheet", name);
    const pdfData = await fs.readFile(pdfFilePath);
    const pdfDoc = await PDFDocument.load(pdfData);
    const count = pdfDoc.getPageCount();
    const number = parseInt(pageNumber);

    if (number > pdfDoc.getPageCount()) {
      throw new Error("Invalid page number");
    }

    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [number - 1]);
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
      throw new Error(`Invalid CropBox values: ${JSON.stringify(cropBox)}`);
    }

    newPdfDoc.addPage(copiedPage);
    const newPdfBytes = await newPdfDoc.save();
    const base64Page = Buffer.from(newPdfBytes).toString("base64");

    return base64Page;
  } catch (err) {
    console.error("Error reading or processing PDF file:", err);
    console.log("Root cause:", err);
    throw new Error(`failing getChart function `);
  }
};

module.exports = {
  getChart,
};
