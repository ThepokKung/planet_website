/*
  Warnings:

  - You are about to drop the column `plant_name` on the `pots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pots" DROP COLUMN "plant_name";

-- CreateTable
CREATE TABLE "plants" (
    "plant_id" TEXT NOT NULL,
    "pot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "moisture" INTEGER,
    "last_watered" TIMESTAMP(3),

    CONSTRAINT "plants_pkey" PRIMARY KEY ("plant_id")
);

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_pot_id_fkey" FOREIGN KEY ("pot_id") REFERENCES "pots"("pot_id") ON DELETE CASCADE ON UPDATE CASCADE;
