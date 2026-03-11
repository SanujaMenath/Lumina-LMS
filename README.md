# Lumina LMS: AI-Powered Lecture Planning & Assessment System

### 🎯 Project Overview

Lumina LMS is a next-generation, AI-integrated Learning Management System designed to bridge the "Efficiency Gap" in higher education. By leveraging Edge AI (locally hosted models), the platform automates complex academic workflows such as lecture planning and assessment generation while ensuring 100% data sovereignty and zero-cost inference.


## 🧠 Core AI & Real-Time Features

## Lecturer Portal (AI Orchestration)
- **LangGraph Lecture Planner**: Generates structured module plans based on title, audience, and duration.  
- **Generator-Critic MCQ Engine**: Multi-stage AI pipeline that drafts and verifies assessments against uploaded materials.  
- **Syllabus Monitoring**: Real-time tracking of teaching progress and content coverage.  

## Student Portal (Personalized Learning)
- **Self-Study RAG Mode**: Students upload materials to trigger a Retrieval-Augmented Generation (RAG) pipeline for custom practice quizzes with hints and rationales.  
- **AI Score Predictor**: Deep-learning module forecasting exam performance ($R^2=0.84$) based on study habits, sleep, and stress levels.  
- **Live Notifications**: Real-time WebSocket alerts for new assessments and grading updates.  

## Admin Panel (Institutional Oversight)
- **Predictive Dashboards**: Identifies at-risk students using ML-driven performance analytics.  
- **Audit Logging**: Detailed system logs for all AI and administrative actions.  

# 🏗️ Advanced Tech Stack

- **Frontend**: React.js (TypeScript) + Tailwind CSS + Lucide React  
- **Core Backend**: Python (FastAPI) + WebSockets for real-time events  
- **AI Orchestration**: LangGraph + Ollama (Local Llama/Gemma models)  
- **Vector Engine**: ChromaDB with Nomic-Embed-Text for RAG  
- **Database**: MongoDB (Synchronous PyMongo)

  ### ⚙️ Project Structure

``` bash
  Lumina-LMS/
│
├── backend/                        # FastAPI backend (port 8000)
│   ├── app/
│   │   ├── database/
│   │   ├── dependencies/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── main.py
│   ├── uploads/
│   ├── venv/
│   ├── .env
│   └── requirements.txt
│
├── ml_model/
│   ├── dataset/
│   ├── notebooks/
│   └── trained_models/
│
├── frontend/                       # React + Vite app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
|   │   │   │   ├── components/
|   │   │   │   ├── services/
|   │   │   │   └── AdminDashboard.tsx
│   │   │   ├── lecturer/
|   │   │   │   ├── components/
|   │   │   │   ├── services/
|   │   │   │   └── LecturerDashboard.tsx
│   │   │   ├── student/
|   │   │   │   ├── components/
|   │   │   │   ├── services/
|   │   │   │   └── StudentDashboard.tsx
│   │   │   └── Login.tsx
│   │   ├── types/
│   │   ├── components/
│   │   ├── context/
│   │   ├── routes/
│   │   ├── layouts/
│   │   └── services/
│   └── package.json
│
├── orchestrator_server/            # AI Microservice (port 8001)
│   ├── rag/                        # ChromaDB & Embedding logic
│   ├── graphs/                     # LangGraph Node Definitions
│   ├── services/
│   └── main.py
│
├── .gitignore
└── README.md

```

