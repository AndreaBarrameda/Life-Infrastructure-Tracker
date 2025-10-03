# Life Infrastructure Tracker

Life Infrastructure Tracker is a Vite + React web app that turns household logistics into a cooperative RPG-style experience. Track essentials, stay ahead of bills, earn points, and collaborate with housemates—all with Tailwind styling and an OpenAI-powered game-master assistant. All data lives in LocalStorage for a lightweight, offline-friendly workflow.

## Features
- **Gamified Dashboard** with a household health bar, points, levels, badges, streak tracking, and personal growth momentum.
- **Essentials Inventory** CRUD with pantry/fridge/freezer locations, automatic "days left" math, and low-supply highlights.
- **Bills & Utilities** management including mark-as-paid actions, urgency emojis, and reminders for due/overdue invoices.
- **Reminders & Notifications** powered by the browser Notification API—earn points for responding to alerts.
- **AI Game Master** (OpenAI Chat Completions) that narrates quests, congratulates wins, and nudges you when supplies run low.
- **Household Guild** so family or roommates can join via invite code, compare streaks, and tackle seasonal challenges together.
- **Personal Growth Layer** to track fitness, reading, savings, or custom missions that feed into the household health bar and reward milestones.
- **Tailwind UI** with dark mode, responsive layouts, and emoji-rich feedback for a playful experience.

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173 by default.

## Environment Variables
Create a `.env` file in the project root with your OpenAI API key:

```
VITE_OPENAI_API_KEY=sk-your-key-here
```

The assistant uses `import.meta.env.VITE_OPENAI_API_KEY` to authorize requests to `https://api.openai.com/v1/chat/completions`.

## Notifications
Click **🔔 Enable reminders** in the header to grant notification permissions. Once granted, daily alerts summarize ⚠️ low supplies and 💸 bills due soon—and acknowledging them awards bonus points.

## Location Sharing
Use **📍 Share location** to capture your approximate latitude/longitude via the browser Geolocation API. This stays local and helps contextualize your planning sessions.

## Gamification Loop
- Add or restock essentials → earn points and keep the household health bar green.
- Mark bills as paid on time → extend streaks and unlock the **Utility Master** badge.
- Maintain buffer days for supplies → work toward **Preparedness Pro**.
- Invite housemates → combine points for seasonal challenges like the "Preparedness Challenge" and vie for titles such as **Chief Household Strategist**.

## Project Structure
```
src/
  components/
    Assistant.jsx      # AI chat interface with OpenAI integration & persona
    Bills.jsx          # Bills CRUD, urgency indicators, mark-as-paid
    Dashboard.jsx      # Health bar, progress, badges, location summaries
    Household.jsx      # Member invites, leaderboard, seasonal challenges
    Inventory.jsx      # Essentials management with location tracking
  utils/
    calculations.js    # Helpers for days-left and due-date math
    gamification.js    # Points, streaks, badges, health scoring utilities
    reminders.js       # Notification scheduling and threshold logic
    storage.js         # LocalStorage helpers for lists, prefs, and gamification
  App.jsx
  index.css
  main.jsx
```

## Available Scripts
- `npm run dev` – start the Vite dev server.
- `npm run build` – create a production build in `dist/`.
- `npm run preview` – preview the production build locally.

## Data Persistence
All lists, gamification stats, preferences, geolocation, and reminder timestamps are stored locally under `life-infrastructure-*` keys. Clearing browser storage resets the app.

## License
MIT
