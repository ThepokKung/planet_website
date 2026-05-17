# Robot Telemetry Dual-Path Design

## Context
The robot detail page must show live telemetry when open, while telemetry ingestion must continue into the database even when no page is open. The existing system uses Node-RED for MQTT and a Next.js App Router frontend with Prisma.

## Goals
- Show latest robot status and state on the robot detail page.
- Continue ingesting telemetry into the database even when the page is not open.
- Support multiple simultaneous WebSocket subscribers without overwriting targets.
- Keep MQTT topic names unchanged.
- Use `NODE_RED_BASE_URL` for Node-RED WebSocket endpoint.

## Non-Goals
- No manual robot control added to the UI.
- No schema changes to Prisma.
- No changes to MQTT topic naming.

## Architecture
The solution is dual-path:
1. **Database path (always on):** Node-RED posts telemetry to `/api/node-red/bridge` on every message, updating the database.
2. **Live path (page open):** The browser connects via WebSocket to Node-RED and subscribes to a robot ID. Node-RED forwards matching telemetry to the WebSocket clients.

## Components
- **Node-RED Flow**
  - WebSocket in: `/ws/telemetry` (subscribe messages from browser).
  - Function: subscribe handler (parse JSON, set `flow.wsSubscriptions[sessionId] = robotId`).
  - MQTT in: use existing topic (currently `plannet-project/+/robot_state`; unchanged).
  - Function: telemetry filter (match `robot_id` to `flow.wsSubscriptions`, then set `msg._session = { id: sessionId }` to target a specific WebSocket).
  - WebSocket out: `/ws/telemetry` (forward telemetry to browser).
  - RBE/Change filter: only pass telemetry when key metrics change (avoid DB bloat).
  - HTTP request: POST `/api/node-red/bridge` (DB ingestion on change).

- **Next.js Robot Detail Page**
  - Server component loads robot snapshot from DB (already in place).
  - Client component opens WebSocket and overlays live telemetry.

## Data Flow
- **Subscribe:**
  - Browser sends JSON over WebSocket: `{ "action": "subscribe", "target": "<robot_id>" }`.
  - Node-RED parses payload and stores `flow.wsSubscriptions[msg._session.id] = <robot_id>`.

- **Telemetry ingestion:**
  - MQTT telemetry arrives at Node-RED.
  - RBE/Change filter allows only state/metric changes to pass.
  - Node-RED posts to `/api/node-red/bridge` for database update.
  - Node-RED forwards telemetry to WebSocket sessions where the mapped robot ID matches the telemetry `robot_id`.

## Error Handling
- If WebSocket is disconnected, the UI shows the DB snapshot and the connection state indicates disconnected.
- If Node-RED is down, DB ingestion stops, but last DB values remain visible.
- If parsing fails, the subscribe handler ignores the message and does not update the active robot.

## Security
- `/api/node-red/bridge` requires `x-api-key`.
- No new secrets introduced.

## Testing Plan
- **DB only:** Close the robot detail page, publish telemetry changes to MQTT, verify robot row updated in DB.
- **DB dedupe:** Publish identical telemetry repeatedly and confirm no new DB updates/logs are created.
- **Live overlay:** Open robot detail page and confirm WebSocket status shows connected and live fields update.
- **Filter:** Send telemetry for a different robot and confirm it does not update the current page.

## Acceptance Criteria
- Robot detail page shows latest DB snapshot on load and updates live when WebSocket data arrives.
- Telemetry continues to update the database when the page is closed.
- MQTT topic naming remains unchanged.
- `NODE_RED_BASE_URL` controls the WebSocket endpoint.
