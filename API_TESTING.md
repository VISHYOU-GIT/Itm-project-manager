# ITM Project Manager API Testing Guide

This document provides curl commands to test all the APIs.

## 1. Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

## 2. Authentication APIs

### Register Student
```bash
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "rollNo": "MCA2023001",
    "password": "password123",
    "username": "John Doe",
    "department": "Computer Applications",
    "class": "MCA 2nd Year"
  }'
```

### Login Student
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "rollNo": "MCA2023001",
    "password": "password123"
  }'
```

### Register Teacher
```bash
curl -X POST http://localhost:5000/api/auth/teacher/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Dr. Smith",
    "email": "smith@itm.edu",
    "password": "teacher123"
  }'
```

### Login Teacher
```bash
curl -X POST http://localhost:5000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smith@itm.edu",
    "password": "teacher123"
  }'
```

### Login Admin
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "admin",
    "password": "admin123"
  }'
```

## 3. Student APIs (Requires Bearer Token)

### Get Student Profile
```bash
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Request Incharge
```bash
curl -X POST http://localhost:5000/api/student/request/incharge \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "TEACHER_ID_HERE"
  }'
```

### Update Project
```bash
curl -X PUT http://localhost:5000/api/student/project/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome Project",
    "description": "Today I worked on the frontend components",
    "report": "Completed the authentication module"
  }'
```

### Get Progress
```bash
curl -X GET http://localhost:5000/api/student/project/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Daily Updates
```bash
curl -X GET http://localhost:5000/api/student/daily-updates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Available Teachers
```bash
curl -X GET http://localhost:5000/api/student/teachers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. Teacher APIs (Requires Bearer Token)

### Get Teacher Profile
```bash
curl -X GET http://localhost:5000/api/teacher/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Latest Updates
```bash
curl -X GET "http://localhost:5000/api/teacher/updates/latest?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Projects
```bash
curl -X GET http://localhost:5000/api/teacher/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Project Details
```bash
curl -X GET http://localhost:5000/api/teacher/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Comment on Update
```bash
curl -X PUT http://localhost:5000/api/teacher/project/PROJECT_ID/update/UPDATE_ID/comment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Good progress! Keep it up."
  }'
```

### Update Targets
```bash
curl -X PUT http://localhost:5000/api/teacher/project/PROJECT_ID/targets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [
      {
        "title": "Complete Frontend",
        "description": "Build all UI components",
        "completed": false
      },
      {
        "title": "Setup Backend",
        "description": "Create API endpoints",
        "completed": true
      }
    ]
  }'
```

### Get Requests
```bash
curl -X GET http://localhost:5000/api/teacher/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Accept Request
```bash
curl -X POST http://localhost:5000/api/teacher/request/REQUEST_ID/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Reject Request
```bash
curl -X POST http://localhost:5000/api/teacher/request/REQUEST_ID/reject \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 5. Admin APIs (Requires Bearer Token)

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Projects
```bash
curl -X GET "http://localhost:5000/api/admin/projects?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Project
```bash
curl -X POST http://localhost:5000/api/admin/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Research Project",
    "teacherId": "TEACHER_ID_HERE",
    "studentIds": ["STUDENT_ID_1", "STUDENT_ID_2"]
  }'
```

### Assign Incharge
```bash
curl -X PUT http://localhost:5000/api/admin/project/PROJECT_ID/assign-incharge \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "NEW_TEACHER_ID"
  }'
```

### Get All Teachers
```bash
curl -X GET "http://localhost:5000/api/admin/teachers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Students
```bash
curl -X GET "http://localhost:5000/api/admin/students?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Flow

1. **Health Check**: Test if server is running
2. **Register Users**: Create student, teacher, and test admin login
3. **Login**: Get JWT tokens for each user type
4. **Student Flow**: Request incharge → Get accepted → Update project → Check progress
5. **Teacher Flow**: Accept student request → Review updates → Add comments → Set targets
6. **Admin Flow**: Monitor all projects → Assign incharges → Manage users

## PowerShell Equivalents

For PowerShell, replace `curl` with:
```powershell
Invoke-RestMethod -Uri "URL" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer TOKEN"}
```

## Notes

- Replace `YOUR_JWT_TOKEN`, `PROJECT_ID`, `TEACHER_ID`, etc. with actual values
- JWT tokens expire after 7 days
- All endpoints return JSON responses
- Error responses include `error` field with description
