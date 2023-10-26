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
  const emailFieldId = "fldtvtie9DpSEf2Fg";
  return (
    lastChangedRecord.current.cellValuesByFieldId[emailFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[emailFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[emailFieldId]
  );
};

const isRoleAdded = (lastChangedRecord) => {
  const roleFieldId = "fldTaQFHchDD5DstL";
  return (
    lastChangedRecord.current.cellValuesByFieldId[roleFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[roleFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[roleFieldId]
  );
};

const isLevelUpdated = (lastChangedRecord) => {
  const levelFieldId = "fld1ghCkCQ5Oll7kg";
  return (
    lastChangedRecord.current.cellValuesByFieldId[levelFieldId] &&
    lastChangedRecord.previous.cellValuesByFieldId[levelFieldId] !==
      lastChangedRecord.current.cellValuesByFieldId[levelFieldId]
  );
};

const getIDs = (lastChangedRecord) => {
  const GroupName =
    lastChangedRecord.unchanged.cellValuesByFieldId.fld88tu3iErshi5Sk;
  const GameID =
    lastChangedRecord.unchanged.cellValuesByFieldId.fldeV1edgsVzgvm6T;
  const RoomNumber =
    lastChangedRecord.unchanged.cellValuesByFieldId.fldsx8MjZTyo2kHPQ;

  return { GroupName, GameID, RoomNumber };
};

const updateAllUserRounds = async (GameID, RoomNumber, GroupName, level) => {
  // Update user rounds with the provided level
  await updateAlltheUserRounds(GroupName, GameID, RoomNumber, level);
};
module.exports = {
  updateAllUserRounds,
  getIDs,
  isLevelUpdated,
  isRoleAdded,
  isNewUserAdded,
  findLastChangedRecord,
  fetchAndProcessPayloads,
};
