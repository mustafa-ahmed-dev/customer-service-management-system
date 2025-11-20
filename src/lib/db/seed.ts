import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, systems, cancellationReasons, governorates } from "./schema";
import argon2 from "argon2";
import "dotenv/config";

async function seed() {
  console.log("🌱 Starting database seeding...");

  // Create a new connection specifically for seeding
  const connectionString = process.env.DATABASE_URL!;
  console.log(
    "Using connection string:",
    connectionString.replace(/:[^:@]+@/, ":****@")
  ); // Hide password in logs

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, {
    schema: { users, systems, cancellationReasons, governorates },
  });

  try {
    // Create admin users
    console.log("Creating admin users...");
    const hashedPassword1 = await argon2.hash("Elryan@12345"); // Change this password
    const hashedPassword2 = await argon2.hash("Elryan@12345"); // Change this password

    const adminUsers = await db
      .insert(users)
      .values([
        {
          email: "yousef.abdulrazaq@elryan.com",
          password: hashedPassword1,
          fullName: "Yousef Ghanem Abdulrazaq",
          role: "admin",
        },
        {
          email: "mustafa.ahmed@elryan.com",
          password: hashedPassword2,
          fullName: "Mustafa Ahmed Mohammed",
          role: "admin",
        },
      ])
      .returning();

    console.log(`✅ Created ${adminUsers.length} admin users`);

    // Create systems
    console.log("Creating systems...");
    await db.insert(systems).values([
      {
        name: "Magento",
        createdBy: adminUsers[0].id,
      },
      {
        name: "NetSuite",
        createdBy: adminUsers[0].id,
      },
    ]);
    console.log("✅ Created systems");

    // Create cancellation reasons
    console.log("Creating cancellation reasons...");
    await db.insert(cancellationReasons).values([
      {
        reason: "Suspension Of Employee Installments",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Test Order",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Preparation Error",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Out Of Delivery Zone",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Item Unavailable",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Financial Reasons",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Personal Circumstance",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Order By Mistake",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "No answer / Phone unreachable",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Customer Would Like To Amend Order",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Late Delivery",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Cardholder is not present",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Order duplicated",
        createdBy: adminUsers[0].id,
      },
    ]);
    console.log("✅ Created cancellation reasons");

    // Create governorates
    console.log("Creating governorates...");
    await db.insert(governorates).values([
      {
        name: "Al Qadisiyyah",
        createdBy: adminUsers[0].id,
      },
      {
        name: "Salah ad-Din",
        createdBy: adminUsers[0].id,
      },
      {
        name: "Sulaymaniyyah",
        createdBy: adminUsers[0].id,
      },
    ]);
    console.log("✅ Created governorates");

    console.log("🎉 Database seeding completed successfully!");

    await client.end();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    await client.end();
    throw error;
  }
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
