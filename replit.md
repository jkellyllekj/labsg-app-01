# Swim Workout Generator

## Overview

A minimal Node.js + Express application that generates swimming workouts. The app takes user inputs (pool size, target distance) and generates coach-plausible workout structures. Built as a clean rebuild (not a refactor) of a previous prototype.

The application runs as a single-file Express server serving both the API and a simple HTML frontend. All generation is now local/deterministic (no OpenAI calls for basic generation).

## Current Status (2026-01-09)

**Phase:** v1 Coach Plausibility - Feature Complete, Polish Phase

**What Works:**
- Full workout generation with coach-quality structure
- Pool types: 25m, 50m, 25yd, Custom (any length)
- Distance: 500-10,000m via slider (snaps to 100)
- Reroll individual sets via dice button with variety
- Zone-based colored cards (Easy/Moderate/Strong/Hard/Full Gas)
- Gradient backgrounds for progressive sets (build, descend)
- 16-drill name library, snazzy workout names, emoji intensity strip
- Jumping dolphin loader (min 1 sec), 0.3s fade-in animation
- Smooth scroll to workout title after 350ms delay
- ~20% multi-part sets for main sets 400m+ (50/50 split, 3-part ladder, mixed distances)

**Session Just Completed (2026-01-12, later):**
1. Dolphin position fixed - now anchored to right side of button row (was inline with text which caused issues when "Generating..." wrapped on different screens)
2. Button row restructured with flexbox: buttons/status left, dolphin right (justify-content:space-between)
3. Dolphin size increased 20% (28px to 34px font, 44px to 52px wrapper)
4. Animation arc goes higher (-56px peak instead of -38px) for more dramatic loop
5. Animation timing: 3s per cycle (was 2.5s), pauses at landing point before splash
6. Title cut-off fixed: added scroll-margin-top:20px for proper clearance
7. Animation pauses immediately at cycle end, preventing restart before splash plays

**Previous Session (2026-01-12, earlier):**
1. Repositioned dolphin loader inline after "Generating..." text (was floating in corner)
2. Redesigned animation with 13 smooth keyframes (was 5 jerky stops) and linear easing
3. Added entrance splash when dolphin appears (jumping out of water)
4. Added exit splash when dolphin finishes loops (diving back down)

**Previous Session (2026-01-09):**
1. Fixed reroll variety - multiple seed derivations for independent randomization
2. Fixed dice button stuck state - finally block resets button
3. Added multi-part sets (~20%) with exact distance validation
4. Improved drill display for 6+ rep sets
5. UI polish: reduced padding, enhanced dolphin, smooth scroll

**Known Future Work:**
- More workout name variety (templates)
- Remove Viewport Lab link before production
- Consider temperature option for more/less creative workouts

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
- **Shared functions section** (lines ~27-285): Common utilities used by both /generate-workout and /reroll-set routes
- **No build step**: Plain Node.js with Express, no transpilation or bundling required

### Frontend
- Inline HTML served from the Express route
- Pool selection via buttons (25m, 50m, 25yd, Custom) - 25m highlighted by default
- Distance selection via slider (500-10000, snapping to 100) - defaults to 1500
- Chips-based UI for workout display with reroll functionality
- Workout cards: zone-based colored backgrounds with left accent bar, floating directly on pool background (no white container)
  - Zone colors: Easy (green), Moderate (blue), Strong (yellow), Hard (orange), Full Gas (red)
  - Vertical gradients (top-to-bottom) for multi-zone sets: build, descend, pyramid, reducer
- Snazzy workout name generator: context-aware names based on distance, focus, and equipment
- Named drill library: 16 specific drill names (Catch-up, Fist drill, Fingertip drag, DPS, Shark fin, Zipper, Scull, Corkscrew, Single arm, Long dog, Tarzan, Head up, etc.)
- Emoji intensity strip: 5 faces (😊 🙂 😐 😣 🔥) in footer showing workout difficulty
- Jumping dolphin animation during workout generation (48px size, loopy loop in dedicated dock to RIGHT of form box, min 1.5s display)
- Smooth 0.5s fade-in animation for workout results (force reflow ensures restart on every generation)
- Animation sequence: dolphin loops -> dolphin clears -> scroll to workout -> fade in cards (400ms after scroll starts)
- Premium form styling: user's sunny outdoor pool photo background (public/pool-lanes-compressed.jpg, 133KB), drop shadow, 16px rounded corners
- Parallax background effect with background-attachment:fixed
- Single-column form layout: Distance above Pool length
- Card shadows: 0 6px 16px for pronounced lift effect
- Dice emoji button for rerolling individual sets
- Advanced options with grid layout: strokes on left, equipment on right
- Static assets served from public/ folder

### Routes
- `/` - Main workout generator page
- `/viewport-lab` - Temporary responsive design testing page (shows app at multiple screen sizes) - REMOVE BEFORE PRODUCTION
- `/generate-workout` - POST endpoint for workout generation
- `/reroll-set` - POST endpoint for rerolling individual sets

### Key Functions (in index.js)
- `buildOneSetBodyShared(label, target, poolLength, opts)` - Generates set content for any label type
- `shuffleWithSeed(arr, seed)` - Deterministic array shuffle for variety
- `snapToPool(val, pool)` - Ensures distances are pool multiples
- `makeLine(reps, dist, desc, rest)` - Formats "NxD description :rest" lines
- `restFor(dist, effort)` - Returns appropriate rest time for distance/effort

### Backend
- Express 5.x server on port 5000 (or PORT env variable)
- JSON API endpoints for workout generation
- All generation now local/deterministic (OpenAI SDK installed but not used for basic generation)

### Data Flow
1. User selects pool type and target distance
2. Frontend sends POST to /generate-workout
3. Backend allocates distances to workout sections (warm-up, drill, kick, pull, main, cool-down)
4. Each section built via buildOneSetBodyShared with deterministic variety
5. Response parsed and displayed as workout chips with effort-based colors

### Key Design Decisions
- **Clean rebuild over refactor**: Started fresh rather than modifying legacy prototype
- **Coach plausibility**: Workouts should feel human-written, not algorithmically generated
- **Custom pool caution**: LLM arithmetic for custom pool lengths cannot be fully trusted - validation required
- **Zone-based colors**: Five intensity levels: Easy (green), Moderate (blue), Strong (yellow), Hard (orange), Full Gas (red). "Sprint" is a set type, not a zone.
- **Zone striation logic**: Cards show gradients/stripes based on actual set content
- **Rest/interval display**: Rest only shows when threshold pace is entered (interval mode)
- **Descend pattern variety**: Not always "descend 1-4" - includes 1-3, 1-5, odds/evens, every 3rd, negative split variants
- **Freestyle default**: Warm-up and cool-down prefer freestyle when available
- **No "easy" in drill/kick/pull**: Color tells the story; use "relaxed" instead
- **Multi-part sets**: ~20% probability for main sets 400m+, always validate exact distance match
- **Drill variety**: Shows "drill choice (Catch-up, Fist drill)" for 6+ rep drill sets

## External Dependencies

### Runtime Dependencies
- **Express 5.x**: Web server framework
- **OpenAI SDK**: Installed but not actively used for basic generation
- **@types/node**: TypeScript definitions

### Environment Configuration
- `OPENAI_API_KEY`: Replit Secret (exists but not used for current generation)
- `PORT`: Optional, defaults to 5000

### No Database
Currently stateless - no persistent storage configured.

## Files

### Active
- `index.js` - Single-file application (all routes, HTML, CSS, JS inline)
- `project-state.md` - Detailed project state and decisions (authoritative)
- `replit.md` - This file, quick reference for fresh agents
- `public/pool-lanes-compressed.jpg` - Background image (133KB)

### Reference Only
- `WORKING-METHOD-REPLIT.md` - Working methodology documentation
- `working-method.md` - Original ChatGPT method (historical)
