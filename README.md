🌱 Halo — Healthy Screen Time for Kids

Halo is a parent-child screen-time management platform designed to help children develop healthier digital habits through structured supervision, positive reinforcement, and guided engagement.

It provides parents with tools to understand and manage screen usage while giving children a more engaging way to learn responsible digital habits.

«Important: Halo is not a solution, treatment, or cure for addiction. It is a management and support tool intended to be used alongside active parental supervision, education, healthy boundaries, communication, and appropriate professional guidance when necessary.»

---

🎯 What is Halo?

Managing children's screen time is not simply about blocking access or setting strict limits.

Children also need to understand why healthy digital habits matter and gradually learn how to manage their own technology use.

Halo is designed around this idea.

Instead of focusing solely on restriction, Halo combines:

- 👨‍👩‍👧 Parental supervision
- ⏱️ Structured screen-time management
- 📊 Usage and engagement information
- 🌱 Positive reinforcement
- 🏆 Progress and rewards
- 📚 Guidance and teaching
- 💬 Parent-child involvement

The goal is to help families move toward healthier and more intentional technology use.

---

⚠️ Important Disclaimer

Halo does not diagnose, prevent, treat, or cure addiction.

Screen or technology-related behavioral problems can be complex and may require support beyond any software application.

Halo should therefore be used as a supporting tool, together with:

- Active parental supervision
- Consistent and age-appropriate boundaries
- Education about healthy technology use
- Open communication between parents and children
- Healthy offline activities and routines
- Teaching children self-regulation and responsible digital behavior
- Professional or clinical guidance when significant concerns arise

The application is intended to help parents manage and teach, not to replace them.

«Technology can support healthy habits, but it cannot replace supervision, teaching, or human care.»

---

✨ Key Features

👨‍👩‍👧 Parent Dashboard

Parents have a dedicated interface for managing and understanding their child's digital activity.

The parent experience includes:

- Child profiles
- Screen-time rules
- Analytics
- Engagement information
- Garden and progress tracking
- Time Bank management
- Parent-controlled settings

---

🧒 Child Experience

Halo provides a dedicated child-facing experience designed to make healthy digital habits more engaging.

Children can interact with:

- 🌱 Progress and journey systems
- 🪙 Cosmetic rewards
- 🛍️ Reward shop
- ⏳ Time Bank
- 🏆 Badges
- 🌳 Garden and progress mechanics

The emphasis is on encouragement and learning rather than punishment.

---

⏳ Parent-Controlled Time Bank

The Time Bank allows parents to manage additional screen time in a structured way.

Parents control how additional minutes are granted.

Children cannot independently add time to their own Time Bank.

This keeps the parent in control while still allowing flexibility when appropriate.

---

🪙 Reward System

Halo includes a reward system designed to encourage positive engagement.

Rewards are intentionally separated from screen-time allocation.

Coins are cosmetic and do not provide additional screen time.

This prevents the reward mechanism from becoming another way of encouraging excessive screen usage.

---

📊 Engagement Awareness

Halo provides parents with engagement-related information that can help them understand how their child interacts with the system.

These signals are:

- Informational
- Intended for parental awareness
- Not medical assessments
- Not psychological diagnoses
- Not addiction diagnoses

They should be interpreted as one source of information within the broader context of parenting and observation.

---

🌱 Garden & Progress

The garden and progress system gives children a visual representation of their progress.

This provides a simple way to make positive behavior and healthy routines more tangible and engaging.

---

🌐 Browser Widget

Halo includes a lightweight browser widget designed to operate within the child's browsing environment.

The widget communicates with the Halo application through API routes and provides the screen-time management layer across supported websites.

Build the widget using:

npm run build:widget

The compiled widget is generated at:

public/halo-widget.js

---

🏗️ Architecture

Halo follows a layered web application architecture built around a Next.js application, Supabase backend, and browser widget.

                         ┌───────────────────────┐
                         │      Parent UI        │
                         │                       │
                         │ Dashboard • Rules     │
                         │ Analytics • Profiles  │
                         └───────────┬───────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                   │
│                                                         │
│  Authentication      Parent Experience                  │
│  Child Experience    API Routes                         │
│  Rewards             Engagement                         │
│  Garden              Break Management                   │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌─────────────────┐        ┌────────────────────┐
     │     Supabase    │        │   Browser Widget   │
     │                 │        │                    │
     │ Authentication  │        │ Child Browser      │
     │ Database        │        │ Activity Layer     │
     │ Data Storage    │        │ API Communication  │
     └─────────────────┘        └────────────────────┘

Architecture Components

Next.js Application

Acts as the primary application layer, handling authentication, parent and child interfaces, API routes, and core application logic.

Supabase

Provides authentication and persistent database functionality.

Parent Interface

Allows parents to configure rules, view information, manage profiles, and control screen-time-related functionality.

Child Interface

Provides the child-facing experience including the journey, rewards, garden, and Time Bank.

Browser Widget

A self-contained browser-side component that interacts with the application through the widget API.

Core Engines

Application logic for engagement detection, coins, badges, garden progression, and break management is organized under "src/lib/".

---

📁 Project Structure

The repository is organized as follows:

halo-app/
│
├── public/
│   └── halo-widget.js
│
├── scripts/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── onboarding/
│   │   │   └── pin/
│   │   │
│   │   ├── (parent)/
│   │   │   └── ...
│   │   │
│   │   ├── parent/
│   │   │   ├── analytics/
│   │   │   ├── rules/
│   │   │   ├── garden/
│   │   │   └── profiles/
│   │   │
│   │   ├── child/
│   │   │   ├── home/
│   │   │   ├── shop/
│   │   │   ├── journey/
│   │   │   └── time-bank/
│   │   │
│   │   └── api/
│   │       └── widget/
│   │
│   ├── lib/
│   │   ├── engagement/
│   │   ├── coins/
│   │   ├── badges/
│   │   ├── garden/
│   │   └── breaks/
│   │
│   ├── store/
│   │
│   └── widget/
│
├── supabase/
│   └── migrations/
│       ├── 001_init.sql
│       ├── 002_sessions.sql
│       ├── 003_rewards.sql
│       ├── 004_parent.sql
│       ├── 005_anticheat.sql
│       ├── 006_last_seen.sql
│       └── 007_garden_delta.sql
│
├── .env.example
├── middleware.ts
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md

Directory Overview

Directory| Purpose
"src/app/(auth)"| Authentication, registration, onboarding and PIN setup
"src/app/(parent)"| Parent authentication and protected parent flows
"src/app/parent"| Parent dashboard, analytics, rules, profiles and garden
"src/app/child"| Child-facing experience
"src/app/api/widget"| API routes used by the browser widget
"src/lib"| Core application engines
"src/store"| Client-side state management
"src/widget"| Browser widget source
"public"| Static assets and compiled browser widget
"supabase/migrations"| Database schema and migration files
"scripts"| Project utility and build scripts

---

🛠️ Technology Stack

Technology| Purpose
Next.js 14| Full-stack web application framework
React| User interface
TypeScript| Type-safe application development
Supabase| Authentication and database
Zustand| Client-side state management
Tailwind CSS| Styling and UI development
Browser Widget| Screen-time interaction layer

---

🚀 Getting Started

Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm
- A Supabase account and project

---

1. Clone the Repository

git clone https://github.com/inimay05/halo-app.git
cd halo-app

---

2. Configure Environment Variables

Copy the example environment file:

cp .env.example .env.local

Add your Supabase credentials to ".env.local":

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

«Security: "SUPABASE_SERVICE_ROLE_KEY" must remain server-side and must never be exposed to the browser or committed to the repository.»

---

3. Install Dependencies

npm install

---

4. Set Up the Database

Run the Supabase migrations in order.

Using the Supabase CLI:

supabase db push

Alternatively, the migration files can be executed through the Supabase SQL Editor:

supabase/migrations/001_init.sql
supabase/migrations/002_sessions.sql
supabase/migrations/003_rewards.sql
supabase/migrations/004_parent.sql
supabase/migrations/005_anticheat.sql
supabase/migrations/006_last_seen.sql
supabase/migrations/007_garden_delta.sql

---

5. Start the Development Server

npm run dev

The application will be available at:

http://localhost:3000

---

🌐 Browser Widget

Halo includes a self-contained browser widget that can be injected into a child's browsing environment.

Build it with:

npm run build:widget

The build produces:

public/halo-widget.js

The widget can then be included on a supported website using:

<script
  src="https://your-app.vercel.app/halo-widget.js"
  data-child-id="CHILD_UUID">
</script>

The widget communicates with the application's API layer under:

src/app/api/widget/

---

📦 Production Build

To create a production build:

npm run build

Start the production server with:

npm start

The project's build process also builds the browser widget before running the Next.js production build.

---

🔐 Product Safeguards

Halo intentionally separates management, rewards, and engagement information.

Cosmetic Rewards

Coins are purely cosmetic and cannot be exchanged for additional screen time.

Parent-Controlled Time Bank

Only parents can grant additional Time Bank minutes.

Informational Engagement Data

Engagement information is provided for parental awareness and should not be interpreted as a medical, psychological, or addiction assessment.

Human Supervision

Halo is designed to support parents, not replace them.

---

🧠 Design Philosophy

Halo is built around four core principles.

1. Manage, Don't Simply Restrict

The goal is not merely to block access to technology.

Instead, Halo provides structure around when and how technology is used.

2. Teach Alongside Management

Children need to understand why healthy technology habits matter.

Halo is therefore intended to be used alongside conversations, education, and guidance from parents and caregivers.

3. Encourage Positive Habits

Progress, rewards, and visual feedback can make healthy routines more understandable and engaging for children.

4. Keep Humans in the Loop

Technology should support the parent-child relationship rather than replace it.

Parents remain responsible for interpreting their child's behavior, setting appropriate boundaries, and providing guidance.

---

🌱 The Bigger Picture

Healthy technology use is not something that can be created by an application alone.

It comes from a combination of:

                ┌──────────────────────┐
                │  Parental Supervision│
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │      Education       │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │  Healthy Boundaries  │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │ Communication & Care │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │    Halo as a Tool    │
                └──────────┬───────────┘
                           │
                           ▼
                Healthier Digital Habits

Halo is designed to be one part of this ecosystem.

The long-term objective is to help children gradually move from externally managed screen time toward greater awareness, responsibility, and self-regulation.

---

🤝 Contributing

Contributions and feedback are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Open a pull request.

---

💚 Final Note

Halo is not a cure for addiction.

It is a tool designed to help families manage screen time, encourage healthier habits, and support conversations and teaching around responsible technology use.

The most important components remain outside the application:

supervision, education, communication, healthy boundaries, offline activities, and care.

Halo simply provides a technological layer to help families put those principles into practice.
