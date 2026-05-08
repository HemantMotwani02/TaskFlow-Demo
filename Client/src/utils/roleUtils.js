// Small utility helpers for reading role information from localStorage
export function getUserFromLocalStorage() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local user from localStorage', e);
    return null;
  }
}

export function getRoleFromLocalStorage() {
  const user = getUserFromLocalStorage();
  return user?.result?.role || null;
}

export function isAuthorized(requiredRoles) {
  const role = getRoleFromLocalStorage();
  if (!role) return false;
  if (Array.isArray(requiredRoles)) return requiredRoles.includes(role);
  return role === requiredRoles;
}

export function getTokenFromLocalStorage() {
  try {
    const user = getUserFromLocalStorage();
    return user?.result?.token || localStorage.getItem('token') || null;
  } catch (e) {
    return localStorage.getItem('token') || null;
  }
}

export default {
  getUserFromLocalStorage,
  getRoleFromLocalStorage,
  isAuthorized,
  getTokenFromLocalStorage
};
