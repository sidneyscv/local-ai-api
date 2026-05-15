# LOCAL-AI-API

## Overview

LOCAL-AI-API is a modular platform focused on:

- AI agents
- Workspace management
- Local and cloud AI integration
- API orchestration
- Automation pipelines
- Developer productivity

The project is designed to support:

- OpenAI
- Ollama
- OpenRouter
- Local LLMs
- Multi-provider AI systems

---

# Architecture

\\\
apps/
 ├── api/
 ├── web/
 └── desktop/

packages/
 ├── shared/
 ├── ai-core/
 ├── ui/
 └── database/

configs/
 ├── eslint/
 ├── typescript/
 └── docker/

scripts/
 ├── setup.ps1
 ├── dev.ps1
 └── build.ps1

docs/
 ├── architecture.md
 ├── roadmap.md
 └── api.md
\\\

---

# Features

- Modular monorepo
- AI provider abstraction
- Workspace manager
- Agent orchestration
- REST APIs
- Plugin-ready architecture
- Desktop integration
- Web frontend
- Docker-ready environment

---

# Technology Stack

## Backend
- Node.js
- TypeScript
- Express/Fastify

## Frontend
- React
- Vite
- TailwindCSS

## AI
- OpenAI
- Ollama
- OpenRouter

## Database
- MySQL
- PostgreSQL
- SQLite

## DevOps
- Docker
- GitHub Actions

---

# Setup

## Clone repository

\\\ash
git clone https://github.com/sidneyscv/local-ai-api.git
\\\

## Install dependencies

\\\powershell
./scripts/setup.ps1
\\\

## Start development

\\\powershell
./scripts/dev.ps1
\\\

---

# Environment Variables

Copy:

\\\
.env.example
\\\

to:

\\\
.env
\\\

and configure your API keys.

---

# Vision

The project aims to become a complete AI workspace platform capable of:

- creating projects automatically
- orchestrating AI agents
- managing code workspaces
- generating APIs
- automating developer workflows
- integrating local and cloud AI models

---

# License

MIT License
