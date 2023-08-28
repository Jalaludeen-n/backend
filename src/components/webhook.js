const { updateAlltheUserRounds } = require("../components/airtable");
const { fetchPayloads } = require("./../controller/airtable");

const findLastChangedRecord = (webhookDetails) => {
  const changedTablesKeys = Object.keys(webhookDetails.changedTablesById);
  const lastChangedTableKey = changedTablesKeys[changedTablesKeys.length - 1];

  const lastChangedTable =
    webhookDetails.changedTablesById[lastChangedTableKey];
  const changedRecordsKeys = Object.keys(lastChangedTable.changedRecordsById);
  const lastChangedRecordKey =
    changedRecordsKeys[changedRecordsKeys.length - 1];

  return lastChangedTable.changedRecordsById[lastChangedRecordKey];
};
const fetchAndProcessPayloads = async (webhookId) => {
  let hasMorePayloads = true;
  let latestCursor = 1;
  let lastPayload;
  while (hasMorePayloads) {
    const { payloads, mightHaveMore, cursor } = await fetchPayloads(
      webhookId,
      latestCursor,
    );
    hasMorePayloads = mightHaveMore;
    latestCursor = cursor;

    for (const payload of payloads) {
      lastPayload = payload;
    }
  }
  return lastPayload;
};

const isNewUserAdded = (lastChangedRecord) => {
  const emailFieldId = "fldg4q0xq2QsofmHf";
  return (
    lastChangedRecord.current.cellValuesByFieldId[emailFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[emailFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[emailFieldId]
  );
};

const isRoleAdded = (lastChangedRecord) => {
  const roleFieldId = "fldRzre0LCkn53U3f";
  console.log("+_++++++++");
  console.log(lastChangedRecord.current.cellValuesByFieldId[roleFieldId]);
  return (
    lastChangedRecord.current.cellValuesByFieldId[roleFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[roleFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[roleFieldId]
  );
};

const isLevelUpdated = (lastChangedRecord) => {
  const levelFieldId = "fldo6NqQFxe3QsAGT";
  return (
    lastChangedRecord.current.cellValuesByFieldId[levelFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[levelFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[levelFieldId]
  );
};

const fetchNewParticipantForLastRecord = async (
  GameID,
  RoomNumber,
  GroupName,
) => {
  // Fetch and return participants
};
const getIDs = (lastChangedRecord) => {
  const GroupName =
    lastChangedRecord.unchanged.cellValuesByFieldId.fldN6N6X6a5ZTtJU9;
  const GameID =
    lastChangedRecord.unchanged.cellValuesByFieldId.fldKjdwBkA9HX2d85;
  const RoomNumber =
    lastChangedRecord.unchanged.cellValuesByFieldId.fldcpTI7KR7fZN1Kk;

  return { GroupName, GameID, RoomNumber };
};

const updateAllUserRounds = async (GameID, RoomNumber, GroupName, level) => {
  // Update user rounds with the provided level
  await updateAlltheUserRounds(GroupName, GameID, RoomNumber, level);
};
module.exports = {
  updateAllUserRounds,
  getIDs,
  fetchNewParticipantForLastRecord,
  isLevelUpdated,
  isRoleAdded,
  isNewUserAdded,
  findLastChangedRecord,
  fetchAndProcessPayloads,
};
