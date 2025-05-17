# Medication Tracker Frontend

A Next.js application for tracking medication adherence.

## Features

### User Authentication
- Registration and login
- Secure JWT-based authentication
- Protected routes

### Dashboard
- Today's medication schedule
- Quick dose logging
- User streak tracking

### Medications Management
- Add, edit, and delete medications
- Configure dosage and schedule
- Organize medications by categories

### Schedule View
- Weekly calendar view
- Mark doses as taken or skipped
- Navigate between weeks

### Adherence Statistics
- Overall adherence percentage
- Calendar heatmap visualization
- Weekly adherence charts
- Medication-specific adherence rates

### Reports
- Generate PDF reports
- Export data as CSV
- Customizable date ranges

## Tech Stack

- **Frontend Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **API Communication**: Axios
- **Authentication**: JWT (stored in cookies)
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Project Structure

```
frontend/
├── app/                   # Next.js App Router
│   ├── dashboard/         # Dashboard and protected pages
│   │   ├── medications/   # Medication management
│   │   ├── schedule/      # Weekly schedule view
│   │   ├── stats/         # Adherence statistics
│   │   ├── reports/       # Reports generation
│   │   └── layout.tsx     # Dashboard layout with sidebar
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── providers/         # React context providers
│   ├── services/          # API services
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/                # Static assets
└── package.json           # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Pages

### Public Pages

- **Home** (`/`): Landing page
- **Login** (`/login`): User login form
- **Register** (`/register`): User registration form

### Protected Pages

- **Dashboard** (`/dashboard`): Today's schedule with dose logging
- **Medications** (`/dashboard/medications`): Medication management
- **Schedule** (`/dashboard/schedule`): Weekly schedule view
- **Adherence Stats** (`/dashboard/stats`): Adherence statistics and visualizations
- **Reports** (`/dashboard/reports`): Generate reports and export data

## Authentication Flow

1. User registers or logs in
2. JWT token is stored in cookies
3. Token is sent with each API request
4. Protected routes check for valid authentication
5. Unauthorized access redirects to login page

## API Integration

The frontend communicates with the backend API using Axios. API service functions are organized by resource type:

- `authApi`: Authentication-related endpoints
- `medicationApi`: Medication management endpoints
- `doseLogApi`: Dose logging and schedule endpoints
- `categoryApi`: Category management endpoints
- `googleApi`: Google Calendar integration endpoints

See the backend README for detailed API documentation. 