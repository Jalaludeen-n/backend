const { createRecord } = require("../controller/airtable");
// const roles = {[{

// }]}

const fetchGameDetails = async (data) => {
  try {
    console.log(data);
    // const formattedData = parseGameData(data);
    // await createRecord(formattedData, "GameInitiated");
    // console.log("Data successfully sent to Airtable");
  } catch (error) {
    // console.error("Error starting game:", error);
  }
};

module.exports = {
  fetchGameDetails,
};
