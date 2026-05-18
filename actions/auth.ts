"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/session";
import { cookies } from "next/headers";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

export async function loginAction(formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return { error: "Invalid input. Please check your credentials." };
  }

  const { username, password } = result.data;

  console.log(`[LOGIN] Attempt: ${username} at ${new Date().toISOString()}`);

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log(`[LOGIN] User not found: ${username}`);
      return { error: "Invalid username or password." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Invalid password for user: ${username}`);
      return { error: "Invalid username or password." };
    }

    console.log(`[LOGIN] Success: ${username}, creating session...`);

    // Create session
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const session = await encrypt({ 
      userId: user.id, 
      username: user.username,
      role: user.role || 'USER',
      expires 
    });

    // Save session in cookie
    (await cookies()).set("session", session, { 
      expires, 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/'
    });
    
    console.log(`[LOGIN] Session set, redirecting to /dashboard...`);
    
  } catch (error) {
    console.error("[LOGIN] Server error:", error);
    return { error: "An unexpected error occurred." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}
