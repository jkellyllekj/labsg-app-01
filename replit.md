# Swim Workout Generator

## Overview

A minimal Node.js + Express application that generates swimming workouts. The app takes user inputs (pool size, target distance) and generates coach-plausible workout structures. Built as a clean rebuild (not a refactor) of a previous prototype.

The application runs as a single-file Express server serving both the API and a simple HTML frontend. It integrates with OpenAI for workout generation.

## User Preferences

Preferred communication style: Simple, everyday language.

Additional project-specific preferences:
- Work in small, focused changes (one goal per change, minimal files touched)
- At session start, state current phase, next task, and expected file changes before editing
- Keep PROJECT_STATE.md current as the source of truth
- No em dashes in UI copy
- Distances must snap to pool length multiples

## System Architecture

### Application Structure
- **Single-file architecture**: The entire application lives in `index.js` - Express server, routes, and inline HTML
- **Block-tagged code**: Code uses comment blocks (e.g., `__START_IMPORTS_R010__`) for structured editing - replace whole blocks only
- **No build step**: Plain Node.js with Express, no transpilation or bundling required

### Frontend
- Inline HTML served from the Express route
- Pool selection via buttons (25m, 50m, 25yd, Custom) - 25m highlighted by default
- Distance selection via slider (500-10000, snapping to 100) - defaults to 1500
- Chips-based UI for workout display with reroll functionality
- Workout cards: zone-based colored backgrounds with left accent bar, floating directly on pool background (no white container)
  - Zone colors: Easy (green), Steady (blue), Moderate (yellow), Strong (orange), Hard (red)
  - Gradients for multi-zone sets: build, descend, pyramid, reducer, pull/kick builds
- Jumping dolphin animation during workout generation (minimum 1 second display)
- Smooth 0.3s fade-in animation for workout results
- Premium form styling: user's sunny outdoor pool photo background (public/pool-lanes-compressed.jpg, 133KB), drop shadow, 16px rounded corners, no "Your Workout" title
- Parallax background effect with background-attachment:fixed
- Single-column form layout: Distance above Pool length for cleaner mobile/desktop experience
- Card shadows: 0 6px 16px for more pronounced lift effect
- Dice emoji button for rerolling individual sets
- Advanced options with grid layout: strokes on left, equipment on right
- Static assets served from public/ folder

### Routes
- `/` - Main workout generator page
- `/viewport-lab` - Temporary responsive design testing page (shows app at multiple screen sizes)
- `/generate-workout` - POST endpoint for workout generation
- `/reroll-set` - POST endpoint for rerolling individual sets

### Backend
- Express 5.x server on port 5000 (or PORT env variable)
- JSON API endpoints for workout generation
- OpenAI integration for generating workout content

### Data Flow
1. User selects pool type and target distance
2. Frontend sends request to backend API
3. Backend generates workout using local algorithm (no external AI calls for basic generation)
4. Response parsed and displayed as workout chips with effort-based colors

### Key Design Decisions
- **Clean rebuild over refactor**: Started fresh rather than modifying legacy prototype
- **Coach plausibility**: Workouts should feel human-written, not algorithmically generated
- **Custom pool caution**: LLM arithmetic for custom pool lengths cannot be fully trusted - validation required
- **Zone-based colors**: Five intensity levels: Easy (green), Steady (blue), Moderate (yellow), Strong (orange), Hard (red). "Sprint" is a set type, not a zone.
- **Freestyle default**: Warm-up and cool-down prefer freestyle when available; other sets use selected stroke variety
- **No "easy" in drill/kick/pull**: Color tells the story; use "relaxed" instead
- **Minimum 1 second loader**: Jumping dolphin shows for at least 1 second for polished feel
- **Fade-in animations**: Workout results fade in over 0.3s for Apple-style polish
- **Viewport Lab**: Temporary testing tool at /viewport-lab for responsive design verification
- **Short workout guard**: Workouts under 800m skip sprints/threshold and use simple steady/smooth sets
- **Stroke variety**: When multiple strokes selected, sets use variety based on seed (not always freestyle)
- **Equipment integration**: Fins appear in kick sets, paddles appear in pull sets when selected

## External Dependencies

### Runtime Dependencies
- **Express 5.x**: Web server framework
- **OpenAI SDK**: For workout generation via GPT models

### Environment Configuration
- `OPENAI_API_KEY`: Required Replit Secret for OpenAI API access (never hardcoded)
- `PORT`: Optional, defaults to 5000

### No Database
Currently stateless - no persistent storage configured.