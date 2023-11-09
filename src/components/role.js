const { getFile } = require("../helpers/helper");

const getRolePdf = async (data) => {
  try {
    const fileName = `Role_${data.GameName}_${data.role}.pdf`;
    const gameInstruction = await getFile(fileName);
    return {
      success: true,
      data: gameInstruction,
      message: "PDF Fetched",
    };
  } catch (error) {
    console.error("Error getting roles", error);
    throw error;
  }
};

module.exports = {
  getRolePdf,
};
