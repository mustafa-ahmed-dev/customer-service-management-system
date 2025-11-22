CREATE TABLE "inactive_coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order" text NOT NULL,
	"coupon_code" text NOT NULL,
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
ALTER TABLE "inactive_coupons" ADD CONSTRAINT "inactive_coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inactive_coupons" ADD CONSTRAINT "inactive_coupons_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inactive_coupons" ADD CONSTRAINT "inactive_coupons_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inactive_coupons_sales_order_idx" ON "inactive_coupons" USING btree ("sales_order");--> statement-breakpoint
CREATE INDEX "inactive_coupons_coupon_code_idx" ON "inactive_coupons" USING btree ("coupon_code");--> statement-breakpoint
CREATE INDEX "inactive_coupons_archived_idx" ON "inactive_coupons" USING btree ("is_archived");