# Todo App — Product Overview

This document summarizes the core **product functionality** users experience when
interacting with the Todo App. It is written for product managers, designers,
or stakeholders who need an at‑a‑glance understanding of what the application
does, how it behaves, and the value it provides.

## Purpose

The Todo App is a lightweight, responsive task manager built for individuals and
small teams who need a simple, reliable way to track work across devices.
Emphasis is placed on **offline reliability**, **minimal dependencies**, and a
clean, distraction‑free interface.

## Key Features

### 📝 Task Management
- Create, view, edit, and delete tasks with a single input field and buttons.
- Tasks are represented by text descriptions and each has a unique identifier.
- Inline editing allows changes without leaving the list view.

### 🔁 Workflow States
- Every task carries a state: **Plan**, **To Do**, or **Done**.
- Clicking the state badge cycles through the states in order.
- Visual cues (badges, styling) make it easy to see progress at a glance.

### 📂 Categories
- Tasks can be categorized as **Trabajo**, **Personal**, or **Estudio**.
- Default category is `personal` for new tasks.
- Category changes are made via an inline dropdown selector.

### 🔍 Filtering & Sorting
- Users can filter the task list by state (All, Plan, To Do, Done).
- Category filter allows viewing tasks from a specific context or all.
- Filters can be combined: e.g. show only `Trabajo` items that are `To Do`.

### 🌙 Theme Support
- Light and dark themes are available.
- Toggle button switches the `data-theme` attribute to change styling.
- Theme preference is stored locally to persist across sessions.

### 💾 Persistence & Sync
- **Offline-first design**: all data is stored in browser localStorage by default.
- When a central server is configured, the app automatically syncs data to it.
- Sync operates in the background; users continue working even if the server is
down.
- A periodic retry mechanism ensures eventual consistency when connectivity
returns.

### 🔄 One‑time Migration
- If the server is empty and the client has local tasks, they are migrated
automatically on first server interaction.
- This avoids duplicate effort when enabling multi‑device syncing.

### 🚦 Health & Status
- A passive health check (`/api/health`) is used internally to confirm server
availability.
- Visual indicators (localStorage vs server load messages in console) assist
power users in debugging sync issues.

## User Flow

1. **First Visit**
   - The app attempts to fetch tasks from the server.
   - If the server responds, the list loads; otherwise, localStorage data or an
     empty list is used.
   - Any existing local tasks are migrated if the server is empty.
2. **Adding Tasks**
   - User types text, chooses a category, and submits (button or Enter key).
3. **Editing & Managing**
   - Click a task description to edit; hit Enter or click outside to save.
   - Use state badge to move tasks along the workflow.
   - Delete tasks with the trash icon.
4. **Filtering**
   - Apply state/category filters to focus on relevant items.
5. **Syncing**
   - Changes are saved locally instantly and sent to the server concurrently.
   - If network issues occur, the app retries automatically every 10 s.

## Target Audience

- Individuals who prefer a simple, no‑friction to‑do list
- People who switch between devices and want automatic synchronization
- Users needing an offline‑capable task tracker that works in plain browsers

## Differentiators

- **Zero dependencies**: no frameworks or build steps for the frontend.
- **Offline-first**: native support for working without network access.
- **Easy migration**: built‑in mechanism to import existing local data.
- **Lightweight backend**: a single Node.js server with a SQLite database keeps
dependency overhead minimal.

## Glossary

- **Sync** – process of pushing the entire task list to the server to ensure
it matches the client state.
- **Migration** – one-time operation moving localStorage tasks to the server
when it's initially empty.
- **State** – the progress stage of a task (`plan`, `todo`, `done`).
- **Category** – classification label (`trabajo`, `personal`, `estudio`).

---
This file is intentionally concise (designed to fit within two pages when
printed) while covering the salient product capabilities. For technical
reference or implementation details, see the README and ARCHITECTURE files.