const checkRequiredParamsForJoinGame = (data) => {
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

module.exports = {
  checkRequiredParamsForJoinGame,
};
