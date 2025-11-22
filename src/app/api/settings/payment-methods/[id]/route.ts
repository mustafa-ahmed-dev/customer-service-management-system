import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/moderator can manage settings
    if (!["admin", "moderator"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Payment method name is required" },
        { status: 400 }
      );
    }

    // Check if name is taken by another payment method
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(like(paymentMethods.name, name))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== parseInt(id)) {
      return NextResponse.json(
        { error: "Payment method name already exists" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(paymentMethods)
      .set({ name })
      .where(eq(paymentMethods.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ paymentMethod: updated });
  } catch (error) {
    console.error("Update payment method error:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can deactivate
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [deactivated] = await db
      .update(paymentMethods)
      .set({ isActive: false })
      .where(eq(paymentMethods.id, parseInt(id)))
      .returning();

    if (!deactivated) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment method deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate payment method error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate payment method" },
      { status: 500 }
    );
  }
}
