const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");

const getChart = async (name, pageNumber) => {
  return new Promise((resolve, reject) => {
    const pdfFilePath = path.join(__dirname, "../fullSheet", name);
    fs.readFile(pdfFilePath)
      .then(async (pdfData) => {
        const pdfDoc = await PDFDocument.load(pdfData);

        if (pageNumber < 1 || pageNumber > pdfDoc.getPageCount()) {
          throw new Error("Invalid page number");
        }

        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
          pageNumber - 1,
        ]);
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
        const base64Page = Buffer.from(newPdfBytes).toString("base64");

        resolve(base64Page);
      })
      .catch((err) => {
        console.error("Error reading or processing PDF file:", err);
        if (err instanceof PDFDocument.PDFInvalidObjectError) {
          console.error(
            "This is a PDFDocument.PDFInvalidObjectError, which may be caused by malformed PDF data.",
          );
        }
        reject(err);
      });
  });
};

module.exports = {
  getChart,
};
