-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "robots" (
    "robot_id" TEXT NOT NULL,
    "name" TEXT,
    "state" TEXT,
    "status" TEXT,
    "current_track_index" INTEGER,
    "battery_level" INTEGER,
    "last_active" TIMESTAMP(3),

    CONSTRAINT "robots_pkey" PRIMARY KEY ("robot_id")
);

-- CreateTable
CREATE TABLE "pots" (
    "pot_id" TEXT NOT NULL,
    "robot_id" TEXT NOT NULL,
    "track_index" INTEGER NOT NULL,
    "plant_name" TEXT NOT NULL,
    "target_moisture_pct" INTEGER NOT NULL,
    "max_water_duration_sec" INTEGER NOT NULL,

    CONSTRAINT "pots_pkey" PRIMARY KEY ("pot_id")
);

-- CreateTable
CREATE TABLE "watering_logs" (
    "log_id" TEXT NOT NULL,
    "robot_id" TEXT NOT NULL,
    "pot_id" TEXT NOT NULL,
    "moisture_before" INTEGER NOT NULL,
    "watering_start_time" TIMESTAMP(3) NOT NULL,
    "watering_end_time" TIMESTAMP(3) NOT NULL,
    "watering_duration_sec" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watering_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "pots" ADD CONSTRAINT "pots_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots"("robot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watering_logs" ADD CONSTRAINT "watering_logs_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots"("robot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watering_logs" ADD CONSTRAINT "watering_logs_pot_id_fkey" FOREIGN KEY ("pot_id") REFERENCES "pots"("pot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
