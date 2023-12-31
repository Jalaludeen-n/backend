const { getRole } = require("../level/gameDetails");

const { createCopySheet } = require("../../components/googleSheets");
const { extractSpreadsheetId } = require("../../helpers/helper");
const { incrementGroupSize, incrementPlayerCount } = require("./update");
const { getFile } = require("../../helpers/helper");
const {
  createNewGroup,
  createRunningGameRecord,
  joinParticipantToGame,
  createGroupSheet,
  createIndividualSheet,
} = require("./create");
const {
  fetchRolesAutoSelection,
  getGameInitiatedResponse,
  isPlayerAlreadyExists,
  fetchGroupSize,
  fetchGroupSheetResponse,
} = require("./condition");
const { parseJoinGameData } = require("./../../helpers/parse");

const { TEXT_MESSAGES } = require("./../../constants");

const checkRequiredParams = (data) => {
  if (!data.roomNumber) {
    return {
      success: false,
      message: "Missing roomNumber parameter",
    };
  }
  if (!data.group) {
    return {
      success: false,
      message: "Missing group parameter",
    };
  }
  if (!data.email) {
    return {
      success: false,
      message: "Missing email parameter",
    };
  }
  return null;
};

const joinGame = async (data, wss) => {
  try {
    const requiredParamError = checkRequiredParams(data);
    if (requiredParamError) {
      return requiredParamError;
    }

    const gameInitiatedResponse = await getGameInitiatedResponse(
      data.roomNumber,
    );
    if (!gameInitiatedResponse) {
      return {
        success: false,
        message: TEXT_MESSAGES.GAME_NOT_STARTED,
      };
    }

    const formattedData = parseJoinGameData(data);
    const isPlayerExists = await isPlayerAlreadyExists(data);

    if (isPlayerExists) {
      return {
        success: false,
        message: TEXT_MESSAGES.PLAYER_EXISTS,
      };
    }

    const GameID = gameInitiatedResponse[0].fields.GameID;

    const roleSelectionResponse = await fetchRolesAutoSelection(GameID);
    await checkAndIncrementGroupSize(GameID, data.roomNumber, data.group);

    let role = null;
    const {
      RolesAutoSelection,
      ResultsSubmission,
      GameName,
      NumberOfRounds,
      ScoreVisibilityForPlayers,
      IndividualInstructionsPerRound,
      Date,
    } = roleSelectionResponse[0].fields;
    let roleAutoAssigned = false;
    if (RolesAutoSelection) {
      roleAutoAssigned = true;
      role = await getRole(data);
      if (!role) {
        return {
          success: false,
          message: TEXT_MESSAGES.NO_AVAILABLE_ROLES,
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

    const { GoogleSheetID, submit } = await handleResultsSubmission(
      fields,
      data,
      role,
    );

    const fileName = `${GameName}_GameInstruction.pdf`;

    try {
      const gameInstruction = await getFile(fileName);

      responseData = {
        RolesAutoSelection,
        ResultsSubmission,
        GoogleSheetID,
        GameName,
        NumberOfRounds,
        ScoreVisibilityForPlayers,
        Date,
        GameID,
        role,
        roleAutoAssigned,
        gameInstruction,
        submit,
        level: 0,
        IndividualInstructionsPerRound,
      };
      wss.sockets.emit("newplayer", responseData);
      return {
        success: true,
        message: TEXT_MESSAGES.JOIN_SUCCESS,
        data: responseData,
      };
    } catch (error) {
      console.error("Error fetching game instruction:", error);
      return {
        success: false,
        message: "Error fetching game instruction",
        error: error.message, // Include the error message in the response
      };
    }
  } catch (error) {
    console.error("Error joining game:", error);
  }
};

const handleResultsSubmission = async (fields, data, role) => {
  if (fields.ResultsSubmission == "Each member does their own submission") {
    const sheetName = `${data.group}_${data.name}`;
    const sheetID = extractSpreadsheetId(fields.GoogleSheet);
    const GoogleSheetID = await createCopySheet(sheetID, sheetName);
    await createIndividualSheet(
      data.email,
      data.roomNumber,
      data.group,
      GoogleSheetID,
    );
    return { GoogleSheetID, submit: true };
  } else {
    let submit = true;
    if (
      fields.ResultsSubmission == "Only one person can submit group answer" &&
      role
    ) {
      const condition = `AND({GameID} = "${GameID}",{RoomNumber} = "${data.roomNumber}",{Role} = "${role}",{Submit} = "1")`;
      const fields = ["Role", "Submit"];
      const submitRole = await fetchWithCondition("Role", condition, fields);
      if (!submitRole) submit = false;
    }

    const groupSheetResponse = await fetchGroupSheetResponse(
      data.roomNumber,
      data.group,
    );

    if (!groupSheetResponse) {
      const sheetName = `${data.group}_${data.name}`;
      const sheetID = extractSpreadsheetId(fields.GoogleSheet);
      const GoogleSheetID = await createCopySheet(sheetID, sheetName);

      await createGroupSheet(data.roomNumber, data.group, GoogleSheetID);
      return { GoogleSheetID, submit };
    } else {
      const GoogleSheetID = groupSheetResponse[0].fields.GoogleSheetID;
      return { GoogleSheetID, submit };
    }
  }
};

const checkAndIncrementGroupSize = async (GameID, roomNumber, group) => {
  const groupResponse = await fetchGroupSize(GameID, roomNumber, group);
  if (groupResponse) {
    await incrementGroupSize(groupResponse[0]);
  } else {
    await createNewGroup(GameID, roomNumber, group);
  }
};

module.exports = {
  joinGame,
};
