import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systems, cancellationReasons } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active systems
    const systemsList = await db
      .select()
      .from(systems)
      .where(isNull(systems.deactivatedAt));

    // Get active cancellation reasons
    const reasonsList = await db
      .select()
      .from(cancellationReasons)
      .where(isNull(cancellationReasons.deactivatedAt));

    return NextResponse.json({
      systems: systemsList,
      reasons: reasonsList,
    });
  } catch (error) {
    console.error("Get options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}
