const credentials = require("../../tomorrow-college.json");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ], // Specify the necessary scopes
);

const updateCellValue = async (spreadsheetId, value) => {
  try {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // const data = [[value]];
    const resource = {
      values: value,
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "test!A1",
      valueInputOption: "RAW",
      resource,
    });

    console.log(`Value in A3 updated successfully: ${value}`);
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
      pageSize: 10, // Number of files to retrieve (change as needed)
      fields: "nextPageToken, files(id, name)", // Fields you want to retrieve
    });

    const files = response.data.files;
    if (files.length) {
      console.log("Files in your Drive:");
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
    console.log(response);
    const copyId = response.data.id;
    await drive.permissions.create({
      fileId: copyId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log("New copy created:");
  } catch (err) {
    console.error("Error:", err);
  }
};

async function getSheetValues(fileID) {
  try {
    // Authorize the client to access the Google Sheets API
    await jwtClient.authorize();

    // Get the sheets API object
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // Range of cells you want to retrieve, e.g., "Sheet1!A1:C10" to get all values from A1 to C10
    const range = "Level 1!A1:C"; // Replace this with the actual range you want to retrieve

    // Get the values from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileID,
      range: range,
    });

    // The response object will contain the values
    const values = response.data.values;

    console.log(values);
  } catch (err) {
    console.error("Error retrieving values:", err.message);
  }
}

module.exports = {
  updateCellValue,
  createCopy,
  getSheetValues,
  deleteAllFiles,
  listFiles,
};
