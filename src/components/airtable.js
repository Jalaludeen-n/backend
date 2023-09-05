const {
  createRecord,
  fetchWithCondition,
  updateGameInitiatedRecord,
  updateLevel,
} = require("../controller/airtable");
const {
  parseAndFormatGameData,
  parseAndFormatLevelData,
  parseAndFormatRoleData,
  parseAndFormatLevel,
  parseGameData,
} = require("../helpers/parse");
const {
  getRemainingRoles,
  assignRoleManually,
} = require("../components/gameDetails");
const {
  fetchQustions,
  storeAnsweresInSheet,
  fetchScore,
  fetchEmbedID,
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
    const fields = ["Players", "Status", "Date", "RoomNumber", "GameID"];
    const condition = ""; // Set your condition here
    const response = await fetchWithCondition(
      "GameInitiated",
      condition,
      fields,
    );

    if (!response) {
      return {
        success: true,
        data: [],
        message: "No running games",
      };
    }

    const extractedData = extractFields(response);

    return {
      success: true,
      data: extractedData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error getting games:", error);
    throw error;
  }
};

const createGame = async (pdf, data, roles) => {
  try {
    const uniqueCode = generateUniqueCode(7);
    const gameData = parseAndFormatGameData(data, uniqueCode, pdf);
    let levelData;
    if (!gameData.IndividualInstructionsPerRound) {
      levelData = parseAndFormatLevel(roles, pdf, gameData);
    } else {
      levelData = parseAndFormatLevelData(roles, pdf, gameData);
    }
    const roleData = parseAndFormatRoleData(roles, uniqueCode, pdf);

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
    let response = await fetchWithCondition("Participant", condition, filed);
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
      response = await fetchWithCondition("Games", condition, filed);
    } else {
      filed = ["GameID"];
      condition = `{RoomNumber} = "${data.roomNumber}"`;
      response = await fetchWithCondition("GameInitiated", condition, filed);
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
        response = await fetchWithCondition("Games", condition, filed);
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
    let subbmisionType = data.resultsSubbmision;
    let submit = true;
    let filed = ["CurrentLevel", "Role"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}",{GroupName} = "${data.groupName}")`;
    let response = await fetchWithCondition("Participant", condition, filed);
    filed = ["IndividualInstructionsPerRound"];
    condition = `AND({IndividualInstructionsPerRound} = 1 ,{GameID} = "${data.gameID}")`;
    let gamesResponse = await fetchWithCondition("Games", condition, filed);

    const role = response[0].fields.Role;
    const formattedData = {
      CurrentLevel: data.level.toString(),
    };
    let sheetID;

    if (subbmisionType == "Each member does  their own subbmision") {
      let filed = ["GoogleSheetID"];
      let condition = `AND({ParticipantEmail} = "${data.email}",{RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
      let response = await fetchWithCondition(
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
      let response = await fetchWithCondition("GroupSheet", condition, filed);

      sheetID = response[0].fields.GoogleSheetID;
      if (subbmisionType == "Only one peson can submit group answer") {
        condition = `AND({GameID} = "${data.gameID}",{Role} = "${role}",{Submit} = 0)`;
        let filed = ["Submit"];
        let response = await fetchWithCondition("Role", condition, filed);
        if (response) {
          submit = false;
        }
      }
    }

    const qustions = await fetchQustions(sheetID, data.level);
    let fileName;

    if (gamesResponse) {
      fileName = `${data.gameName}_${role}_Level${data.level}.pdf`;
    } else {
      fileName = `${data.gameName}_LevelInstruction.pdf`;
    }

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
const updateCurrentLevels = (records, newLevel) => {
  return records.map((record) => ({
    id: record.id,
    fields: {
      CurrentLevel: newLevel.toString(),
    },
  }));
};
function allFieldsCompleted(records) {
  for (const record of records) {
    const currentLevel = record.fields["CurrentLevel"];
    if (currentLevel !== "word") {
      return false;
    }
  }
  return true;
}

const gameCompleted = async (data) => {
  try {
    let filed = ["CurrentLevel", "Role"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
    let response = await fetchWithCondition("Participant", condition, filed);
    let formattedData = updateCurrentLevels(response, "Completed");
    for (const record of formattedData) {
      await updateGameInitiatedRecord("Participant", record.id, record.fields);
    }
    filed = ["CurrentLevel"];
    condition = `{RoomNumber} = "${data.roomNumber}"`;
    response = await fetchWithCondition("Participant", condition, filed);
    if (allFieldsCompleted(response)) {
      filed = ["Status"];
      let condition = `AND({RoomNumber} = "${data.roomNumber}",{GameID} = "${data.gameID}")`;
      response = await fetchWithCondition("GameInitiated", condition, filed);
      const Id = response.id;
      const updatedFields = {
        Status: "Completed",
      };
      await updateGameInitiatedRecord("GameInitiated", Id, updatedFields);
    }

    return {
      success: true,
      data: {},
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching game details", error);
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
    assignRoleManually(data.groupName, data.email, data.role, data.roomNumber);
    let filed = ["RoomNumber", "GroupName", "ParticipantEmail"];
    let condition = `AND({RoomNumber} = "${data.roomNumber}",{ParticipantEmail} = "${data.email}")`;
    let response = await fetchWithCondition("Participant", condition, filed);
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

        // Convert the level to an integer
        const numericLevel =
          level === "Completed" ? Infinity : parseInt(level, 10);

        if (
          !groupedRecords[groupName] ||
          numericLevel > groupedRecords[groupName].level
        ) {
          groupedRecords[groupName] = { groupName, level: numericLevel };
        }
      });

      // Convert the grouped records object into an array and sort by level
      const groupsWithHighestLevel = Object.values(groupedRecords)
        .sort((a, b) => {
          // Sort by numeric level in descending order
          return b.level - a.level;
        })
        .map((record) => ({
          groupName: record.groupName,
          level: record.level === Infinity ? "Completed" : String(record.level),
        }));

      // Find and set the highest level
      const highestLevel =
        groupsWithHighestLevel.length > 0
          ? groupsWithHighestLevel[0].level
          : "No records";

      return { groupsWithHighestLevel, highestLevel };
    } else {
      console.log("No records found");
      return { groupsWithHighestLevel: null, highestLevel: "No records" };
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
    let gamesResponse = await fetchWithCondition("Games", condition, filed);

    if (!gamesResponse || gamesResponse.length === 0) {
      return {
        success: false,
        Data: null,
        Message: "Game details not found",
      };
    }

    filed = ["CurrentLevel", "GroupName"];
    condition = `AND({GameID} = "${data.GameID}", {RoomNumber} = "${data.RoomNumber}")`;

    let runningGamesResponse = await fetchWithCondition(
      "Participant",
      condition,
      filed,
    );

    if (!runningGamesResponse || runningGamesResponse.length === 0) {
      return {
        success: false,
        Data: null,
        Message: "Running game details not found",
      };
    }

    const totalLevels = gamesResponse[0].fields.NumberOfRounds;
    const level = await groupsWithHighestLevel(
      runningGamesResponse,
      totalLevels,
    );
    const Data = {
      Name: gamesResponse[0].fields.GameName,
      Levels: level.groupsWithHighestLevel,
      currentLevel: level.highestLevel.toString(),
      totalLevels,
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

    const response = await fetchWithCondition(
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
    let response = await fetchWithCondition("Games", condition, filed);
    const subbmisionType = response[0].fields.ResultsSubbmision;
    let sheetID;
    if (subbmisionType == "Each member does  their own subbmision") {
      let filed = ["GoogleSheetID"];
      let condition = `AND({ParticipantEmail} = "${data.email}",{RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
      let response = await fetchWithCondition(
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
      let response = await fetchWithCondition("GroupSheet", condition, filed);

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
function extractFieldsForMember(records, fieldNames) {
  return records.map((record) => {
    const extractedFields = {};
    fieldNames.forEach((fieldName) => {
      extractedFields[fieldName] = record.get(fieldName);
    });
    return extractedFields;
  });
}

const getScore = async (data) => {
  const { groupName, roomNumber, gameID } = data;
  try {
    let filed = ["ResultsSubbmision"];
    let condition = `{gameID} = "${gameID}"`;
    let response = await fetchWithCondition("Games", condition, filed);
    const subbmisionType = response[0].fields.ResultsSubbmision;
    console.log(subbmisionType);
    let sheetID;
    if (subbmisionType == "Each member does  their own subbmision") {
      let filed = ["GoogleSheetID"];
      let condition = `AND({ParticipantEmail} = "${data.email}",{RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.groupName}")`;
      let response = await fetchWithCondition(
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
      let response = await fetchWithCondition("GroupSheet", condition, filed);

      sheetID = response[0].fields.GoogleSheetID;
    }

    const score = await fetchScore(sheetID);
    const responseData = await formatDataForGID(score, sheetID);

    return {
      success: true,
      data: responseData,
      message: "Data fetched",
      sheetID,
    };
  } catch (error) {
    console.error("Error Fetching score:", error);
    throw error;
  }
};
async function formatDataForGID(data, sheetID) {
  const formattedData = {};

  for (const level in data) {
    if (!data.hasOwnProperty(level)) continue;

    const value = data[level];

    if (!isNaN(value)) {
      formattedData[level] = {
        type: "number",
        score: parseInt(value),
      };
    } else {
      const id = await fetchEmbedID(sheetID); // Replace sheetID with your actual ID retrieval logic
      formattedData[level] = {
        type: "chart",
        id,
      };
    }
  }

  return formattedData;
}

const getMember = async (data) => {
  const { groupName, roomNumber, gameID } = data;
  try {
    let filed = ["Name", "Role", "ParticipantEmail", "CurrentLevel"];
    let condition = `AND({GroupName} = "${groupName}",{gameID} = "${gameID}",{RoomNumber} = "${roomNumber}")`;
    console.log(groupName, roomNumber, gameID);
    let response = await fetchWithCondition("Participant", condition, filed);
    const extractedData = extractFieldsForMember(response, filed);
    console.log(extractedData);

    return {
      success: true,
      data: extractedData,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error Fetching member:", error);
    throw error;
  }
};

const fetchNewParticipant = async (GroupName, GameID, RoomNumber) => {
  try {
    let filed = ["GameID", "Role", "ParticipantEmail", "Name"];
    let condition = `AND({GroupName} = "${GroupName}",{GameID} = "${GameID}",{RoomNumber} = "${RoomNumber}")`;
    let response = await fetchWithCondition("Participant", condition, filed);

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
    let response = await fetchWithCondition("Participant", condition, filed);
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
      CurrentLevel: level.toString(),
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
  gameCompleted,
  getScore,
  getMember,
};
