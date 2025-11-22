import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { like, or, isNull, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hash } from "argon2";

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can view users
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const showDeactivated = searchParams.get("deactivated") === "true";

    let query = db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        hasFinanceAccess: users.hasFinanceAccess,
        createdAt: users.createdAt,
        deactivatedAt: users.deactivatedAt,
      })
      .from(users);

    // Filter by search
    if (search) {
      query = query.where(
        or(
          like(users.email, `%${search}%`),
          like(users.fullName, `%${search}%`)
        )!
      ) as any;
    }

    // Filter by deactivated status
    if (showDeactivated) {
      query = query.where(isNotNull(users.deactivatedAt)) as any;
    } else {
      query = query.where(isNull(users.deactivatedAt)) as any;
    }

    const allUsers = await query;

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create users
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, role, hasFinanceAccess } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "moderator", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(like(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        fullName,
        role,
        hasFinanceAccess: hasFinanceAccess || false,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        hasFinanceAccess: users.hasFinanceAccess,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
