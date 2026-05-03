# Vertical Forest Dashboard - Project Structure

## 1. Tech Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15+ (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth** | Custom JWT (jose) |

---

## 2. Directory Structure
```text
planet_website/
├── actions/             # Server Actions (Database mutations)
├── app/                 # Next.js App Router (Pages & API)
│   ├── (dashboard)/     # Protected Dashboard Routes
│   │   ├── analytics/   # KPI & Data Visualization
│   │   ├── dashboard/   # Fleet Overview
│   │   ├── details/     # Robot specific details
│   │   ├── plant-master/# Plant Template Management
│   │   ├── plants/      # Plant Inventory & Individual Logs
│   │   ├── setup/       # Robot & Zone Configuration
│   │   ├── system-logs/ # Global event logs
│   │   └── users/       # User & Role Management
│   ├── api/             # IoT Endpoints (OTA Config & Log Ingestion)
│   └── login/           # Authentication page
├── components/          # Reusable UI & Client Components
├── lib/                 # Shared utilities, Prisma client, Session logic
├── prisma/              # Database Schema & Seed scripts
└── public/              # Static assets (images, icons)
```

---

## 3. Page Inventory
### Core Dashboard
- **Dashboard Overview (`/dashboard`)**: Summary cards and robot fleet status table.
- **Analytics (`/analytics`)**: Moisture trends and water usage charts with time-range presets (24h, 7d, 14d).
- **Plant Inventory (`/plants`)**: List of all plants assigned to robots.
- **Plant Logs (`/plants/[id]`)**: Detailed history for a specific plant.
- **Robot Details (`/details/[id]`)**: Comprehensive status, track assignments, and hardware logs for a unit.
- **System Logs (`/system-logs`)**: Centralized table for all robot activities.

### Configuration & Admin
- **Setup Robot (`/setup`)**: Interface to link robots to locations and configure pots.
- **Plant Master (`/plant-master`)**: (Super Admin) Define global moisture targets and species.
- **User Management (`/users`)**: (Super Admin) Assign roles and zone access.

---

## 4. API & Data Flow
### IoT Hardware Endpoints
- `GET /api/config?robot_id=...` -> Returns OTA configuration for the ESP32.
- `POST /api/logs` -> Receives telemetry and watering data from the robots.

### Server Actions
- `createPlantTemplate` / `updatePlantTemplate`
- `loginAction` / `logoutAction`
- `updateRobotConfig`

---

## 5. Data Model (Prisma)
- **User**: Authentication & RBAC (SUPER ADMIN / ADMIN).
- **Location**: Physical zones where robots operate.
- **Robot**: The hardware unit; tracks battery, status, and last active time.
- **Pot**: A specific track/container on a robot.
- **Plant**: The living specimen; holds current moisture targets.
- **PlantTemplate**: Master data for plant species.
- **WateringLog**: Record of every hydration event (moisture levels + water amount).
- **RobotLog**: General system events and errors.
