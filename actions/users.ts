"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const userSchema = z.object({
  username: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return { error: "Unauthorized. Admin access required." };
  }

  const result = userSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return { error: "Invalid input data." };
  }

  const { username, password, role } = result.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "Username already exists." };
    }
    return { error: "Failed to create user." };
  }
}

export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return { error: "Unauthorized." };
  }

  // Prevent self-deletion
  if (session.userId === userId) {
    return { error: "Cannot delete your own account." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete user." };
  }
}
