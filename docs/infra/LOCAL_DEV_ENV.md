# Local Development Environment

## Purpose

This document explains how to run Murmurant on your laptop for local development.
The local environment uses Docker containers to run the web application and
database. This keeps your setup consistent and avoids conflicts with other
software on your machine.

---

## Prerequisites

Before you begin, make sure you have these installed:

- **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
  - After installing, open Docker Desktop and let it start up
  - You should see a whale icon in your menu bar (Mac) or system tray (Windows)

- **Docker Compose** - This comes bundled with Docker Desktop

To verify installation, open a terminal and run:

```bash
docker --version
docker compose version
```

Both commands should show version numbers.

---

## First-Time Setup

Run these commands once when setting up Murmurant for the first time.

### Step 1: Start the containers

This command starts both the database and web application:

```bash
docker compose -f infra/docker-compose.yml up -d
```

What this does:

- Downloads the PostgreSQL database image (first time only)
- Builds the web application container
- Starts both containers in the background
- The `-d` flag means "detached" (runs in background)

Wait about 30 seconds for everything to start.

### Step 2: Run database migrations

This command sets up the database tables:

```bash
docker compose -f infra/docker-compose.yml exec web npx prisma migrate dev
```

What this does:

- Connects to the running web container
- Runs Prisma migrations to create database tables
- You may see output about migrations being applied

### Step 3: Seed the database (optional)

If seed data is available, run:

```bash
docker compose -f infra/docker-compose.yml exec web npx prisma db seed
```

What this does:

- Adds sample data to the database for testing

### Step 4: Open the application

Open your web browser and go to:

```
http://localhost:3000
```

You should see the Murmurant application.

---

## Daily Use

### Starting the system

When you want to work on Murmurant, run:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Then open http://localhost:3000 in your browser.

### Stopping the system

When you are done working:

```bash
docker compose -f infra/docker-compose.yml down
```

This stops both containers but keeps your data.

### Viewing logs

To see what the application is doing:

```bash
docker compose -f infra/docker-compose.yml logs -f web
```

Press `Ctrl+C` to stop viewing logs.

To see database logs:

```bash
docker compose -f infra/docker-compose.yml logs -f db
```

### Checking container status

To see if containers are running:

```bash
docker compose -f infra/docker-compose.yml ps
```

You should see both `murmurant-db` and `murmurant-web` listed as "Up".

---

## Troubleshooting

### Port 5432 already in use

**Symptom:** Error message says port 5432 is already in use.

**Cause:** Another PostgreSQL instance is running on your machine.

**Solution:** Either stop the other PostgreSQL, or change the port in
`docker-compose.yml`. Find this line:

```yaml
ports:
  - "5432:5432"
```

Change it to:

```yaml
ports:
  - "5433:5432"
```

Then update your DATABASE_URL to use port 5433.

### Container failing to start

**Symptom:** Web container keeps restarting or shows errors.

**Steps to diagnose:**

1. Check the logs:
   ```bash
   docker compose -f infra/docker-compose.yml logs web
   ```

2. Make sure the database is running:
   ```bash
   docker compose -f infra/docker-compose.yml ps
   ```
   The `murmurant-db` container should show as "healthy".

3. Try rebuilding the container:
   ```bash
   docker compose -f infra/docker-compose.yml down
   docker compose -f infra/docker-compose.yml build --no-cache
   docker compose -f infra/docker-compose.yml up -d
   ```

### Database connection refused

**Symptom:** Application shows "connection refused" errors.

**Cause:** Database container is not ready yet, or is not running.

**Solution:** Wait 30 seconds and try again. If the problem persists, check
that the database container is running with the `ps` command above.

### Resetting everything

If you need a fresh start, this command removes all containers and data:

```bash
docker compose -f infra/docker-compose.yml down -v
```

The `-v` flag removes the database volume, erasing all data.

Then run the first-time setup steps again.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start system | `docker compose -f infra/docker-compose.yml up -d` |
| Stop system | `docker compose -f infra/docker-compose.yml down` |
| View web logs | `docker compose -f infra/docker-compose.yml logs -f web` |
| View db logs | `docker compose -f infra/docker-compose.yml logs -f db` |
| Check status | `docker compose -f infra/docker-compose.yml ps` |
| Reset database | `docker compose -f infra/docker-compose.yml down -v` |
| Run migrations | `docker compose -f infra/docker-compose.yml exec web npx prisma migrate dev` |
