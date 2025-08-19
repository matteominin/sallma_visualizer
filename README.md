# SALLMA UI - Docker Setup

This project has been dockerized for easy deployment with Docker Compose.

## Quick Start

1. Make sure you have Docker and Docker Compose installed
2. Run the application:

```bash
docker-compose up
```

This will:
- Build and start the React frontend + Express backend
- Start a MongoDB database with sample data
- Make the application available at http://localhost:4000

## Services

- **sallma-ui**: React frontend + Express backend (Port 4000)
- **mongodb**: MongoDB database (Port 27017)

## Default MongoDB Connection

When the containers start, you can connect to the MongoDB using:
- **MongoDB URI**: `mongodb://admin:password@localhost:27017`
- **Database Name**: `sallma`
- **Username**: `admin`
- **Password**: `password`

## Development

To run in development mode (without Docker):

```bash
# Terminal 1 - Backend
cd server
npm install
node index.js

# Terminal 2 - Frontend  
npm install
npm run dev
```

## Stopping the Application

```bash
docker-compose down
```

To also remove the database data:

```bash
docker-compose down -v
```
