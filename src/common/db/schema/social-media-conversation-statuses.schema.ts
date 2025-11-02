import { pgTable, serial, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { conversationStatusEnum } from './enums.schema';

export const socialMediaConversationStatuses = pgTable(
  'social_media_conversation_statuses',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    status: conversationStatusEnum('status').notNull(),
    numberOfConversations: integer('number_of_conversations').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
);
