const ROLE_KEY_BY_LEVEL = {
  1: 'sales',
  2: 'manager',
  3: 'admin',
};

const ROLE_KEY_BY_ARABIC_NAME = {
  'مندوب مبيعات': 'sales',
  'مدير مباشر': 'manager',
  'مدير عام': 'admin',
};

const ROLE_LEVEL_BY_KEY = {
  sales: 1,
  manager: 2,
  admin: 3,
};

const getRoleKey = (userOrRole) => {
  const role = userOrRole?.role || userOrRole;
  const roleName = String(role?.name || '').trim().toLowerCase();

  if (ROLE_LEVEL_BY_KEY[roleName]) {
    return roleName;
  }

  const roleNameAr = String(role?.name_ar || '').trim();
  if (ROLE_KEY_BY_ARABIC_NAME[roleNameAr]) {
    return ROLE_KEY_BY_ARABIC_NAME[roleNameAr];
  }

  const level = Number(role?.level || 0);
  return ROLE_KEY_BY_LEVEL[level] || 'sales';
};

const getRoleLevel = (userOrRole) => {
  const role = userOrRole?.role || userOrRole;
  return Number(role?.level || ROLE_LEVEL_BY_KEY[getRoleKey(userOrRole)] || 1);
};

const hasRole = (userOrRole, ...allowedRoles) => allowedRoles.includes(getRoleKey(userOrRole));

module.exports = {
  getRoleKey,
  getRoleLevel,
  hasRole,
};