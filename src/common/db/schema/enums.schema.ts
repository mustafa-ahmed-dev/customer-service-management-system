import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'manager', 'user']);
export const activityTypeEnum = pgEnum('activity_type', [
  'login',
  'logout',
  'break',
  'meeting',
]);
export const conversationStatusEnum = pgEnum('conversation_status', [
  'attended',
  'unassigned',
]);
export const contactTypeEnum = pgEnum('contact_type', ['new', 'existing']);
