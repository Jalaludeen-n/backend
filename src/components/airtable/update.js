const { updateGameInitiatedRecord } = require("../../controller/airtable");

const incrementGroupSize = async (groupRecord) => {
  const formattedData = {
    Size: groupRecord.fields.Size + 1,
  };
  await updateGameInitiatedRecord("Group", groupRecord.id, formattedData);
};

const incrementPlayerCount = async (response) => {
  const Id = response.id;
  const updatedFields = {
    Status: "Running",
    Players: response.fields.Players + 1,
  };
  await updateGameInitiatedRecord("GameInitiated", Id, updatedFields);
};

module.exports = {
  incrementGroupSize,
  incrementPlayerCount,
};
