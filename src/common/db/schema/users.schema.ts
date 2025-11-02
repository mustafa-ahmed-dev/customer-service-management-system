import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roleEnum } from './enums.schema';
import { departments } from './departments.schema';
import { activities } from './activities.schema';
import { socialMediaPerformance } from './social-media-performance.schema';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull().default('user'),
  departmentId: integer('department_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: 'department',
  }),
  managedDepartment: one(departments, {
    fields: [users.id],
    references: [departments.managerId],
    relationName: 'manager',
  }),
  activities: many(activities),
  socialMediaPerformance: many(socialMediaPerformance),
}));
