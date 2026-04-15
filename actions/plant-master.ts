"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const plantTemplateSchema = z.object({
  name: z.string().min(1),
  targetMoisturePct: z.number().min(0).max(100),
});

export async function createPlantTemplate(data: any) {
  const result = plantTemplateSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid data");
  const plantTemplate = (prisma as any).plantTemplate;

  await plantTemplate.create({
    data: result.data
  });
  revalidatePath("/plant-master");
}

export async function updatePlantTemplate(id: string, data: any) {
  const result = plantTemplateSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid data");
  const plantTemplate = (prisma as any).plantTemplate;

  await plantTemplate.update({
    where: { id },
    data: result.data
  });
  revalidatePath("/plant-master");
}

export async function deletePlantTemplate(id: string) {
  const plantTemplate = (prisma as any).plantTemplate;

  await plantTemplate.delete({
    where: { id }
  });
  revalidatePath("/plant-master");
}
