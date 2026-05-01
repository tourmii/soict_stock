# SoictStock

A realistic, full-stack stock market trading simulation platform built with React, Vite, Express, and WebSockets.

## Running the Application Locally (Port 80)

The easiest way to run the entire stack (both frontend and backend) on your local machine is by using **Docker Compose**. This will automatically build the images and run the frontend on port 80.

### Prerequisites
- Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tourmii/soict_stock.git
   cd soict_stock
   ```

2. **Start the application with Docker:**
   ```bash
   docker compose up -d --build
   ```

3. **Access the application:**
   Open your web browser and navigate to:
   👉 **http://localhost** (or http://localhost:80)

### Stopping the Application
To stop the running containers, execute:
```bash
docker compose down
```

### Manual Setup (Without Docker)
If you prefer to run the services manually without Docker:

**1. Start the Backend:**
```bash
cd backend
npm install
npm start
```

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Note: This will usually start the frontend on port 5173 or 5174 depending on Vite's availability, not port 80.*
