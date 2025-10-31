
---

## 📁 `tasks.md` – ITM Project Manager (MERN Stack)

### 🧑‍🎓 Student Module

#### 🔐 Authentication
- [ ] Create Account Page  
  - Fields: Roll No, Password, Department, Class, Username  
  - Validation: Unique Roll No, strong password rules  
- [ ] Login Page  
  - Fields: Roll No, Password  
  - JWT-based login

#### 📂 My Project Page
- [ ] Display assigned Incharge name  
- [ ] Editable Project Name  
- [ ] Current Update Section  
  - [ ] Rich Text Editor for report  
  - [ ] Multiple screenshot upload (drag & drop or file picker)  
  - [ ] Timestamp auto-generated  
  - [ ] Save & Edit functionality

#### 📊 Progress Page
- [ ] List of targets (todo items)  
  - [ ] Tick/Cross icons for completion  
  - [ ] Progress bar (auto-calculated from completed targets)

#### 📅 Daily Updates
- [ ] List of updates (sorted by upload date descending)  
  - [ ] Description  
  - [ ] Edit option  
  - [ ] Incharge comments  
  - [ ] Upload date & Last edited date

#### 🧑‍🏫 Request Incharge
- [ ] Dropdown or search from teacher list  
- [ ] Send request  
- [ ] Status: Pending / Accepted / Rejected  
- [ ] Auto-assign project if accepted

#### 👥 Add Partner
- [ ] Search student by Roll No  
- [ ] Send request  
- [ ] Request list with status  
- [ ] Auto-assign partner to project if accepted

---

### 👨‍🏫 Teacher Module

#### 🔐 Authentication
- [ ] Register Page  
  - Fields: Username, Email, Password  
- [ ] Login Page  
  - Fields: Email, Password  
  - JWT-based login

#### 🆕 Latest Updates Page
- [ ] List of updates from assigned students  
  - [ ] Filter by date/project/student  
  - [ ] Comment on each update

#### 📁 Projects Page
- [ ] List of all assigned projects  
  - [ ] Sorted by last updated  
  - [ ] Search/filter by student name or project name

#### 📄 Project Detail Page
- [ ] Project Name  
- [ ] Update List  
  - [ ] Comment on each update  
- [ ] Editable Target List  
  - [ ] Checkbox for progress tracking  
  - [ ] Add/Edit/Delete targets

#### 🧑‍💼 Profile Page
- [ ] Edit Username, Email, Password

#### 📬 Requests Page
- [ ] List of student requests  
  - [ ] Accept/Reject  
  - [ ] Auto-assign project on acceptance

---

### 🛠️ Admin Module

#### 🔐 Authentication
- [ ] Predefined ID & Password (hardcoded or env-based)

#### 🧑‍🏫 Incharges Page
- [ ] Assign teacher to student project  
  - [ ] Dropdown or search  
  - [ ] Reassign option

#### 📁 Projects Page
- [ ] List of all projects  
  - [ ] Student Name  
  - [ ] Incharge Name  
  - [ ] Edit: Add/Remove teachers  
  - [ ] Update student list

---

### 🧠 Suggested Enhancements

- ✅ **Role-based access control** using middleware
- 📈 **Dashboard analytics** for Admin (project count, active users, etc.)
- 🔔 **Notification system** (email or in-app for requests/updates)
- 🗃️ **MongoDB schema design** with references for students, teachers, and projects
- 🧪 **Unit & integration tests** using Jest or Mocha
- 🌐 **Responsive UI** with React + Bootstrap and Material UI
- 🧾 **Audit log** for Admin to track changes

---

Awesome, Vish! Let’s scaffold your **ITM Project Manager** MERN app with a clean folder structure, MongoDB schema design, and sample API routes for each role. This will give you a solid foundation to build on and extend.

---

## 📁 Folder Structure

```bash
ITM-Project-Manager/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Role-based pages (Student, Teacher, Admin)
│       ├── utils/           # Axios, auth helpers
│       └── App.js
├── server/                  # Node.js + Express backend
│   ├── controllers/         # Logic for each route
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, role checks
│   └── server.js
├── .env
├── package.json
└── README.md
```

---

## 🧬 MongoDB Schema Design

### 1. `Student.js`

```js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, unique: true },
  password: String,
  username: String,
  department: String,
  class: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

module.exports = mongoose.model('Student', studentSchema);
```

### 2. `Teacher.js`

```js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

module.exports = mongoose.model('Teacher', teacherSchema);
```

### 3. `Project.js`

```js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: String,
  incharge: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  updates: [{
    description: String,
    screenshots: [String],
    report: String,
    timestamp: Date,
    lastEdited: Date,
    inchargeComment: String
  }],
  targets: [{
    title: String,
    completed: Boolean
  }]
});

module.exports = mongoose.model('Project', projectSchema);
```

---

## 🚀 Sample API Routes

### 🔐 Auth Routes (`/api/auth`)
- `POST /student/register`
- `POST /student/login`
- `POST /teacher/register`
- `POST /teacher/login`
- `POST /admin/login`

### 👨‍🎓 Student Routes (`/api/student`)
- `GET /me`
- `PUT /project/update`
- `POST /project/request-incharge`
- `POST /project/add-partner`
- `GET /project/progress`
- `POST /project/daily-update`
- `PUT /daily-update/:id/edit`

### 👨‍🏫 Teacher Routes (`/api/teacher`)
- `GET /projects`
- `GET /project/:id`
- `PUT /project/:id/comment`
- `PUT /project/:id/targets`
- `GET /requests`
- `POST /requests/:id/accept`
- `POST /requests/:id/reject`

### 🛠️ Admin Routes (`/api/admin`)
- `GET /projects`
- `PUT /project/:id/assign-incharge`
- `PUT /project/:id/update-students`
- `POST /teacher/add`
- `DELETE /teacher/:id/remove`

---



MONGODB_URI="mongodb+srv://vishwanath2427:vishyou@datavisuals.2aoei.mongodb.net/?retryWrites=true&w=majority&appName=dataVIsuals"
JWT_SECRET="itm_university_marksheet_secret_key_2025"