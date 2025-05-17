# Medication Tracker API Documentation

This document provides information about the API endpoints available in the Medication Tracker backend.

## Base URL

All endpoints are prefixed with: `/api`

For local development: `http://localhost:5000/api`

## Authentication

All protected routes require a JWT token sent in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register a New User

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe" // Optional
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```
- **Error Response**: `400 Bad Request` if user already exists or validation fails

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```
- **Error Response**: `400 Bad Request` if credentials are invalid

#### Get Current User

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "streak": 5,
      "lastStreakUpdate": "2023-05-17T00:00:00.000Z"
    }
  }
  ```
- **Error Response**: `401 Unauthorized` if token is invalid or missing

## Medications

### Medication Endpoints

#### Get All Medications

- **URL**: `/medications`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "medications": [
      {
        "id": 1,
        "name": "Aspirin",
        "dose": "100mg",
        "frequency": 2,
        "times": ["08:00", "20:00"],
        "startDate": "2023-05-01",
        "endDate": "2023-06-01",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Pain Relief"
        }
      }
    ]
  }
  ```

#### Get Medication by ID

- **URL**: `/medications/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` medication ID
- **Success Response**: `200 OK`
  ```json
  {
    "medication": {
      "id": 1,
      "name": "Aspirin",
      "dose": "100mg",
      "frequency": 2,
      "times": ["08:00", "20:00"],
      "startDate": "2023-05-01",
      "endDate": "2023-06-01",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Pain Relief"
      }
    }
  }
  ```
- **Error Response**: `404 Not Found` if medication doesn't exist

#### Create Medication

- **URL**: `/medications`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Aspirin",
    "dose": "100mg",
    "frequency": 2,
    "times": ["08:00", "20:00"],
    "startDate": "2023-05-01",
    "endDate": "2023-06-01",
    "categoryId": 1
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Medication created successfully",
    "medication": {
      "id": 1,
      "name": "Aspirin",
      "dose": "100mg",
      "frequency": 2,
      "times": ["08:00", "20:00"],
      "startDate": "2023-05-01",
      "endDate": "2023-06-01",
      "categoryId": 1
    }
  }
  ```
- **Error Response**: `400 Bad Request` if validation fails

#### Update Medication

- **URL**: `/medications/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` medication ID
- **Request Body**: Same as create medication
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Medication updated successfully",
    "medication": {
      "id": 1,
      "name": "Aspirin",
      "dose": "100mg",
      "frequency": 2,
      "times": ["08:00", "20:00"],
      "startDate": "2023-05-01",
      "endDate": "2023-06-01",
      "categoryId": 1
    }
  }
  ```
- **Error Response**: `404 Not Found` if medication doesn't exist

#### Delete Medication

- **URL**: `/medications/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` medication ID
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Medication deleted successfully"
  }
  ```
- **Error Response**: `404 Not Found` if medication doesn't exist

## Dose Logs

### Dose Log Endpoints

#### Get All Dose Logs

- **URL**: `/dose-logs`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**: 
  - `startDate=[YYYY-MM-DD]` (optional)
  - `endDate=[YYYY-MM-DD]` (optional)
- **Success Response**: `200 OK`
  ```json
  {
    "doseLogs": [
      {
        "id": 1,
        "medicationId": 1,
        "medication": {
          "id": 1,
          "name": "Aspirin",
          "dose": "100mg"
        },
        "scheduledTime": "08:00",
        "status": "taken",
        "date": "2023-05-10"
      }
    ]
  }
  ```

#### Get Today's Schedule

- **URL**: `/dose-logs/schedule`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "schedule": [
      {
        "medicationId": 1,
        "medication": {
          "id": 1,
          "name": "Aspirin",
          "dose": "100mg",
          "category": {
            "id": 1,
            "name": "Pain Relief"
          }
        },
        "scheduledTime": "08:00",
        "status": "pending"
      }
    ]
  }
  ```

#### Log a Dose

- **URL**: `/dose-logs`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "medicationId": 1,
    "scheduledTime": "08:00",
    "status": "taken" // "taken", "missed", or "skipped"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Dose logged successfully",
    "doseLog": {
      "id": 1,
      "medicationId": 1,
      "scheduledTime": "08:00",
      "status": "taken",
      "date": "2023-05-10"
    }
  }
  ```
- **Error Response**: `400 Bad Request` if validation fails

#### Get Adherence Statistics

- **URL**: `/dose-logs/stats`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**: 
  - `startDate=[YYYY-MM-DD]` (optional)
  - `endDate=[YYYY-MM-DD]` (optional)
- **Success Response**: `200 OK`
  ```json
  {
    "overall": 0.85,
    "byMedication": [
      {
        "medicationId": 1,
        "medicationName": "Aspirin",
        "adherenceRate": 0.9,
        "missed": 1,
        "taken": 9,
        "total": 10
      }
    ],
    "byDay": [
      {
        "date": "2023-05-10",
        "adherenceRate": 1.0,
        "missed": 0,
        "taken": 2,
        "total": 2
      }
    ]
  }
  ```

#### Generate PDF Report

- **URL**: `/dose-logs/export/pdf`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**: 
  - `startDate=[YYYY-MM-DD]` (optional)
  - `endDate=[YYYY-MM-DD]` (optional)
- **Success Response**: `200 OK` with PDF file as response

#### Generate CSV Export

- **URL**: `/dose-logs/export/csv`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**: 
  - `startDate=[YYYY-MM-DD]` (optional)
  - `endDate=[YYYY-MM-DD]` (optional)
- **Success Response**: `200 OK` with CSV file as response

## Categories

### Category Endpoints

#### Get All Categories

- **URL**: `/categories`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "categories": [
      {
        "id": 1,
        "name": "Pain Relief"
      }
    ]
  }
  ```

#### Get Category by ID

- **URL**: `/categories/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` category ID
- **Success Response**: `200 OK`
  ```json
  {
    "category": {
      "id": 1,
      "name": "Pain Relief"
    }
  }
  ```
- **Error Response**: `404 Not Found` if category doesn't exist

#### Create Category

- **URL**: `/categories`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Pain Relief"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Category created successfully",
    "category": {
      "id": 1,
      "name": "Pain Relief"
    }
  }
  ```
- **Error Response**: `400 Bad Request` if validation fails

#### Update Category

- **URL**: `/categories/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` category ID
- **Request Body**:
  ```json
  {
    "name": "Pain Management"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Category updated successfully",
    "category": {
      "id": 1,
      "name": "Pain Management"
    }
  }
  ```
- **Error Response**: `404 Not Found` if category doesn't exist

#### Delete Category

- **URL**: `/categories/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**: `id=[integer]` category ID
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Category deleted successfully"
  }
  ```
- **Error Response**: `404 Not Found` if category doesn't exist

## Google Calendar Integration

### Google Calendar Endpoints

#### Get Google Auth URL

- **URL**: `/google/auth-url`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "url": "https://accounts.google.com/o/oauth2/auth?..."
  }
  ```

#### Sync Calendar

- **URL**: `/google/sync-calendar`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Calendar synced successfully"
  }
  ```
- **Error Response**: `400 Bad Request` if Google account not connected

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have permission to access the resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. The token is returned upon successful registration or login and should be included in the Authorization header of all subsequent requests to protected endpoints.

```
Authorization: Bearer <your_jwt_token>
```

The token expires after 7 days, after which the user needs to log in again. 