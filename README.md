# Medication Tracker

A full-stack application for tracking medication adherence, built with Node.js, Express, PostgreSQL, and Next.js.

## Overview

Medication Tracker helps users manage complex medication schedules, log their doses, receive reminders, and track adherence visually. The application allows users to:

- Set up and manage medication regimens
- Track daily medication doses
- View adherence statistics and patterns
- Generate reports for healthcare providers

## Project Structure

This project is organized as a monorepo with separate frontend and backend directories:

```
medication-tracker/
├── backend/           # Express.js API server
│   ├── src/           # Source code
│   ├── .env           # Environment variables
│   └── README.md      # Backend documentation
├── frontend/          # Next.js web application
│   ├── app/           # Next.js App Router
│   ├── .env.local     # Environment variables
│   └── README.md      # Frontend documentation
└── README.md          # Project documentation
```

## Tech Stack

### Backend
- **Node.js** with **Express** for the API server
- **PostgreSQL** database
- **Prisma/Sequelize** ORM
- **JWT** for authentication
- **Express-validator** for request validation

### Frontend
- **Next.js 13** (App Router) with **TypeScript**
- **TailwindCSS** for styling
- **shadcn/ui** components
- **Axios** for API requests
- **date-fns** for date manipulation

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd medication-tracker
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   # Create and configure .env file (see .env.example)
   npm run dev
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   # Create and configure .env.local file
   npm run dev
   ```

The backend server will run on http://localhost:5000, and the frontend will be available at http://localhost:3000.

### Running both servers together in Windows PowerShell
```powershell
cd backend; npm run dev
# Open a new terminal window
cd frontend; npm run dev
```

## Features

- **User Authentication**: Secure login and registration
- **Medication Management**: Add, edit, and delete medications
- **Flexible Scheduling**: Configure complex medication schedules
- **Dose Logging**: Track taken, missed, or skipped doses
- **Adherence Statistics**: Visual representation of adherence patterns
- **Reporting**: Generate PDF reports and CSV exports
- **Streak Tracking**: Motivational streak counter for consistent dose logging

## Documentation

For more detailed documentation:
- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## License

MIT