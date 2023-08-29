const TABLE_NAMES = {
  INDIVIDUAL_SHEET: "IndividualSheet",
  GROUP_SHEET: "GroupSheet",
};

const TEXT_MESSAGES = {
  GAME_NOT_STARTED: "The game has not yet started.",
  PLAYER_EXISTS: "Player already exists in the game",
  NO_AVAILABLE_ROLES:
    "There are no available roles in this group. Please consider joining another group.",
  JOIN_SUCCESS: "Game joined successfully",
};

const FIELDS = {
  GAME: {
    GameID: "GameID",
    GameName: "GameName",
    GoogleSheet: "GoogleSheet",
    NumberOfRounds: "NumberOfRounds",
    ScoreVisibilityForPlayers: "ScoreVisibilityForPlayers",
    ResultsSubbmision: "ResultsSubbmision",
    RolesAutoSelection: "RolesAutoSelection",
    IndividualInstructionsPerRound: "IndividualInstructionsPerRound",
    Instruction: "Instruction",
    Date: "Date",
  },

  ROLE: {
    GameID: "GameID",
    Role: "Role",
    Submit: "Submit",
    Duplicate: "Duplicate",
  },

  Instructions: {
    GameID: "GameID",
    Role: "Role",
    Level: "Level",
    PDF: "PDF",
  },

  GameInitiated: {
    RoomNumber: "RoomNumber",
    GameID: "GameID",
    Date: "Date",
    Status: "Status",
    Players: "Players",
  },

  RunningGames: {
    RoomNumber: "RoomNumber",
    EmailID: "EmailID",
    Group: "Group",
  },

  Participant: {
    GameID: "GameID",
    Name: "Name",
    RoomNumber: "RoomNumber",
    GroupName: "GroupName",
    ParticipantEmail: "ParticipantEmail",
    Role: "Role",
    CurrentLevel: "CurrentLevel",
  },

  Group: {
    GameID: "GameID",
    RoomNumber: "RoomNumber",
    GroupName: "GroupName",
    Size: "Size",
  },

  GroupSheet: {
    RoomNumber: "RoomNumber",
    GroupName: "GroupName",
    GoogleSheetID: "GoogleSheetID",
  },

  IndividualSheet: {
    ParticipantEmail: "ParticipantEmail",
    RoomNumber: "RoomNumber",
    GoogleSheetID: "GoogleSheetID",
    GroupName: "GroupName",
  },
};

module.exports = {
  TABLE_NAMES,
  TEXT_MESSAGES,
  FIELDS,
};
