import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cancelledOrders,
  lateOrders,
  installmentOrders,
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count non-archived records in each table
    const [cancelledCount] = await db
      .select({ count: count() })
      .from(cancelledOrders)
      .where(eq(cancelledOrders.isArchived, false));

    const [lateOrdersCount] = await db
      .select({ count: count() })
      .from(lateOrders)
      .where(eq(lateOrders.isArchived, false));

    const [installmentOrdersCount] = await db
      .select({ count: count() })
      .from(installmentOrders)
      .where(eq(installmentOrders.isArchived, false));

    return NextResponse.json({
      cancelledOrders: cancelledCount.count,
      lateOrders: lateOrdersCount.count,
      installmentOrders: installmentOrdersCount.count,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
