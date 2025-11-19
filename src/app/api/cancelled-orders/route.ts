import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cancelledOrders,
  cancellationReasons,
  systems,
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
    const archived = searchParams.get("archived") === "true";
    const paymentMethodFilter = searchParams.get("paymentMethod") || "";

    const orders = await db
      .select({
        id: cancelledOrders.id,
        orderNumber: cancelledOrders.orderNumber,
        cancellationReason: cancellationReasons.reason,
        cancellationReasonAr: cancellationReasons.reasonAr,
        systemName: systems.name,
        systemNameAr: systems.nameAr,
        paymentMethod: cancelledOrders.paymentMethod,
        cardholderName: cancelledOrders.cardholderName,
        totalAmount: cancelledOrders.totalAmount,
        notes: cancelledOrders.notes,
        employeeName: users.fullName,
        createdAt: cancelledOrders.createdAt,
        updatedAt: cancelledOrders.updatedAt,
        isArchived: cancelledOrders.isArchived,
        archivedAt: cancelledOrders.archivedAt,
      })
      .from(cancelledOrders)
      .leftJoin(
        cancellationReasons,
        eq(cancelledOrders.cancellationReasonId, cancellationReasons.id)
      )
      .leftJoin(systems, eq(cancelledOrders.systemId, systems.id))
      .leftJoin(users, eq(cancelledOrders.createdBy, users.id))
      .where(
        and(
          eq(cancelledOrders.isArchived, archived),
          search
            ? or(
                like(cancelledOrders.orderNumber, `%${search}%`),
                like(users.fullName, `%${search}%`),
                like(cancelledOrders.cardholderName, `%${search}%`)
              )
            : undefined,
          paymentMethodFilter
            ? eq(cancelledOrders.paymentMethod, paymentMethodFilter)
            : undefined
        )
      )
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
      paymentMethod,
      cardholderName,
      totalAmount,
      notes,
    } = body;

    // Validate required fields
    if (!orderNumber || !cancellationReasonId || !systemId || !paymentMethod) {
      return NextResponse.json(
        {
          error:
            "Order number, cancellation reason, system, and payment method are required",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = [
      "Cash on Delivery",
      "Pay in Installment",
      "Pay using Visa/Master card",
      "Zain Cash",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // If payment method is "Pay in Installment", require additional fields
    if (paymentMethod === "Pay in Installment") {
      if (!cardholderName || !totalAmount) {
        return NextResponse.json(
          {
            error:
              "Cardholder name and total amount are required for installment payments",
          },
          { status: 400 }
        );
      }
    }

    const [order] = await db
      .insert(cancelledOrders)
      .values({
        orderNumber,
        cancellationReasonId,
        systemId,
        paymentMethod,
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
