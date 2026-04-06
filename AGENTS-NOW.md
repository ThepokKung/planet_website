# 🧭 AgroBot Command Center: ACTUAL STATUS (April 1, 2026)

You are **Gemini**, an expert Senior Full-Stack Engineer and IoT Software Architect. 
This document reflects the **actual implementation and critical fixes** as of April 1, 2026.

---

## 🛠️ Current Architecture & Project Structure

- **Unified Dashboard (`app/(dashboard)/`)**:
  - `fleet/` → Real-time overview of all connected robots.
  - `setup/` → **Commissioning Center**. Web Serial (USB) and WiFi sync.
  - `details/[id]/` → Individual robot monitoring and system logs.
  - `analytics/` → Data visualizations and KPI summaries.
- **Authentication & Local Network Access (CRITICAL UPDATE)**:
  - **Local IP Access**: Optimized for access via `192.168.1.155:3000` (iPad/Notebook).
  - **Next.js Config**: `allowedDevOrigins` and `serverActions.allowedOrigins` are configured in `next.config.ts` to permit cross-device interaction in development.
  - **Session Security**: Cookies are set to `secure: false` in `actions/auth.ts` to allow login over local HTTP (non-HTTPS) connections.

---

## 🔐 Authentication & Session Logic

- **Login Flow**:
  - Uses `loginAction` in `actions/auth.ts`.
  - Redirects to `/fleet` upon success.
  - **Simplified UI**: The login page (`app/login/page.tsx`) uses local `useState` for loading states instead of `useFormStatus` to ensure compatibility with mobile browsers (iPad/Safari).
- **Default Credentials**: 
  - **Username**: `admin`
  - **Password**: `admin123` (from `prisma/seed.ts`).

---

## 🪴 Data Model & Logging Strategy

- **Hierarchy:** `User` -> `Location` -> `Robot` -> `Pot` -> `Plant`.
- **Dual Logging System:**
  1.  **`watering_logs`**: Business logic (moisture levels, ml, duration).
  2.  **`robot_logs`**: System states (WAKEUP, MOVING, WATERING, SLEEP, ERROR).
- **STRICT RULE: NO MOCK DATA.** All components must fetch real data from PostgreSQL via Prisma.

---

## 🌐 Connectivity & Development Environment

- **Server Command**: Must be run with `--hostname 0.0.0.0` to be reachable on the local network.
  - `npm run dev -- --hostname 0.0.0.0`
- **Network Troubleshooting**: 
  - If the "Sign in" button is unresponsive on other devices, check `next.config.ts` for the correct `allowedDevOrigins` matching the server's current local IP.
  - Logging is enabled in `actions/auth.ts` and `app/login/page.tsx` to trace login attempts in the server console and browser developer tools.

---

## 🎨 UI/UX & AgroBot CI

- **Primary Colors**: Dark Forest Green (`#0E6633`), Pulse Green (`#22a042`).
- **Design Constraint**: Prefer Vanilla CSS for styling. Use Lucide icons for UI elements.
- **Responsiveness**: Simplified Client Components to ensure critical functions (like Login and Dashboard navigation) work across iPad, Mobile, and Desktop.

---

## 🧠 Gemini Code Style Rules (AgroBot Now)

- **Think step-by-step**: Validate DB schemas before writing Prisma queries.
- **Revalidate**: Use `revalidatePath` after data mutations.
- **Reliability**: Prioritize simple, robust React patterns over experimental features for core actions like authentication.
- **No placeholder code**: Write complete, functional implementations.
