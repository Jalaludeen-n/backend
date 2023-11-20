const Airtable = require("airtable");
const axios = require("axios"); // Import Axios or your preferred HTTP client library
const apiKey = process.env.TOKEN_ID;
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
async function fetchPayloads(webhookId, cursor) {
  const response = await axios.get(
    `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        cursor: cursor,
      },
    },
  );
  return response.data;
}

const fetchGameData = async (tableName, fieldNames) => {
  try {
    const records = await base(tableName)
      .select({
        fields: fieldNames,
      })
      .all();
    const gameData = records.map((record) => {
      const data = {};
      fieldNames.forEach((field) => {
        data[field] = record.get(field);
      });
      return data;
    });

    return gameData;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

const fetchWithCondition = async (tableName, condition, fields) => {
  try {
    const queryResult = await base(tableName)
      .select({
        fields: fields,
        filterByFormula: condition,
      })
      .firstPage();

    if (queryResult && queryResult.length > 0) {
      return queryResult;
    } else {
      console.log("No record found");
      return null;
    }
  } catch (error) {
    console.error("Error updating record:", error);
    throw error;
  }
};

const updateGameInitiatedRecord = async (tableName, id, updatedFields) => {
  try {
    const updatedRecord = await base(tableName).update(id, updatedFields);

    if (updatedRecord) {
      console.log("Record updated:");
    } else {
      console.log("No record found");
    }
  } catch (error) {
    console.error("Error updating record:", error);
  }
};
const updateLevel = async (tableName, updatedFields) => {
  try {
    const updatedRecord = await base(tableName).update(updatedFields);

    if (updatedRecord) {
      console.log("Record updated:");
    } else {
      console.log("No record found");
    }
  } catch (error) {
    console.error("Error updating record:", error);
  }
};

module.exports = {
  createRecord,
  fetchGameData,
  updateGameInitiatedRecord,
  fetchWithCondition,
  updateLevel,
  fetchPayloads,
};
