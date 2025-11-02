import { pgTable, serial, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const socialMediaPerformance = pgTable('social_media_performance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: date('date').notNull(),
  numberOfConversations: integer('number_of_conversations').default(0),
  avgConversationPickupTime: integer('avg_conversation_pickup_time'), // in seconds
  avgConversationFirstResponseTime: integer(
    'avg_conversation_first_response_time',
  ), // in seconds
  avgConversationResponseTime: integer('avg_conversation_response_time'), // in seconds
  numberOfTickets: integer('number_of_tickets').default(0),
  numberOfLiveChatMessages: integer('number_of_live_chat_messages').default(0),
  numberOfComments: integer('number_of_comments').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const socialMediaPerformanceRelations = relations(
  socialMediaPerformance,
  ({ one }) => ({
    employee: one(users, {
      fields: [socialMediaPerformance.employeeId],
      references: [users.id],
    }),
  }),
);
