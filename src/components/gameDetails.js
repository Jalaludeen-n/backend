const { fetchWithCondition } = require("../controller/airtable");

const assignedRoles = {}; // { groupName: { email: role } }
let roles = [];
let duplicateRoles = [];

const emailExistsInAssignedRoles = (email) => {
  for (const group in assignedRoles) {
    if (Object.prototype.hasOwnProperty.call(assignedRoles, group)) {
      const roles = assignedRoles[group];
      for (const role in roles) {
        if (Array.isArray(roles[role]) && roles[role].includes(email)) {
          return true;
        }
      }
    }
  }
  return false;
};

const assignRoleToGroup = (groupName, email, roomNumber) => {
  if (!assignedRoles[roomNumber]) {
    assignedRoles[roomNumber] = {};
  }

  if (!assignedRoles[roomNumber][groupName]) {
    assignedRoles[roomNumber][groupName] = {};
  }

  const groupAssignedRoles = Object.keys(assignedRoles[roomNumber][groupName]);
  for (const role of roles) {
    if (!groupAssignedRoles.includes(role)) {
      if (!assignedRoles[roomNumber][groupName][role]) {
        assignedRoles[roomNumber][groupName][role] = [];
      }
      assignedRoles[roomNumber][groupName][role].push(email);
      return role;
    }
  }

  for (const dupRole of duplicateRoles) {
    if (
      assignedRoles[roomNumber][groupName][dupRole] &&
      assignedRoles[roomNumber][groupName][dupRole].length === 1
    ) {
      assignedRoles[roomNumber][groupName][dupRole].push(email);
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
  const roomNumber = data.roomNumber;

  if (!emailExistsInAssignedRoles(email)) {
    if (!roles.length) {
      const gameID = await fetchGameID(data.roomNumber);

      await fetchRolesFromAirtable(gameID);

      const roleAssigned = assignRoleToGroup(groupName, email, roomNumber);
      return roleAssigned;
    } else {
      const roleAssigned = assignRoleToGroup(groupName, email, roomNumber);
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

  if (!assignedRoles[roomNumber]) {
    return roles;
  }

  if (!assignedRoles[roomNumber][groupName]) {
    return roles;
  }

  const unassignedRoles = roles.filter((role) => {
    return !Object.keys(assignedRoles[roomNumber][groupName]).includes(role);
  });

  if (unassignedRoles.length === 0) {
    const unassignedDupRoles = duplicateRoles.filter((role) => {
      return (
        !Object.keys(assignedRoles[roomNumber][groupName]).includes(role) ||
        assignedRoles[roomNumber][groupName][role].length === 1
      );
    });
    return unassignedDupRoles;
  }

  return unassignedRoles;
};

const assignRoleManually = async (groupName, email, role, roomNumber) => {
  if (!assignedRoles[roomNumber]) {
    assignedRoles[roomNumber] = {};
  }

  if (!assignedRoles[roomNumber][groupName]) {
    assignedRoles[roomNumber][groupName] = {};
  }

  if (!assignedRoles[roomNumber][groupName][role]) {
    assignedRoles[roomNumber][groupName][role] = [];
  }
  assignedRoles[roomNumber][groupName][role].push(email);
};

module.exports = {
  getRole,
  getRemainingRoles,
  assignRoleManually,
};
