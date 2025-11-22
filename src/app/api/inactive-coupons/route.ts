import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inactiveCoupons, users } from "@/lib/db/schema";
import { eq, and, isNull, or, like, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// GET - Fetch all inactive coupons (non-archived)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const conditions = [eq(inactiveCoupons.isArchived, false)];

    if (search) {
      conditions.push(
        or(
          like(inactiveCoupons.salesOrder, `%${search}%`),
          like(inactiveCoupons.couponCode, `%${search}%`)
        )!
      );
    }

    const records = await db
      .select({
        id: inactiveCoupons.id,
        salesOrder: inactiveCoupons.salesOrder,
        couponCode: inactiveCoupons.couponCode,
        notes: inactiveCoupons.notes,
        createdAt: inactiveCoupons.createdAt,
        createdBy: inactiveCoupons.createdBy,
        createdByName: users.fullName,
        updatedAt: inactiveCoupons.updatedAt,
      })
      .from(inactiveCoupons)
      .leftJoin(users, eq(inactiveCoupons.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(inactiveCoupons.createdAt));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get inactive coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inactive coupons" },
      { status: 500 }
    );
  }
}

// POST - Create new inactive coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "CREATE_RECORD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { salesOrder, couponCode, notes } = body;

    // Validate required fields
    if (!salesOrder || !couponCode) {
      return NextResponse.json(
        { error: "Sales order and coupon code are required" },
        { status: 400 }
      );
    }

    const [newRecord] = await db
      .insert(inactiveCoupons)
      .values({
        salesOrder,
        couponCode,
        notes: notes || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ record: newRecord }, { status: 201 });
  } catch (error) {
    console.error("Create inactive coupon error:", error);
    return NextResponse.json(
      { error: "Failed to create inactive coupon" },
      { status: 500 }
    );
  }
}
