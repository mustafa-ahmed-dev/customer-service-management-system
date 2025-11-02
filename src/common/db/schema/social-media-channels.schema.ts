import {
  pgTable,
  serial,
  integer,
  date,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';

export const socialMediaChannels = pgTable('social_media_channels', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  channelId: varchar('channel_id', { length: 100 }).notNull(),
  channelName: varchar('channel_name', { length: 255 }),
  numberOfConversations: integer('number_of_conversations').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
