import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function validateAndSetup() {
  console.log("--- Validation Script Start ---");

  // 1. Verify/Setup Super Admin credentials
  const username = "superadmin";
  const password = "superadmin123";
  
  console.log(`Checking user: ${username}`);
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    console.log("Super admin not found. Creating...");
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "SUPER ADMIN",
      },
    });
    console.log("Super admin created.");
  } else {
    console.log("Super admin exists.");
  }

  // 2. Discover Routes (File System based discovery)
  console.log("\n--- Discovering Routes ---");
  // We'll simulate this by listing directories in app/
  // Based on your previous list_directory/tree output:
  const routes = [
    "/dashboard",
    "/analytics",
    "/plants",
    "/system-logs",
    "/settings",
    "/setup",
    "/plant-master",
    "/users",
    "/login"
  ];
  console.log("Routes to validate:", routes);

  // 3. Database Integrity Check
  console.log("\n--- Database Integrity Check ---");
  const robotCount = await prisma.robot.count();
  const locationCount = await prisma.location.count();
  const plantCount = await prisma.plant.count();
  const userCount = await prisma.user.count();

  console.log(`Robots: ${robotCount}`);
  console.log(`Locations: ${locationCount}`);
  console.log(`Plants: ${plantCount}`);
  console.log(`Users: ${userCount}`);

  if (robotCount === 0) console.warn("WARNING: No robots found in DB.");
  if (locationCount === 0) console.warn("WARNING: No locations found in DB.");

  console.log("\n--- Validation Script End ---");
}

validateAndSetup()
  .catch((e) => {
    console.error("Validation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
