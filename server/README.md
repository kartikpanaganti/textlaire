# Server Documentation

## Folder Structure

- **controller/**: Contains controller logic for handling business operations
- **middleware/**: Contains middleware functions for authentication and file uploads
- **models/**: Contains MongoDB schema definitions
- **public/**: Contains static assets like default images
- **routes/**: Contains API route definitions
- **socket/**: Contains Socket.IO implementation for real-time communication
- **uploads/**: Contains uploaded files like employee images

## API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration

### Employees
- `GET /api/employees`: Get all employees
- `GET /api/employees/:id`: Get employee by ID
- `POST /api/employees`: Create new employee
- `PUT /api/employees/:id`: Update employee
- `DELETE /api/employees/:id`: Delete employee

### Attendance
- `GET /api/attendance`: Get all attendance records
- `GET /api/attendance/:id`: Get attendance record by ID
- `POST /api/attendance`: Create new attendance record
- `PUT /api/attendance/:id`: Update attendance record
- `DELETE /api/attendance/:id`: Delete attendance record

### Raw Materials
- `GET /api/raw-materials`: Get all raw materials
- `GET /api/raw-materials/:id`: Get raw material by ID
- `POST /api/raw-materials`: Create new raw material
- `PUT /api/raw-materials/:id`: Update raw material
- `DELETE /api/raw-materials/:id`: Delete raw material

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
3. Start the server: `npm start` 