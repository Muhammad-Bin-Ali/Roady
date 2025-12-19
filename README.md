# Roady

**Roady** is the "Flighty for road trips." It is a sophisticated tracking application designed to log, visualize, and analyze your car journeys with the same level of detail and polish that aviation enthusiasts expect from flight trackers.

Whether you're commuting, road-tripping, or just love data, Roady provides a beautiful, local-first way to keep a passport of your travels.

## Project Structure

This is a full-stack application composed of:

-   **Client (`/client`)**: A React application built with Vite, TypeScript, Tailwind CSS, and Capacitor for mobile deployment.
-   **Server (`/server`)**: A high-performance Go (Golang) REST API.
-   **Database**: PostgreSQL for persistent storage of user data and trip logs.

## Prerequisites

-   **Docker & Docker Compose** (Recommended for easiest setup)
-   *Or manually:* Node.js (v18+), Go (1.21+), and PostgreSQL.

## Quick Start (Docker)

The easiest way to run the entire stack (Client, Server, and Database) is using Docker Compose.

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd Roady
    ```

2.  **Start the services**:
    ```bash
    docker-compose up --build
    ```

    This will start:
    -   **PostgreSQL Database**: Port `5432`
    -   **Go Server**: Port `8080` (Accessible at `http://localhost:8080`)

3.  **Run the Client**:
    Open a new terminal window to run the frontend.
    ```bash
    cd client
    npm install
    npm run dev
    ```
    The client will be available at `http://localhost:8081` (or the port shown in your terminal).

## Manual Setup

If you prefer to run things manually without Docker:

### 1. Database (PostgreSQL)
Ensure you have PostgreSQL running and create a database named `roady`.
```bash
createdb roady
```

### 2. Server (Go)
Navigate to the server directory and start the backend.
```bash
cd server
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/roady?sslmode=disable" # Adjust credentials as needed
go mod tidy
go run main.go
```

### 3. Client (React/Vite)
Navigate to the client directory and start the frontend.
```bash
cd client
npm install
npm run dev
```

## Technologies Used

### Client
-   **Framework**: React + Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Shadcn UI
-   **Mobile**: Capacitor (Filesystem, Geolocation, Preferences)
-   **State**: React Context + Framer Motion

### Server
-   **Language**: Go (Golang)
-   **Database**: PostgreSQL
-   **Auth**: JWT-ready architecture (currently simple token-based)

## Features
-   **Live Tracking**: Real-time GPS logging with offline buffering.
-   **Trip History**: View past trips with detailed statistics (distance, duration).
-   **Vehicle Management**: Tag trips with specific vehicles (Make, Model, Year).
-   **Beautiful UI**: Dark-mode first, "Flighty-inspired" design.
