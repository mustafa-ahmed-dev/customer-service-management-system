import { pgTable, serial, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { contactTypeEnum } from './enums.schema';

export const socialMediaContacts = pgTable('social_media_contacts', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  contactType: contactTypeEnum('contact_type').notNull(),
  numberOfContacts: integer('number_of_contacts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
