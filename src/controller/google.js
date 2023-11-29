const { google } = require("googleapis");
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
const fs = require("fs");
const path = require("path");

const util = require("util");
const access = util.promisify(fs.access);

const jwtClient = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ], // Specify the necessary scopes
);

const updateCellValues = async (spreadsheetId, values, level) => {
  try {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    const range = `Output!A${level}`;

    const resource = {
      values: [values], // Assuming "values" is an array of new values
    };

    sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource,
    });

    console.log(`Values in ${range} updated successfully: ${values}`);
  } catch (err) {
    console.error("Error:", err);
  }
};
const deleteAllFiles = async () => {
  try {
    await jwtClient.authorize();
    const drive = google.drive({ version: "v3", auth: jwtClient });

    const response = await drive.files.list({
      pageSize: 100, // Adjust the pageSize as needed to retrieve more files
      fields: "files(id, name)", // Fields you want to retrieve
    });

    const files = response.data.files;
    if (files.length) {
      console.log("Deleting files:");
      for (const file of files) {
        console.log(`Deleting ${file.name} (${file.id})`);
        await drive.files.delete({ fileId: file.id });
        console.log(`${file.name} deleted.`);
      }
    } else {
      console.log("No files found to delete.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

const listFiles = async () => {
  try {
    await jwtClient.authorize();
    const drive = google.drive({ version: "v3", auth: jwtClient });

    const response = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });

    const files = response.data.files;
    if (files.length) {
      files.forEach((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log("No files found.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

const createCopy = async (fileId, fileName) => {
  try {
    await jwtClient.authorize();
    const drive = google.drive({ version: "v3", auth: jwtClient });

    const response = await drive.files.copy({
      fileId,
      requestBody: {
        name: fileName, // Replace with the desired name for the new copy
      },
    });
    const copyId = response.data.id;
    drive.permissions.create({
      fileId: copyId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log("New copy created:");
    return copyId;
  } catch (err) {
    console.error("Error:", err);
  }
};

const convertToPDF = async (spreadsheetId, pdfFileName) => {
  try {
    console.log("inside convertToPDF");

    // Checking if directory exists
    const pdfDirectory = path.join(__dirname, "src", "fullSheet");
    const pdfPath = path.join(pdfDirectory, pdfFileName);

    console.log("path for pdf");
    console.log(pdfDirectory);

    console.log(`PDF will be saved to: ${pdfPath}`);

    let directoryExists = false;
    try {
      await access(pdfDirectory, fs.constants.R_OK | fs.constants.W_OK);
      directoryExists = true;
      console.log(
        `Directory exists and has read/write permissions: ${pdfDirectory}`,
      );
    } catch (err) {
      console.error(
        `Directory does not exist or lacks read/write permissions: ${pdfDirectory}`,
      );
    }

    if (!directoryExists) {
      try {
        fs.mkdirSync(pdfDirectory);
        console.log(`Created directory: ${pdfDirectory}`);
      } catch (err) {
        console.error(`Error creating directory: ${pdfDirectory}`, err);
      }
    }

    // Writing PDF file
    const drive = google.drive({ version: "v3", auth: jwtClient });
    const pageHeight = 7;
    const pageWidth = 8.5;
    const exportOptions = {
      fileId: spreadsheetId,
      mimeType: "application/pdf",
      pageHeight,
      pageWidth,
      portrait: false,
      ranges: `Round 1!A1:M50`,
    };

    const response = await drive.files.export(exportOptions, {
      responseType: "stream",
    });

    const dest = fs.createWriteStream(pdfPath);

    response.data
      .on("end", () => {
        console.log(`PDF Downloaded from Google: ${pdfFileName}`);
        if (!fs.existsSync(pdfPath)) {
          console.error("File not saved properly");
        } else {
          console.log(`File exists at path: ${pdfPath}`);
        }
      })
      .on("error", (err) => {
        console.error("Error on downloading:", err);
      })
      .pipe(dest);

    dest.on("error", (err) => {
      console.error("Error writing file:", err);
    });

    return new Promise((resolve, reject) => {
      dest.on("finish", () => {
        console.log(`PDF write finished: ${pdfFileName}`);
        resolve(); // Resolve the Promise when the download completes
      });
      dest.on("error", (err) => {
        console.error("Error writing file:", err);
        reject(err); // Reject if there's an error during download
      });
    });
  } catch (err) {
    console.error("Error in Google PDF export:", err);
    throw err;
  }
};

async function getStoredAnswers(fileID, name, level) {
  try {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });
    const range = `${name}!A1:Z1`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileID,
      range: range,
    });
    const values = response.data.values;
    return values;
  } catch (err) {
    console.error("Error retrieving values:", err.message);
  }
}
async function fetchStoredQustionsAndAnswers(range, id) {
  try {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: range,
    });
    const values = response.data.values;
    return values;
  } catch (err) {
    console.error("Error retrieving values:", err.message);
  }
}

async function getSheetValues(fileID, name) {
  try {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });
    const range = `${name}!A1:C`; // Replace this with the actual range you want to retrieve\

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileID,
      range: range,
    });
    const values = response.data.values;
    return values;
  } catch (err) {
    console.error("Error retrieving values:", err.message);
  }
}

module.exports = {
  updateCellValues,
  createCopy,
  getSheetValues,
  deleteAllFiles,
  listFiles,
  convertToPDF,
  getStoredAnswers,
  fetchStoredQustionsAndAnswers,
};
