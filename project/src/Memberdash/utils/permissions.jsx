export function hasPermission(codename) {
  try {
    const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");
    return permissions.includes(codename);
  } catch {
    return false;
  }
}

export function getRole() {
  return sessionStorage.getItem("role") || "user";
}
