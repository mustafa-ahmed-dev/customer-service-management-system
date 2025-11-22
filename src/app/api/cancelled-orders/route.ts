import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cancelledOrders,
  cancellationReasons,
  systems,
  paymentMethods,
  users,
} from "@/lib/db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch cancelled orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const conditions = [eq(cancelledOrders.isArchived, false)];

    if (search) {
      conditions.push(
        or(
          like(cancelledOrders.orderNumber, `%${search}%`),
          like(cancelledOrders.cardholderName, `%${search}%`),
          like(cancelledOrders.notes, `%${search}%`)
        )!
      );
    }

    const orders = await db
      .select({
        id: cancelledOrders.id,
        orderNumber: cancelledOrders.orderNumber,
        cancellationReasonId: cancelledOrders.cancellationReasonId,
        cancellationReasonName: cancellationReasons.reason,
        systemId: cancelledOrders.systemId,
        systemName: systems.name,
        paymentMethodId: cancelledOrders.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        cardholderName: cancelledOrders.cardholderName,
        totalAmount: cancelledOrders.totalAmount,
        notes: cancelledOrders.notes,
        employeeName: users.fullName,
        createdAt: cancelledOrders.createdAt,
        updatedAt: cancelledOrders.updatedAt,
      })
      .from(cancelledOrders)
      .leftJoin(
        cancellationReasons,
        eq(cancelledOrders.cancellationReasonId, cancellationReasons.id)
      )
      .leftJoin(systems, eq(cancelledOrders.systemId, systems.id))
      .leftJoin(
        paymentMethods,
        eq(cancelledOrders.paymentMethodId, paymentMethods.id)
      )
      .leftJoin(users, eq(cancelledOrders.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(cancelledOrders.createdAt));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get cancelled orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancelled orders" },
      { status: 500 }
    );
  }
}

// POST - Create new cancelled order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderNumber,
      cancellationReasonId,
      systemId,
      paymentMethodId,
      cardholderName,
      totalAmount,
      notes,
    } = body;

    // Validate required fields
    if (
      !orderNumber ||
      !cancellationReasonId ||
      !systemId ||
      !paymentMethodId
    ) {
      return NextResponse.json(
        {
          error:
            "Order number, cancellation reason, system, and payment method are required",
        },
        { status: 400 }
      );
    }

    const [order] = await db
      .insert(cancelledOrders)
      .values({
        orderNumber,
        cancellationReasonId: parseInt(cancellationReasonId),
        systemId: parseInt(systemId),
        paymentMethodId: parseInt(paymentMethodId),
        cardholderName: cardholderName || null,
        totalAmount: totalAmount ? totalAmount.toString() : null,
        notes: notes || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create cancelled order error:", error);
    return NextResponse.json(
      { error: "Failed to create cancelled order" },
      { status: 500 }
    );
  }
}
