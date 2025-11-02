import {
  pgTable,
  serial,
  integer,
  date,
  time,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { activityTypes } from './activity-types.schema';

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: date('date').notNull(),
  time: time('time').notNull(),
  typeId: integer('type_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  employee: one(users, {
    fields: [activities.employeeId],
    references: [users.id],
  }),
  type: one(activityTypes, {
    fields: [activities.typeId],
    references: [activityTypes.id],
  }),
}));
