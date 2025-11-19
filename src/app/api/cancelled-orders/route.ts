import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cancelledOrders,
  systems,
  cancellationReasons,
  users,
} from "@/lib/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch all cancelled orders (with archive filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const archived = searchParams.get("archived") === "true";

    const orders = await db
      .select({
        id: cancelledOrders.id,
        orderNumber: cancelledOrders.orderNumber,
        cancellationReason: cancellationReasons.reason,
        cancellationReasonAr: cancellationReasons.reasonAr,
        systemName: systems.name,
        systemNameAr: systems.nameAr,
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
                like(users.fullName, `%${search}%`)
              )
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
    const { orderNumber, cancellationReasonId, systemId } = body;

    // Validate input
    if (!orderNumber || !cancellationReasonId || !systemId) {
      return NextResponse.json(
        { error: "Order number, cancellation reason, and system are required" },
        { status: 400 }
      );
    }

    const [order] = await db
      .insert(cancelledOrders)
      .values({
        orderNumber,
        cancellationReasonId,
        systemId,
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
