export const PERMISSIONS = {
  // Data operations
  CREATE_RECORD: ["admin", "moderator", "user"],
  EDIT_RECORD: ["admin", "moderator"],
  VIEW_RECORD: ["admin", "moderator", "user"],
  SEARCH_RECORD: ["admin", "moderator", "user"],
  COPY_TABLE: ["admin", "moderator", "user"],

  // Archive operations
  ARCHIVE_DATA: ["admin", "moderator"],
  VIEW_ARCHIVE: ["admin", "moderator"],
  EXPORT_EXCEL: ["admin", "moderator"],

  // Statistics
  VIEW_STATISTICS: ["admin", "moderator"],
  VIEW_DASHBOARD: ["admin", "moderator"],

  // Settings management
  MANAGE_SETTINGS: ["admin", "moderator"],
  DEACTIVATE_SETTINGS: ["admin"], // ONLY admin

  // User management
  MANAGE_USERS: ["admin"], // ONLY admin

  VIEW_FINANCE: ["admin", "moderator", "user"], // Everyone can view
  MANAGE_FINANCE: ["admin", "moderator", "user"], // But requires hasFinanceAccess attribute
  MANAGE_PAYMENT_METHODS: ["admin", "moderator"], // In settings
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = "admin" | "moderator" | "user";

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole);
}

export function hasFinanceAccess(
  userRole: Role,
  hasFinanceAttribute: boolean,
  operation: "view" | "manage"
): boolean {
  // View is allowed for all authenticated users
  if (operation === "view") {
    return true;
  }

  // Manage requires the special attribute (regardless of role)
  return hasFinanceAttribute;
}

export function requirePermission(
  userRole: Role,
  permission: Permission
): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
