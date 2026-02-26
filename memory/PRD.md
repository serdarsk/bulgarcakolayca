# BulgarcaKolayca - Bulgarian-Turkish Language Academy

## Original Problem Statement
Build a modern, conversion-focused educational website for BulgarcaKolayca language academy with structured Bulgarian and Turkish language courses (A1, A2 levels).

## User Personas
1. **Turkish Speakers** - Learning Bulgarian for work, travel, or personal reasons
2. **Bulgarian Speakers** - Learning Turkish for business or cultural connections
3. **Students** - Seeking structured language certification
4. **Professionals** - Need language skills for career advancement

## Core Requirements (Static)
- Hero section with YouTube video embed
- About teacher section with credentials
- Course structure cards (A1, A2) with pricing
- Why Choose Us section with features
- Pricing comparison table
- Level assessment quiz with automatic results
- Contact form with database storage
- Multi-language support (TR/EN/BG)
- Responsive design (mobile-first)
- Brand colors from logo (Green #1B5E3C, Red #C41E3A)

## What's Been Implemented (Jan 2026)
- ✅ Full single-page website with all sections
- ✅ Language switcher (TR/EN/BG) with translations
- ✅ YouTube video embed in hero
- ✅ Course cards with A1/A2 pricing
- ✅ Level test quiz (10 questions each for Bulgarian/Turkish)
- ✅ Quiz scoring with level recommendations
- ✅ Contact form with MongoDB storage
- ✅ Responsive navigation with mobile menu
- ✅ Footer with quick links

## API Endpoints
- GET /api/ - Health check
- POST /api/contact - Submit contact form
- GET /api/contact - Get contact submissions
- GET /api/quiz/questions/{language} - Get quiz questions
- POST /api/quiz/submit - Submit quiz and get results

## Tech Stack
- Frontend: React, TailwindCSS, Shadcn/UI
- Backend: FastAPI
- Database: MongoDB
- Fonts: Playfair Display (headings), Manrope (body)

## Prioritized Backlog

### P0 (Critical - Future)
- Email integration for contact form (Resend/SendGrid)
- WhatsApp integration with real number

### P1 (Important - Next Phase)
- B1/B2 level courses
- Online learning portal
- Student login area
- Payment integration (Stripe)

### P2 (Nice to Have)
- Blog section
- Student testimonials
- Course scheduling calendar
- Progress tracking dashboard

## Next Tasks
1. Add email service integration
2. Add real WhatsApp number
3. Expand to B1/B2 courses
4. Build student portal
