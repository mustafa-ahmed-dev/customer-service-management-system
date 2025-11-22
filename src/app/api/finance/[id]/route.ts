import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PUT - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance access
    if (!session.hasFinanceAccess) {
      return NextResponse.json(
        { error: "You don't have permission to manage finance" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      phoneNumber,
      orderNumber,
      customerName,
      paymentMethodId,
      amount,
      status,
      notes,
    } = body;

    // Validate required fields
    if (
      !phoneNumber ||
      !customerName ||
      !paymentMethodId ||
      !amount ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .update(financeTransactions)
      .set({
        phoneNumber,
        orderNumber: orderNumber || null,
        customerName,
        paymentMethodId: parseInt(paymentMethodId),
        amount: amount.toString(),
        status,
        notes: notes || null,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(financeTransactions.id, parseInt(id)))
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Archive transaction (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance access for archiving
    if (!session.hasFinanceAccess) {
      return NextResponse.json(
        { error: "You don't have permission to archive transactions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [transaction] = await db
      .update(financeTransactions)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: session.id,
      })
      .where(eq(financeTransactions.id, parseInt(id)))
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Transaction archived successfully" });
  } catch (error) {
    console.error("Archive transaction error:", error);
    return NextResponse.json(
      { error: "Failed to archive transaction" },
      { status: 500 }
    );
  }
}

// PATCH - Unarchive transaction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance access for unarchiving
    if (!session.hasFinanceAccess) {
      return NextResponse.json(
        { error: "You don't have permission to unarchive transactions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { unarchiveNote } = body;

    if (!unarchiveNote || unarchiveNote.trim() === "") {
      return NextResponse.json(
        { error: "Unarchive note is required" },
        { status: 400 }
      );
    }

    // Get current transaction
    const [currentTransaction] = await db
      .select()
      .from(financeTransactions)
      .where(eq(financeTransactions.id, parseInt(id)))
      .limit(1);

    if (!currentTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Append unarchive note to existing notes
    const updatedNotes = currentTransaction.notes
      ? `${
          currentTransaction.notes
        }\n\n[UNARCHIVED on ${new Date().toLocaleString()}]: ${unarchiveNote}`
      : `[UNARCHIVED on ${new Date().toLocaleString()}]: ${unarchiveNote}`;

    const [transaction] = await db
      .update(financeTransactions)
      .set({
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        notes: updatedNotes,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(financeTransactions.id, parseInt(id)))
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Transaction unarchived successfully",
      transaction,
    });
  } catch (error) {
    console.error("Unarchive transaction error:", error);
    return NextResponse.json(
      { error: "Failed to unarchive transaction" },
      { status: 500 }
    );
  }
}
