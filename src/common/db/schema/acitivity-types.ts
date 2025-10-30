import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const activityTypes = pgTable('activity_types', {
  id: serial('id').primaryKey(),
  type: activityTypeEnum('type').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations

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
