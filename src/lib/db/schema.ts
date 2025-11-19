import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==================== USERS TABLE ====================
// Replace the users table definition with this:
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // argon2 hashed (97 chars)
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // 'admin' | 'moderator' | 'user'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references((): any => users.id),
});

// ==================== REFERENCE/LOOKUP TABLES ====================

// Systems Table (Magento, NetSuite, etc.)
export const systems = pgTable("systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

// Cancellation Reasons Table
export const cancellationReasons = pgTable("cancellation_reasons", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull().unique(),
  reasonAr: text("reason_ar").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

// Governorates Table
export const governorates = pgTable("governorates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

// ==================== MAIN DATA TABLES ====================

// Cancelled Orders Table
export const cancelledOrders = pgTable(
  "cancelled_orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),

    // System and reason references
    cancellationReasonId: integer("cancellation_reason_id")
      .notNull()
      .references(() => cancellationReasons.id),
    systemId: integer("system_id")
      .notNull()
      .references(() => systems.id),

    // NEW: Payment method field (required)
    paymentMethod: text("payment_method").notNull(),
    // Options: 'Cash on Delivery' | 'Pay in Installment' | 'Pay using Visa/Master card' | 'Zain Cash'

    // NEW: Installment-specific fields (nullable, only for installment payments)
    cardholderName: text("cardholder_name"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
    notes: text("notes"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: integer("updated_by")
      .notNull()
      .references(() => users.id),

    // Archive fields
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
    archivedBy: integer("archived_by").references(() => users.id),
  },
  (table) => [
    index("cancelled_orders_order_number_idx").on(table.orderNumber),
    index("cancelled_orders_payment_method_idx").on(table.paymentMethod),
    index("cancelled_orders_archived_idx").on(table.isArchived),
  ]
);

// Late Orders Table
export const lateOrders = pgTable(
  "late_orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    governorateId: integer("governorate_id")
      .notNull()
      .references(() => governorates.id),
    orderDate: timestamp("order_date").notNull(),
    notes: text("notes"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: integer("updated_by")
      .notNull()
      .references(() => users.id),

    // Archive fields
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
    archivedBy: integer("archived_by").references(() => users.id),
  },
  (table) => ({
    orderNumberIdx: index("late_orders_order_number_idx").on(table.orderNumber),
    governorateIdx: index("late_orders_governorate_idx").on(
      table.governorateId
    ),
    orderDateIdx: index("late_orders_order_date_idx").on(table.orderDate),
    archivedIdx: index("late_orders_archived_idx").on(table.isArchived),
  })
);

// Installment Orders Table
export const installmentOrders = pgTable(
  "installment_orders",
  {
    id: serial("id").primaryKey(),

    // Fields editable by ALL roles
    orderNumber: text("order_number").notNull(),
    installmentId: text("installment_id").notNull(),
    isAddedToMagento: boolean("is_added_to_magento").default(false).notNull(),

    // Fields ONLY editable by admin/moderator
    cardholderName: text("cardholder_name"),
    cardholderMotherName: text("cardholder_mother_name"),
    cardholderPhoneNumber: text("cardholder_phone_number"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: integer("updated_by")
      .notNull()
      .references(() => users.id),

    // Archive fields
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
    archivedBy: integer("archived_by").references(() => users.id),
  },
  (table) => ({
    orderNumberIdx: index("installment_orders_order_number_idx").on(
      table.orderNumber
    ),
    installmentIdIdx: index("installment_orders_installment_id_idx").on(
      table.installmentId
    ),
    archivedIdx: index("installment_orders_archived_idx").on(table.isArchived),
  })
);

// ==================== RELATIONS ====================

export const cancelledOrdersRelations = relations(
  cancelledOrders,
  ({ one }) => ({
    cancellationReason: one(cancellationReasons, {
      fields: [cancelledOrders.cancellationReasonId],
      references: [cancellationReasons.id],
    }),
    system: one(systems, {
      fields: [cancelledOrders.systemId],
      references: [systems.id],
    }),
    createdByUser: one(users, {
      fields: [cancelledOrders.createdBy],
      references: [users.id],
    }),
  })
);

export const lateOrdersRelations = relations(lateOrders, ({ one }) => ({
  governorate: one(governorates, {
    fields: [lateOrders.governorateId],
    references: [governorates.id],
  }),
  createdByUser: one(users, {
    fields: [lateOrders.createdBy],
    references: [users.id],
  }),
}));
