docker compose up
docker compose build

docker compose build frontend
docker compose up -d frontend

RenpyCreatorStudio/
frontend/
│   ├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue        # Navbar with dropdown
│   │   │   └── AppLayout.vue        # Layout wrapper
│   ├── views/
│   │   ├── CharacterCreator.vue     # Create characters
│   │   ├── CharacterListView.vue    # List all characters
│   │   ├── CharacterDetailView.vue  # View/Edit character
│   │   └── HomeView.vue             # Dashboard
│   ├── router/
│   │   └── index.ts                 # Vue Router setup
│   ├── services/
│   │   └── api.ts                 # python FASTapi
│   │ App.vue                      # Updated with layout
│   └── main.ts
│   ├── .env.example             # Frontend env vars
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile              # Frontend Dockerfile
│   └── README.md
│
│
├── docker-compose.yml         # Full stack orchestration
├── docker-compose.dev.yml    # Development compose
├── docker-compose.prod.yml   # Production compose
├── .gitignore
├── README.md                 # Main project README
└── LICENSE


Ren'Py Dialogue & UI Helper Tool - Summary
Core Concept:
A visual editor that bridges the gap between design and Ren'Py code, allowing developers to design dialogue interfaces visually while generating clean, production-ready Ren'Py screen code.

Problem It Solves:
Ren'Py's text-based screen language requires coding knowledge

Visual preview is limited and iterative

Dialogue flow management is code-heavy

UI component positioning is manual trial-and-error

Asset management (images, sounds) isn't visually linked

Key Features Envisioned:
1. Visual Screen Builder
Drag-and-drop UI components (textboxes, buttons, images, bars)

Live preview with Ren'Py theme compatibility

Grid/snap tools for precise positioning

Export to .rpy screen code

2. Dialogue Flow Editor
Node-based dialogue tree (like Twine but Ren'Py native)

Character/voice assignment per line

Branching logic visualization

Expression/pose changes linked to sprites

Jump/label management

3. Character & Asset Manager
Character profile builder (name color, voice tag, etc.)

Sprite pose organizer

Background/scene library

Click-to-insert assets into scenes

4. Interactive Preview
Playtest dialogue within editor

Variable state tracking

Conditional branch simulation

Quick jump between screens

5. Code Generation & Sync
Clean, commented Ren'Py code output

Two-way editing (edit code → updates visual)

Customizable code style templates

Version control friendly output

Technical Architecture:
text
Frontend (Electron/Python+Qt/Web) 
    ↓
Editor Canvas (Visual Design)
    ↓
Internal Representation (JSON/XML)
    ↓
Ren'Py Code Generator
    ↓
.rpy files + assets
Target Users:
Visual novel beginners intimidated by code

Writers wanting focus on narrative

Small teams separating writing/coding

Experienced devs seeking faster prototyping

Competitive Edge:
Native Ren'Py output (unlike generic tools)

Preserves Ren'Py flexibility (not locked into limited features)

Two-way editing (not just one-way export)

Integrated asset pipeline

Major Challenges:
Ren'Py's screen language is Turing-complete (complex logic in UI)

Variable/conditional handling in visual format

Python code blocks within screens

Maintaining compatibility with Ren'Py updates

Minimal Viable Product (MVP):
Basic screen designer (textbox + character sprite positioning)

Simple dialogue tree → Ren'Py script conversion

One-way export (visual → code)

Preview with sample Ren'Py project