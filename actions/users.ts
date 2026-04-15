"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const userSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["SUPER ADMIN", "ADMIN"]),
  locationIds: z.array(z.string()).optional(),
});

export async function createUserAction(data: any) {
  const session = await getSession();
  if (session?.role !== "SUPER ADMIN") {
    throw new Error("Unauthorized. Super Admin access required.");
  }

  const result = userSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Invalid input data: " + JSON.stringify(result.error.format()));
  }

  const { username, password, role, locationIds } = result.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        locations: locationIds ? {
          connect: locationIds.map(id => ({ id }))
        } : undefined
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
  if (session?.role !== "SUPER ADMIN") {
    throw new Error("Unauthorized.");
  }

  if (session.userId === userId) {
    throw new Error("Cannot delete your own account.");
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    throw new Error("Failed to delete user.");
  }
}
