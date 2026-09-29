🌱 Halo — Healthy Screen Time for Kids




A companion-based approach to helping children build healthier digital habits.




Halo is a parent-child screen-time management platform designed to help families understand, manage, and gradually improve children's digital habits.


Rather than treating screen time as something that can simply be blocked or eliminated, Halo focuses on guided engagement, healthy boundaries, positive reinforcement, and parent involvement.


The goal is not to replace parenting or professional support, but to provide families with a practical tool that can be used alongside supervision, education, and consistent healthy habits.



⚠️ Important Disclaimer


Halo is not a treatment or cure for screen addiction, gaming addiction, or any other form of behavioral addiction.


The application is designed as a support and management tool, not as a medical or psychological intervention.


Healthy digital habits generally require more than an application. Halo is intended to work together with:




👨‍👩‍👧 Active parental supervision


📚 Education about healthy technology use


🕐 Consistent screen-time boundaries


🧠 Teaching children self-regulation and responsible digital behavior


💬 Open communication between parents and children


🌱 Offline activities, hobbies, exercise, and social interaction


👩‍⚕️ Professional guidance when significant behavioral or mental-health concerns are present




The platform should therefore be viewed as a companion to good supervision and teaching, rather than a standalone solution.



💡 Why Halo?


Simply restricting a child's screen time does not necessarily teach them why healthy technology use matters or how to manage it independently.


Halo takes a more supportive approach.


Instead of only asking:




"How do we stop a child from using a screen?"




Halo focuses on:




"How can we help a child develop healthier habits around technology?"




The platform combines parental controls, engagement awareness, positive reinforcement, and child-facing experiences to make screen-time management more collaborative.



✨ Key Features


👨‍👩‍👧 Parent Dashboard


Parents can manage and understand their child's digital activity from a dedicated dashboard.


Features include:




Screen-time management


Usage analytics


Parent-controlled rules


Child profiles


Time Bank management


Engagement information


Garden/progress tracking





🧒 Child Experience


Halo provides a child-facing environment designed to make healthy digital habits more engaging.


Children can interact with:




🌱 Progress and journey systems


🪙 Cosmetic rewards


🛍️ Reward/shop experiences


⏳ Time Bank


🏆 Badges


🌳 Garden/progress mechanics




The emphasis is on encouragement and learning, rather than punishment.



⏳ Parent-Controlled Time Bank


The Time Bank provides a structured way for parents to manage additional screen time.


A key design principle is:




Children cannot independently add time to their own Time Bank.




Parents remain responsible for granting additional minutes.



🪙 Reward System


Halo uses rewards to encourage positive engagement.


However, rewards are deliberately designed to remain cosmetic.




Coins do not directly provide additional screen time.




This prevents the reward system from becoming another mechanism for encouraging excessive screen usage.



📊 Engagement Awareness


Halo can provide parents with engagement-related information to help them understand how a child interacts with the platform.


These signals are intended to be:




Informational, not diagnostic.




They should not be interpreted as psychological, medical, or addiction assessments.



🌱 Garden & Progress


The garden/progress system provides a visual representation of positive activity and progress.


The intention is to make healthy digital habits feel more tangible and encouraging for children.



🌐 Browser Widget


Halo includes a lightweight browser widget that can be injected into websites.


The widget communicates with the Halo application through its API layer and allows the platform to provide its screen-time management functionality across supported browsing experiences.


Build the widget with:


npm run build:widget



This generates:


public/halo-widget.js




🏗️ Architecture


Halo is built using a modern web stack:


┌───────────────────────────────┐
│        Parent Interface       │
│ Dashboard • Rules • Analytics │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          Next.js App           │
│ Auth • APIs • Child Experience│
│ Engagement • Rewards • Garden │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Supabase   │  │Browser Widget│
│ Auth + DB    │  │ Web Activity │
└──────────────┘  └──────────────┘



Project Structure


src/
├── app/
│   ├── (auth)/          # Login, registration, onboarding & PIN setup
│   ├── (parent)/        # Parent authentication & dashboard
│   ├── parent/          # Parent management pages
│   ├── child/           # Child-facing experience
│   └── api/
│       └── widget/      # Browser widget APIs
│
├── lib/
│   ├── engagement/      # Engagement detection
│   ├── coins/           # Reward system
│   ├── badges/          # Badge system
│   ├── garden/          # Garden/progress system
│   └── breaks/          # Break management
│
├── store/               # Zustand client-side state
│
└── widget/              # Browser widget source

supabase/
└── migrations/          # Database migrations

public/
└── halo-widget.js       # Compiled browser widget




🛠️ Tech Stack




Technology
Purpose




Next.js 14
Web application framework


React
User interfaces


TypeScript
Application development


Supabase
Database & authentication


Zustand
Client-side state management


Tailwind CSS
Styling


Browser Widget
Screen-time interaction layer





🚀 Getting Started


Prerequisites


Make sure you have:




Node.js 18+


npm


A Supabase account and project





1. Clone the Repository


git clone https://github.com/inimay05/halo-app.git
cd halo-app




2. Configure Environment Variables


Create your local environment file:


cp .env.example .env.local



Add your Supabase credentials:


NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key





Security: The Supabase service-role key must remain server-side and should never be exposed to the browser.





3. Install Dependencies


npm install




4. Set Up the Database


Run the Supabase migrations in order.


supabase db push



Or execute the migration files through the Supabase SQL editor:


supabase/migrations/001_init.sql
supabase/migrations/002_sessions.sql
supabase/migrations/003_rewards.sql
supabase/migrations/004_parent.sql
supabase/migrations/005_anticheat.sql
supabase/migrations/006_last_seen.sql
supabase/migrations/007_garden_delta.sql




5. Run Locally


npm run dev



Then open:


http://localhost:3000




📦 Production Build


Build the application with:


npm run build



Then start it using:


npm start



The production build also handles the browser widget build automatically.



🧩 Design Philosophy


Halo is built around several principles:


1. Management over punishment


The goal is not simply to take technology away.


The platform aims to help families establish structured and healthier patterns of use.


2. Parents remain in control


Important decisions around screen time remain with the parent.


Technology should support parenting — not replace it.


3. Teach, don't just restrict


Children should gradually learn why healthy digital habits matter.


Halo is therefore intended to complement conversations, education, and consistent guidance.


4. Positive reinforcement


Progress and healthy behavior can be encouraged through non-intrusive rewards and visual feedback.


5. No false promises


Halo does not claim to diagnose, prevent, or cure addiction.


It is a digital tool for screen-time management and habit support.



🔐 Product Constraints


Several safeguards are intentionally built into the product:




Coins are cosmetic and do not provide additional screen time.


Time Bank access is parent-controlled.


Children cannot independently add time to their Time Bank.


Engagement scores are informational for parents, not medical or psychological assessments.


Halo is not intended to replace professional care or parental supervision.





🌱 The Bigger Goal


Healthy technology use isn't created by an app alone.


It develops through a combination of:


Technology
     +
Parental Supervision
     +
Education
     +
Communication
     +
Healthy Offline Habits
     +
Consistent Boundaries
     ↓
Healthier Digital Habits



Halo is designed to be one part of that ecosystem.


The long-term goal is to help children move from externally managed screen time toward greater understanding and self-regulation as they grow.



🤝 Contributing


Contributions, ideas, and feedback are welcome.


If you'd like to contribute:




Fork the repository


Create a feature branch


Make your changes


Test your changes locally


Open a pull request




💚 Final Note


Halo is not intended to be a replacement for parents, teachers, counselors, psychologists, or other professionals.


It is a supportive technology layer designed to make screen-time management more structured, understandable, and engaging.


The most important part of healthy technology use remains the human element:


supervision, communication, education, boundaries, and care.


