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
    const hashedPassword1 = await argon2.hash("Admin@2025"); // Change this password
    const hashedPassword2 = await argon2.hash("Admin@2025"); // Change this password

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
        nameAr: "ماجنتو",
        createdBy: adminUsers[0].id,
      },
      {
        name: "NetSuite",
        nameAr: "نيت سويت",
        createdBy: adminUsers[0].id,
      },
    ]);
    console.log("✅ Created systems");

    // Create cancellation reasons
    console.log("Creating cancellation reasons...");
    await db.insert(cancellationReasons).values([
      {
        reason: "Suspension Of Employee Installments",
        reasonAr: "تعليق أقساط الموظف",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Test Order",
        reasonAr: "طلب تجريبي",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Preparation Error",
        reasonAr: "خطأ في التحضير",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Out Of Delivery Zone",
        reasonAr: "خارج منطقة التوصيل",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Item Unavailable",
        reasonAr: "المنتج غير متوفر",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Financial Reasons",
        reasonAr: "أسباب مالية",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Personal Circumstance",
        reasonAr: "ظروف شخصية",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Order By Mistake",
        reasonAr: "طلب بالخطأ",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "No answer / Phone unreachable",
        reasonAr: "لا إجابة / الهاتف لا يمكن الوصول إليه",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Customer Would Like To Amend Order",
        reasonAr: "العميل يرغب في تعديل الطلب",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Late Delivery",
        reasonAr: "تأخير في التوصيل",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Cardholder is not present",
        reasonAr: "حامل البطاقة غير موجود",
        createdBy: adminUsers[0].id,
      },
      {
        reason: "Order duplicated",
        reasonAr: "طلب مكرر",
        createdBy: adminUsers[0].id,
      },
    ]);
    console.log("✅ Created cancellation reasons");

    // Create governorates
    console.log("Creating governorates...");
    await db.insert(governorates).values([
      { name: "Al Anbar", nameAr: "الأنبار", createdBy: adminUsers[0].id },
      {
        name: "Al Qadisiyyah",
        nameAr: "القادسية",
        createdBy: adminUsers[0].id,
      },
      { name: "Babil", nameAr: "بابل", createdBy: adminUsers[0].id },
      { name: "Baghdad", nameAr: "بغداد", createdBy: adminUsers[0].id },
      { name: "Basra", nameAr: "البصرة", createdBy: adminUsers[0].id },
      { name: "Dhi Qar", nameAr: "ذي قار", createdBy: adminUsers[0].id },
      { name: "Diyala", nameAr: "ديالى", createdBy: adminUsers[0].id },
      { name: "Erbil", nameAr: "أربيل", createdBy: adminUsers[0].id },
      { name: "Karbala", nameAr: "كربلاء", createdBy: adminUsers[0].id },
      { name: "Kirkuk", nameAr: "كركوك", createdBy: adminUsers[0].id },
      { name: "Maysan", nameAr: "ميسان", createdBy: adminUsers[0].id },
      { name: "Ninawa", nameAr: "نينوى", createdBy: adminUsers[0].id },
      { name: "Muthana", nameAr: "المثنى", createdBy: adminUsers[0].id },
      { name: "Najaf", nameAr: "النجف", createdBy: adminUsers[0].id },
      {
        name: "Salah ad-Din",
        nameAr: "صلاح الدين",
        createdBy: adminUsers[0].id,
      },
      {
        name: "Sulaymaniyyah",
        nameAr: "السليمانية",
        createdBy: adminUsers[0].id,
      },
      { name: "Wasit", nameAr: "واسط", createdBy: adminUsers[0].id },
      { name: "Halabja", nameAr: "حلبجة", createdBy: adminUsers[0].id },
      { name: "Dohuk", nameAr: "دهوك", createdBy: adminUsers[0].id },
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
