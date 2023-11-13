const { fetchQustions } = require("./googleSheets");

const getQustions = async (data) => {
  try {
    const qustions = await fetchQustions(data.sheetID, data.level);
    return {
      success: true,
      data: qustions,
      message: "Data fetched",
    };
  } catch (error) {
    console.error("Error fetching level details", error);
    throw error;
  }
};

module.exports = {
  getQustions,
};
