# Skills Map: Plant Doctor Pro

This document highlights the core technical skills, frameworks, and architecture demonstrated in the **Plant Doctor Pro** repository.

---

## 1. Firmware Engineering (C++ / Arduino)
Building reliable IoT edge logic to gather physical metrics and sync them upstream.
*   **WiFi Lifecycle Management**: Scanning local networks, managing connection states, and auto-reconnecting.
    *   *Demonstrated in*: [wifi_post.ino](../arduino/plant_doctor_pro/wifi_post.ino)
*   **Sensor Polling & Data Handling**: Scheduling reads for Soil Moisture, Light, Temperature, and Tilt sensors.
*   **HTTP/JSON Client Operations**: Building JSON payloads from sensor readings and transmitting them via REST requests to the backend server.
    *   *Demonstrated in*: [plant_doctor_pro.ino](../arduino/plant_doctor_pro/plant_doctor_pro.ino) (Main sketch shell)

---

## 2. Backend API Engineering (Node.js / Express)
Creating a robust middleware API layer that interfaces securely with the database.
*   **RESTful Routing Architecture**: Grouping related routes into Express router modules and mounting them under a API namespace path (`/api`).
    *   *Demonstrated in*: [server.js](../web/backend/js/server.js)
*   **CRUD Database Operations**: Implementing data-access actions (POST to save readings, GET to retrieve history, PUT to update configurations, and DELETE to remove records).
    *   *Demonstrated in*: [sensor.js](../web/backend/database/sensor.js)
*   **Middleware Stack Integration**: Utilizing `helmet` for HTTP headers security, `cors` for cross-origin access, `morgan` for development request logging, and `dotenv` for env variable safety.
    *   *Demonstrated in*: [package.json (backend)](../web/backend/package.json)
*   **Supabase JS SDK Integration**: Initializing the database client and utilizing promise-based API requests to query database tables.
    *   *Demonstrated in*: [supabase.js](../web/backend/js/supabase.js)

---

## 3. Database Architecture (SQL / PostgreSQL)
Structuring relational database components to support sensor data persistence.
*   **Relational Schema Design**: Designing tables with strict constraints, UUID primary keys generated via `gen_random_uuid()`, foreign keys referencing device nodes, and cascade deletions.
    *   *Demonstrated in*: [schema.sql](../web/backend/database/schema.sql)
*   **Data Seeding & Verification**: Constructing mock injection scripts featuring safe, conditional queries to support testing environments.
    *   *Demonstrated in*: [mock_data.sql](../web/backend/database/mock_data.sql)

---

## 4. Frontend Engineering (React / TypeScript / Vite / Recharts)
Building a responsive, aesthetic dashboard showing real-time metrics.
*   **Theme & Design Systems**: Setting up custom utility classes, botanical CSS variables, and Google Fonts imports.
    *   *Demonstrated in*: [theme.css](../web/frontend/src/styles/theme.css) and [fonts.css](../web/frontend/src/styles/fonts.css)
*   **Component Assembly**: Structuring pages cleanly with highly focused React components.
    *   *Demonstrated in*: [App.tsx](../web/frontend/src/app/App.tsx)
*   **Interactive Visualizations**: Integrated Recharts components to render customized visualizations:
    *   *Micro Sparklines*: Visualizing 7-day metric patterns. [sensor-card.tsx](../web/frontend/src/app/components/sensor-card.tsx)
    *   *Radar Charts*: Multi-axial stress breakdown analysis. [care-suggestions.tsx](../web/frontend/src/app/components/care-suggestions.tsx)
    *   *Multi-Line Composed Charts*: Showing historical trends with reference overlays. [history-chart.tsx](../web/frontend/src/app/components/history-chart.tsx)
*   **Dashboard API Clients**: Asynchronous data loading from local backend endpoints into React state hooks.
    *   *Demonstrated in*: [fetch-data.ts](../web/frontend/src/app/api/fetch-data.ts)
