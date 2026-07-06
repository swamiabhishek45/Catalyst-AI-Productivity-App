# 🌌 Catalyst Cozy Workspace

An AI-powered productivity workspace designed for thinking, planning, and shipping. Catalyst seamlessly blends document editing (like Notion) with spatial canvas layouts (like Miro) and real-time planning tools (Kanban, Calendars). Guided by a cozy, developer-friendly AI assistant called **Antigravity**, users can orchestrate their entire workflow via natural language.

---

## 🎨 Visual Philosophy & Brand Mood
Catalyst is built around a "Cozy UI" design aesthetic—clean and fresh, yet warm enough to encourage deep work and creative momentum.
- **Background**: Warm off-white (`hsl(42, 54%, 97%)`) to reduce eye strain.
- **Surfaces**: Clean white cards and floating panels.
- **Typography**: Sleek, modern sans-serif typography (`Inter`).
- **Visual Scannability**: High-quality, colorful `lucide-react` icons that make navigation instinctive without cluttering the screen.

---

## 🚀 Key Features

### 1. 🤖 AI Assistant (Antigravity)
Powered by **Google Gemini 1.5 Flash**, Antigravity acts as the central command center for the workspace.
- **Multi-Modal Input**: Text or voice queries (using **AssemblyAI** real-time speech-to-text integration).
- **Interactive Action Proposals**: Rather than just chat, the AI generates action payloads (e.g., schedule calendar, create boards, build notes, generate template apps) which are presented as interactive proposal cards. The user reviews and clicks "Confirm" to execute them in real time.

### 2. 📋 Real-Time Collaborative Kanban Board
A multiplayer Kanban tool powered by **Liveblocks**.
- **Multiplayer Presence**: Real-time avatar stacks showing active collaborators.
- **Live Collaboration**: Live updates for task dragging-and-dropping, column creation, card updates, and inline commenting/threads.
- **Note & Calendar Syncing**: Quick actions to link tasks directly to document notes or calendar events.

### 3. 📝 Cozy Document Editor (Notes)
A clean, minimal distraction-free writing environment built on top of **Tiptap**.
- Supports formatting, checklists, pinned items, and trash folders.
- **AI-driven refinement**: Summarize, expand, or fix grammar with inline commands.

### 4. 🗺️ Spatial Whiteboard (Excalidraw + AI Diagrams)
An infinite-canvas workspace utilizing **Excalidraw**.
- Generate structural diagrams (flowcharts, mindmaps, architecture layouts, user journeys, processes) using natural language instructions processed through the Gemini API.

### 5. 🛠️ Dynamic AI Template Builder
Generate custom single-page mini-applications tailored to your workflow (e.g., Budget Companions, Meal Planners, Habit Trackers).
- Gemini designs a functional schema of stat cards, checklists, lists, custom forms, table widgets, and bar/line charts.
- Instantly deployed to the user's sidebar under "My Apps".

### 6. 📅 Integrated Calendar
A month/week calendar view that tracks reminders, tasks, and deadlines categorized by Work, Home, Focus, Wellness, or Finance.

---

## 🏗️ System Architecture & Data Flow

Here is how the main components of Catalyst communicate:

```mermaid
graph TD
    Client[Next.js Client App] <-->|HTTP API Routes| API["API Endpoints /api/*"]
    Client <-->|Live WebSocket| Liveblocks[Liveblocks Multiplayer Server]
    Client <-->|Audio Stream| AssemblyAI[AssemblyAI Live STT API]
    API <-->|Drizzle ORM| DB[("Neon Serverless Postgres")]
    API <-->|HTTP POST| Gemini[Gemini 1.5 Flash API]
    Client <-->|Auth Tokens| Clerk[Clerk Authentication]
```

### ⚡ AI Assistant Action Proposal Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as App Shell / Assistant Page
    participant API as /api/ai/chat
    participant LLM as Gemini 1.5 Flash
    participant DB as Drizzle Database / LocalStorage

    User->>Frontend: Enter prompt (e.g. "Schedule a meeting tomorrow at 10 AM")
    Frontend->>API: POST /api/ai/chat { messages, currentTime }
    API->>DB: Query User Boards & Notes Context
    DB-->>API: Return Context Data
    API->>LLM: Send Context + System Prompt + User Query
    LLM-->>API: Return Raw JSON { message, action: { type, payload } }
    API-->>Frontend: Return Action Proposal
    Frontend->>User: Display Action Proposal Card (Confirm/Cancel)
    alt User Confirms Action
        User->>Frontend: Click "Confirm"
        Frontend->>DB: Dispatch mutation (API Route request or LocalStorage update)
        DB-->>Frontend: Mutation Success
        Frontend->>User: Show Toast Notification & Update View
    else User Cancels Action
        User->>Frontend: Click "Cancel"
        Frontend->>User: Dismiss Card & Show Toast
    end
```

---

## 🗄️ Database Schema & Data Model

We use **Drizzle ORM** targeting a **Neon Serverless PostgreSQL** database. The relational model is detailed below:

```mermaid
erDiagram
    users {
        serial id PK
        text clerk_user_id UK
        text name
        text email UK
        text image_url
        timestamp created_at
        timestamp updated_at
    }

    posts {
        serial id PK
        text title
        text content
        integer author_id FK
        timestamp created_at
    }

    boards {
        text id PK
        text name
        text color
        text owner_id FK
        timestamp created_at
    }

    board_shares {
        serial id PK
        text board_id FK
        text user_email
        timestamp created_at
    }

    notes {
        text id PK
        text title
        text content
        text user_id FK
        text icon
        text color
        boolean is_pinned
        boolean is_trash
        timestamp created_at
        timestamp updated_at
    }

    ai_templates {
        text id PK
        text user_id FK
        text app_name
        text description
        text icon
        text color
        text layout
        text config
        boolean in_sidebar
        timestamp created_at
        timestamp updated_at
    }

    user_settings {
        serial id PK
        text user_id FK
        text theme
        boolean notifications_enabled
        text default_calendar_view
        text default_task_priority
        boolean auto_save_enabled
        text ai_model
        text ai_behavior
        text ai_tone
        text ai_features
        text subscription_plan
        text subscription_status
        timestamp subscription_renewal
        timestamp created_at
        timestamp updated_at
    }

    categories {
        text id PK
        text user_id FK
        text name
        text type
        text color
        text icon
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ posts : "writes"
    users ||--o{ boards : "owns"
    boards ||--o{ board_shares : "shared_with"
    users ||--o{ notes : "creates"
    users ||--o{ ai_templates : "generates"
    users ||--|| user_settings : "configures"
    users ||--o{ categories : "defines"
```

---

## 🛠️ Configuration & Setup

### Environment Variables
To get Catalyst running locally, duplicate `.env.example` to `.env` and fill in the necessary API keys:

```bash
cp .env.example .env
```

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostgreSQL Connection String (Neon, Supabase, or Local Postgres)
DATABASE_URL=postgresql://user:password@hostname/dbname?sslmode=require

# Clerk Authentication (Get keys at clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Liveblocks Collaboration (Get keys at liveblocks.io)
LIVEBLOCKS_SECRET_KEY=sk_test_...
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_test_...

# AssemblyAI Speech-to-Text Key (Get keys at assemblyai.com)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Gemini API Key for AI features (Get keys at aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Generation & Migrations**:
   Run Drizzle Kit commands to push the schema to your database.
   ```bash
   # Generate schema snapshot
   npm run db:generate
   
   # Push schema migrations to Neon DB
   npm run db:push
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Launch Drizzle Studio (Optional)**:
   View and edit your DB schema visually:
   ```bash
   npm run db:studio
   ```

---

## 🐳 Docker Deployment
You can also run Catalyst in a containerized environment using Docker.

```bash
# Build Docker image
docker build -t catalyst-app .

# Run Docker container
docker run -p 3000:3000 --env-file .env catalyst-app
```

---

## 📂 Project Structure

```
catalyst/
├── app/                      # Next.js App Router Pages & API Routes
│   ├── api/                  # Backend REST API Routes
│   │   ├── ai/               # AI routes (chat, diagram, text refinement)
│   │   ├── assemblyai/       # AssemblyAI auth token generation
│   │   ├── boards/           # Kanban boards API
│   │   ├── categories/       # Category Management API
│   │   ├── liveblocks-auth/  # Multiplayer auth gateway
│   │   ├── notes/            # Document Notes API
│   │   └── template-builder/ # Dynamic AI Template API
│   ├── assistant/            # AI Assistant view
│   ├── calendar/             # Calendar workspace view
│   ├── kanban/               # Kanban board view
│   ├── notes/                # Distraction-free notes view
│   ├── settings/             # User configurations
│   ├── spaces/               # Workspace page grids
│   └── whiteboard/           # Spatial Excalidraw canvas
├── components/               # Reusable React UI Components
│   ├── calendar/             # Calendar parts
│   ├── dashboard/            # Layout dashboard shell & sidebar
│   ├── kanban/               # Kanban board and live comments
│   ├── notes/                # Tiptap writing drawer
│   ├── spaces/               # Space dashboards
│   ├── whiteboard/           # Excalidraw integration and AI diagrams
│   └── ui/                   # Core Tailwind/CSS components
├── db/                       # Database schema and client initialization
│   ├── index.ts              # Connection initializer
│   └── schema.ts             # Drizzle tables & relationships definitions
├── hooks/                    # Custom React hooks (e.g. useAssemblyAIStreaming)
└── lib/                      # Common helpers and libraries
```
