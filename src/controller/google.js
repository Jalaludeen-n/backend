const { google } = require("googleapis");
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");

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

    // const range = `Output!${column}${startRow}:${column}${endRow}`;
    const range = `Output!B${level}`;

    const resource = {
      values: [values], // Assuming "values" is an array of new values
    };

    await sheets.spreadsheets.values.update({
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
      pageSize: 10, // Number of files to retrieve (change as needed)
      fields: "nextPageToken, files(id, name)", // Fields you want to retrieve
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
function isValidPrivateKeyFormat(privateKey) {
  // Expected start and end lines for PEM-encoded private keys
  const expectedStartLine = "-----BEGIN PRIVATE KEY-----";
  const expectedEndLine = "-----END PRIVATE KEY-----";

  // Remove leading/trailing whitespace and newlines
  privateKey = privateKey.trim();

  // Check if the private key starts with the expected start line
  if (!privateKey.startsWith(expectedStartLine)) {
    console.log("Check if the private key starts with the expected start line");
    return false;
  }

  // Check if the private key ends with the expected end line
  if (!privateKey.endsWith(expectedEndLine)) {
    console.log("Check if the private key ends with the expected end line");
    return false;
  }

  // Validate variable escaping
  if (privateKey.includes("\\n") || privateKey.includes("\\r")) {
    console.log("Validate variable escaping");
    return false;
  }
  console.log("valid");

  return true;
}
const test = () => {
  isValidPrivateKeyFormat(PRIVATE_KEY);
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
    await drive.permissions.create({
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

async function getSheetValues(fileID, name) {
  console.log("_________");
  console.log(fileID);
  try {
    // Authorize the client to access the Google Sheets API
    await jwtClient.authorize();

    // Get the sheets API object
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // Range of cells you want to retrieve, e.g., "Sheet1!A1:C10" to get all values from A1 to C10
    const range = `${name}!A1:C`; // Replace this with the actual range you want to retrieve

    // Get the values from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileID,
      range: range,
    });

    // The response object will contain the values
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
  test,
};
