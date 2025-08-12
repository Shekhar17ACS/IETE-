// src/utils/roles.js

export const ROLE_GROUPS = {
  privilegedMain: ['Governing Council', 'Admin', 'Staff', 'Super Admin', 'Sec Gen'],
  subRoles: ['Fellow', 'Member', 'Associate', 'Associate Member'],
};

export function getSidebarPermissions(userRoles) {
  if (!userRoles || userRoles.length === 0) return 'user';

  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

  const hasMainPrivilege = roles.some(role => ROLE_GROUPS.privilegedMain.includes(role));
  const hasOnlySubRole = !hasMainPrivilege && roles.some(role => ROLE_GROUPS.subRoles.includes(role));

  if (hasMainPrivilege) return 'admin';
  if (hasOnlySubRole) return 'limited';

  return 'user'; // fallback for guests or unknown roles
}

export function isPrivilegedRole(role) {
  return ROLE_GROUPS.privilegedMain.includes(role);
}

export function isSubordinateRole(role) {
  return ROLE_GROUPS.subRoles.includes(role);
}