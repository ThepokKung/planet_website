import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not defined in the environment variables.');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function resetAdminPassword() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const username = 'admin'; // Based on seed.ts
  const newPassword = 'admin123456';

  console.log(`--- 🛡️  AgroBot: Password Reset Utility ---`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.error(`❌ Error: User '${username}' not found in the database.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { username },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log(`✅ Success: Password for user '${username}' has been reset to: ${newPassword}`);
    console.log(`🚀 You can now login at /login using these credentials.`);

  } catch (error) {
    console.error('❌ Failed to reset password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
