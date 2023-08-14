const credentials = require(" ../../tomorrow-college.json");



const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ], // Specify the necessary scopes
);



const getFile = (pdfArray, name) => {
  for (const file of pdfArray) {
    if (file.originalname === name) {
      const uploadsPath = path.join(__dirname, "./../../uploads"); // Adjust the path as needed
      const filePath = path.join(uploadsPath, name);
      fs.writeFileSync(filePath, file.buffer);
      return filePath;
    }
  }
  return null;
};

const updateCellValue = async (spreadsheetId, value) => {
  try {
    const tokens = await jwtClient.authorize();
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    const data = [[value]];
    const resource = {
      values: data,
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "test!A2",
      valueInputOption: "RAW",
      resource,
    });

    console.log(`Value in A3 updated successfully: ${value}`);
  } catch (err) {
    console.error("Error:", err);
  }
};

const createCopy = async (fileId) => {
  try {
    // Authorize the client
    const tokens = await jwtClient.authorize();
    const drive = google.drive({ version: "v3", auth: jwtClient });

    // Create a copy of the file
    const response = await drive.files.copy({
      fileId,
      requestBody: {
        name: "Copy of My File", // Replace with the desired name for the new copy
      },
    });

    console.log("New copy created:");
    console.log(response.data);
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
    const range = "test!A1:C10"; // Replace this with the actual range you want to retrieve

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

export { updateCellValue, createCopy, getSheetValues };
