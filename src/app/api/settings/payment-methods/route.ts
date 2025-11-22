import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch all payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeactivated =
      searchParams.get("includeDeactivated") === "true";

    let query = db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        isActive: paymentMethods.isActive,
        createdAt: paymentMethods.createdAt,
      })
      .from(paymentMethods);

    // Filter active/inactive
    if (!includeDeactivated) {
      query = query.where(like(paymentMethods.isActive as any, "true")) as any;
    }

    const methods = await query;

    return NextResponse.json({ paymentMethods: methods });
  } catch (error) {
    console.error("Fetch payment methods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/moderator can manage settings
    if (!["admin", "moderator"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Payment method name is required" },
        { status: 400 }
      );
    }

    // Check if payment method already exists
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(like(paymentMethods.name, name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Payment method already exists" },
        { status: 400 }
      );
    }

    const [newMethod] = await db
      .insert(paymentMethods)
      .values({ name })
      .returning();

    return NextResponse.json({ paymentMethod: newMethod }, { status: 201 });
  } catch (error) {
    console.error("Create payment method error:", error);
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 }
    );
  }
}
