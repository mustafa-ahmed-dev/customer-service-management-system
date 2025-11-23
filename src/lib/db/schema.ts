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
  hasFinanceAccess: boolean("has_finance_access").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references((): any => users.id),
});

// ==================== REFERENCE/LOOKUP TABLES ====================

// Systems Table (Magento, NetSuite, etc.)
export const systems = pgTable("systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

// Cancellation Reasons Table
export const cancellationReasons = pgTable("cancellation_reasons", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

// Governorates Table
export const governorates = pgTable("governorates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: integer("deactivated_by").references(() => users.id),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

    // UPDATED: Payment method as foreign key instead of text
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),

    // Installment-specific fields (nullable, only for installment payments)
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
    index("cancelled_orders_payment_method_idx").on(table.paymentMethodId),
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
  (table) => [
    index("late_orders_order_number_idx").on(table.orderNumber),
    index("late_orders_governorate_idx").on(table.governorateId),
    index("late_orders_order_date_idx").on(table.orderDate),
    index("late_orders_archived_idx").on(table.isArchived),
  ]
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

// Reward Points Addition Table
export const rewardPointsAdditions = pgTable(
  "reward_points_additions",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    customerName: text("customer_name").notNull(),
    orderStatus: text("order_status").notNull(),
    deliveryDate: timestamp("delivery_date"),
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
    orderNumberIdx: index("reward_points_order_number_idx").on(
      table.orderNumber
    ),
    archivedIdx: index("reward_points_archived_idx").on(table.isArchived),
  })
);

export const inactiveCoupons = pgTable(
  "inactive_coupons",
  {
    id: serial("id").primaryKey(),
    salesOrder: text("sales_order").notNull(),
    couponCode: text("coupon_code").notNull(),
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
    salesOrderIdx: index("inactive_coupons_sales_order_idx").on(
      table.salesOrder
    ),
    couponCodeIdx: index("inactive_coupons_coupon_code_idx").on(
      table.couponCode
    ),
    archivedIdx: index("inactive_coupons_archived_idx").on(table.isArchived),
  })
);

// Finance Transactions Table
export const financeTransactions = pgTable(
  "finance_transactions",
  {
    id: serial("id").primaryKey(),
    phoneNumber: text("phone_number").notNull(),
    orderNumber: text("order_number"), // Optional
    customerName: text("customer_name").notNull(),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull(), // e.g., "pending", "completed", "failed"

    // NEW: Employee handling the transaction
    employeeId: integer("employee_id")
      .notNull()
      .references(() => users.id),

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
    index("finance_phone_number_idx").on(table.phoneNumber),
    index("finance_order_number_idx").on(table.orderNumber),
    index("finance_status_idx").on(table.status),
    index("finance_employee_idx").on(table.employeeId),
    index("finance_archived_idx").on(table.isArchived),
  ]
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
    paymentMethod: one(paymentMethods, {
      fields: [cancelledOrders.paymentMethodId],
      references: [paymentMethods.id],
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

export const rewardPointsAdditionsRelations = relations(
  rewardPointsAdditions,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [rewardPointsAdditions.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [rewardPointsAdditions.updatedBy],
      references: [users.id],
    }),
    archivedByUser: one(users, {
      fields: [rewardPointsAdditions.archivedBy],
      references: [users.id],
    }),
  })
);

export const inactiveCouponsRelations = relations(
  inactiveCoupons,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [inactiveCoupons.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [inactiveCoupons.updatedBy],
      references: [users.id],
    }),
    archivedByUser: one(users, {
      fields: [inactiveCoupons.archivedBy],
      references: [users.id],
    }),
  })
);

export const financeTransactionsRelations = relations(
  financeTransactions,
  ({ one }) => ({
    paymentMethod: one(paymentMethods, {
      fields: [financeTransactions.paymentMethodId],
      references: [paymentMethods.id],
    }),
    employee: one(users, {
      fields: [financeTransactions.employeeId],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [financeTransactions.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [financeTransactions.updatedBy],
      references: [users.id],
    }),
    archivedByUser: one(users, {
      fields: [financeTransactions.archivedBy],
      references: [users.id],
    }),
  })
);
