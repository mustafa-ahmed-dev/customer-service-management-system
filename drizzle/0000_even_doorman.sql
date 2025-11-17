CREATE TABLE "cancellation_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"reason_ar" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"deactivated_at" timestamp,
	"deactivated_by" integer,
	CONSTRAINT "cancellation_reasons_reason_unique" UNIQUE("reason")
);
--> statement-breakpoint
CREATE TABLE "cancelled_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"cancellation_reason_id" integer NOT NULL,
	"system_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archived_by" integer
);
--> statement-breakpoint
CREATE TABLE "governorates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"deactivated_at" timestamp,
	"deactivated_by" integer,
	CONSTRAINT "governorates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "installment_cancelled_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"cardholder_name" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archived_by" integer
);
--> statement-breakpoint
CREATE TABLE "installment_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"installment_id" text NOT NULL,
	"is_added_to_magento" boolean DEFAULT false NOT NULL,
	"cardholder_name" text,
	"cardholder_mother_name" text,
	"cardholder_phone_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archived_by" integer
);
--> statement-breakpoint
CREATE TABLE "late_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"governorate_id" integer NOT NULL,
	"order_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archived_by" integer
);
--> statement-breakpoint
CREATE TABLE "systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"deactivated_at" timestamp,
	"deactivated_by" integer,
	CONSTRAINT "systems_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deactivated_at" timestamp,
	"deactivated_by" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cancellation_reasons" ADD CONSTRAINT "cancellation_reasons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_reasons" ADD CONSTRAINT "cancellation_reasons_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancelled_orders" ADD CONSTRAINT "cancelled_orders_cancellation_reason_id_cancellation_reasons_id_fk" FOREIGN KEY ("cancellation_reason_id") REFERENCES "public"."cancellation_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancelled_orders" ADD CONSTRAINT "cancelled_orders_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancelled_orders" ADD CONSTRAINT "cancelled_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancelled_orders" ADD CONSTRAINT "cancelled_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancelled_orders" ADD CONSTRAINT "cancelled_orders_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governorates" ADD CONSTRAINT "governorates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governorates" ADD CONSTRAINT "governorates_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_cancelled_orders" ADD CONSTRAINT "installment_cancelled_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_cancelled_orders" ADD CONSTRAINT "installment_cancelled_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_cancelled_orders" ADD CONSTRAINT "installment_cancelled_orders_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_orders" ADD CONSTRAINT "installment_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_orders" ADD CONSTRAINT "installment_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_orders" ADD CONSTRAINT "installment_orders_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_orders" ADD CONSTRAINT "late_orders_governorate_id_governorates_id_fk" FOREIGN KEY ("governorate_id") REFERENCES "public"."governorates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_orders" ADD CONSTRAINT "late_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_orders" ADD CONSTRAINT "late_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "late_orders" ADD CONSTRAINT "late_orders_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cancelled_orders_order_number_idx" ON "cancelled_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "cancelled_orders_archived_idx" ON "cancelled_orders" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "installment_cancelled_orders_order_number_idx" ON "installment_cancelled_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "installment_cancelled_orders_archived_idx" ON "installment_cancelled_orders" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "installment_orders_order_number_idx" ON "installment_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "installment_orders_installment_id_idx" ON "installment_orders" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "installment_orders_archived_idx" ON "installment_orders" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "late_orders_order_number_idx" ON "late_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "late_orders_governorate_idx" ON "late_orders" USING btree ("governorate_id");--> statement-breakpoint
CREATE INDEX "late_orders_order_date_idx" ON "late_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "late_orders_archived_idx" ON "late_orders" USING btree ("is_archived");