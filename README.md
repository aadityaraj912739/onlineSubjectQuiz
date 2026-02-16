# McqQuiz - Online MCQ Exam Portal

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for conducting MCQ exams with separate dashboards for teachers and students.

## 🚀 Live Demo

**[View Live Application](https://college-project-roan.vercel.app/login)** - Deployed on Vercel

## Features

### Teacher Dashboard
- Create and manage exams with multiple-choice questions
- Generate unique exam keys for student access
- View student results and rankings
- Subject-wise exam organization
- Recent exam management
- Profile management with social links

### Student Dashboard
- Take exams using unique exam keys
- View exam results immediately after submission
- Detailed results with correct/incorrect answers
- Exam history tracking
- Profile management

### General Features
- User authentication (JWT-based) for students and teachers
- Role-based access control
- Dark mode toggle (LeetCode-inspired design)
- Responsive design with Tailwind CSS
- Real-time exam timer
- Secure exam key generation

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, React Context API, React Router DOM
- **Backend:** Node.js, Express.js, MongoDB (with Mongoose)
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **UI Features:** React Hot Toast, React Icons

## Project Structure

```
collegeProject/
├── mcq-quiz/
│   ├── backend/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Exam.js
│   │   │   └── Result.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── exams.js
│   │   │   └── results.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── config/
│   │   └── server.js
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── context/
│       │   │   ├── AuthContext.js
│       │   │   └── ThemeContext.js
│       │   └── utils/
│       └── public/
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aadityaraj912739/onlineSubjectQuiz.git
   cd onlineSubjectQuiz
   ```

2. **Install dependencies for the root, backend, and frontend:**
   ```bash
   npm run install-deps
   ```

3. **Create a `.env` file in the `mcq-quiz/backend` directory:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5001
   ```

4. **Run the application:**
   
   **Option 1: Using npm scripts (from root directory):**
   ```bash
   npm run dev
   ```
   
   **Option 2: Using PowerShell scripts (Windows):**
   ```powershell
   .\mcq-quiz\start-dev.ps1
   ```
   
   **Option 3: Manually:**
   
   Terminal 1 (Backend):
   ```bash
   cd mcq-quiz/backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd mcq-quiz/frontend
   npm start
   ```

5. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5001`

## Usage

### For Teachers:
1. Register as a teacher with your department information
2. Login to access the teacher dashboard
3. Create exams with MCQ questions
4. Share the generated exam key with students
5. View student results and rankings

### For Students:
1. Register as a student with your enrollment number
2. Login to access the student dashboard
3. Enter the exam key provided by your teacher
4. Take the exam within the time limit
5. View your results and detailed answers

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Exams
- `POST /api/exams` - Create exam (Teacher only)
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam by ID
- `GET /api/exams/key/:examKey` - Get exam by key
- `DELETE /api/exams/:id` - Delete exam (Teacher only)

### Results
- `POST /api/results` - Submit exam result
- `GET /api/results` - Get user's results
- `GET /api/results/:id` - Get detailed result

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Aaditya Raj
- GitHub: [@aadityaraj912739](https://github.com/aadityaraj912739)
