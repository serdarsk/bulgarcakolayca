# BulgarcaKolayca - Bulgarian-Turkish Language Academy

## Original Problem Statement
Build a modern, conversion-focused educational website for BulgarcaKolayca language academy with:
- Landing page (Hero, About, Courses A1-B2, Contact)
- Flashcards module
- Adaptive level test (stops after 3 wrong per level)
- **NEW: Student-Teacher LMS Panel** with JWT auth, scheduling, materials, notifications

## User Personas
1. **Turkish Speakers** - Learning Bulgarian for work, travel, or personal reasons
2. **Bulgarian Speakers** - Learning Turkish for business or cultural connections
3. **Students** - Using the LMS panel to track lessons and materials
4. **Teacher (Single)** - Managing students, lessons, and materials

## Core Requirements (Static)
### Landing Page
- Hero section with YouTube video embed
- About teacher section with credentials
- Course structure cards (A1, A2, B1, B2)
- Curriculum details by level
- Flashcards module (Bulgarian/Turkish)
- Adaptive level test with 3-wrong-stop rule
- Contact form
- Multi-language support (TR/EN/BG)
- Brand colors: Green #1B5E3C, Red #C41E3A, White (Bulgarian flag)

### LMS Panel (NEW - Implemented Dec 2025)
- JWT authentication system
- Student registration with teacher approval
- Teacher dashboard with tabs:
  - Overview (stats, pending students, upcoming lessons)
  - Students (list, approve, reject, add manually, delete)
  - Lessons (create with Zoom links, calendar, levels A1-B2)
  - Materials (Drive/Dropbox links, document/video/audio types)
  - Notifications (read/unread, mark all read)
- Student dashboard:
  - View lessons and materials
  - Join Zoom meetings
  - Request lesson reschedule
  - Receive notifications

## What's Been Implemented

### Phase 1 - Landing Page (Complete)
- ✅ Full single-page website with all sections
- ✅ Language switcher (TR/EN/BG) with translations
- ✅ YouTube video embed in hero
- ✅ Course cards (A1, A2, B1, B2) with details
- ✅ Detailed curriculum by level
- ✅ Flashcards (Bulgarian/Turkish, 20 cards each)
- ✅ Adaptive level test (A1-C1, 3-wrong stops test)
- ✅ Contact form with MongoDB storage
- ✅ Responsive design

### Phase 2 - LMS Panel (Complete - Dec 2025)
- ✅ JWT Authentication (login, register, token verification)
- ✅ Teacher account initialization (/api/init-teacher)
- ✅ Student registration with approval workflow
- ✅ Teacher Dashboard (5 tabs)
- ✅ Student Dashboard
- ✅ Lesson management with:
  - Zoom/meeting links
  - Level selection (A1-B2)
  - Individual/group types
  - Date/time scheduling
  - Recurring lessons
- ✅ Material sharing (Drive/Dropbox links)
- ✅ Notification system (in-panel)
- ✅ Reschedule request workflow

## API Endpoints

### Public
- GET /api/ - Health check
- POST /api/contact - Submit contact form
- GET /api/flashcards/{language} - Get flashcards
- POST /api/quiz/submit-adaptive - Submit level test

### Auth
- POST /api/auth/register - Student registration
- POST /api/auth/login - Login (teacher/student)
- GET /api/auth/me - Current user info
- POST /api/init-teacher - Initialize teacher account

### Teacher Only
- GET /api/teacher/students - List all students
- GET /api/teacher/pending-students - Pending approvals
- POST /api/teacher/approve-student - Approve/reject
- POST /api/teacher/add-student - Manual add
- DELETE /api/teacher/student/{id} - Delete student

### Protected (Auth Required)
- GET/POST /api/lessons - List/create lessons
- PUT/DELETE /api/lessons/{id} - Update/delete
- GET/POST /api/materials - List/create materials
- DELETE /api/materials/{id} - Delete material
- GET /api/notifications - User notifications
- PUT /api/notifications/read-all - Mark all read
- POST /api/reschedule-request - Request reschedule
- POST /api/reschedule-requests/{id}/respond - Approve/reject

## Tech Stack
- Frontend: React 18, TailwindCSS, Shadcn/UI, React Router v6
- Backend: FastAPI, Motor (async MongoDB)
- Auth: Custom JWT with sha256 password hashing
- Database: MongoDB

## Prioritized Backlog

### P0 (Complete)
- ✅ LMS Panel implementation

### P1 (Next Phase)
- Email notifications (lesson reminders, approval status)
- WhatsApp integration for real contact
- Online payment integration (Stripe)

### P2 (Future)
- Blog section
- Student testimonials/reviews
- Progress tracking dashboard
- Course completion certificates
- Video lesson playback within panel
