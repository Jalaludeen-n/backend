const { updateGameInitiatedRecord } = require("../controller/airtable");
const { getFile } = require("../helpers/helper");
const {
  assignRoleManually,
  getRemainingRoles,
} = require("./level/gameDetails");

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

module.exports = {
  getRolePdf,
  selectRole,
  getRoles,
};
