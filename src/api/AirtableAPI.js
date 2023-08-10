const Airtable = require('airtable');
const { json } = require( 'express' );
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const base = new Airtable({ apiKey }).base(baseId);
const fs = require('fs');
const path = require('path'); 




const createRecord = async (data,Table) => {
try {
  const createdRecord = await base(Table).create(data);
  return createdRecord;
} catch (error) {
  console.log(error)
  throw error; // Throw the error to be caught by the caller
}
};

const getFile = (pdfArray, name) => {
console.log(name)
for (const file of pdfArray) {
  console.log("inside" + file.originalname)
  if (file.originalname === name) {
    const uploadsPath = path.join(__dirname, './../../uploads'); // Adjust the path as needed
    const filePath = path.join(uploadsPath, name);
    
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }
}
return null;
};


const formatData = (pdf, data) => {
const RecordForGameTable = generateDataForGame(data,"Name");
const parsedData = getParseData(data);
const formattedData = parsedData.map((Data, dataIndex) => {
  const pdfFile = getFile(pdf, `${dataObject.Role}_Level${dataIndex+1}.pdf`); 
  // Replace 'test' with the actual filename
  const UniqueCode = generateUniqueCode(7);
  if (pdfFile) {
    return {
      fields: {
        GameID:UniqueCode,
        GameName: Data.GameName,
        GoogleSheet: Data.GoogleSheet,
        NumberOfRounds: 1,
        ResultsSubbmision: Data.ResultsSubbmision,
        ScoreVisibilityForPlayers: Data.ScoreVisibility,
        RolesAutoSelection : Data.RoleSelection,
        IndividualInstructionsPerRound : Data.IndividualInstructions
      },
    };
  }
  return null;
}).filter(Boolean); // Remove any null entries
return formattedData;
};

const formatDataOriginal = (pdf, data) => {
const parsedData = getParseData(data);
const formattedData = parsedData.map((dataObject, dataIndex) => {
  const pdfFile = getFile(pdf, 'test'); // Replace 'test' with the actual filename
  if (pdfFile) {
    return {
      fields: {
        GameID: dataObject.GameID,
        Role: dataObject.Role,
        LevelDescription: pdfFile,
        Level: dataIndex + 1,
      },
    };
  }
  return null;
}).filter(Boolean); // Remove any null entries
return formattedData;
};


const formatGameData = (data,GameId) => {
    return {
        GameID:GameId,
        GameName: data.GameName,
        GoogleSheet: data.GoogleSheet,
        NumberOfRounds: parseInt(data.NumberOfRounds),
        ResultsSubbmision: data.ResultsSubbmision,
        ScoreVisibilityForPlayers: data.ScoreVisibility,
        RolesAutoSelection : data.RoleSelection,
        IndividualInstructionsPerRound : data.IndividualInstructions
      
  }
};

const formatRoleData = (data,GameId) => {
const records = data.map((role) => ({
  fields: {
    GameID: GameId, // Update with the actual GameID
    Role: role,
    
  },
}));
};


const getParseData = (data) => {

const parsedData = data.map((dataString) => {
  return JSON.parse(dataString);
});
return parsedData;
};

const createGame = async (pdf, data,roles) => {
try {
  const UniqueCode = generateUniqueCode(7);
  const GameData = formatGameData(JSON.parse(data),UniqueCode);
  const RoleData = formatRoleData(roles,UniqueCode)
  const output = await createRecord(GameData,"Games");
if (output && output.id){
  

}
  // console.log(formattedData)
  // console.log(formattedData.GameName)
  // console.log(roles)
  // const rolesArray = roles.split(',');
  // console.log(rolesArray)
  // const parsedData = getParseData(data);
  // console.log(parsedData)

  // const finalData = formatData(pdf, data);
  // if (finalData.length === 0) {
  //   console.log('No valid data to create.');
  //   return;
  // }
  // const output = await createRecord(finalData,"Game");
  // const output = await createRecord(finalData);
  // console.log('Data successfully sent to Airtable', output);
} catch (error) {
  console.error('Error creating game:', error);
  // Handle the error, such as sending an error response to the client
}
};

function generateUniqueCode(length) {
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let code = '';

for (let i = 0; i < length; i++) {
  const randomIndex = Math.floor(Math.random() * characters.length);
  code += characters[randomIndex];
}

const timestamp = Date.now().toString(36).toUpperCase(); // Convert timestamp to base36 and uppercase
code = timestamp + code;

return code.substring(0, length); // Return only the desired length
}

// Generate a code of length 7

// Export the functions
module.exports = {
createRecord,
createGame,
};
