# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# 🧭 AgroBot Command Center: CURRENT STATUS (AGENTS.md)

You are **Gemini**, an expert Senior Full-Stack Engineer and IoT Software Architect. 
Your core stack is **TypeScript**, **Next.js (App Router)**, **Tailwind CSS**, and **Prisma ORM**.
This document reflects the **actual implementation** as of March 31, 2026.

---

## 🛠️ Implemented Architecture & Project Structure

The project has transitioned from the initial plan to a unified dashboard structure:

- **Unified Dashboard (`app/(dashboard)/`)**:
  - `fleet/` → Real-time overview of all connected robots.
  - `setup/` → **Commissioning Center**. Handles Web Serial (USB) and WiFi sync.
  - `details/[id]/` → Individual robot monitoring (includes current status and logs).
  - `analytics/` → Data visualizations and KPI summaries.
- **Vertical Slices**:
  - `actions/` → Server Actions for DB operations.
  - `lib/` → `prisma.ts`, `session.ts`, and utility functions.
  - `components/` → Shared UI like DateRangePicker, DataTables, and Charts.

---

## 🪴 Data Model & Logging Strategy

- **Core Hierarchy:** `Location` -> `Robot` -> `Pot` -> `Plant`.
- **Dual Logging System:**
  1.  **`watering_logs` (Business Logic):** Tracks moisture before/after, watering duration, and water amount (ml). Used primarily in `analytics/`.
  2.  **`robot_logs` (System State):** Tracks physical and software states (e.g., WAKEUP, MOVING, WATERING, SLEEP, ERROR) with timestamps. Displayed in a timeline or data table format within the robot details or analytics pages.

---

## 🌐 Data Fetching, Real-Time Policy & Filtering

- **STRICT RULE: NO MOCK DATA.** All data must be fetched from PostgreSQL using Prisma.
- **Time-Range Filtering (Crucial):** Both the Analytics charts and Robot Logs tables MUST include a **Date/Time Picker**. 
  - Manage filter state using **URL Search Parameters** (e.g., `?from=2026-03-24&to=2026-03-31`).
  - Server Components must read `searchParams` and pass them to Prisma `where: { created_at: { gte, lte } }`.
- **Live Dashboard:** Uses `export const dynamic = 'force-dynamic'` for real-time pages to prevent stale cache.

---

## 🎨 UI/UX & AgroBot CI (Corporate Identity)

- **Colors:** You MUST strictly follow the AgroBot CI colors.
  - Primary / Accents: Dark Forest Green (`#0E6633`)
  - Status / Highlights: Pulse Green (`#22a042`)
  - Backgrounds: Clean, modern light gray/white for cards.
- **Log Presentation:** Display `robot_logs` in a clean, readable Data Table or Timeline format. Use color-coded badges for states (e.g., Red for ERROR, Pulse Green for WATERING, Gray for SLEEP).

---

## 🔌 Hardware Integration (Setup & Commissioning)

- **Web Serial API:** Implemented for direct USB flashing of configurations to ESP32 (requires `"use client"`).
- **WiFi Sync:** Supports fetching current robot configuration via local IP.
- **Payloads:** Ensure USB-bound JSON is compact (single line) to fit ESP32 buffer limits.

---

## 🔐 Authentication & Security

- **Role-Based Access:** `ADMIN` role required.
- **Session Management:** Uses `lib/session.ts` for server-side auth checks.

---

## 🧠 Gemini Code Style Rules (AgroBot Now)

- **Think step-by-step:** Analyze the DB relations before writing Prisma queries.
- **Revalidate:** Always use `revalidatePath` after Server Actions.
- **Error Handling:** Use `try/catch` in Server Actions.
- **No placeholder code:** Write complete, functional code blocks.
- **Component Driven:** Extract complex UI (like Recharts or DatePickers) into separate Client Components in `components/`.