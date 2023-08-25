const { storeFile, getDate } = require("./helper");

const parseAndFormatRoleData = (roles, uniqueCode, pdfArray) => {
  // const levelDescription = getLevelDescription(pdfArray, roles);
  const parsedData = JSON.parse(roles);
  return formatRoleData(parsedData, uniqueCode);
};
const formatRoleData = (data, GameId) => {
  const records = data.map((datum) => ({
    fields: {
      GameID: GameId,
      Role: datum.role,
      Submit: datum.submit,
      Duplicate: datum.dublicate,
    },
  }));
  return records;
};
const formatGameData = (data, GameId, instruction) => {
  return {
    GameID: GameId,
    GameName: data.GameName,
    GoogleSheet: data.GoogleSheet,
    NumberOfRounds: parseInt(data.NumberOfRounds),
    ResultsSubbmision: data.ResultsSubbmision,
    ScoreVisibilityForPlayers: data.ScoreVisibility,
    RolesAutoSelection: data.RoleSelection,
    IndividualInstructionsPerRound: data.IndividualInstructions,
    Instruction: instruction,
    Date: getDate(),
  };
};

const parseGameData = (data) => {
  return {
    GameID: data.gameId,
    RoomNumber: data.roomNumber,
    Date: getDate(),
    Status: "Started",
    Players: 0,
  };
};

const parseJoinGameData = (data) => {
  return {
    RoomNumber: data.roomNumber,
    EmailID: data.email,
    Group: data.group,
  };
};

const parseAndFormatGameData = (data, uniqueCode, pdf) => {
  const parsedData = JSON.parse(data);
  const instruction = storeFile(
    pdf,
    `${parsedData.GameName}_GameInstruction.pdf`,
  );
  return formatGameData(parsedData, uniqueCode, instruction);
};

const parseAndFormatLevelData = (roles, pdfArray, gameData) => {
  const formattedLevelData = [];
  JSON.parse(roles).forEach((data) => {
    for (let index = 0; index < gameData.NumberOfRounds; index++) {
      const PDFPath = storeFile(
        pdfArray,
        `${gameData.GameName}_${data.role}_Level${index + 1}.pdf`,
      );
      if (PDFPath) {
        const formattedData = formatLevelData(
          data,
          gameData.GameID,
          index + 1,
          PDFPath,
        );
        formattedLevelData.push(formattedData);
      }
    }
  });

  return formattedLevelData;
};

const formatLevelData = (data, GameId, level, pdfPath) => {
  return {
    fields: {
      GameID: GameId,
      Role: data.role,
      Level: level,
      PDF: pdfPath,
    },
  };
};

module.exports = {
  parseAndFormatGameData,
  parseAndFormatRoleData,
  parseAndFormatLevelData,
  parseGameData,
  parseJoinGameData,
};
