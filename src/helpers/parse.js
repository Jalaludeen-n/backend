const { storeFile, getDate } = require("./helper");

const parseAndFormatRoleData = (roles, uniqueCode, pdfArray, gameName) => {
  // const levelDescription = getLevelDescription(pdfArray, roles);
  const parsedData = JSON.parse(roles);
  return formatRoleData(parsedData, uniqueCode, gameName, pdfArray);
};
const formatRoleData = (data, GameId, gameName, pdfArray) => {
  const records = data.map((datum, index) => {
    const rolePdfPath = `Role_${gameName}_${datum.role}.pdf`;
    storeFile(pdfArray, rolePdfPath);

    return {
      fields: {
        GameID: GameId,
        Role: datum.role,
        Submit: datum.submit,
        Duplicate: datum.duplicate,
        Path: rolePdfPath,
      },
    };
  });

  return records;
};

const formatGameData = (data, GameId, instruction) => {
  return {
    GameID: GameId,
    GameName: data.GameName,
    GoogleSheet: data.GoogleSheet,
    NumberOfRounds: parseInt(data.NumberOfRounds),
    ResultsSubmission: data.resultsSubmission,
    ScoreVisibilityForPlayers: data.ScoreVisibility,
    RolesAutoSelection: !data.RoleSelection,
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
const parseLevelData = (data) => {
  return {
    GameID: data.gameID,
    RoomNumber: data.roomNumber,
    Level: data.level,
    Status: "Started",
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
      const rolePdf = `Role_${gameData.GameName}_${data.role}.pdf`;
      storeFile(pdfArray, rolePdf);
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
const parseAndFormatLevel = (roles, pdfArray, gameData) => {
  const isIndividualInstructions = gameData.IndividualInstructionsPerRound;
  const formattedLevelData = [];

  const createPDF = (data, fileName, index) => {
    const PDFPath = storeFile(pdfArray, fileName);

    if (PDFPath) {
      const formattedData = formatLevelData(
        data,
        gameData.GameID,
        index + 1,
        PDFPath,
      );
      formattedLevelData.push(formattedData);
    }
  };

  if (isIndividualInstructions) {
    JSON.parse(roles).forEach((data) => {
      for (let index = 0; index < gameData.NumberOfRounds; index++) {
        const fileName = `${gameData.GameName}_${data.role}_Level${
          index + 1
        }.pdf`;
        createPDF(data, fileName, index);
      }
    });
  } else {
    for (let index = 0; index < gameData.NumberOfRounds; index++) {
      const fileName = `${gameData.GameName}_Level${index + 1}.pdf`;
      const data = {
        role: "generic",
      };
      createPDF(data, fileName, index);
    }
  }

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
  parseAndFormatLevel,
  parseLevelData,
};
