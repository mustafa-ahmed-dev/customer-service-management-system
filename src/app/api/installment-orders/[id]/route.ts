import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installmentOrders } from "@/lib/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PUT - Update installment order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users can update installment orders
    // (Permission check removed - all users can toggle Magento checkbox)

    const { id } = await params;
    const body = await request.json();

    // Users can only edit these fields
    const userEditableFields = {
      orderNumber: body.orderNumber,
      installmentId: body.installmentId,
      isAddedToMagento: body.isAddedToMagento,
      updatedBy: session.id,
      updatedAt: new Date(),
    };

    // Admin/Moderator can edit all fields including cardholder info
    const isAdminOrModerator =
      session.role === "admin" || session.role === "moderator";
    const updateData = isAdminOrModerator
      ? {
          ...userEditableFields,
          cardholderName: body.cardholderName || null,
          cardholderMotherName: body.cardholderMotherName || null,
          cardholderPhoneNumber: body.cardholderPhoneNumber || null,
        }
      : {
          ...userEditableFields,
          // Keep existing cardholder data for users
          cardholderName: body.cardholderName || null,
          cardholderMotherName: body.cardholderMotherName || null,
          cardholderPhoneNumber: body.cardholderPhoneNumber || null,
        };

    const [order] = await db
      .update(installmentOrders)
      .set(updateData)
      .where(eq(installmentOrders.id, parseInt(id)))
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Update installment order error:", error);
    return NextResponse.json(
      { error: "Failed to update installment order" },
      { status: 500 }
    );
  }
}

// DELETE - HARD DELETE (permanent, admin/moderator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and moderator can delete
    if (session.role !== "admin" && session.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // HARD DELETE - permanently remove from database
    const [deleted] = await db
      .delete(installmentOrders)
      .where(eq(installmentOrders.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order permanently deleted" });
  } catch (error) {
    console.error("Delete installment order error:", error);
    return NextResponse.json(
      { error: "Failed to delete installment order" },
      { status: 500 }
    );
  }
}
