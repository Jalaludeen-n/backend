const { getRole } = require("../../components/gameDetails");

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

const joinGame = async (data) => {
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
      ResultsSubbmision,
      GoogleSheet,
      GameName,
      NumberOfRounds,
      ScoreVisibilityForPlayers,
      IndividualInstructionsPerRound,
      Instruction,
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

    const GoogleSheetID = await handleResultsSubmission(fields, data);
    const fileName = `${GameName}_GameInstruction.pdf`;

    const gameInstruction = await getFile(fileName);

    responseData = {
      RolesAutoSelection,
      ResultsSubbmision,
      GoogleSheetID,
      GameName,
      NumberOfRounds,
      ScoreVisibilityForPlayers,
      Date,
      GameID,
      role,
      roleAutoAssigned,
      gameInstruction,
    };

    return {
      success: true,
      message: TEXT_MESSAGES.JOIN_SUCCESS,
      data: responseData,
    };
  } catch (error) {
    console.error("Error joining game:", error);
  }
};

const handleResultsSubmission = async (fields, data) => {
  if (fields.ResultsSubbmision === "Each member does  their own subbmision") {
    const sheetName = `${data.group}_${data.name}`;
    const sheetID = extractSpreadsheetId(fields.GoogleSheet);
    const copySheetLink = await createCopySheet(sheetID, sheetName);
    await createIndividualSheet(
      data.email,
      data.roomNumber,
      data.group,
      copySheetLink,
    );
    return copySheetLink;
  } else if (
    fields.ResultsSubbmision === "Each group member can submit  group answer" ||
    fields.ResultsSubbmision === "Only one peson can submit group answer"
  ) {
    const groupSheetResponse = await fetchGroupSheetResponse(
      data.roomNumber,
      data.group,
    );

    if (!groupSheetResponse) {
      const sheetName = `${data.groupName}_${data.name}`;
      const sheetID = extractSpreadsheetId(fields.GoogleSheet);
      const copySheetLink = await createCopySheet(sheetID, sheetName);

      await createGroupSheet(data.roomNumber, data.group, copySheetLink);
      return copySheetLink;
    }
    groupSheetResponse[0].fields.GoogleSheetID;
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
