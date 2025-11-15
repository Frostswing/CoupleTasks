# CoupleTasks Web Interface

A web-based user management interface for the CoupleTasks mobile application.

## Features

- User authentication (Login/Register)
- User profile management
- Real-time profile updates
- Clean, modern UI

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose up --build
```

The web interface will be available at `http://localhost:3000`

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Docker Commands

- **Build and start**: `docker compose up --build`
- **Start in background**: `docker compose up -d`
- **Stop**: `docker compose down`
- **View logs**: `docker compose logs -f`
- **Rebuild**: `docker compose up --build --force-recreate`

## Environment

The web interface uses the same Firebase project as the mobile app:
- Firebase Authentication
- Firebase Realtime Database

## Routes

- `/` - Redirects to login or dashboard
- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - User profile management dashboard

## Technologies

- React 18
- React Router DOM
- Firebase (Auth & Realtime Database)
- Vite (Build tool)
- Docker & Nginx (Production)

