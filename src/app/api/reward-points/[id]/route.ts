import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rewardPointsAdditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PUT - Update reward points addition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { orderNumber, customerName, orderStatus, deliveryDate, notes } =
      body;

    const [record] = await db
      .update(rewardPointsAdditions)
      .set({
        orderNumber,
        customerName,
        orderStatus,
        deliveryDate: new Date(deliveryDate),
        notes: notes || null,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(rewardPointsAdditions.id, parseInt(id)))
      .returning();

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Update reward points error:", error);
    return NextResponse.json(
      { error: "Failed to update reward points addition" },
      { status: 500 }
    );
  }
}

// DELETE - Archive reward points addition (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [record] = await db
      .update(rewardPointsAdditions)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: session.id,
      })
      .where(eq(rewardPointsAdditions.id, parseInt(id)))
      .returning();

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Record archived successfully" });
  } catch (error) {
    console.error("Archive reward points error:", error);
    return NextResponse.json(
      { error: "Failed to archive reward points addition" },
      { status: 500 }
    );
  }
}
