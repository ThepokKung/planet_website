"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const plantTemplateSchema = z.object({
  name: z.string().min(1),
  targetMoisturePct: z.number().min(0).max(100),
});

type PlantTemplateInput = z.infer<typeof plantTemplateSchema>;

export async function createPlantTemplate(data: PlantTemplateInput) {
  const result = plantTemplateSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid data");

  await prisma.plantTemplate.create({
    data: result.data
  });
  revalidatePath("/plant-master");
}

export async function updatePlantTemplate(id: string, data: PlantTemplateInput) {
  const result = plantTemplateSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid data");

  await prisma.plantTemplate.update({
    where: { id },
    data: result.data
  });
  revalidatePath("/plant-master");
}

export async function deletePlantTemplate(id: string) {
  await prisma.plantTemplate.delete({
    where: { id }
  });
  revalidatePath("/plant-master");
}
