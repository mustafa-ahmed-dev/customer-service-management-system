import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systems, cancellationReasons } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active systems (not deactivated)
    const activeSystems = await db
      .select({
        id: systems.id,
        name: systems.name,
      })
      .from(systems)
      .where(isNull(systems.deactivatedAt));

    // Get active cancellation reasons (not deactivated)
    const activeReasons = await db
      .select({
        id: cancellationReasons.id,
        reason: cancellationReasons.reason,
      })
      .from(cancellationReasons)
      .where(isNull(cancellationReasons.deactivatedAt));

    console.log("Systems found:", activeSystems.length);
    console.log("Reasons found:", activeReasons.length);

    return NextResponse.json({
      systems: activeSystems,
      cancellationReasons: activeReasons,
    });
  } catch (error) {
    console.error("Get options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}
