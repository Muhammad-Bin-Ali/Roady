# Roady Server

A simple Go REST API for the Roady application.

## Prerequisites

- Go 1.21+
- PostgreSQL

## Setup

1.  **Database**: Ensure you have a PostgreSQL database running.
    ```bash
    createdb roady
    ```

2.  **Environment Variables**:
    Set the `DATABASE_URL` environment variable.
    ```bash
    export DATABASE_URL="postgres://user:password@localhost:5432/roady?sslmode=disable"
    ```

3.  **Dependencies**:
    Install the required Go packages.
    ```bash
    go mod tidy
    ```

## Running the Server

```bash
go run main.go
```

The server will start on port `8080`.

## API Endpoints

-   `POST /auth/signup`: Register a new user.
-   `POST /auth/login`: Login.
-   `GET /trips?userId={id}`: Get user trips.
-   `POST /tracking/start`: Start a new trip.
-   `POST /tracking/stop`: Stop a trip.
-   `POST /tracking/points`: Upload GPS points.
