const { fetchWithCondition } = require("../controller/airtable");

const assignedRoles = {}; // { groupName: { email: role } }
let roles = [];
let duplicateRoles = [];

const emailExistsInAssignedRoles = (email) => {
  for (const group in assignedRoles) {
    if (Object.prototype.hasOwnProperty.call(assignedRoles, group)) {
      const roles = assignedRoles[group];
      for (const role in roles) {
        if (roles[role].includes(email)) {
          return true;
        }
      }
    }
  }
  return false;
};

const assignRoleToGroup = (groupName, email) => {
  if (!assignedRoles[groupName]) {
    assignedRoles[groupName] = {};
  }

  const groupAssignedRoles = Object.keys(assignedRoles[groupName]);
  for (const role of roles) {
    if (!groupAssignedRoles.includes(role)) {
      if (!assignedRoles[groupName][role]) {
        assignedRoles[groupName][role] = [];
      }
      assignedRoles[groupName][role].push(email);
      return role;
    }
  }
  for (const dupRole of duplicateRoles) {
    if (
      assignedRoles[groupName][dupRole] &&
      assignedRoles[groupName][dupRole].length === 1
    ) {
      assignedRoles[groupName][dupRole].push(email);
      return dupRole;
    }
  }

  return null;
};

const fetchGameID = async (roomNumber) => {
  const condition = `{RoomNumber} = "${roomNumber}"`;
  const response = await fetchWithCondition("GameInitiated", condition, [
    "GameID",
  ]);
  return response[0].fields.GameID;
};

const fetchRolesFromAirtable = async (gameID) => {
  const condition = `{GameID} = "${gameID}"`;
  const fields = ["Role", "Submit", "Duplicate"];
  const airtableRoles = await fetchWithCondition("Role", condition, fields);

  airtableRoles.forEach((data) => {
    roles.push(data.fields.Role);
    if (data.fields.Duplicate) {
      duplicateRoles.push(data.fields.Role);
    }
  });
};

const getRole = async (data) => {
  const groupName = data.group;
  const email = data.email;

  if (!emailExistsInAssignedRoles(email)) {
    if (!roles.length) {
      console.log("inside role");
      const gameID = await fetchGameID(data.roomNumber);
      console.log(gameID);

      await fetchRolesFromAirtable(gameID);

      const roleAssigned = assignRoleToGroup(groupName, email);
      return roleAssigned;
    } else {
      const roleAssigned = assignRoleToGroup(groupName, email);
      return roleAssigned;
    }
  }
  return null;

  // Handle case where email exists in assignedRoles
};

const getRemainingRoles = async (roomNumber, groupName) => {
  if (!roles.length) {
    const gameID = await fetchGameID(roomNumber);
    await fetchRolesFromAirtable(gameID);
  }
  const unassignedRoles = roles.filter((role) => {
    return !Object.keys(assignedRoles[groupName] || {}).includes(role);
  });

  if (unassignedRoles.length === 0) {
    const unassignedDupRoles = duplicateRoles.filter((role) => {
      return (
        !Object.keys(assignedRoles[groupName] || {}).includes(role) ||
        assignedRoles[groupName][role].length === 1
      );
    });
    return unassignedDupRoles;
  }

  return unassignedRoles;
};
const assignRoleManually = async (groupName, email, role) => {
  if (!assignedRoles[groupName]) {
    assignedRoles[groupName] = {};
  }

  if (!assignedRoles[groupName][role]) {
    assignedRoles[groupName][role] = [];
  }
  assignedRoles[groupName][role].push(email);
};

module.exports = {
  getRole,
  getRemainingRoles,
  assignRoleManually,
};
