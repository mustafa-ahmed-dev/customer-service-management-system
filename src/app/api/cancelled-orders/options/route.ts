import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancellationReasons, systems, paymentMethods } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch dropdown options
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch active cancellation reasons
    const reasons = await db
      .select({
        id: cancellationReasons.id,
        reason: cancellationReasons.reason,
      })
      .from(cancellationReasons)
      .where(isNull(cancellationReasons.deactivatedAt))
      .orderBy(cancellationReasons.reason);

    // Fetch active systems
    const systemsList = await db
      .select({
        id: systems.id,
        name: systems.name,
      })
      .from(systems)
      .where(isNull(systems.deactivatedAt))
      .orderBy(systems.name);

    // Fetch active payment methods
    const paymentMethodsList = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.name);

    return NextResponse.json({
      cancellationReasons: reasons,
      systems: systemsList,
      paymentMethods: paymentMethodsList,
    });
  } catch (error) {
    console.error("Fetch options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}
