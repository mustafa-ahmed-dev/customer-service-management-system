import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activityTypeEnum } from './enums.schema';
import { activities } from './activities.schema';

export const activityTypes = pgTable('activity_types', {
  id: serial('id').primaryKey(),
  type: activityTypeEnum('type').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityTypesRelations = relations(activityTypes, ({ many }) => ({
  activities: many(activities),
}));
