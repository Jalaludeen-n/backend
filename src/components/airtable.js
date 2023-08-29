const {
  createRecord,
  fetchWithContion,
  updateGameInitiatedRecord,
  updateLevel,
} = require("../controller/airtable");
const {
  parseAndFormatGameData,
  parseAndFormatLevelData,
  parseAndFormatRoleData,
  parseGameData,
} = require("../helpers/parse");
const {
  getRemainingRoles,
  assignRoleManually,
} = require("../components/gameDetails");
const {
  fetchQustions,
  storeAnsweresInSheet,
} = require("../components/googleSheets");

const { generateUniqueCode, getFile } = require("../helpers/helper");

const { fetchRolesAutoSelection } = require("./airtable/condition");

const startGame = async (data) => {
  try {
    const formattedData = parseGameData(data);
    await createRecord(formattedData, "GameInitiated");
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

const getRunningAndPastGame = async () => {
  try {
    const filed = ["Players", "Status", "Date", "RoomNumber", "GameID"];
    const condition = "";
    const response = await fetchWithContion("GameInitiated", condition, filed);
    const res = extractFields(response);
    return {
      success: true,
      data: res,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error getting  games:", error);
    throw error;
  }
};

const createGame = async (pdf, data, roles) => {
  try {
    const uniqueCode = generateUniqueCode(7);
    const gameData = parseAndFormatGameData(data, uniqueCode, pdf);
    const roleData = parseAndFormatRoleData(roles, uniqueCode, pdf);
    const levelData = parseAndFormatLevelData(roles, pdf, gameData);

    await createRecord(gameData, "Games");
    await createRecord(roleData, "Role");
    await createRecord(levelData, "Instructions");
  } catch (error) {
    console.error("Error creating game:", error);
  }
};

const fetchParticipantDetails = async (data) => {
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}")`;
    let response = await fetchWithContion("Participant", condition, filed);
    let responseData = {};
    let role;
    let name = response && response[0].fields.Name;
    let roleAutoAssigned = false;
    if (response && response[0].fields.Role) {
      roleAutoAssigned = true;
      role = response[0].fields.Role;
      const GameID = response[0].fields.GameID;
      filed = [
        "NumberOfRounds",
        "GameName",
        "Instruction",
        "GameID",
        "ResultsSubbmision",
        "ScoreVisibilityForPlayers",
      ];
      condition = `{GameID} = "${GameID}"`;
      response = await fetchWithContion("Games", condition, filed);
    } else {
      filed = ["GameID"];
      condition = `{RoomNumber} = "${data.roomNumber}"`;
      response = await fetchWithContion("GameInitiated", condition, filed);
      if (response) {
        condition = `{GameID} = "${response[0].fields.GameID}"`;
        filed = [
          "NumberOfRounds",
          "GameName",
          "Instruction",
          "GameID",
          "ResultsSubbmision",
          "ScoreVisibilityForPlayers",
        ];
        response = await fetchWithContion("Games", condition, filed);
      } else {
        return {
          success: false,
          message: "The game has not yet started.",
        };
      }
    }

    const fileName = `${response[0].fields.GameName}_GameInstruction.pdf`;

    const gameInstruction = await getFile(fileName);
    responseData = {
      role: role,
      name: name,
      numberOfRounds: response[0].fields.NumberOfRounds,
      gameName: response[0].fields.GameName,
      email: data.email,
      roomNumber: data.roomNumber,
      gameID: response[0].fields.GameID,
      resultsSubbmision: response[0].fields.ResultsSubbmision,
      scoreVisibilityForPlayers: response[0].fields.ScoreVisibilityForPlayers,
      pdf: gameInstruction,
    };

    return {
      success: true,
      roleAutoAssigned,
      data: responseData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

const fetchLevelDetails = async (data) => {
  try {
    console.log(data);
    let subbmisionType = data.resultsSubbmision;
    let submit = true;
    let filed = ["CurrentLevel"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}",{GroupName} = "${data.groupName}")`;
    let response = await fetchWithContion("Participant", condition, filed);
    const formattedData = {
      CurrentLevel: data.level,
    };
    if (subbmisionType == "Only one peson can submit group answer") {
      condition = `AND({GameID} = "${data.gameID}",{Role} = "${data.role}",{Submit} = 0)`;
      let filed = ["Submit"];
      let response = await fetchWithContion("Role", condition, filed);
      if (response) {
        submit = false;
      }
    }

    const qustions = await fetchQustions(data.sheetID, data.level);

    const fileName = `${data.gameName}_${data.role}_Level${data.level}.pdf`;

    const levelInstruction = await getFile(fileName);

    await updateGameInitiatedRecord(
      "Participant",
      response[0].id,
      formattedData,
    );

    const responseData = {
      qustions: qustions,
      instruction: levelInstruction,
      submit,
    };

    return {
      success: true,
      data: responseData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};

const getRoles = async (data) => {
  try {
    roles = await getRemainingRoles(data.roomNumber, data.groupName);

    return {
      success: true,
      data: roles,
      message: "Roles Fetched",
    };
  } catch (error) {
    console.error("Error getting roles", error);
    throw error;
  }
};
const selectRole = async (data) => {
  try {
    assignRoleManually(data.groupName, data.email, data.role);
    let filed = ["RoomNumber", "GroupName", "ParticipantEmail"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}")`;
    let response = await fetchWithContion("Participant", condition, filed);
    const formattedData = {
      Role: data.role,
    };
    await updateGameInitiatedRecord(
      "Participant",
      response[0].id,
      formattedData,
    );
    return {
      success: true,
      message: "Role updated",
    };
  } catch (error) {
    console.error("Error selecting role:", error);
    throw error;
  }
};
function extractFields(records) {
  return records.map((record) => {
    return {
      id: record.id,
      Date: record.fields.Date,
      Players: record.fields.Players,
      Status: record.fields.Status,
      RoomNumber: record.fields.RoomNumber,
      GameID: record.fields.GameID,
    };
  });
}
const groupsWithHighestLevel = async (queryResult, totalLevel) => {
  try {
    if (queryResult && queryResult.length > 0) {
      // Group the records by group name
      const groupedRecords = {};
      queryResult.forEach((record) => {
        const groupName = record.get("GroupName");
        const level = record.get("CurrentLevel");
        if (
          !groupedRecords[groupName] ||
          level > groupedRecords[groupName].level
        ) {
          groupedRecords[groupName] = { groupName, level };
        }
      });

      // Convert the grouped records object into an array and sort by level
      const groupsWithHighestLevel = Object.values(groupedRecords)
        .sort((a, b) => b.level - a.level)
        .map((record) => ({
          groupName: record.groupName,
          level: record.level === totalLevel ? "Completed" : record.level,
        }));

      return groupsWithHighestLevel;
    } else {
      console.log("No records found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching records:", error);
    throw error;
  }
};

const fetchGroupDetails = async (data) => {
  try {
    let filed = ["GameName", "NumberOfRounds"];
    let condition = `{GameID} = "${data.GameID}"`;
    let gamesResponse = await fetchWithContion("Games", condition, filed);
    filed = ["CurrentLevel", "GroupName"];
    condition = "";

    filed = ["GroupName", "CurrentLevel"];
    condition = `AND({GameID} = "${data.GameID}", {RoomNumber} = "${data.RoomNumber}")`;

    let runningGamesResponse = await fetchWithContion(
      "Participant",
      condition,
      filed,
    );

    const totalLevels = gamesResponse[0].fields.NumberOfRounds;
    const level = await groupsWithHighestLevel(
      runningGamesResponse,
      totalLevels,
    );
    const Data = {
      Name: gamesResponse[0].fields.GameName,
      Levels: level,
    };

    return {
      success: true,
      Data,
      Message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching group details", error);
    throw error;
  }
};

const fetchParticipants = async (data) => {
  try {
    const fetchedFields = ["Role", "ParticipantEmail", "Name", "GameID"];
    const condition = `AND({RoomNumber} = "${data.roomNumber}", {GroupName} = "${data.groupName}")`;

    // Fetch participants based on the condition and required fields
    const response = await fetchWithContion(
      "Participant",
      condition,
      fetchedFields,
    );

    const filteredparticipants = filterAndCondition(
      response,
      data.email,
      data.roomNumber,
    );

    let rolesAutoAssigned = data.roleAutoAssigned;
    if (typeof rolesAutoAssigned === "undefined") {
      const rolesAutoSelectionResponse = await fetchRolesAutoSelection(
        response[0].fields.GameID,
      );
      rolesAutoAssigned =
        rolesAutoSelectionResponse[0].fields.RolesAutoSelection;
    }

    const participants = {
      filteredparticipants,
      rolesAutoAssigned,
    };

    if (!rolesAutoAssigned) {
      const remainingRoles = await getRemainingRoles(
        data.roomNumber,
        data.groupName,
      );
      participants.roles = remainingRoles;
    }

    return {
      success: true,
      data: participants,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

function filterAndCondition(response, emailId, roomNumber) {
  const filteredData = response
    .filter(
      (item) =>
        item.fields.ParticipantEmail !== emailId &&
        item.fields.RoomNumber !== roomNumber,
    )
    .map((item) => ({
      Role: item.fields.Role || "Not Selected",
      Name: item.fields.Name,
      ParticipantEmail: item.fields.ParticipantEmail,
      GameID: item.fields.GameID,
    }));

  return filteredData;
}
const storeAnsweres = async (data) => {
  try {
    const resultsSubbmision = data.resultsSubbmision;
    // if (typeof resultsSubbmision === "undefined") {
    let filed = ["ResultsSubbmision", "IndividualInstructionsPerRound"];
    let condition = `{GameID} = "${data.gameID}"`;
    let response = await fetchWithContion("Games", condition, filed);
    const subbmisionType = response[0].fields.ResultsSubbmision;
    let sheetID;
    if (subbmisionType == "Each member does  their own subbmision") {
      let filed = ["GoogleSheetID"];
      let condition = `AND({ParticipantEmail} = "${data.email}",{RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
      let response = await fetchWithContion(
        "IndividualSheet",
        condition,
        filed,
      );
      sheetID = response[0].fields.GoogleSheetID;
    } else if (
      subbmisionType == "Each group member can submit  group answer" ||
      subbmisionType == "Only one peson can submit group answer"
    ) {
      let filed = ["GoogleSheetID"];
      let condition = `AND({RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
      let response = await fetchWithContion("GroupSheet", condition, filed);

      sheetID = response[0].fields.GoogleSheetID;
    }

    // await storeAnsweresInSheet(sheetID, data.answers, data.level);
    // } else {
    await storeAnsweresInSheet(sheetID, data.answers, data.level);
    // }

    return {
      success: true,
      message: "Answeres Stored",
    };
  } catch (error) {
    console.error("Error Storing ans", error);
    throw error;
  }
};

const fetchNewParticipant = async (GroupName, GameID, RoomNumber) => {
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name"];
    let condition = `AND({GroupName} = "${GroupName}",{GameID} = "${GameID}",{RoomNumber} = "${RoomNumber}")`;
    let response = await fetchWithContion("Participant", condition, filed);

    return {
      success: true,
      data: {},
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error Fetching new participant:", error);
    throw error;
  }
};
const updateAlltheUserRounds = async (GroupName, GameID, RoomNumber, round) => {
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name"];
    let condition = `AND({GroupName} = "${GroupName}",{GameID} = "${GameID}",{RoomNumber} = "${RoomNumber}")`;
    let response = await fetchWithContion("Participant", condition, filed);
    const formatted = formatAndReturnUpdatedData(response, round);

    await updateLevel("Participant", formatted.records);

    return {
      success: true,
      data: {},
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error updating all the user round:", error);
    throw error;
  }
};
const formatAndReturnUpdatedData = (records, level) => {
  const updatedData = records.map((record) => ({
    id: record.id,
    fields: {
      CurrentLevel: level,
    },
  }));

  return { records: updatedData };
};

module.exports = {
  startGame,
  createGame,
  getRunningAndPastGame,
  fetchParticipantDetails,
  getRoles,
  selectRole,
  fetchGroupDetails,
  fetchParticipants,
  fetchLevelDetails,
  storeAnsweres,
  fetchNewParticipant,
  updateAlltheUserRounds,
};
