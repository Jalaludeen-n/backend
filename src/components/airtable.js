const {
  createRecord,
  fetchWithContion,
  updateGameInitiatedRecord,
} = require("../controller/airtable");
const {
  parseAndFormatGameData,
  parseAndFormatLevelData,
  parseAndFormatRoleData,
  parseJoinGameData,
  parseGameData,
} = require("../util/parse");
const {
  getRole,
  getRemainingRoles,
  assignRoleManually,
} = require("../components/gameDetails");

const {
  generateUniqueCode,
  getFile,
  extractSpreadsheetId,
} = require("../util/helper");

const startGame = async (data) => {
  try {
    const formattedData = parseGameData(data);
    await createRecord(formattedData, "GameInitiated");
    console.log("Data successfully sent to Airtable");
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

const createRunningGameRecord = async (formattedData) => {
  console.log(formattedData);
  await createRecord(formattedData, "RunningGames");
};

const incrementPlayerCount = async (response) => {
  const Id = response.id;
  const updatedFields = {
    Status: "Running",
    Players: response.fields.Players + 1,
  };
  await updateGameInitiatedRecord("GameInitiated", Id, updatedFields);
};

const fetchRolesAutoSelection = async (GameID) => {
  const condition = `{GameID} = "${GameID}"`;
  const fields = ["RolesAutoSelection", "ResultsSubbmision", "GoogleSheet"];
  const response = await fetchWithContion("Games", condition, fields);
  return response;
};
const joinParticipantToGame = async (
  GameID,
  roomNumber,
  group,
  email,
  role,
  name,
) => {
  const formattedData = {
    GameID: GameID,
    RoomNumber: roomNumber,
    GroupName: group,
    ParticipantEmail: email,
    Role: role,
    Name: name,
    CurrentLevel: 0,
  };
  await createRecord(formattedData, "Participant");
};
const updateGroupSize = async (GameID, roomNumber, group) => {
  const condition = `AND({GameID} = "${GameID}",{RoomNumber} = "${roomNumber}",{GroupName} = "${group}" )`;
  const filed = ["Size"];
  const response = await fetchWithContion("Group", condition, filed);

  if (response) {
    const formattedData = {
      Size: response[0].fields.Size + 1,
    };
    await updateGameInitiatedRecord(
      "GameInitiated",
      response[0].id,
      formattedData,
    );
  } else {
    const formattedData = {
      GameID: GameID,
      RoomNumber: roomNumber,
      GroupName: group,
      Size: 1,
    };
    await createRecord(formattedData, "Group");
  }
};
const isPlayerAlreadyExists = async (data) => {
  const condition = `AND({RoomNumber} = "${data.roomNumber}",{EmailID} = "${data.email}")`;
  const fields = ["EmailID"];
  const response = await fetchWithContion("RunningGames", condition, fields);
  return response;
};
const joinGame = async (data) => {
  try {
    let filed = ["Players", "Status", "GameID"];
    let condition = `{RoomNumber} = "${data.roomNumber}"`;
    let gameInitiatedResponse = await fetchWithContion(
      "GameInitiated",
      condition,
      filed,
    );
    if (gameInitiatedResponse) {
      const formattedData = parseJoinGameData(data);
      const isPlayerExists = await isPlayerAlreadyExists(data);
      if (!isPlayerExists) {
        const GameID = gameInitiatedResponse[0].fields.GameID;

        const roleSelectionResponse = await fetchRolesAutoSelection(GameID);
        await updateGroupSize(GameID, data.roomNumber, data.group);
        let role = null;
        if (roleSelectionResponse[0].fields.RolesAutoSelection) {
          role = await getRole(data);
          if (!role) {
            return {
              success: false,
              message:
                "There are no available roles in this group. Please consider joining another group.",
            };
          }
        }
        await createRunningGameRecord(formattedData);

        await incrementPlayerCount(gameInitiatedResponse[0]);

        await joinParticipantToGame(
          GameID,
          data.roomNumber,
          data.group,
          data.email,
          role,
          data.name,
        );
        const fields = roleSelectionResponse[0].fields;
        const sheetID = extractSpreadsheetId(fields.GoogleSheet);
        if (
          fields.ResultsSubbmision == "Each member does  their own subbmision"
        ) {
          const individualSheetData = {
            ParticipantEmail: data.email,
            RoomNumber: data.roomNumber,
            GroupName: data.group,
            GoogleSheetID: sheetID,
          };
          await createRecord(individualSheetData, "IndividualSheet");
        } else if (
          fields.ResultsSubbmision ==
            "Each group member can submit  group answer" ||
          fields.ResultsSubbmision == "Only one peson can submit group answer"
        ) {
          filed = ["GoogleSheetID"];
          condition = `AND({RoomNumber} = "${data.roomNumber}",{GroupName} = "${data.group}")`;
          let groupSheetResponse = await fetchWithContion(
            "IndividualSheet",
            condition,
            filed,
          );

          if (!groupSheetResponse) {
            const groupSheetSheetData = {
              RoomNumber: data.roomNumber,
              GroupName: data.group,
              GoogleSheetID: sheetID,
            };
            await createRecord(groupSheetSheetData, "GroupSheet");
          }
        }

        console.log("Data successfully sent to Airtable");
        return { success: true, message: "Game joined successfully" };
      } else {
        return {
          success: false,
          message: "Player already exists in the game",
        };
      }
    }
    return {
      success: false,
      message: "The game has not yet started.",
    };
  } catch (error) {
    console.error("Error joining game:", error);
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
      filed = ["GameName", "GameID", "NumberOfRounds"];
      condition = `{GameID} = "${GameID}"`;
      response = await fetchWithContion("Games", condition, filed);
    } else {
      filed = ["GameID"];
      condition = `{RoomNumber} = "${data.roomNumber}"`;
      response = await fetchWithContion("GameInitiated", condition, filed);
      if (response) {
        condition = `{GameID} = "${response[0].fields.GameID}"`;
        filed = ["NumberOfRounds", "GameName", "Instruction", "GameID"];
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

const getRoles = async (roomNumber, groupName) => {
  try {
    roles = await getRemainingRoles(roomNumber, groupName);

    return {
      success: true,
      data: roles,
      message: "Roles Fetched",
    };
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};
const selectRole = async (data) => {
  try {
    assignRoleManually(data.groupName, data.email, data.role);
    return {
      success: true,
      message: "Role selected",
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
    console.error("Error joining game:", error);
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
        data.roomNumber,
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
        item.fields &&
        item.fields.Role &&
        item.fields.Name &&
        item.fields.ParticipantEmail &&
        item.fields.GameID &&
        item.fields.ParticipantEmail !== emailId &&
        item.fields.RoomNumber !== roomNumber,
    )
    .map((item) => ({
      Role: item.fields.Role,
      Name: item.fields.Name,
      ParticipantEmail: item.fields.ParticipantEmail,
      GameID: item.fields.GameID,
    }));

  return filteredData;
}

module.exports = {
  startGame,
  joinGame,
  createGame,
  getRunningAndPastGame,
  fetchParticipantDetails,
  getRoles,
  selectRole,
  fetchGroupDetails,
  fetchParticipants,
};
