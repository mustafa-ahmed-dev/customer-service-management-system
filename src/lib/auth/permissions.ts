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

  // Installment orders special
  EDIT_INSTALLMENT_BASIC: ["admin", "moderator", "user"], // orderNumber, installmentId, isAddedToMagento
  EDIT_INSTALLMENT_ADMIN: ["admin", "moderator"], // cardholder info
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = "admin" | "moderator" | "user";

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole);
}

export function requirePermission(
  userRole: Role,
  permission: Permission
): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
