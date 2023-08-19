const Airtable = require("airtable");
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const base = new Airtable({ apiKey }).base(baseId);

const createRecord = async (data, Table) => {
  try {
    const createdRecord = await base(Table).create(data);
    return createdRecord;
  } catch (error) {
    console.log(error);
    throw error; // Throw the error to be caught by the caller
  }
};

const fetchGameData = async () => {
  try {
    const records = await base("Games")
      .select({
        fields: ["GameID", "GameName"],
      })
      .all();
    const gameData = records.map((record) => ({
      id: record.get("GameID"),
      name: record.get("GameName"),
    }));
    return gameData;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

module.exports = {
  createRecord,
  fetchGameData,
};
