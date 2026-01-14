/**
 * Swim Workout Generator v1
 * Node + Express single-file app
 *
 * Block-tagged. Edit by replacing whole blocks only.
 *
 * Notes:
 * - No em dashes in UI copy.
 * - Distances snap to pool multiples.
 * - Always generates a human-style workout structure.
 * - Optional threshold pace enables time estimates.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("public"));

app.get("/styles.css", (req, res) => {
  const cssPath = path.join(__dirname, "styles.css");
  try {
    const css = fs.readFileSync(cssPath, "utf8");
    res.setHeader("Content-Type", "text/css; charset=utf-8");
    res.send(css);
  } catch (e) {
    res.status(404).send("/* styles.css not found */");
  }
});

function snapToPoolMultipleShared(dist, poolLen) {
  const d = Number(dist);
  if (!Number.isFinite(d) || d <= 0) return 0;
  const base = Number(poolLen);
  if (!Number.isFinite(base) || base <= 0) return d;
  return Math.round(d / base) * base;
}

// ============================================================================
// VALIDATION HELPERS - Free-tier realism guards
// ============================================================================

// Allowed rep counts by rep distance (coach-plausible patterns)
function isAllowedRepCount(repCount, repDistance) {
  const r = Number(repCount);
  const d = Number(repDistance);
  if (!Number.isFinite(r) || r < 1) return false;
  if (!Number.isFinite(d) || d <= 0) return false;
  
  // Single rep is always allowed
  if (r === 1) return true;
  
  // Short reps (25-50): allow 2,3,4,5,6,8,10,12,16,20
  if (d <= 50) {
    return [2, 3, 4, 5, 6, 8, 10, 12, 16, 20].includes(r);
  }
  // Medium reps (75-100): allow 2,3,4,5,6,8,10,12
  if (d <= 100) {
    return [2, 3, 4, 5, 6, 8, 10, 12].includes(r);
  }
  // Long reps (200+): allow 2,3,4,5,6,8,10
  return [2, 3, 4, 5, 6, 8, 10].includes(r);
}

// Check if total distance ends at home end (even number of lengths)
function endsAtHomeEnd(totalDistance, poolLen) {
  const d = Number(totalDistance);
  const p = Number(poolLen);
  if (!Number.isFinite(d) || !Number.isFinite(p) || p <= 0) return false;
  const lengths = d / p;
  return Number.isInteger(lengths) && lengths % 2 === 0;
}

// Validate warm-up/cool-down line: no hard efforts allowed
function isValidWarmupCoolLine(text) {
  const t = String(text || "").toLowerCase();
  const forbidden = ["hard", "threshold", "sprint", "max", "full gas", "fullgas", "fast", "race pace", "all out"];
  for (const word of forbidden) {
    if (t.includes(word)) return false;
  }
  return true;
}

// Validate drill line: no odd/random rep counts
function isValidDrillLine(repCount) {
  const r = Number(repCount);
  // Drills should use clean rep counts: 2,3,4,5,6,8,10,12
  // Reject odd random numbers like 7, 9, 11, 13
  const forbidden = [7, 9, 11, 13, 14, 15, 17, 18, 19];
  return !forbidden.includes(r);
}

// Validate kick line: no "relaxed" or "easy" with short reps
function isValidKickLine(text, repDistance) {
  const t = String(text || "").toLowerCase();
  const d = Number(repDistance);
  // Short kick reps (25-50) should not be "relaxed" or "easy" - too short to be meaningful
  if (d <= 50 && (t.includes("relaxed") || t.includes("easy"))) {
    return false;
  }
  return true;
}

// Parse a line to extract NxD format
function parseNxD(line) {
  const match = String(line || "").match(/^(\d+)x(\d+)/i);
  if (!match) return null;
  return { reps: Number(match[1]), dist: Number(match[2]) };
}

// Validate a set body: all lines must parse, total must match target
function validateSetBody(body, targetDistance, poolLen) {
  const lines = String(body || "").split("\n").filter(l => l.trim());
  if (lines.length === 0) return { valid: false, reason: "empty body" };
  
  let totalParsed = 0;
  for (const line of lines) {
    const parsed = parseNxD(line);
    if (!parsed) {
      // Check for single distance format (e.g., "200 easy")
      const singleMatch = line.match(/^(\d+)\s+/);
      if (singleMatch) {
        totalParsed += Number(singleMatch[1]);
        continue;
      }
      return { valid: false, reason: "unparseable line: " + line };
    }
    totalParsed += parsed.reps * parsed.dist;
  }
  
  if (totalParsed !== targetDistance) {
    return { valid: false, reason: "distance mismatch: got " + totalParsed + ", expected " + targetDistance };
  }
  
  // Check even lengths
  if (!endsAtHomeEnd(totalParsed, poolLen)) {
    return { valid: false, reason: "odd number of lengths" };
  }
  
  return { valid: true };
}

// Shuffle array deterministically based on seed
function shuffleWithSeed(arr, seed) {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1) * 9973) >>> 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// FNV-1a 32-bit hash for deterministic randomisation
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

// Section templates for coach-plausible workout blocks
const SECTION_TEMPLATES = {
  warmup: [
    { body: "300 easy", dist: 300 },
    { body: "400 easy", dist: 400 },
    { body: "4x100 easy", dist: 400 },
    { body: "8x50 easy", dist: 400 },
    { body: "200 easy\n4x50 build", dist: 400 },
    { body: "6x50 easy choice", dist: 300 },
    { body: "4x75 easy", dist: 300 },
    { body: "200 easy\n2x100 build", dist: 400 },
    { body: "500 easy", dist: 500 },
    { body: "2x200 easy", dist: 400 },
    { body: "10x50 easy", dist: 500 }
  ],
  build: [
    { body: "4x50 build", dist: 200 },
    { body: "6x50 build", dist: 300 },
    { body: "2x100 negative split", dist: 200 },
    { body: "4x100 build", dist: 400 },
    { body: "8x50 build", dist: 400 },
    { body: "3x100 descend", dist: 300 },
    { body: "2x150 build", dist: 300 },
    { body: "6x50 descend 1-3 twice", dist: 300 }
  ],
  drill: [
    { body: "6x50 drill choice", dist: 300 },
    { body: "8x25 drill choice", dist: 200 },
    { body: "6x50 drill down swim back", dist: 300 },
    { body: "4x50 drill", dist: 200 },
    { body: "4x100 drill swim", dist: 400 },
    { body: "8x50 catch up", dist: 400 },
    { body: "6x50 fingertip drag", dist: 300 },
    { body: "4x75 drill choice", dist: 300 }
  ],
  kick: [
    { body: "6x50 kick descend", dist: 300 },
    { body: "4x100 kick strong", dist: 400 },
    { body: "8x25 kick fast", dist: 200 },
    { body: "4x50 kick moderate", dist: 200 },
    { body: "6x50 kick build", dist: 300 },
    { body: "8x50 kick choice", dist: 400 },
    { body: "4x75 kick", dist: 300 },
    { body: "200 kick\n4x50 kick fast", dist: 400 }
  ],
  cooldown: [
    { body: "200 easy", dist: 200 },
    { body: "300 easy", dist: 300 },
    { body: "4x100 loosen", dist: 400 },
    { body: "4x50 easy", dist: 200 },
    { body: "5x50 easy", dist: 250 },
    { body: "6x50 easy", dist: 300 },
    { body: "300 easy choice", dist: 300 },
    { body: "2x150 easy", dist: 300 }
  ],
  main: [
    { body: "6x100 strong", dist: 600 },
    { body: "8x100 moderate", dist: 800 },
    { body: "4x200 strong", dist: 800 },
    { body: "5x100 descend", dist: 500 },
    { body: "3x200 build", dist: 600 },
    { body: "10x100 steady", dist: 1000 },
    { body: "8x50 fast\n4x100 moderate", dist: 800 },
    { body: "400 strong\n4x100 descend", dist: 800 },
    { body: "6x150 strong", dist: 900 },
    { body: "4x150 build\n4x50 fast", dist: 800 }
  ]
};

function pickTemplate(section, targetDistance, seed, poolLen) {
  const list = SECTION_TEMPLATES[section];
  if (!list) return null;
  
  // Filter templates that fit distance AND end at home end
  const fits = list.filter(t => {
    if (t.dist > targetDistance) return false;
    // For 25m and 50m pools, enforce home end
    if (poolLen === 25 || poolLen === 50) {
      if (!endsAtHomeEnd(t.dist, poolLen)) return false;
    }
    return true;
  });
  
  if (!fits.length) return null;
  
  // Shuffle fits based on seed + section hash for variety
  const sectionHash = fnv1a32(section);
  const shuffled = shuffleWithSeed(fits, (seed ^ sectionHash) >>> 0);
  
  // Pick from shuffled list
  const idx = ((seed * 7919) >>> 0) % shuffled.length;
  return shuffled[idx];
}

function normalizeSectionKey(label) {
  const l = String(label).toLowerCase();
  if (l.includes("warm")) return "warmup";
  if (l.includes("build")) return "build";
  if (l.includes("drill")) return "drill";
  if (l.includes("kick")) return "kick";
  if (l.includes("cool")) return "cooldown";
  if (l.includes("main")) return "main";
  return null;
}

const SECTION_MIN_DIST = {
  warmup: 300,
  build: 200,
  drill: 200,
  kick: 200,
  cooldown: 200
};

// Snap distance to nearest pool multiple with even lengths (ends at home end)
function snapSection(dist, poolLen) {
  if (dist <= 0) return 0;
  const lengths = Math.round(dist / poolLen);
  const evenLengths = lengths % 2 === 0 ? lengths : lengths + 1;
  return Math.max(evenLengths * poolLen, poolLen * 2);
}

// Apply minimum distances to non-main sections, shift excess to main
function applySectionMinimums(sets, total, poolLen) {
  let adjustment = 0;
  
  for (const s of sets) {
    const key = normalizeSectionKey(s.label);
    const minDist = SECTION_MIN_DIST[key] || 0;
    
    // Skip main sets
    if (String(s.label).toLowerCase().includes("main")) continue;
    
    // Snap to even lengths
    let snapped = snapSection(s.dist, poolLen);
    
    // Apply minimum
    if (minDist > 0 && snapped < minDist) {
      const needed = snapSection(minDist, poolLen);
      adjustment += needed - snapped;
      snapped = needed;
    }
    
    s.dist = snapped;
  }
  
  // Subtract adjustment from main set(s)
  const mainSets = sets.filter(s => String(s.label).toLowerCase().includes("main"));
  if (mainSets.length > 0 && adjustment > 0) {
    // Distribute adjustment across main sets proportionally
    const mainTotal = mainSets.reduce((sum, s) => sum + s.dist, 0);
    for (const m of mainSets) {
      const share = Math.round((m.dist / mainTotal) * adjustment);
      m.dist = snapSection(m.dist - share, poolLen);
    }
  }
  
  return sets;
}

// ENHANCED SET BUILDER - Coach-like sets with variety + ~20% multi-part
function buildOneSetBodyShared({ label, targetDistance, poolLen, unitsShort, opts, seed, rerollCount }) {
  const base = poolLen;
  const target = snapToPoolMultipleShared(targetDistance, base);
  if (target <= 0) return null;

  const isNonStandardPool = ![25, 50].includes(base);
  const hasThresholdPace = opts.thresholdPace && String(opts.thresholdPace).trim().length > 0;
  
  // Use different seed bits for different decisions
  const seedA = seed >>> 0;
  const seedB = ((seed * 7919) >>> 0);
  const seedC = ((seed * 104729) >>> 0);
  const seedD = ((seed * 224737) >>> 0);
  
  // Reroll count for cycling through effort levels
  // If rerollCount is provided (>0), use it to deliberately cycle effort levels
  // If not provided or 0, use seeded random for natural initial variety
  const hasRerollCount = typeof rerollCount === 'number' && rerollCount > 0;
  const rerollNum = hasRerollCount ? rerollCount : seedA;

  // TEMPLATE SELECTION - runs first, before any section-specific logic
  // If a template fits, return it immediately
  // Use real targetDistance only (allocator now ensures clean distances)
  const sectionKey = normalizeSectionKey(label);
  if (sectionKey) {
    const template = pickTemplate(sectionKey, target, seedA, base);
    if (template) {
      return template.body;
    }
  }

  const makeLine = (reps, dist, text, restSec) => {
    let suffix = "";
    if (hasThresholdPace && Number.isFinite(restSec) && restSec > 0) {
      suffix = " rest " + String(restSec) + "s";
    }
    let lengthInfo = "";
    if (isNonStandardPool && dist > 0 && base > 0 && dist % base === 0 && dist / base > 1) {
      lengthInfo = " (" + (dist / base) + " lengths)";
    }
    return String(reps) + "x" + String(dist) + lengthInfo + " " + (text || "").trim() + suffix;
  };

  const pickStroke = () => {
    const allowed = [];
    if (opts.strokes && opts.strokes.freestyle) allowed.push("freestyle");
    if (opts.strokes && opts.strokes.backstroke) allowed.push("backstroke");
    if (opts.strokes && opts.strokes.breaststroke) allowed.push("breaststroke");
    if (opts.strokes && opts.strokes.butterfly) allowed.push("butterfly");
    if (!allowed.length) return "freestyle";
    const k = String(label || "").toLowerCase();
    if ((k.includes("warm") || k.includes("cool")) && allowed.includes("freestyle")) return "freestyle";
    return allowed[seedB % allowed.length];
  };

  const restFor = (repDist, intensity) => {
    const k = String(label || "").toLowerCase();
    let r = 15;
    if (k.includes("warm") || k.includes("cool")) r = 0;
    else if (k.includes("drill")) r = 20;
    else if (k.includes("kick") || k.includes("pull")) r = 15;
    else if (k.includes("main")) r = 20;
    if (repDist >= 200) r = Math.max(10, r - 5);
    if (intensity === "hard" || intensity === "fast") r = r + 5;
    if (opts.restPref === "short") r = Math.max(0, r - 5);
    if (opts.restPref === "more") r = r + 10;
    // Add some variation based on seed
    r = r + (seedD % 3) - 1;
    return Math.max(0, r);
  };

  // Find best rep distance - now with seed-based preference shuffling
  // Applies isAllowedRepCount guard to reject implausible rep counts
  const findBestFit = (preferredDists, useSeed) => {
    const dists = useSeed ? shuffleWithSeed(preferredDists, seedC) : preferredDists;
    // First pass: exact fit with allowed rep count
    for (const d of dists) {
      if (d > 0 && target % d === 0) {
        const reps = target / d;
        if (reps >= 2 && reps <= 20 && isAllowedRepCount(reps, d)) {
          return { reps, dist: d };
        }
      }
    }
    // Second pass: allow any exact fit (fallback for edge cases)
    for (const d of dists) {
      if (d > 0 && target % d === 0) {
        const reps = target / d;
        if (reps >= 2 && reps <= 20) return { reps, dist: d };
      }
    }
    // Third pass: floor division (last resort)
    for (const d of dists) {
      if (d > 0) {
        const reps = Math.floor(target / d);
        if (reps >= 2 && isAllowedRepCount(reps, d)) return { reps, dist: d };
      }
    }
    return null;
  };

  const stroke = pickStroke();
  const k = String(label || "").toLowerCase();
  const hasFins = !!opts.fins;
  const hasPaddles = !!opts.paddles;

  // Named drills - expanded list
  const drills = [
    "Catch-up", "Fist drill", "Fingertip drag", "DPS", "Shark fin", "Zipper", 
    "Scull", "Corkscrew", "Single arm", "Long dog", "Tarzan", "Head up",
    "Hip rotation", "6-3-6", "Kickboard balance", "Paddle scull"
  ];
  const drill = drills[seedA % drills.length];
  const drill2 = drills[(seedA + 7) % drills.length];

  // Build descriptions - expanded with varied effort levels
  const buildDescs = [
    // Strong (yellow) - building effort
    "build", "descend 1-3", "descend 1-4", "descend 1-5", "negative split", 
    "smooth to strong", "build to fast", "odds easy evens strong",
    "every 3rd fast", "last 2 fast",
    // Hard (orange) - more intense builds
    "descend to hard", "build to threshold", "odds steady evens fast",
    // Fullgas touches
    "last one sprint", "build to max", "descend with final sprint"
  ];
  const buildDesc = buildDescs[seedA % buildDescs.length];

  // Preferred distances by set type
  const d25 = snapToPoolMultipleShared(25, base);
  const d50 = snapToPoolMultipleShared(50, base);
  const d75 = snapToPoolMultipleShared(75, base);
  const d100 = snapToPoolMultipleShared(100, base);
  const d200 = snapToPoolMultipleShared(200, base);

  // ~20% chance of multi-part set for main sets (seed % 5 === 0)
  const wantMultiPart = (seedA % 5) === 0 && target >= 400 && k.includes("main");

  // WARM-UP: Simple easy swim with variety
  // Guard: warm-up must not contain hard effort keywords
  if (k.includes("warm")) {
    const warmDescs = [stroke + " easy", stroke + " relaxed", "easy swim", "choice easy", stroke + " loosen up"];
    const warmDesc = warmDescs[seedA % warmDescs.length];
    if (!isValidWarmupCoolLine(warmDesc)) {
      return makeLine(4, d100 > 0 ? d100 : d50, stroke + " easy", 0);
    }
    const fit = findBestFit([d100, d50, d200, d75, d25].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, warmDesc, 0);
    const line = makeLine(fit.reps, fit.dist, warmDesc, 0);
    if (!endsAtHomeEnd(fit.reps * fit.dist, base)) {
      const evenReps = fit.reps % 2 === 0 ? fit.reps : fit.reps + 1;
      return makeLine(evenReps, fit.dist, warmDesc, 0);
    }
    return line;
  }

  // BUILD: Build set with variety - clear progression keywords for gradient
  if (k.includes("build")) {
    const buildSetDescs = [
      stroke + " build to strong", stroke + " descend 1-4", stroke + " build to fast",
      stroke + " negative split", stroke + " descend to hard", stroke + " build with last one sprint"
    ];
    const buildSetDesc = buildSetDescs[seedA % buildSetDescs.length];
    const fit = findBestFit([d50, d100, d75, d25].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, stroke + " build", 0);
    return makeLine(fit.reps, fit.dist, buildSetDesc, restFor(fit.dist, "moderate"));
  }

  // DRILL: Named drill with nice display
  // Guard: drill reps must be clean numbers (no 7, 9, 11, 13)
  if (k.includes("drill")) {
    const fit = findBestFit([d50, d25, d75].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, drill, 0);
    
    if (!isValidDrillLine(fit.reps)) {
      const cleanReps = fit.reps < 7 ? 6 : fit.reps < 9 ? 8 : fit.reps < 11 ? 10 : 12;
      return makeLine(cleanReps, fit.dist, drill, restFor(fit.dist, "easy"));
    }
    
    if (fit.reps >= 6 && (seedB % 3) === 0) {
      return makeLine(fit.reps, fit.dist, "drill choice (" + drill + ", " + drill2 + ")", restFor(fit.dist, "easy"));
    }
    return makeLine(fit.reps, fit.dist, drill, restFor(fit.dist, "easy"));
  }

  // KICK: Kick set with variety across effort levels
  // Use rerollNum to CYCLE through effort levels deliberately
  // Guard: no "relaxed" or "easy" with short reps (25-50)
  if (k.includes("kick")) {
    const finNote = hasFins ? " with fins" : "";
    const kickByEffort = {
      moderate: ["kick steady" + finNote, "kick on side" + finNote, "streamline kick" + finNote, "flutter kick" + finNote],
      strong: ["kick build" + finNote, "kick descend" + finNote, "kick descend 1-4" + finNote],
      hard: ["kick strong" + finNote, "kick fast" + finNote, "kick hard" + finNote],
      fullgas: ["kick sprint" + finNote, "kick max effort" + finNote]
    };
    const effortLevels = ["moderate", "strong", "hard", "fullgas"];
    const effortIdx = rerollNum % effortLevels.length;
    const effort = effortLevels[effortIdx];
    const descs = kickByEffort[effort];
    let kickDesc = descs[seedA % descs.length];
    const fit = findBestFit([d100, d50, d75, d25].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, "kick" + finNote, 0);
    
    if (!isValidKickLine(kickDesc, fit.dist)) {
      kickDesc = "kick steady" + finNote;
    }
    return makeLine(fit.reps, fit.dist, kickDesc, restFor(fit.dist, effort));
  }

  // PULL: Pull set with variety across effort levels
  // Use rerollNum to CYCLE through effort levels deliberately
  if (k.includes("pull")) {
    const padNote = hasPaddles ? " with paddles" : "";
    // Organized by effort level for deliberate cycling
    const pullByEffort = {
      moderate: ["pull steady" + padNote, "pull smooth" + padNote, "pull focus DPS" + padNote, "pull relaxed" + padNote, "pull technique" + padNote],
      strong: ["pull build" + padNote, "pull descend" + padNote, "pull descend 1-4" + padNote],
      hard: ["pull strong" + padNote, "pull hard" + padNote, "pull hold pace" + padNote],
      fullgas: ["pull fast" + padNote, "pull sprint" + padNote]
    };
    const effortLevels = ["moderate", "strong", "hard", "fullgas"];
    // Cycle through effort levels based on rerollNum
    const effortIdx = rerollNum % effortLevels.length;
    const effort = effortLevels[effortIdx];
    const descs = pullByEffort[effort];
    const pullDesc = descs[seedA % descs.length];
    const fit = findBestFit([d100, d50, d200, d75].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, "pull" + padNote, 0);
    return makeLine(fit.reps, fit.dist, pullDesc, restFor(fit.dist, effort));
  }

  // COOL-DOWN: Easy swim with variety
  // Guard: cool-down must not contain hard effort keywords
  if (k.includes("cool")) {
    const coolDescs = ["easy choice", stroke + " easy", "easy swim", "choice loosen up", "relaxed swim"];
    const coolDesc = coolDescs[seedA % coolDescs.length];
    if (!isValidWarmupCoolLine(coolDesc)) {
      return makeLine(4, d100 > 0 ? d100 : d50, stroke + " easy", 0);
    }
    const fit = findBestFit([d100, d200, d50].filter(x => x > 0), true);
    if (!fit) return makeLine(1, target, coolDesc, 0);
    const line = makeLine(fit.reps, fit.dist, coolDesc, 0);
    if (!endsAtHomeEnd(fit.reps * fit.dist, base)) {
      const evenReps = fit.reps % 2 === 0 ? fit.reps : fit.reps + 1;
      return makeLine(evenReps, fit.dist, coolDesc, 0);
    }
    return line;
  }

  // MAIN SET: Coach-quality variety with optional multi-part
  const focus = String(opts.focus || "allround");
  
  // Multi-part set patterns (~20% of the time for main sets 400m+)
  // CRITICAL: Total must equal target exactly - try all patterns until one works
  if (wantMultiPart) {
    const multiPatterns = [
      // Two-part: build + fast (50/50 split)
      () => {
        const repDist = d100 > 0 ? d100 : d50;
        if (repDist <= 0) return null;
        const totalReps = target / repDist;
        if (!Number.isInteger(totalReps) || totalReps < 4) return null;
        const r1 = Math.floor(totalReps / 2);
        const r2 = totalReps - r1;
        if (r1 >= 2 && r2 >= 2 && r1 * repDist + r2 * repDist === target) {
          return makeLine(r1, repDist, stroke + " build", restFor(repDist, "moderate")) + "\n" +
                 makeLine(r2, repDist, stroke + " fast", restFor(repDist, "hard"));
        }
        return null;
      },
      // Three-part ladder: steady + strong + fast (equal thirds)
      () => {
        const repDist = d100 > 0 ? d100 : d50;
        if (repDist <= 0) return null;
        const totalReps = target / repDist;
        if (!Number.isInteger(totalReps) || totalReps < 6 || totalReps % 3 !== 0) return null;
        const r = totalReps / 3;
        if (r >= 2 && r * repDist * 3 === target) {
          return makeLine(r, repDist, stroke + " steady", restFor(repDist, "easy")) + "\n" +
                 makeLine(r, repDist, stroke + " strong", restFor(repDist, "moderate")) + "\n" +
                 makeLine(r, repDist, stroke + " fast", restFor(repDist, "hard"));
        }
        return null;
      },
      // Mixed distance: 50s + 100s (requires exact math)
      () => {
        if (d50 <= 0 || d100 <= 0) return null;
        // Try: r1 x 50 + r2 x 100 = target where r1,r2 >= 2
        // Iterate to find valid combo
        for (let r2 = 2; r2 <= 10; r2++) {
          const remaining = target - r2 * d100;
          if (remaining > 0 && remaining % d50 === 0) {
            const r1 = remaining / d50;
            if (r1 >= 2 && r1 <= 12 && r1 * d50 + r2 * d100 === target) {
              return makeLine(r1, d50, stroke + " build", restFor(d50, "moderate")) + "\n" +
                     makeLine(r2, d100, stroke + " strong", restFor(d100, "hard"));
            }
          }
        }
        return null;
      }
    ];
    
    // Try preferred pattern first, then try others
    const startIdx = seedB % multiPatterns.length;
    for (let i = 0; i < multiPatterns.length; i++) {
      const idx = (startIdx + i) % multiPatterns.length;
      const result = multiPatterns[idx]();
      if (result) return result;
    }
  }

  // Simple single-line main set (default) - with varied effort levels
  // Use rerollNum to CYCLE through effort levels for allround focus
  // Descriptions designed to trigger proper effort gradients in parseEffortTimeline
  const mainDescs = {
    sprint: [
      stroke + " fast", stroke + " build to sprint", stroke + " max effort", 
      stroke + " race pace", stroke + " all out", stroke + " descend with final sprint"
    ],
    threshold: [
      stroke + " maintain strong pace", stroke + " threshold hold", stroke + " threshold pace", 
      stroke + " controlled fast", stroke + " tempo hold"
    ],
    endurance: [
      stroke + " steady", stroke + " smooth", stroke + " hold pace", 
      stroke + " aerobic", stroke + " consistent"
    ],
    technique: [
      stroke + " perfect form", stroke + " focus DPS", stroke + " count strokes", 
      stroke + " smooth technique", stroke + " efficient"
    ],
    allround: null // Handled specially with effort cycling below
  };
  
  // For allround focus: cycle through effort levels deliberately
  const allroundByEffort = {
    strong: [stroke + " build", stroke + " descend 1-4", stroke + " negative split", stroke + " build to strong"],
    hard: [stroke + " hard", stroke + " strong hold", stroke + " threshold", stroke + " fast hold", stroke + " descend to hard"],
    fullgas: [stroke + " sprint", stroke + " max effort", stroke + " race pace", stroke + " all out", stroke + " build to sprint"]
  };
  
  let mainDesc;
  let effortForRest = "hard";
  if (focus === "allround" || !mainDescs[focus]) {
    // Cycle through 3 effort levels for main sets: strong → hard → fullgas
    const mainEfforts = ["strong", "hard", "fullgas"];
    const effortIdx = rerollNum % mainEfforts.length;
    const effort = mainEfforts[effortIdx];
    const descs = allroundByEffort[effort];
    mainDesc = descs[seedA % descs.length];
    effortForRest = effort;
  } else {
    const descs = mainDescs[focus];
    mainDesc = descs[seedA % descs.length];
  }

  // Shuffle distance preferences for variety
  const fit = findBestFit([d100, d50, d200, d75].filter(x => x > 0), true);
  if (!fit) return makeLine(1, target, stroke + " swim", 0);
  return makeLine(fit.reps, fit.dist, mainDesc, restFor(fit.dist, effortForRest));
}
app.get("/", (req, res) => {
  const HOME_HTML = `
    <link rel="stylesheet" href="/styles.css">
    <div id="adBanner" style="width:100%; max-width:520px; height:50px; margin-bottom:10px; background:rgba(200,200,200,0.5); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#666;">
      <a href="/viewport-lab" style="color:inherit; text-decoration:underline; font-weight:600;">Viewport Lab</a>
    </div>

    <div style="max-width:520px;">
      <form id="genForm" class="glassPanel" style="position:relative; max-width:520px; padding:16px;">
        <div class="form-row">
          <div class="form-col">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                <h3 style="margin:0; font-size:20px; font-weight:700; font-variant:small-caps; letter-spacing:0.5px;">
                  <span class="glassChip readChip">Swim Gen</span>
                </h3>
              </div>

              <div style="flex:1; display:flex; justify-content:center;">
                <button id="bgCycleBtn" type="button" aria-label="Change background" class="iconBtnBare iconSm">🖼️</button>
              </div>

              <span class="glassChip readChip" style="white-space:nowrap; border-radius:8px; padding:6px 12px;">
                <strong id="distanceLabel">1500</strong>
              </span>
            </div>

            <div style="display:flex; align-items:center;">
              <input
                id="distanceSlider"
                type="range"
                min="500"
                max="10000"
                step="100"
                value="1500"
                class="distance-slider"
                style="flex:1;"
              />
            </div>

            <input type="hidden" name="distance" id="distanceHidden" value="1500" />
          </div>

          <div class="form-col">
            <input type="hidden" name="poolLength" id="poolLengthHidden" value="25m" />

            <div id="controlsGrid">
              <div id="leftControls">
                <div id="poolButtons" class="poolRow">
                  <button type="button" data-pool="25m" class="active" style="padding:6px 14px; border-radius:5px; cursor:pointer;">25m</button>
                  <button type="button" data-pool="50m" style="padding:6px 14px; border-radius:5px; cursor:pointer;">50m</button>
                  <button type="button" data-pool="25yd" style="padding:6px 14px; border-radius:5px; cursor:pointer;">25yd</button>
                </div>

                <div id="advancedRow" style="display:flex; align-items:center; justify-content:flex-start; gap:10px; margin-top:10px; position:relative;">
                  <button type="button" id="toggleAdvanced" style="background:transparent; border:none; text-align:left; font-size:16px; opacity:0.95; display:flex; align-items:center; gap:8px; cursor:pointer; padding:0; font-weight:700;">
                    <span id="advancedChip" class="whiteChip">▶ Advanced options</span>
                  </button>
                </div>
              </div>

              <div id="generateStack">
                <button id="generateBtn" type="submit" class="generateBox">
                  <div class="genLabel">Generate</div>
                  <div id="dolphinLoader" class="genDolphin"><img class="dolphinIcon dolphinIcon--generate" src="/assets/dolphins/dolphin-base.png" alt=""></div>
                </button>
              </div>
            </div>

            <div id="advancedWrap" style="display:none; margin-top:10px; padding:14px;">
              <div style="margin-bottom:14px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">
                  Custom pool length
                </label>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input
                    name="customPoolLength"
                    id="customPoolLength"
                    type="number"
                    min="10"
                    max="400"
                    placeholder="e.g. 30"
                    style="width: 90px; padding:6px 8px; border-radius:8px; border:1px solid #ccc;"
                  />
                  <select name="poolLengthUnit" id="poolLengthUnit" style="padding:6px 8px; border-radius:8px; border:1px solid #ccc;">
                    <option value="meters">meters</option>
                    <option value="yards">yards</option>
                  </select>
                </div>
                <div style="margin-top:4px; font-size:11px; color:#888;">Select Custom pool button to enable</div>
              </div>

              <div style="margin-bottom:14px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">
                  Threshold pace (per 100, optional)
                </label>
                <input
                  name="thresholdPace"
                  id="thresholdPace"
                  type="text"
                  placeholder="e.g. 1:30"
                  style="width: 120px; padding:6px 8px; border-radius:8px; border:1px solid #ccc;"
                />
                <div style="margin-top:4px; font-size:11px; color:#888;">
                  Estimates times per set and total
                </div>
              </div>

              <div class="advanced-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                  <div style="font-weight:700; margin-bottom:8px; color:#222;">Strokes</div>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="stroke_freestyle" checked />
                    Freestyle
                  </label>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="stroke_backstroke" />
                    Backstroke
                  </label>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="stroke_breaststroke" />
                    Breaststroke
                  </label>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="stroke_butterfly" />
                    Butterfly
                  </label>
                </div>
                <div>
                  <div style="font-weight:700; margin-bottom:8px; color:#222;">Equipment</div>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="equip_fins" />
                    Fins
                  </label>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="equip_paddles" />
                    Paddles
                  </label>
                  <div style="height:14px;"></div>
                  <div style="font-weight:700; margin-bottom:6px; color:#222;">Include sets</div>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="includeKick" checked />
                    Kick
                  </label>
                  <label style="display:block; margin:6px 0;">
                    <input type="checkbox" name="includePull" />
                    Pull
                  </label>
                </div>
              </div>

              <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                  <div style="font-weight:700; margin-bottom:6px; color:#222;">Focus area</div>
                  <select name="focus" id="focus" style="padding:8px 10px; border-radius:8px; border:1px solid #bbb; width:100%; font-size:14px;">
                    <option value="allround">All round</option>
                    <option value="endurance">Endurance</option>
                    <option value="threshold">Threshold</option>
                    <option value="sprint">Sprint</option>
                    <option value="technique">Technique</option>
                  </select>
                </div>
                <div>
                  <div style="font-weight:700; margin-bottom:6px; color:#222;">Rest preference</div>
                  <select name="restPref" id="restPref" style="padding:8px 10px; border-radius:8px; border:1px solid #bbb; width:100%; font-size:14px;">
                    <option value="balanced">Balanced</option>
                    <option value="short">Short rest</option>
                    <option value="moderate">Moderate rest</option>
                    <option value="more">More rest</option>
                  </select>
                </div>
              </div>

              <div style="margin-top:14px;">
                <div style="font-weight:700; margin-bottom:6px; color:#222;">Notes (optional)</div>
                <textarea
                  name="notes"
                  id="notes"
                  rows="3"
                  placeholder="e.g. I cannot do breaststroke kick, I want to work on freestyle sprinting, shoulder is sore"
                  style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #bbb; border-radius:8px; resize:vertical; font-size:14px;"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:14px; display:flex; align-items:flex-end; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button id="copyBtn" type="button" style="display:none; padding:8px 12px; border-radius:8px; border:1px solid #777; background:#fff; color:#111; cursor:pointer;" disabled>
              Copy
            </button>
            <span id="statusPill" style="font-size:13px; color:#555;"></span>
          </div>
        </div>
      </form>
    </div>

    <div style="max-width:520px; box-sizing:border-box; padding:0;">

      <div id="resultWrap" style="margin-top:16px; padding:0; background:transparent; border-radius:0; border:none; box-shadow:none;">
        <div id="errorBox" style="display:none; margin-bottom:10px; padding:10px; background:#fff; border:1px solid #e7e7e7; border-radius:8px;"></div>

        <div id="workoutNameDisplay" style="display:none; margin-bottom:8px; margin-top:10px; scroll-margin-top:20px;">
          <div class="workoutTitleRow">
            <button id="regenBtn2" type="button" aria-label="Regenerate" class="iconBtnBare iconSm"><img class="dolphinIcon" src="/assets/dolphins/dolphin-base.png" alt=""></button>
            <button id="bgCycleBtn2" type="button" aria-label="Change background" class="iconBtnSilhouette iconSm">🖼️</button>
            <span id="workoutNameText" style="display:inline-block; font-weight:700; font-size:15px; font-variant:small-caps; color:#111; background:#ffff00; padding:6px 14px; border-radius:4px; border:1px solid #111; box-shadow:0 2px 6px rgba(0,0,0,0.25);"></span>
          </div>
        </div>
        <div id="cards" style="display:none;"></div>

        <div id="totalBox" style="display:none; text-align:right; margin-top:8px;"><span id="totalText" style="display:inline-block; font-weight:700; font-size:15px; font-variant:small-caps; color:#111; background:#ffff00; padding:6px 14px; border-radius:4px; border:1px solid #111; box-shadow:0 2px 6px rgba(0,0,0,0.25);"></span></div>
        <div id="footerBox" class="glassSummary" style="display:none; margin-top:8px; padding:12px;"></div>

        <pre id="raw" style="display:none; margin-top:12px; padding:12px; background:#fff; border-radius:8px; border:1px solid #e7e7e7; white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:13px; line-height:1.35;"></pre>
      </div>
    </div>
  `;
  const HOME_JS_OPEN = `
    <script>
  `;
  const HOME_JS_DOM = `
      const form = document.getElementById("genForm");
      const errorBox = document.getElementById("errorBox");
      const statusPill = document.getElementById("statusPill");
      const dolphinLoader = document.getElementById("dolphinLoader");

      const cards = document.getElementById("cards");
      const totalBox = document.getElementById("totalBox");
      const totalText = document.getElementById("totalText");
      const footerBox = document.getElementById("footerBox");
      const raw = document.getElementById("raw");

      const copyBtn = document.getElementById("copyBtn");

      const distanceSlider = document.getElementById("distanceSlider");
      const distanceHidden = document.getElementById("distanceHidden");
      const distanceLabel = document.getElementById("distanceLabel");

      const poolButtons = document.getElementById("poolButtons");
      const poolHidden = document.getElementById("poolLengthHidden");
      const customLen = document.getElementById("customPoolLength");
      const customUnit = document.getElementById("poolLengthUnit");

      const thresholdPace = document.getElementById("thresholdPace");

      const toggleAdvanced = document.getElementById("toggleAdvanced");
      const advancedWrap = document.getElementById("advancedWrap");
      const generateBtn = document.getElementById("generateBtn");
      const advancedChip = document.getElementById("advancedChip");
  `;
  const HOME_JS_HELPERS = `
      function snap100(n) {
        const x = Number(n);
        if (!Number.isFinite(x)) return 1000;
        return Math.round(x / 100) * 100;
      }

      function setDistance(val) {
        const snapped = snap100(val);
        distanceSlider.value = String(snapped);
        distanceHidden.value = String(snapped);
        distanceLabel.textContent = String(snapped);
      }

      function safeHtml(s) {
        return String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      }

      function parsePaceToSecondsPer100(s) {
        const t = String(s || "").trim();
        if (!t) return null;

        // Accept 1:30 or 90
        if (/^\\d{1,2}:\\d{2}$/.test(t)) {
          const parts = t.split(":");
          const mm = Number(parts[0]);
          const ss = Number(parts[1]);
          if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
          return (mm * 60) + ss;
        }

        if (/^\\d{2,3}$/.test(t)) {
          const v = Number(t);
          if (!Number.isFinite(v) || v <= 0) return null;
          return v;
        }

        return null;
      }

      function fmtMmSs(totalSeconds) {
        const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
        const mm = Math.floor(s / 60);
        const ss = s % 60;
        return String(mm) + ":" + String(ss).padStart(2, "0");
      }

      function unitShortFromPayload(payload) {
        if (payload.poolLength === "custom") {
          return payload.poolLengthUnit === "yards" ? "yd" : "m";
        }
        return payload.poolLength === "25yd" ? "yd" : "m";
      }

      function poolLabelFromPayload(payload) {
        if (payload.poolLength !== "custom") return payload.poolLength;
        const u = payload.poolLengthUnit === "yards" ? "yd" : "m";
        return String(payload.customPoolLength) + u + " custom";
      }

      function fnv1a(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      }

      function loadLastWorkoutFingerprint() {
        try {
          return localStorage.getItem("swg_v1_last_fp") || "";
        } catch {
          return "";
        }
      }

      function saveLastWorkoutFingerprint(fp) {
        try {
          localStorage.setItem("swg_v1_last_fp", String(fp || ""));
        } catch {
        }
      }

      function fingerprintWorkoutText(text) {
        return String(fnv1a(String(text || "")));
      }

      // Background cycling with two-layer crossfade
      const backgroundImages = [
        "/backgrounds/Page-002 (Large)_result.webp",
        "/backgrounds/Page-004 (Large)_result.webp",
        "/backgrounds/Page-006 (Large)_result.webp",
        "/backgrounds/Page-008 (Large)_result.webp",
        "/backgrounds/Page-010 (Large)_result.webp",
        "/backgrounds/Page-012 (Large)_result.webp",
        "/backgrounds/Page-014 (Large)_result.webp",
        "/backgrounds/Page-016 (Large)_result.webp",
        "/backgrounds/Page-018 (Large)_result.webp",
        "/backgrounds/Page-020 (Large)_result.webp",
        "/backgrounds/Page-022 (Large)_result.webp",
        "/backgrounds/Page-022(1) (Large)_result.webp",
        "/backgrounds/Page-024 (Large)_result.webp"
      ];

      // Determine initial background index from bgA layer or body
      let bgIndex = (function() {
        const bgA = document.getElementById("bgA");
        const style = (bgA && bgA.style.backgroundImage) || document.body.style.backgroundImage || "";
        for (let i = 0; i < backgroundImages.length; i++) {
          if (style.includes(backgroundImages[i])) return i;
        }
        return 0;
      })();

      let activeBgLayer = "A";

      function setLayerImage(layerEl, url) {
        layerEl.style.backgroundImage = 'url("' + url + '")';
      }

      function preloadImage(url) {
        return new Promise(function(resolve, reject) {
          const img = new Image();
          img.onload = function() { resolve(true); };
          img.onerror = function() { reject(new Error("bg preload failed")); };
          img.src = url;
        });
      }

      function initBackgroundLayers() {
        const bgA = document.getElementById("bgA");
        const bgB = document.getElementById("bgB");
        if (!bgA || !bgB) return;

        const url = backgroundImages[bgIndex];
        setLayerImage(bgA, url);
        bgA.classList.add("isActive");
        bgB.classList.remove("isActive");
        activeBgLayer = "A";
      }

      async function cycleBackgroundManually() {
        const btn = document.getElementById("bgCycleBtn");
        const bgA = document.getElementById("bgA");
        const bgB = document.getElementById("bgB");
        if (!btn || !bgA || !bgB) return;

        btn.disabled = true;

        const nextIndex = (bgIndex + 1) % backgroundImages.length;
        const nextUrl = backgroundImages[nextIndex];

        console.log("[BG CYCLE] BEFORE:", {
          bgIndex: bgIndex,
          nextIndex: nextIndex,
          activeBgLayer: activeBgLayer,
          nextUrl: nextUrl
        });

        try {
          await preloadImage(nextUrl);
        } catch (e) {
          console.log("[BG CYCLE] preload FAILED:", e);
          btn.disabled = false;
          return;
        }

        const fromLayer = activeBgLayer === "A" ? bgA : bgB;
        const toLayer = activeBgLayer === "A" ? bgB : bgA;

        console.log("[BG CYCLE] LAYERS:", {
          fromLayerId: fromLayer.id,
          toLayerId: toLayer.id
        });

        setLayerImage(toLayer, nextUrl);

        toLayer.classList.add("isActive");
        fromLayer.classList.remove("isActive");

        console.log("[BG CYCLE] AFTER TOGGLE:", {
          bgA_classList: bgA.className,
          bgB_classList: bgB.className,
          bgA_opacity: getComputedStyle(bgA).opacity,
          bgB_opacity: getComputedStyle(bgB).opacity,
          bgA_bgImage: bgA.style.backgroundImage.slice(0, 60),
          bgB_bgImage: bgB.style.backgroundImage.slice(0, 60)
        });

        window.setTimeout(function() {
          bgIndex = nextIndex;
          activeBgLayer = activeBgLayer === "A" ? "B" : "A";
          btn.disabled = false;
          console.log("[BG CYCLE] COMMITTED:", { bgIndex: bgIndex, activeBgLayer: activeBgLayer });
        }, 300);
      }

      function wireBackgroundCycleButton() {
        const btn = document.getElementById("bgCycleBtn");
        if (!btn) return;
        btn.addEventListener("click", cycleBackgroundManually);
      }

      initBackgroundLayers();
      wireBackgroundCycleButton();
  `;
  const HOME_JS_PARSERS = `
      function splitWorkout(workoutText) {
        const lines = String(workoutText || "").split(/\\r?\\n/);

        const setLines = [];
        const footerLines = [];

        const isFooterLine = (line) => {
          const t = String(line || "").trim();
          if (!t) return false;
          return (
            t.startsWith("Total lengths:") ||
            t.startsWith("Ends at start end:") ||
            t.startsWith("Requested:") ||
            t.startsWith("Total distance:") ||
            t.startsWith("Est total time:")
          );
        };

        for (const line of lines) {
          if (isFooterLine(line)) footerLines.push(String(line || "").trim());
          else if (String(line || "").trim()) setLines.push(String(line || ""));
        }

        return { setLines: setLines, footerLines: footerLines };
      }

      function parseSetLine(line) {
        const trimmed = String(line || "").trim();
        const m = trimmed.match(/^([^:]{2,30}):\\s*(.+)$/);
        if (m) {
          const label = m[1].trim();
          const body = m[2].trim();
          return { label: label, body: body };
        }
        return { label: null, body: trimmed };
      }
  `;
  const HOME_JS_RENDER_CORE = `
      function clearUI() {
        errorBox.style.display = "none";
        errorBox.innerHTML = "";

        cards.style.display = "none";
        cards.innerHTML = "";

        totalBox.style.display = "none";
        totalBox.classList.remove("workout-fade-in");
        
        footerBox.style.display = "none";
        footerBox.innerHTML = "";
        footerBox.classList.remove("workout-fade-in");

        raw.style.display = "none";
        raw.textContent = "";

        statusPill.innerHTML = "";
        copyBtn.disabled = true;
        copyBtn.dataset.copyText = "";

        window.__swgSummary = null;
        
        const nameDisplay = document.getElementById("workoutNameDisplay");
        if (nameDisplay) nameDisplay.style.display = "none";
      }

      function renderError(title, details) {
        const lines = [];
        lines.push("<div style=\\"font-weight:700; color:#b00020; margin-bottom:6px;\\">" + safeHtml(title) + "</div>");

        if (Array.isArray(details) && details.length) {
          lines.push("<ul style=\\"margin:0; padding-left:18px;\\">");
          for (const d of details) {
            lines.push("<li style=\\"margin:4px 0;\\">" + safeHtml(String(d)) + "</li>");
          }
          lines.push("</ul>");
        }

        errorBox.innerHTML = lines.join("");
        errorBox.style.display = "block";
      }

      function canonicalizeLabel(labelRaw) {
        const raw = String(labelRaw || "").trim();
        if (!raw) return null;

        const key = raw.toLowerCase().replace(/\\s+/g, " ").trim();

        const map = {
          "warm-up": "Warm up",
          "warm up": "Warm up",
          "warmup": "Warm up",
          "build": "Build",
          "drill": "Drill",
          "drills": "Drill",
          "kick": "Kick",
          "pull": "Pull",
          "main": "Main",
          "main 1": "Main 1",
          "main 2": "Main 2",
          "cooldown": "Cool down",
          "cool down": "Cool down"
        };

        if (map[key]) return map[key];
        return raw;
      }

      function getEffortLevel(label, body) {
        const text = (String(label || "") + " " + String(body || "")).toLowerCase();
        const labelOnly = String(label || "").toLowerCase();
        
        // Zone names: easy (green), moderate (blue), strong (yellow), hard (orange), fullgas (red)
        
        // Warm-up and cool-down are always easy (green - Zone 1)
        if (text.includes("warm") || text.includes("cool")) return "easy";
        
        // Full Gas keywords (red - Zone 5) - max intensity
        const fullgasWords = ["sprint", "all out", "max effort", "race pace", "100%", "full gas", "max"];
        for (const w of fullgasWords) if (text.includes(w)) return "fullgas";
        
        // Hard keywords (orange - Zone 4) - sustained hard
        const hardWords = ["fast", "strong", "best average", "race", "threshold", "hard"];
        for (const w of hardWords) if (text.includes(w)) return "hard";
        
        // Main sets are NEVER easy/green - at minimum strong (yellow), default hard (orange)
        if (labelOnly.includes("main")) {
          // Check if it has strong keywords, otherwise default to hard
          const strongWords = ["descend", "build", "negative split", "push", "steady", "smooth"];
          for (const w of strongWords) if (text.includes(w)) return "strong";
          return "hard";
        }
        
        // Strong keywords (yellow - Zone 3) - building effort
        const strongWords = ["descend", "build", "negative split", "push"];
        for (const w of strongWords) if (text.includes(w)) return "strong";
        
        // Moderate keywords (blue - Zone 2) - technique work
        const moderateWords = ["steady", "smooth", "drill", "technique", "focus", "form", "choice"];
        for (const w of moderateWords) if (text.includes(w)) return "moderate";
        
        // Easy keywords (green - Zone 1)
        const easyWords = ["easy", "relaxed", "recovery", "loosen"];
        for (const w of easyWords) if (text.includes(w)) return "easy";
        
        // Default: moderate for technique sets
        return "moderate";
      }

      // Zone order for filling gaps (never skip levels)
      const ZONE_ORDER = ["easy", "moderate", "strong", "hard", "fullgas"];
      
      // Parse a single line or clause to detect its zone
      function detectLineZone(line) {
        const t = String(line || "").toLowerCase();
        
        // Fullgas (red) - maximum intensity
        if (t.includes("sprint") || t.includes("all out") || t.includes("max effort") || 
            t.includes("race pace") || t.includes("full gas") || t.includes("100%")) {
          return "fullgas";
        }
        
        // Hard (orange) - sustained hard
        if (t.includes("fast") || t.includes("strong") || t.includes("hard") || 
            t.includes("threshold") || t.includes("best average")) {
          return "hard";
        }
        
        // Strong (yellow) - building effort, moderate-hard
        if (t.includes("push") || t.includes("moderate")) {
          return "strong";
        }
        
        // Moderate (green) - steady, technique
        if (t.includes("steady") || t.includes("smooth") || t.includes("drill") || 
            t.includes("technique") || t.includes("focus") || t.includes("form") || 
            t.includes("choice") || t.includes("relaxed")) {
          return "moderate";
        }
        
        // Easy (blue)
        if (t.includes("easy") || t.includes("recovery") || t.includes("loosen") || 
            t.includes("warm") || t.includes("cool")) {
          return "easy";
        }
        
        return null; // Unknown
      }
      
      // Fill gaps between two zones so we never skip levels
      function fillZoneGap(fromZone, toZone) {
        const fromIdx = ZONE_ORDER.indexOf(fromZone);
        const toIdx = ZONE_ORDER.indexOf(toZone);
        if (fromIdx < 0 || toIdx < 0) return [fromZone, toZone];
        
        const result = [];
        if (fromIdx <= toIdx) {
          for (let i = fromIdx; i <= toIdx; i++) result.push(ZONE_ORDER[i]);
        } else {
          for (let i = fromIdx; i >= toIdx; i--) result.push(ZONE_ORDER[i]);
        }
        return result;
      }
      
      // Parse body text into effort segments with weights
      // Returns { zones: [...], isStriped: bool, isProgressive: bool }
      // Optional variantSeed adds randomness for gradient probability
      function parseEffortTimeline(label, body, variantSeed) {
        const labelOnly = String(label || "").toLowerCase();
        const bodyText = String(body || "").toLowerCase();
        const lines = String(body || "").split("\\n").filter(l => l.trim());
        
        // LCG-based seeded random generator - advances with each call
        let lcgState = variantSeed || (body ? body.length * 7 + 42 : 42);
        function nextRandom() {
          lcgState = (lcgState * 9301 + 49297) % 233280;
          return lcgState / 233280;
        }
        
        // Detect progression keywords - these create smooth gradients
        const hasProgression = /build|descend|negative split|pyramid|disappearing/i.test(bodyText);
        const hasFinalSprint = /final.*(sprint|fast|hard)|last.*(sprint|fast|hard)|with final|last \\d+ sprint/i.test(bodyText);
        const hasAlternating = /odds.*(easy|fast)|evens.*(easy|fast)|alternate/i.test(bodyText);
        
        // Warm-up: 80% solid blue, 20% easy→moderate gradient
        if (labelOnly.includes("warm")) {
          if (nextRandom() < 0.8) {
            return { zones: ["easy"], isStriped: false, isProgressive: false };
          }
          return { zones: ["easy", "moderate"], isStriped: false, isProgressive: true };
        }
        
        // Cool-down: 80% solid blue, 20% moderate→easy gradient
        if (labelOnly.includes("cool")) {
          if (nextRandom() < 0.8) {
            return { zones: ["easy"], isStriped: false, isProgressive: false };
          }
          return { zones: ["moderate", "easy"], isStriped: false, isProgressive: true };
        }
        
        // Drill: Always solid green or yellow (technique focus, no gradients)
        if (labelOnly.includes("drill")) {
          const zone = nextRandom() < 0.7 ? "moderate" : "strong";
          return { zones: [zone], isStriped: false, isProgressive: false };
        }
        
        // Alternating pattern: odds easy evens fast -> stripes with actual zones
        if (hasAlternating) {
          // Parse exact zones from alternating pattern
          let zone1 = "moderate";
          let zone2 = "hard";
          
          // Detect first zone (odds X or evens X where X is first mentioned)
          if (/odds\\s+easy/i.test(bodyText)) zone1 = "easy";
          else if (/odds\\s+steady|odds\\s+relaxed/i.test(bodyText)) zone1 = "moderate";
          else if (/odds\\s+strong|odds\\s+push/i.test(bodyText)) zone1 = "strong";
          else if (/odds\\s+fast|odds\\s+hard/i.test(bodyText)) zone1 = "hard";
          else if (/odds\\s+sprint/i.test(bodyText)) zone1 = "fullgas";
          
          // Detect second zone (evens X or vice versa)
          if (/evens\\s+easy/i.test(bodyText)) zone2 = "easy";
          else if (/evens\\s+steady|evens\\s+relaxed/i.test(bodyText)) zone2 = "moderate";
          else if (/evens\\s+strong|evens\\s+push/i.test(bodyText)) zone2 = "strong";
          else if (/evens\\s+fast|evens\\s+hard/i.test(bodyText)) zone2 = "hard";
          else if (/evens\\s+sprint/i.test(bodyText)) zone2 = "fullgas";
          
          // Only stripe if zones are different
          if (zone1 !== zone2) {
            return { zones: [zone1, zone2, zone1, zone2], isStriped: true, isProgressive: false };
          }
          // Same zone = solid color
          return { zones: [zone1], isStriped: false, isProgressive: false };
        }
        
        // Steady/hold sets: only solid if explicit "maintain" or "same pace" - not just "hold" 
        // Skip this if progression keywords are present (build then hold is still progressive)
        const hasPureSteady = /maintain.*pace|same pace|consistent pace/i.test(bodyText) && !hasProgression;
        if (hasPureSteady) {
          // Detect the actual zone level
          if (/strong|threshold/i.test(bodyText)) return { zones: ["hard"], isStriped: false, isProgressive: false };
          if (/fast|hard/i.test(bodyText)) return { zones: ["hard"], isStriped: false, isProgressive: false };
          if (/easy|relaxed/i.test(bodyText)) return { zones: ["moderate"], isStriped: false, isProgressive: false };
          return { zones: ["strong"], isStriped: false, isProgressive: false };
        }
        
        // Progression sets: build, descend, etc
        if (hasProgression) {
          // Determine start and end zones based on context
          let startZone = "moderate"; // Default start
          let endZone = "hard"; // Default end
          
          // Check for explicit start zone mentions
          if (/from easy|start easy|start relaxed/i.test(bodyText)) startZone = "easy";
          else if (/from moderate|start steady|start smooth/i.test(bodyText)) startZone = "moderate";
          
          // Check for explicit end zone mentions  
          if (hasFinalSprint || /to sprint|to max|to race pace|to full/i.test(bodyText)) {
            endZone = "fullgas";
          } else if (/to strong|strong effort/i.test(bodyText)) {
            endZone = "hard";
          } else if (/to fast|to hard|to threshold/i.test(bodyText)) {
            endZone = "hard";
          }
          
          // For main sets with build, start higher
          if (labelOnly.includes("main") && startZone === "easy") {
            startZone = "moderate";
          }
          
          // Fill the progression
          const progressionZones = fillZoneGap(startZone, endZone);
          return { zones: progressionZones, isStriped: false, isProgressive: true };
        }
        
        // Multi-line sets: parse each line's zone
        if (lines.length >= 2) {
          const lineZones = [];
          for (const line of lines) {
            const zone = detectLineZone(line);
            if (zone) lineZones.push(zone);
          }
          
          if (lineZones.length >= 2) {
            // Check if it's alternating (A-B-A-B pattern)
            const isAlternatingPattern = lineZones.length >= 3 && lineZones.every((z, i) => 
              z === lineZones[i % 2 === 0 ? 0 : 1]
            ) && lineZones[0] !== lineZones[1];
            
            if (isAlternatingPattern) {
              return { zones: lineZones.slice(0, 6), isStriped: true, isProgressive: false };
            }
            
            // Progressive: fill gaps between first and last
            const firstZone = lineZones[0];
            const lastZone = lineZones[lineZones.length - 1];
            if (firstZone !== lastZone) {
              return { zones: fillZoneGap(firstZone, lastZone), isStriped: false, isProgressive: true };
            }
          }
        }
        
        // Single zone detection for solid colors
        const singleZone = detectLineZone(bodyText);
        if (singleZone) {
          // Check for final sprint modifier - cap gradient at most one level above base
          // unless explicitly fullgas set already
          if (hasFinalSprint && singleZone !== "fullgas") {
            // Determine reasonable end zone - one level up from base, max hard for non-main sets
            const baseIdx = ZONE_ORDER.indexOf(singleZone);
            let endIdx = Math.min(baseIdx + 1, ZONE_ORDER.length - 1);
            // Only go to fullgas if base is already hard, or if label is main
            if (baseIdx >= ZONE_ORDER.indexOf("hard") || labelOnly.includes("main")) {
              endIdx = ZONE_ORDER.length - 1; // fullgas
            }
            const endZone = ZONE_ORDER[endIdx];
            if (singleZone !== endZone) {
              const progressionZones = fillZoneGap(singleZone, endZone);
              return { zones: progressionZones, isStriped: false, isProgressive: true };
            }
          }
          return { zones: [singleZone], isStriped: false, isProgressive: false };
        }
        
        // Default by label type with probability-based variety
        
        // Kick/Pull: mostly moderate (70%), sometimes strong (20%), occasionally hard (10%)
        if (labelOnly.includes("kick") || labelOnly.includes("pull")) {
          const kickRoll = nextRandom();
          if (kickRoll < 0.7) return { zones: ["moderate"], isStriped: false, isProgressive: false };
          if (kickRoll < 0.9) return { zones: ["strong"], isStriped: false, isProgressive: false };
          return { zones: ["hard"], isStriped: false, isProgressive: false };
        }
        
        // Build: 50% gradient (moderate→strong or moderate→hard), 50% solid
        if (labelOnly.includes("build")) {
          const buildGradientRoll = nextRandom();
          if (buildGradientRoll < 0.5) {
            return { zones: ["moderate", "strong"], isStriped: false, isProgressive: true };
          }
          // Solid color - mostly moderate, sometimes strong
          const buildZoneRoll = nextRandom();
          const zone = buildZoneRoll < 0.75 ? "moderate" : "strong";
          return { zones: [zone], isStriped: false, isProgressive: false };
        }
        
        // Main: 50% gradient, 50% solid. Sometimes moderate, sometimes hard
        // Fullgas ONLY allowed in main sets
        if (labelOnly.includes("main")) {
          const mainGradientRoll = nextRandom();
          if (mainGradientRoll < 0.5) {
            // Gradient - could go to hard or fullgas
            const mainEndRoll = nextRandom();
            const endZone = mainEndRoll < 0.3 ? "fullgas" : "hard";
            return { zones: fillZoneGap("strong", endZone), isStriped: false, isProgressive: true };
          }
          // Solid - variety of effort levels
          const mainSolidRoll = nextRandom();
          if (mainSolidRoll < 0.5) return { zones: ["strong"], isStriped: false, isProgressive: false };
          if (mainSolidRoll < 0.8) return { zones: ["hard"], isStriped: false, isProgressive: false };
          return { zones: ["moderate"], isStriped: false, isProgressive: false };
        }
        
        return { zones: ["moderate"], isStriped: false, isProgressive: false };
      }

      function getZoneSpan(label, body, variantSeed) {
        const timeline = parseEffortTimeline(label, body, variantSeed);
        
        // Single zone = solid color, no gradient needed
        if (timeline.zones.length <= 1) return null;
        
        // Return zones for gradient/stripe rendering
        return timeline.zones;
      }
      
      // Check if zones should be rendered as stripes vs gradient
      function isZoneStriped(label, body, variantSeed) {
        const timeline = parseEffortTimeline(label, body, variantSeed);
        return timeline.isStriped;
      }

      function getZoneColors(zone) {
        const root = document.documentElement;
        const getVar = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
        
        // Zone names: easy (blue), moderate (green), strong (yellow), hard (orange), fullgas (red)
        const zones = {
          easy: { bg: getVar('--zone-easy-bg', '#b9f0fd'), bar: getVar('--zone-easy-bar', '#7ac8db') },
          moderate: { bg: getVar('--zone-moderate-bg', '#cfffc0'), bar: getVar('--zone-moderate-bar', '#8fcc80') },
          strong: { bg: getVar('--zone-strong-bg', '#fcf3d5'), bar: getVar('--zone-strong-bar', '#d4c9a0') },
          hard: { bg: getVar('--zone-hard-bg', '#ffc374'), bar: getVar('--zone-hard-bar', '#cc9a4a') },
          fullgas: { bg: getVar('--zone-fullgas-bg', '#fe0000'), bar: getVar('--zone-fullgas-bar', '#cc0000') }
        };
        return zones[zone] || zones.moderate;
      }

      function gradientStyleForZones(zoneSpan, label, body, variantSeed) {
        if (!zoneSpan || zoneSpan.length < 2) return null;
        
        const colors = zoneSpan.map(z => getZoneColors(z));
        
        // Determine text color - white only if more than half is fullgas
        const fullgasCount = zoneSpan.filter(z => z === 'fullgas').length;
        const hardOrFullgasCount = zoneSpan.filter(z => z === 'fullgas' || z === 'hard').length;
        const textColor = (fullgasCount > zoneSpan.length / 2) ? '#fff' : '#111';
        
        // Check if this should be striped (alternating pattern) vs smooth gradient
        const shouldStripe = isZoneStriped(label, body, variantSeed);
        
        if (shouldStripe) {
          // Alternating patterns now use smooth blended gradients (not hard stripes)
          // This creates a wave-like transition between effort levels
          const bgStops = colors.map((c, i) => c.bg + ' ' + Math.round(i * 100 / (colors.length - 1)) + '%').join(', ');
          const bgGradient = 'linear-gradient(to bottom, ' + bgStops + ')';
          
          const barStops = colors.map((c, i) => c.bar + ' ' + Math.round(i * 100 / (colors.length - 1)) + '%').join(', ');
          const barGradient = 'linear-gradient(to bottom, ' + barStops + ')';
          
          return {
            background: bgGradient,
            barGradient: barGradient,
            borderColor: colors[0].bar,
            textColor: textColor
          };
        }
        
        // Smooth gradient for progressive builds
        const bgStops = colors.map((c, i) => c.bg + ' ' + Math.round(i * 100 / (colors.length - 1)) + '%').join(', ');
        const bgGradient = 'linear-gradient(to bottom, ' + bgStops + ')';
        
        const barStops = colors.map((c, i) => c.bar + ' ' + Math.round(i * 100 / (colors.length - 1)) + '%').join(', ');
        const barGradient = 'linear-gradient(to bottom, ' + barStops + ')';
        
        return {
          background: bgGradient,
          barGradient: barGradient,
          borderColor: colors[0].bar,
          textColor: textColor
        };
      }

      function colorStyleForEffort(effort, variantSeed) {
        // Zone-based colors using CSS variables for live color picker
        // Zone names: easy (blue), moderate (green), strong (yellow), hard (orange), fullgas (red)
        // variantSeed adds subtle gradient variety to prevent flat/boring cards
        const root = document.documentElement;
        const getVar = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
        const variant = (variantSeed || 0) % 4; // 4 gradient variants per zone
        
        if (effort === "easy") {
          const bg = getVar('--zone-easy-bg', '#b9f0fd');
          const bgLight = '#d4f7ff';
          // Variants: solid, subtle top-down, subtle left-right, subtle diagonal
          if (variant === 1) return "background:linear-gradient(to bottom, " + bgLight + ", " + bg + ");";
          if (variant === 2) return "background:linear-gradient(135deg, " + bgLight + " 0%, " + bg + " 100%);";
          return "background:" + bg + ";";
        }
        if (effort === "moderate") {
          const bg = getVar('--zone-moderate-bg', '#cfffc0');
          const bgLight = '#e0ffe0';
          if (variant === 1) return "background:linear-gradient(to bottom, " + bgLight + ", " + bg + ");";
          if (variant === 2) return "background:linear-gradient(135deg, " + bgLight + " 0%, " + bg + " 100%);";
          return "background:" + bg + ";";
        }
        if (effort === "strong") {
          const bg = getVar('--zone-strong-bg', '#fcf3d5');
          const bgLight = '#fffaea';
          const bgDark = '#f5e6b8';
          if (variant === 1) return "background:linear-gradient(to bottom, " + bgLight + ", " + bg + ");";
          if (variant === 2) return "background:linear-gradient(to bottom, " + bg + ", " + bgDark + ");";
          if (variant === 3) return "background:linear-gradient(135deg, " + bgLight + " 0%, " + bgDark + " 100%);";
          return "background:" + bg + ";";
        }
        if (effort === "hard") {
          const bg = getVar('--zone-hard-bg', '#ffc374');
          const bgLight = '#ffd9a8';
          const bgDark = '#ff9933';
          // More dramatic gradients for hard sets - makes them pop
          if (variant === 0) return "background:linear-gradient(to bottom, " + bgLight + ", " + bg + ");";
          if (variant === 1) return "background:linear-gradient(to bottom, " + bg + ", " + bgDark + ");";
          if (variant === 2) return "background:linear-gradient(135deg, " + bgLight + " 0%, " + bgDark + " 100%);";
          if (variant === 3) return "background:linear-gradient(180deg, " + bgLight + " 0%, " + bg + " 50%, " + bgDark + " 100%);";
          return "background:" + bg + ";";
        }
        if (effort === "fullgas") {
          const bg = getVar('--zone-fullgas-bg', '#fe0000');
          const bgLight = '#ff4444';
          const bgDark = '#cc0000';
          // Dramatic gradients for max intensity - really stands out
          if (variant === 0) return "background:linear-gradient(to bottom, " + bgLight + ", " + bg + "); color:#fff;";
          if (variant === 1) return "background:linear-gradient(to bottom, " + bg + ", " + bgDark + "); color:#fff;";
          if (variant === 2) return "background:linear-gradient(135deg, " + bgLight + " 0%, " + bgDark + " 100%); color:#fff;";
          if (variant === 3) return "background:linear-gradient(180deg, " + bgLight + " 0%, " + bg + " 40%, " + bgDark + " 100%); color:#fff;";
          return "background:" + bg + "; color:#fff;";
        }
        return "background:#fff;";
      }

      // Keep old functions for compatibility but mark deprecated
      function labelColorKey(label) {
        const k = String(label || "").toLowerCase();
        if (k.includes("warm")) return "warm";
        if (k.includes("build")) return "build";
        if (k.includes("drill")) return "drill";
        if (k.includes("kick")) return "kick";
        if (k.includes("pull")) return "pull";
        if (k.includes("main")) return "main";
        if (k.includes("cool")) return "cool";
        return "neutral";
      }

      function colorStyleForKey(key) {
        const k = String(key || "");
        if (k === "warm") return "background:linear-gradient(to right, #22c55e 4px, #f0fdf4 4px); border:1px solid #bbf7d0; border-left:4px solid #22c55e;";
        if (k === "build") return "background:linear-gradient(to right, #3b82f6 4px, #eff6ff 4px); border:1px solid #bfdbfe; border-left:4px solid #3b82f6;";
        if (k === "drill") return "background:linear-gradient(to right, #8b5cf6 4px, #f5f3ff 4px); border:1px solid #ddd6fe; border-left:4px solid #8b5cf6;";
        if (k === "kick") return "background:linear-gradient(to right, #f59e0b 4px, #fffbeb 4px); border:1px solid #fde68a; border-left:4px solid #f59e0b;";
        if (k === "pull") return "background:linear-gradient(to right, #f97316 4px, #fff7ed 4px); border:1px solid #fed7aa; border-left:4px solid #f97316;";
        if (k === "main") return "background:linear-gradient(to right, #ef4444 4px, #fef2f2 4px); border:1px solid #fecaca; border-left:4px solid #ef4444;";
        if (k === "cool") return "background:linear-gradient(to right, #06b6d4 4px, #ecfeff 4px); border:1px solid #a5f3fc; border-left:4px solid #06b6d4;";
        return "background:#fff; border:1px solid #e7e7e7;";
      }

      function captureSummary(payload, workoutText) {
        const units = unitShortFromPayload(payload);
        const requested = Number(payload.distance);

        const poolText = poolLabelFromPayload(payload);

        const paceSec = parsePaceToSecondsPer100(payload.thresholdPace || "");
        window.__swgSummary = {
          units: units,
          requested: requested,
          poolText: poolText,
          paceSec: paceSec,
          workoutText: String(workoutText || "")
        };
      }

      function extractFooterInfo(footerLines) {
        const info = {
          totalLengthsLine: null,
          endsLine: null,
          requestedLine: null,
          totalDistanceLine: null,
          estTotalTimeLine: null
        };

        if (!Array.isArray(footerLines)) return info;

        for (const line of footerLines) {
          const t = String(line || "").trim();
          if (!t) continue;

          if (t.startsWith("Total lengths:")) info.totalLengthsLine = t;
          else if (t.startsWith("Ends at start end:")) info.endsLine = t;
          else if (t.startsWith("Requested:")) info.requestedLine = t;
          else if (t.startsWith("Total distance:")) info.totalDistanceLine = t;
          else if (t.startsWith("Est total time:")) info.estTotalTimeLine = t;
        }

        return info;
      }

      function renderFooterTotalsAndMeta(footerLines) {
        const s = window.__swgSummary || { units: "", requested: null, poolText: "", paceSec: null };
        const info = extractFooterInfo(footerLines);

        // Extract total distance for the yellow Total box
        let totalDistStr = "";
        if (info.totalDistanceLine) {
          const match = info.totalDistanceLine.match(/Total distance:\\s*(\\d+)/);
          if (match) totalDistStr = match[1] + (s.units || "m");
        } else if (Number.isFinite(s.requested)) {
          totalDistStr = String(s.requested) + (s.units || "m");
        }

        // Show yellow Total box (prepared for fade-in, triggered by main animation)
        if (totalDistStr) {
          totalText.textContent = "Total " + totalDistStr;
          totalBox.style.opacity = "0";
          totalBox.style.transform = "translateY(16px)";
          totalBox.style.transition = "none";
          totalBox.style.display = "block";
        } else {
          totalBox.style.display = "none";
        }

        // Build summary chips (without Total since it's in yellow box now)
        const chips = [];
        if (s.poolText) chips.push("Pool: " + s.poolText);
        if (info.totalLengthsLine) chips.push(info.totalLengthsLine);
        if (info.estTotalTimeLine) chips.push(info.estTotalTimeLine);

        const seen = new Set();
        const deduped = [];
        for (const c of chips) {
          const k = String(c);
          if (seen.has(k)) continue;
          seen.add(k);
          deduped.push(k);
        }

        if (!deduped.length) {
          footerBox.style.display = "none";
          footerBox.innerHTML = "";
          return;
        }

        const f = [];
        f.push("<div style=\\"display:flex; flex-wrap:wrap; gap:10px;\\">");

        for (const c of deduped) {
          f.push("<div class=\\"readChip\\" style=\\"padding:6px 10px; border-radius:8px; font-weight:700;\\">" + safeHtml(c) + "</div>");
        }

        f.push("</div>");
        
        // Add emoji intensity strip
        const intensityStrip = renderEmojiIntensityStrip();
        if (intensityStrip) {
          f.push(intensityStrip);
        }
        
        footerBox.innerHTML = f.join("");
        footerBox.style.opacity = "0";
        footerBox.style.transform = "translateY(16px)";
        footerBox.style.transition = "none";
        footerBox.style.display = "block";
      }
      
      // Emoji intensity strip - 5 faces with gradient background like CardGym
      function renderEmojiIntensityStrip() {
        // Calculate intensity from rendered cards
        const cards = document.querySelectorAll('[data-effort]');
        if (!cards.length) return null;
        
        let intensitySum = 0;
        let count = 0;
        
        cards.forEach(card => {
          const effort = card.getAttribute('data-effort');
          const effortValues = { easy: 1, steady: 2, moderate: 3, strong: 4, hard: 5, fullgas: 5 };
          if (effortValues[effort]) {
            intensitySum += effortValues[effort];
            count++;
          }
        });
        
        if (count === 0) return null;
        
        const avgIntensity = intensitySum / count;
        
        // Map average to 1-5 scale for display
        const level = Math.min(5, Math.max(1, Math.round(avgIntensity)));
        
        // 5 dolphin icons from easy to hard
        const dolphinIcons = [
          '/assets/dolphins/dolphin-easy.png',
          '/assets/dolphins/dolphin-moderate.png',
          '/assets/dolphins/dolphin-strong.png',
          '/assets/dolphins/dolphin-threshold.png',
          '/assets/dolphins/dolphin-fullgas.png'
        ];
        const iconAlts = ['Easy', 'Moderate', 'Strong', 'Threshold', 'Full Gas'];
        
        // Gradient background colors matching CardGym: blue -> green -> yellow -> orange -> red
        const bgColors = ['#b9f0fd', '#cfffc0', '#fcf3d5', '#ffc374', '#fe5050'];
        
        let strip = '<div style=\\"margin-top:6px;\\">';
        
        // Scroll wrapper. On big phones you should see all 5 without scrolling.
        // On smaller widths it can swipe.
        strip += '<div class=\\"effortScrollWrap\\">';
        
        // Inner strip: full width, but won't collapse below 360px.
        strip += '<div class=\\"effortStrip\\">';
        
        for (let i = 0; i < 5; i++) {
          strip += '<div class=\\"effortTile\\" style=\\"background:' + bgColors[i] + ';\\">';
          strip += '<img class=\\"effortIcon\\" src=\\"' + dolphinIcons[i] + '\\" alt=\\"' + iconAlts[i] + '\\">';
          strip += '</div>';
        }
        
        strip += '</div></div></div>';
        return strip;
      }
  `;
  const HOME_JS_RENDER_CARDS = `
      // Persistent Map to track reroll counts per set index (survives innerHTML replacement)
      const rerollCountMap = new Map();
      
      function computeSetDistanceFromBody(body) {
        const t = String(body || "");
        let sum = 0;

        // Split by newlines to handle multi-line set bodies
        const lines = t.split(/\\n/);
        
        for (const line of lines) {
          // Support x and × for NxD format (8x50, 4×100, etc)
          const re = /(\\d+)\\s*[x×]\\s*(\\d+)\\s*(m|yd)?/gi;
          let m;
          while ((m = re.exec(line)) !== null) {
            const reps = Number(m[1]);
            const dist = Number(m[2]);
            if (Number.isFinite(reps) && Number.isFinite(dist)) sum += reps * dist;
          }
          
          // Also check for standalone distances like "200 easy" without NxD
          // Only if this line had no NxD matches
          if (!/(\\d+)\\s*[x×]\\s*(\\d+)/i.test(line)) {
            const standaloneMatch = line.match(/(^|\\s)(\\d{2,5})(\\s*(m|yd|meters|yards))?(\\s|$)/i);
            if (standaloneMatch) {
              const v = Number(standaloneMatch[2]);
              if (Number.isFinite(v) && v >= 25 && v <= 5000) sum += v;
            }
          }
        }

        return sum > 0 ? sum : null;
      }

      function computeRestSecondsFromBody(body) {
        // Sum an estimate of rest for repeats where "rest 15s" appears.
        const t = String(body || "");
        const reSeg = /(\\d+)\\s*[x×]\\s*(\\d+)[^\\n]*?rest\\s*(\\d+)\\s*s/gi;
        let sum = 0;
        let m;
        while ((m = reSeg.exec(t)) !== null) {
          const reps = Number(m[1]);
          const rest = Number(m[3]);
          if (Number.isFinite(reps) && reps >= 2 && Number.isFinite(rest) && rest >= 0) {
            sum += (reps - 1) * rest;
          }
        }
        return sum;
      }
      
      function extractRestDisplay(body) {
        // Extract all rest display values from set body (may have multiple lines)
        const t = String(body || "");
        const matches = [];
        const re = /rest\\s*(\\d+)\\s*s/gi;
        let m;
        while ((m = re.exec(t)) !== null) {
          const val = m[1] + "s";
          if (!matches.includes(val)) matches.push(val);
        }
        // Return unique rest values joined, or null if none
        return matches.length ? matches.join("/") : null;
      }
      
      function stripRestFromBody(body) {
        // Remove "rest XXs" from each line for cleaner display
        return String(body || "")
          .split("\\n")
          .map(line => line.replace(/\\s*rest\\s*\\d+\\s*s/gi, "").trim())
          .filter(line => line.length > 0)
          .join("\\n");
      }

      function estimateSwimSeconds(body, paceSecPer100, label) {
        if (!Number.isFinite(paceSecPer100) || paceSecPer100 <= 0) return null;

        const dist = computeSetDistanceFromBody(body);
        if (!Number.isFinite(dist) || dist <= 0) return null;

        const k = String(label || "").toLowerCase();

        // Multipliers relative to threshold pace
        // Warm up slower, drills slower, main around threshold, sprint slightly faster but more rest.
        let mult = 1.15;
        if (k.includes("warm")) mult = 1.25;
        else if (k.includes("build")) mult = 1.18;
        else if (k.includes("drill")) mult = 1.30;
        else if (k.includes("kick")) mult = 1.38;
        else if (k.includes("pull")) mult = 1.25;
        else if (k.includes("main")) mult = 1.05;
        else if (k.includes("cool")) mult = 1.35;

        const swim = (dist / 100) * paceSecPer100 * mult;

        const rest = computeRestSecondsFromBody(body);
        return swim + rest;
      }

      function renderCards(payload, workoutText) {
        // Clear reroll counts for fresh workout generation
        rerollCountMap.clear();
        
        const parts = splitWorkout(workoutText);
        const setLines = parts.setLines || [];
        const footerLines = parts.footerLines || [];

        if (!setLines.length) {
          cards.style.display = "none";
          return false;
        }

        const sections = [];
        for (const line of setLines) {
          const parsed = parseSetLine(line);
          const labelCanon = canonicalizeLabel(parsed.label);

          if (labelCanon) {
            sections.push({ label: labelCanon, bodies: [parsed.body] });
          } else if (sections.length) {
            sections[sections.length - 1].bodies.push(parsed.body);
          } else {
            sections.push({ label: null, bodies: [parsed.body] });
          }
        }

        const paceSec = parsePaceToSecondsPer100(payload.thresholdPace || "");

        const html = [];
        html.push('<div style="display:flex; flex-direction:column; gap:10px;">');

        let idx = 0;

        for (const s of sections) {
          idx += 1;

          const label = s.label ? s.label : ("Set " + idx);
          const body = s.bodies.filter(Boolean).join("\\n");

          const setDist = computeSetDistanceFromBody(body);
          const restDisplay = extractRestDisplay(body);

          const estSec = estimateSwimSeconds(body, paceSec, label);
          
          // Get unit for display
          const unitShort = unitShortFromPayload(payload);

          const effortLevel = getEffortLevel(label, body);
          const variantSeed = idx * 7 + body.length;
          const zoneSpan = getZoneSpan(label, body, variantSeed);
          const gradientStyle = zoneSpan ? gradientStyleForZones(zoneSpan, label, body, variantSeed) : null;
          
          let boxStyle;
          let textColor = '#111';
          const dropShadow = "0 6px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.25)";
          
          if (gradientStyle) {
            // Gradient cards: full box color + drop shadow (no left bar)
            boxStyle = "background:" + gradientStyle.background + "; border:none; box-shadow:" + dropShadow + ";";
            textColor = gradientStyle.textColor || '#111';
          } else {
            // Solid color cards with drop shadow - use idx as variant seed for gradient variety
            boxStyle = colorStyleForEffort(effortLevel, idx) + " box-shadow:" + dropShadow + ";";
            // White text only on full red (fullgas)
            if (effortLevel === 'fullgas') {
              textColor = '#fff';
            }
          }
          
          html.push('<div data-effort="' + effortLevel + '" style="' + boxStyle + ' border-radius:12px; padding:12px;">');

          const subTextColor = textColor === '#fff' ? '#eee' : '#666';
          const distColor = textColor === '#fff' ? '#99ccff' : '#0055aa';
          const restColor = textColor === '#fff' ? '#ffcccc' : '#c41e3a';
          const bodyClean = stripRestFromBody(body);

          // Main layout: left column (title + detail) | right column (dolphin + metres)
          html.push('<div class="setHeaderRow">');
          
          // Left column: title and detail lines
          html.push('<div style="flex:1; min-width:0;">');
          html.push('<div style="font-weight:700; color:' + textColor + '; margin-bottom:6px;">' + safeHtml(label) + '</div>');
          html.push('<div data-set-body="' + safeHtml(String(idx)) + '" data-original-body="' + safeHtml(body) + '" style="white-space:pre-wrap; line-height:1.35; font-weight:600; color:' + textColor + ';">' + safeHtml(bodyClean) + "</div>");
          if (restDisplay) {
            html.push('<div style="color:' + restColor + '; font-weight:600; font-size:14px; margin-top:4px;">' + safeHtml(restDisplay) + "</div>");
          }
          if (Number.isFinite(estSec)) {
            html.push('<div style="font-size:12px; color:' + subTextColor + '; margin-top:4px;">Est: ' + fmtMmSs(estSec) + "</div>");
          }
          html.push("</div>");
          
          // Right column: dolphin aligned with title, metres aligned with detail
          html.push('<div class="setRightCol">');
          html.push(
            '<button type="button" data-reroll-set="' +
              safeHtml(String(idx)) +
              '" style="padding:0; border-radius:8px; border:none; background:transparent; cursor:pointer; line-height:1;" title="Reroll this set">' +
              '<span class="reroll-dolphin setDolphin"><img class="dolphinIcon setDolphinSpinTarget" src="/assets/dolphins/dolphin-base.png" alt=""></span>' +
            "</button>"
          );
          if (Number.isFinite(setDist)) {
            html.push('<div class="setMeters" style="font-size:14px; white-space:nowrap; color:' + distColor + ';">' + String(setDist) + unitShort + "</div>");
          }
          html.push("</div>");
          
          html.push("</div>");

          html.push("</div>");
        }

        html.push("</div>");

        cards.innerHTML = html.join("");
        cards.style.display = "block";

        const rerollButtons = cards.querySelectorAll("button[data-reroll-set]");
        for (const btn of rerollButtons) {
          btn.addEventListener("click", async () => {
            const setIndex = Number(btn.getAttribute("data-reroll-set"));
            const bodyEl = cards.querySelector('[data-set-body="' + String(setIndex) + '"]');
            if (!bodyEl) return;

            // Use original body (with rest) for avoidText matching, display body for distance calc
            const originalBody = bodyEl.getAttribute("data-original-body") || "";
            const displayBody = bodyEl.textContent || "";
            const currentDist = computeSetDistanceFromBody(displayBody);

            if (!Number.isFinite(currentDist)) {
              renderError("Cannot reroll this set", ["Set distance could not be parsed. Ensure it contains NxD segments like 8x50, 4x100, or a single distance like 600."]);
              return;
            }

            // Increment reroll counter using persistent Map (survives innerHTML replacement)
            const prevCount = rerollCountMap.get(setIndex) || 0;
            const rerollCount = prevCount + 1;
            rerollCountMap.set(setIndex, rerollCount);

            if (btn.dataset.busy === "1") return;
            btn.dataset.busy = "1";
            btn.blur();
            const spinTarget = btn.querySelector('.setDolphinSpinTarget');
            if (spinTarget) {
              spinTarget.classList.add('spinning');
            }

            try {
              const res = await fetch("/reroll-set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  poolLength: payload.poolLength,
                  poolLengthUnit: payload.poolLengthUnit,
                  customPoolLength: payload.customPoolLength,
                  thresholdPace: payload.thresholdPace || "",
                  focus: payload.focus || "allround",
                  restPref: payload.restPref || "balanced",
                  includeKick: !!payload.includeKick,
                  includePull: !!payload.includePull,
                  equip_fins: !!payload.equip_fins,
                  equip_paddles: !!payload.equip_paddles,
                  stroke_freestyle: !!payload.stroke_freestyle,
                  stroke_backstroke: !!payload.stroke_backstroke,
                  stroke_breaststroke: !!payload.stroke_breaststroke,
                  stroke_butterfly: !!payload.stroke_butterfly,
                  label: (sections[setIndex - 1] && sections[setIndex - 1].label) ? sections[setIndex - 1].label : null,
                  targetDistance: currentDist,
                  avoidText: originalBody,
                  rerollCount: rerollCount
                }),
              });

              const data = await res.json().catch(() => null);
              if (!res.ok || !data || data.ok !== true) {
                const msg = data && data.error ? data.error : ("HTTP " + res.status);
                renderError("Reroll failed", [msg]);
                return;
              }

              const nextBody = String(data.setBody || "").trim();
              if (!nextBody) {
                renderError("Reroll failed", ["Empty set returned."]);
                return;
              }

              // Strip rest from display and update rest column
              const nextBodyClean = stripRestFromBody(nextBody);
              const nextRest = extractRestDisplay(nextBody);
              bodyEl.textContent = nextBodyClean;
              bodyEl.setAttribute("data-original-body", nextBody);

              // Update card color based on new effort level
              const cardContainer = bodyEl.closest('[data-effort]');
              if (cardContainer) {
                const label = sections[setIndex - 1] && sections[setIndex - 1].label ? sections[setIndex - 1].label : "";
                const newEffort = getEffortLevel(label, nextBody);
                cardContainer.setAttribute('data-effort', newEffort);
                // Use Date.now() for true randomness - ensures different styling each reroll
                const nowMs = Date.now();
                const newVariantSeed = (nowMs ^ (rerollCount * 7919) ^ nextBody.length) >>> 0;
                const newZoneSpan = getZoneSpan(label, nextBody, newVariantSeed);
                const newGradientStyle = newZoneSpan ? gradientStyleForZones(newZoneSpan, label, nextBody, newVariantSeed) : null;
                let newStyle;
                let newTextColor = '#111';
                const dropShadow = "0 6px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.25)";
                
                if (newGradientStyle) {
                  newStyle = "background:" + newGradientStyle.background + "; border:none; box-shadow:" + dropShadow + ";";
                  newTextColor = newGradientStyle.textColor || '#111';
                } else {
                  // Use nowMs for true randomness on solid color variant
                  newStyle = colorStyleForEffort(newEffort, nowMs) + " box-shadow:" + dropShadow + ";";
                  // White text only on full red (fullgas)
                  if (newEffort === 'fullgas') {
                    newTextColor = '#fff';
                  }
                }
                cardContainer.style.cssText = newStyle + " border-radius:12px; padding:12px;";
                
                // Update text colors for body and other elements
                bodyEl.style.color = newTextColor;
                const labelEl = cardContainer.querySelector('div[style*="font-weight:700"]');
                if (labelEl) labelEl.style.color = newTextColor;
                
                // Update rest color
                const restEl = bodyEl.nextElementSibling;
                const restColor = newTextColor === '#fff' ? '#ffcccc' : '#c41e3a';
                if (restEl) {
                  restEl.style.color = restColor;
                  if (nextRest) {
                    restEl.textContent = nextRest;
                    restEl.style.display = "";
                  } else {
                    restEl.textContent = "";
                  }
                }
                
                // Update distance color - always blue (royal blue for light, light blue for dark)
                const distanceContainer = restEl ? restEl.nextElementSibling : null;
                if (distanceContainer) {
                  const distEl = distanceContainer.querySelector('div:first-child');
                  const estEl = distanceContainer.querySelector('div:last-child');
                  const distColor = newTextColor === '#fff' ? '#99ccff' : '#0055aa';
                  if (distEl) distEl.style.color = distColor;
                  if (estEl && estEl !== distEl) estEl.style.color = newTextColor === '#fff' ? '#eee' : '#666';
                }
              } else {
                // Fallback: just update rest column
                const restEl = bodyEl.nextElementSibling;
                if (restEl) {
                  if (nextRest) {
                    restEl.textContent = nextRest;
                    restEl.style.display = "";
                  } else {
                    restEl.textContent = "";
                  }
                }
              }
            } catch (e) {
              renderError("Reroll failed", [String(e && e.message ? e.message : e)]);
            } finally {
              // Wait for the full 1.25s spin animation to complete before removing class
              const spinTarget = btn.querySelector('.setDolphinSpinTarget');
              await new Promise(r => setTimeout(r, 1250));
              btn.dataset.busy = "0";
              if (spinTarget) {
                spinTarget.classList.remove('spinning');
              }
            }
          });
        }

        renderFooterTotalsAndMeta(footerLines);

        return true;
      }
  `;
  const HOME_JS_RENDER_GLUE = `
      // Dolphin animation stabilisation
      // - single helper path for all generator dolphins
      // - cancels overlapping timers
      // - forces CSS animation restart
      // - tokenises runs to prevent overlap
      let __dolphinAnimToken = 0;
      let __dolphinAnimTimers = [];

      function __clearDolphinAnimTimers() {
        for (const t of __dolphinAnimTimers) clearTimeout(t);
        __dolphinAnimTimers = [];
      }

      function __forceRestartSpin(el) {
        if (!el) return;
        el.classList.remove("dolphinSpin");
        // Force reflow so the CSS animation restarts reliably
        void el.offsetWidth;
        el.classList.add("dolphinSpin");
      }

      function dolphinAnimBegin(mainEl, extraEls, activeBtn) {
        __dolphinAnimToken += 1;
        const token = __dolphinAnimToken;

        __clearDolphinAnimTimers();

        const all = [mainEl].concat(Array.isArray(extraEls) ? extraEls : []).filter(Boolean);

        // Ensure baseline state
        for (const el of all) {
          if (!el.innerHTML || !String(el.innerHTML).trim()) el.innerHTML = '<img class="dolphinIcon" src="/assets/dolphins/dolphin-base.png" alt="">';
          el.dataset.spinStartedAt = String(Date.now());
          __forceRestartSpin(el);
        }

        if (activeBtn) activeBtn.classList.add("active");
        return token;
      }

      function dolphinAnimFinish(mainEl, extraEls, activeBtn, onSplashShown) {
        const token = __dolphinAnimToken;
        const all = [mainEl].concat(Array.isArray(extraEls) ? extraEls : []).filter(Boolean);

        const SPIN_MS = 800;           // one full loop (sped up from 1000)
        const FADE_MS = 200;           // cross-fade chunk
        const SPLASH_HOLD_MS = 1000;   // keep splash visible
        const IDLE_FADEIN_MS = 200;    // dolphin fade back in

        const started = Number(mainEl && mainEl.dataset ? (mainEl.dataset.spinStartedAt || "0") : "0");
        const elapsed = started ? (Date.now() - started) : SPIN_MS;
        const wait = Math.max(0, SPIN_MS - elapsed);

        __clearDolphinAnimTimers();

        __dolphinAnimTimers.push(setTimeout(() => {
          if (token !== __dolphinAnimToken) return;

          // Stop spinning
          for (const el of all) el.classList.remove("dolphinSpin");

          // Crossfade: dolphin fades out AND splash fades in simultaneously
          for (const el of all) {
            // Create splash element with fixed angle class
            const splashSpan = document.createElement("span");
            splashSpan.className = "splashFixed";
            splashSpan.textContent = "💦";
            splashSpan.style.position = "absolute";
            splashSpan.style.top = "50%";
            splashSpan.style.left = "50%";
            splashSpan.style.translate = "-50% -50%";
            splashSpan.style.fontSize = "inherit";
            splashSpan.style.opacity = "0";
            splashSpan.style.transition = "opacity " + FADE_MS + "ms ease";
            
            // Position container relatively if needed
            if (getComputedStyle(el).position === "static") {
              el.style.position = "relative";
            }
            
            // Start dolphin fade out
            const dolphinImg = el.querySelector("img");
            if (dolphinImg) {
              dolphinImg.style.transition = "opacity " + FADE_MS + "ms ease";
              dolphinImg.style.opacity = "0";
            }
            
            // Insert splash and fade in at same time
            el.appendChild(splashSpan);
            void splashSpan.offsetWidth;
            splashSpan.style.opacity = "1";
          }

          // Trigger scroll/reveal callback after splash is clearly visible (150ms delay)
          __dolphinAnimTimers.push(setTimeout(() => {
            if (typeof onSplashShown === "function") {
              try { onSplashShown(); } catch (e) { console.error("onSplashShown error:", e); }
            }
          }, FADE_MS + 150));

          // Hold splash, then fade out and reset to idle dolphin
          __dolphinAnimTimers.push(setTimeout(() => {
            if (token !== __dolphinAnimToken) return;

            // Fade out splash
            for (const el of all) {
              const splash = el.querySelector(".splashFixed");
              if (splash) {
                splash.style.transition = "opacity " + FADE_MS + "ms ease";
                splash.style.opacity = "0";
              }
            }

            __dolphinAnimTimers.push(setTimeout(() => {
              if (token !== __dolphinAnimToken) return;

              for (let i = 0; i < all.length; i++) {
                const el = all[i];
                const isMain = (i === 0);
                const imgClass = isMain ? "dolphinIcon dolphinIcon--generate" : "dolphinIcon";
                // Remove splash and restore dolphin
                const splash = el.querySelector(".splashFixed");
                if (splash) splash.remove();
                const oldImg = el.querySelector("img");
                if (oldImg) oldImg.remove();
                
                const newImg = document.createElement("img");
                newImg.className = imgClass;
                newImg.src = "/assets/dolphins/dolphin-base.png";
                newImg.alt = "";
                newImg.style.opacity = "0";
                newImg.style.transition = "opacity " + IDLE_FADEIN_MS + "ms ease";
                el.appendChild(newImg);
                void newImg.offsetWidth;
                newImg.style.opacity = "1";
              }

              // Explicit final reset after dolphin fade-in completes
              __dolphinAnimTimers.push(setTimeout(() => {
                if (token !== __dolphinAnimToken) return;
                for (const el of all) {
                  el.style.position = "";
                  el.style.display = "";
                  el.style.opacity = "1";
                  el.style.transform = "";
                  el.style.transition = "";
                  el.classList.remove("animating");
                }
                if (activeBtn) activeBtn.classList.remove("active");
              }, IDLE_FADEIN_MS));
            }, FADE_MS));
          }, SPLASH_HOLD_MS));
        }, wait));
      }

      function renderAll(payload, workoutText) {
        captureSummary(payload, workoutText);
        const ok = renderCards(payload, workoutText);
        return ok;
      }
  `;
  const HOME_JS_RENDER = HOME_JS_RENDER_CORE + HOME_JS_RENDER_CARDS + HOME_JS_RENDER_GLUE;
  const HOME_JS_EVENTS = `
      function setActivePool(poolValue) {
        poolHidden.value = poolValue;

        const isCustom = poolValue === "custom";

        if (isCustom) {
          advancedWrap.style.display = "block";
          if (advancedChip) {
            advancedChip.innerHTML = "▼ Advanced options";
            advancedChip.classList.add("whiteChipActive");
          }
        } else {
          customLen.value = "";
          customUnit.value = "meters";
        }

        for (const btn of poolButtons.querySelectorAll("button[data-pool]")) {
          const isActive = btn.getAttribute("data-pool") === poolValue;
          if (isActive) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        }
      }

      poolButtons.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-pool]");
        if (!btn) return;
        setActivePool(btn.getAttribute("data-pool"));
      });

      distanceSlider.addEventListener("input", (e) => {
        setDistance(e.target.value);
      });

      // Track last selected pool button for reversion
      let lastPoolBtn = "25m";

      // Custom pool length input: auto-select custom mode when user types a value
      customLen.addEventListener("input", () => {
        const val = customLen.value.trim();
        if (val && !isNaN(Number(val)) && Number(val) > 0) {
          // Valid number entered: switch to custom pool mode
          poolHidden.value = "custom";
          // Clear active class from tier buttons
          for (const btn of poolButtons.querySelectorAll("button[data-pool]")) {
            btn.classList.remove("active");
          }
          // Expand advanced options if not already open
          if (advancedWrap.style.display === "none") {
            advancedWrap.style.display = "block";
            if (advancedChip) {
              advancedChip.innerHTML = "▼ Advanced options";
              advancedChip.classList.add("whiteChipActive");
            }
          }
        } else {
          // Cleared or invalid: revert to last selected pool button
          // This restores both the hidden value and button active state
          setActivePool(lastPoolBtn);
        }
      });

      // Update lastPoolBtn when user clicks a pool button (capture phase to run before setActivePool)
      poolButtons.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-pool]");
        if (btn) {
          lastPoolBtn = btn.getAttribute("data-pool");
        }
      }, true);

      toggleAdvanced.addEventListener("click", () => {
        const open = advancedWrap.style.display !== "none";
        if (open) {
          advancedWrap.style.display = "none";
          if (advancedChip) {
            advancedChip.innerHTML = "▶ Advanced options";
            advancedChip.classList.remove("whiteChipActive");
          }
        } else {
          advancedWrap.style.display = "block";
          if (advancedChip) {
            advancedChip.innerHTML = "▼ Advanced options";
            advancedChip.classList.add("whiteChipActive");
          }
        }
      });

      copyBtn.addEventListener("click", async () => {
        const text = copyBtn.dataset.copyText || "";
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          statusPill.textContent = "Copied.";
          setTimeout(() => {
            if (statusPill.textContent === "Copied.") statusPill.innerHTML = "";
          }, 1200);
        } catch {
          statusPill.textContent = "Copy failed.";
          setTimeout(() => {
            if (statusPill.textContent === "Copy failed.") statusPill.innerHTML = "";
          }, 1200);
        }
      });

      function formToPayload() {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());

        // Normalize checkboxes (present => "on")
        const boolNames = [
          "stroke_freestyle",
          "stroke_backstroke",
          "stroke_breaststroke",
          "stroke_butterfly",
          "includeKick",
          "includePull",
          "equip_fins",
          "equip_paddles"
        ];
        for (const n of boolNames) payload[n] = payload[n] === "on";

        return payload;
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // STEP 0: Check if there's an existing workout to fade out
        const hasExistingWorkout = cards.innerHTML.trim().length > 0 && cards.style.display !== "none";
        const nameDisplay = document.getElementById("workoutNameDisplay");
        
        if (hasExistingWorkout) {
          // Store current height to prevent layout jump
          const currentHeight = cards.offsetHeight;
          cards.style.minHeight = currentHeight + "px";
          
          // Fade out existing workout and title
          cards.classList.add("workout-fade-out");
          if (nameDisplay && nameDisplay.style.display !== "none") {
            nameDisplay.classList.add("workout-fade-out");
          }
          
          // Wait for fade-out to complete (0.7s animation)
          await new Promise(r => setTimeout(r, 700));
          
          // Remove fade-out class and clear
          cards.classList.remove("workout-fade-out");
          if (nameDisplay) nameDisplay.classList.remove("workout-fade-out");
        }
        
        clearUI();
        
        // Reset min-height after clearing
        cards.style.minHeight = "";
        // Dolphin animation (stabilised)
        const regenDolphin = document.getElementById("regenDolphin");
        dolphinAnimBegin(dolphinLoader, [regenDolphin], generateBtn);
        statusPill.textContent = "";

        const payload = formToPayload();
        const isCustom = payload.poolLength === "custom";
        if (isCustom) {
          if (!payload.customPoolLength) {
            dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn);
            statusPill.textContent = "";
            renderError("Error", ["Enter a custom pool length."]);
            return;
          }
          payload.customPoolLength = Number(payload.customPoolLength);
        } else {
          delete payload.customPoolLength;
          payload.poolLengthUnit = "meters";
        }

        try {
          const lastFp = loadLastWorkoutFingerprint();

          const res = await fetch("/generate-workout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, lastWorkoutFp: lastFp })
          });

          let data = null;
          try {
            data = await res.json();
          } catch {
          }

          if (!res.ok) {
            dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn);
            statusPill.textContent = "";
            const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ("HTTP " + res.status);
            renderError("Request failed", [msg].filter(Boolean));
            return;
          }

          if (!data || data.ok !== true) {
            dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn);
            statusPill.textContent = "";
            const msg = data && data.error ? data.error : "Unknown error.";
            renderError("Generation failed", [msg].filter(Boolean));
            return;
          }

          const workoutText = String(data.workoutText || "").trim();
          const workoutName = String(data.workoutName || "").trim();

          if (!workoutText) {
            dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn);
            statusPill.textContent = "";
            renderError("No workout returned", ["workoutText was empty."]);
            return;
          }
          statusPill.textContent = "";
          // STEP 1: Setup title and cards for fade-in (both invisible initially)
          const nameDisplayEl = document.getElementById("workoutNameDisplay");
          const nameText = document.getElementById("workoutNameText");
          
          // Prepare workout name (invisible initially)
          if (workoutName && nameDisplayEl && nameText) {
            nameText.textContent = workoutName;
            nameDisplayEl.style.opacity = "0";
            nameDisplayEl.style.transform = "translateY(16px)";
            nameDisplayEl.style.transition = "none";
            nameDisplayEl.style.display = "block";
          } else if (nameDisplayEl) {
            nameDisplayEl.style.display = "none";
          }

          // Prepare cards (invisible initially)
          cards.style.opacity = "0";
          cards.style.transform = "translateY(20px)";
          cards.style.transition = "none";

          const ok = renderAll(payload, workoutText);
          if (!ok) {
            raw.textContent = workoutText;
            raw.style.display = "block";
          }

          // Force reflow to reset animation state (critical for consistent behavior)
          void cards.offsetWidth;
          if (nameDisplayEl) void nameDisplayEl.offsetWidth;

          // Dolphin animation finish with callback when splash appears
          dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn, () => {
            // STEP 2: Scroll to workout area when splash is visible
            const scrollTarget = nameDisplayEl && nameDisplayEl.style.display !== "none" ? nameDisplayEl : cards;
            if (scrollTarget) {
              scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // STEP 3: Fade in content after scroll starts
            setTimeout(() => {
              // Fade in title first (0.7s)
              if (nameDisplayEl && nameDisplayEl.style.display !== "none") {
                nameDisplayEl.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
                nameDisplayEl.style.opacity = "1";
                nameDisplayEl.style.transform = "translateY(0)";
              }
              
              // Fade in cards (0.7s)
              cards.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
              cards.style.opacity = "1";
              cards.style.transform = "translateY(0)";
              
              // Fade in Total and Summary at the same time
              if (totalBox.style.display !== "none") {
                void totalBox.offsetWidth;
                totalBox.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
                totalBox.style.opacity = "1";
                totalBox.style.transform = "translateY(0)";
              }
              if (footerBox.style.display !== "none") {
                void footerBox.offsetWidth;
                footerBox.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
                footerBox.style.opacity = "1";
                footerBox.style.transform = "translateY(0)";
              }
            }, 500);
          });

          const fp = fingerprintWorkoutText(workoutText);
          saveLastWorkoutFingerprint(fp);

          copyBtn.disabled = false;
          copyBtn.dataset.copyText = workoutText;
        } catch (err) {
            dolphinAnimFinish(dolphinLoader, [regenDolphin], generateBtn);
          statusPill.textContent = "";
          renderError("Network error", [String(err && err.message ? err.message : err)]);
        }
      });
      
      // Wire up regen button to trigger Generate
      const regenBtn = document.getElementById("regenBtn");
      if (regenBtn) {
        regenBtn.addEventListener("click", () => {
          const gen = document.getElementById("generateBtn");
          if (gen) gen.click();
        });
      }
      
      // Wire up workout title area regen and bg buttons
      document.getElementById("regenBtn2")?.addEventListener("click", () => {
        document.getElementById("generateBtn")?.click();
      });
      document.getElementById("bgCycleBtn2")?.addEventListener("click", () => {
        document.getElementById("bgCycleBtn")?.click();
      });

  `;
  const HOME_JS_CLOSE = `
    </script>
  `;
  const backgroundImages = [
    "/backgrounds/Page-002 (Large)_result.webp",
    "/backgrounds/Page-004 (Large)_result.webp",
    "/backgrounds/Page-006 (Large)_result.webp",
    "/backgrounds/Page-008 (Large)_result.webp",
    "/backgrounds/Page-010 (Large)_result.webp",
    "/backgrounds/Page-012 (Large)_result.webp",
    "/backgrounds/Page-014 (Large)_result.webp",
    "/backgrounds/Page-016 (Large)_result.webp",
    "/backgrounds/Page-018 (Large)_result.webp",
    "/backgrounds/Page-020 (Large)_result.webp",
    "/backgrounds/Page-022 (Large)_result.webp",
    "/backgrounds/Page-022(1) (Large)_result.webp",
    "/backgrounds/Page-024 (Large)_result.webp"
  ];

  const randomBg = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Swim Gen</title>
</head>
<body style="padding:5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(180deg, #40c9e0 0%, #2db8d4 100%); min-height:100vh;">
<div id="bgWrap">
  <div id="bgA" class="bgLayer" style="background-image: url('${randomBg}');"></div>
  <div id="bgB" class="bgLayer"></div>
</div>
${HOME_HTML}
${HOME_JS_OPEN}
${HOME_JS_DOM}
${HOME_JS_HELPERS}
${HOME_JS_PARSERS}
${HOME_JS_RENDER}
${HOME_JS_EVENTS}
${HOME_JS_CLOSE}
</body>
</html>`;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(fullHtml);
  });
app.get("/viewport-lab", (req, res) => {
  const VIEWPORT_LAB_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Swim Workout Generator - Viewport Lab</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body id="viewportLab">
  <a class="back" href="/">Back to Generator</a>
  <h1>Viewport Lab</h1>
  <p>Test the Swim Workout Generator across multiple screen sizes. Use sliders to adjust widths. Drag frames to reorder.</p>

  <div id="colorPicker">
    <div class="picker-header">
      <span>Zone Colors</span>
      <button type="button" id="togglePicker" style="border:none; background:transparent; cursor:pointer; font-size:12px;">-</button>
    </div>
    <div class="picker-content">
      <div class="zone-row" style="background:#dcfce7; border-left:3px solid #22c55e;">
        <span class="zone-label">Easy</span>
        <input type="color" id="colorEasyBg" value="#dcfce7" title="Background" />
        <span class="hex-display" id="hexEasyBg">#dcfce7</span>
        <input type="color" id="colorEasyBar" value="#22c55e" title="Accent" />
        <span class="hex-display" id="hexEasyBar">#22c55e</span>
      </div>
      <div class="zone-row" style="background:#dbeafe; border-left:3px solid #3b82f6;">
        <span class="zone-label">Moderate</span>
        <input type="color" id="colorModerateBg" value="#dbeafe" title="Background" />
        <span class="hex-display" id="hexModerateBg">#dbeafe</span>
        <input type="color" id="colorModerateBar" value="#3b82f6" title="Accent" />
        <span class="hex-display" id="hexModerateBar">#3b82f6</span>
      </div>
      <div class="zone-row" style="background:#fef3c7; border-left:3px solid #f6c87a;">
        <span class="zone-label">Strong</span>
        <input type="color" id="colorStrongBg" value="#fef3c7" title="Background" />
        <span class="hex-display" id="hexStrongBg">#fef3c7</span>
        <input type="color" id="colorStrongBar" value="#f6c87a" title="Accent" />
        <span class="hex-display" id="hexStrongBar">#f6c87a</span>
      </div>
      <div class="zone-row" style="background:#fed7aa; border-left:3px solid #ea580c;">
        <span class="zone-label">Hard</span>
        <input type="color" id="colorHardBg" value="#fed7aa" title="Background" />
        <span class="hex-display" id="hexHardBg">#fed7aa</span>
        <input type="color" id="colorHardBar" value="#ea580c" title="Accent" />
        <span class="hex-display" id="hexHardBar">#ea580c</span>
      </div>
      <div class="zone-row" style="background:#f6c1c1; border-left:3px solid #d10f24;">
        <span class="zone-label">Full Gas</span>
        <input type="color" id="colorFullgasBg" value="#f6c1c1" title="Background" />
        <span class="hex-display" id="hexFullgasBg">#f6c1c1</span>
        <input type="color" id="colorFullgasBar" value="#d10f24" title="Accent" />
        <span class="hex-display" id="hexFullgasBar">#d10f24</span>
      </div>
      <div style="margin-top:6px; font-size:9px; color:#666; line-height:1.2;">
        Pick colors, then generate a workout in a frame to see them applied.
      </div>
    </div>
  </div>

  <h2>Mobile (3)</h2>
  <div class="row" data-row="mobile">
    <div class="frame" draggable="true" data-demo style="--w: 320px; --h: 700px;">
      <div class="bar">
        <div class="meta"><span class="name">Small phone</span><span class="tag">portrait</span></div>
        <div class="controls">
          <input type="range" min="280" max="420" step="1" value="320" data-width />
          <span class="num"><span data-wout>320</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>

    <div class="frame" draggable="true" data-demo style="--w: 390px; --h: 700px;">
      <div class="bar">
        <div class="meta"><span class="name">iPhone 14/15</span><span class="tag">portrait</span></div>
        <div class="controls">
          <input type="range" min="360" max="430" step="1" value="390" data-width />
          <span class="num"><span data-wout>390</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>

    <div class="frame" draggable="true" data-demo style="--w: 430px; --h: 700px;">
      <div class="bar">
        <div class="meta"><span class="name">iPhone Plus/Max</span><span class="tag">portrait</span></div>
        <div class="controls">
          <input type="range" min="400" max="500" step="1" value="430" data-width />
          <span class="num"><span data-wout>430</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>
  </div>

  <h2>Tablet (2)</h2>
  <div class="row-pair" data-row="tablet">
    <div class="frame" draggable="true" data-demo style="--w: 768px; --h: 800px;">
      <div class="bar">
        <div class="meta"><span class="name">iPad Mini</span><span class="tag">portrait</span></div>
        <div class="controls">
          <input type="range" min="640" max="900" step="1" value="768" data-width />
          <span class="num"><span data-wout>768</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>

    <div class="frame" draggable="true" data-demo style="--w: 1024px; --h: 800px;">
      <div class="bar">
        <div class="meta"><span class="name">iPad Pro</span><span class="tag">landscape</span></div>
        <div class="controls">
          <input type="range" min="900" max="1200" step="1" value="1024" data-width />
          <span class="num"><span data-wout>1024</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>
  </div>

  <h2>Desktop (1)</h2>
  <div class="row-wide">
    <div class="frame" data-demo style="--w: 1366px; --h: 800px;">
      <div class="bar">
        <div class="meta"><span class="name">Laptop</span><span class="tag">1366px</span></div>
        <div class="controls">
          <input type="range" min="1200" max="1600" step="1" value="1366" data-width />
          <span class="num"><span data-wout>1366</span>px</span>
        </div>
      </div>
      <iframe src="/"></iframe>
    </div>
  </div>

  <script>
    for (const frame of document.querySelectorAll('[data-demo]')) {
      const range = frame.querySelector('[data-width]');
      const wout = frame.querySelector('[data-wout]');
      if (!range || !wout) continue;

      const apply = (v) => {
        frame.style.setProperty('--w', v + 'px');
        wout.textContent = v;
      };

      apply(range.value);
      range.addEventListener('input', (e) => apply(e.target.value));
    }

    let dragging = null;

    document.addEventListener('dragstart', (e) => {
      const frame = e.target.closest('.frame');
      const row = e.target.closest('.row, .row-pair');
      if (!frame || !row) return;
      dragging = frame;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'drag');
    });

    document.addEventListener('dragover', (e) => {
      const row = e.target.closest('.row, .row-pair');
      if (!row || !dragging) return;
      if (dragging.parentElement !== row) return;
      e.preventDefault();

      const over = e.target.closest('.frame');
      if (!over || over === dragging) return;

      const r = over.getBoundingClientRect();
      const before = (e.clientX - r.left) < (r.width / 2);
      row.insertBefore(dragging, before ? over : over.nextSibling);
    });

    document.addEventListener('dragend', () => {
      dragging = null;
    });

    // Color picker toggle
    const colorPicker = document.getElementById('colorPicker');
    const togglePicker = document.getElementById('togglePicker');
    togglePicker.addEventListener('click', () => {
      colorPicker.classList.toggle('collapsed');
      togglePicker.textContent = colorPicker.classList.contains('collapsed') ? '+' : '-';
    });

    // Color picker functionality - updates CSS vars in all iframes
    function setupColorInput(inputId, hexDisplayId, cssVarName) {
      const input = document.getElementById(inputId);
      const hexDisplay = document.getElementById(hexDisplayId);
      if (!input || !hexDisplay) return;

      input.addEventListener('input', () => {
        const val = input.value;
        hexDisplay.textContent = val;
        
        // Update the zone row preview
        const zoneRow = input.closest('.zone-row');
        if (zoneRow) {
          if (cssVarName.includes('-bg')) {
            zoneRow.style.background = val;
          } else if (cssVarName.includes('-bar')) {
            zoneRow.style.borderLeftColor = val;
          }
        }
        
        // Push to all iframes
        document.querySelectorAll('iframe').forEach(iframe => {
          try {
            if (iframe.contentDocument) {
              iframe.contentDocument.documentElement.style.setProperty(cssVarName, val);
            }
          } catch (e) {}
        });
      });
    }

    // Setup all color inputs (Zone names: easy, moderate, strong, hard, fullgas)
    setupColorInput('colorEasyBg', 'hexEasyBg', '--zone-easy-bg');
    setupColorInput('colorEasyBar', 'hexEasyBar', '--zone-easy-bar');
    setupColorInput('colorModerateBg', 'hexModerateBg', '--zone-moderate-bg');
    setupColorInput('colorModerateBar', 'hexModerateBar', '--zone-moderate-bar');
    setupColorInput('colorStrongBg', 'hexStrongBg', '--zone-strong-bg');
    setupColorInput('colorStrongBar', 'hexStrongBar', '--zone-strong-bar');
    setupColorInput('colorHardBg', 'hexHardBg', '--zone-hard-bg');
    setupColorInput('colorHardBar', 'hexHardBar', '--zone-hard-bar');
    setupColorInput('colorFullgasBg', 'hexFullgasBg', '--zone-fullgas-bg');
    setupColorInput('colorFullgasBar', 'hexFullgasBar', '--zone-fullgas-bar');

    // Draggable color picker
    (function enableDraggableColorPicker() {
      const picker = document.getElementById("colorPicker");
      if (!picker) return;
      const header = picker.querySelector(".picker-header");
      if (!header) return;

      // Restore saved position
      try {
        const saved = JSON.parse(localStorage.getItem("swg_picker_pos") || "null");
        if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
          picker.style.left = saved.x + "px";
          picker.style.top = saved.y + "px";
          picker.style.right = "auto";
        }
      } catch {}

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;

      header.addEventListener("mousedown", (e) => {
        dragging = true;
        const rect = picker.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        originLeft = rect.left;
        originTop = rect.top;

        picker.style.left = originLeft + "px";
        picker.style.top = originTop + "px";
        picker.style.right = "auto";

        e.preventDefault();
      });

      window.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const x = Math.max(8, originLeft + dx);
        const y = Math.max(8, originTop + dy);
        picker.style.left = x + "px";
        picker.style.top = y + "px";
      });

      window.addEventListener("mouseup", () => {
        if (!dragging) return;
        dragging = false;
        try {
          const rect = picker.getBoundingClientRect();
          localStorage.setItem("swg_picker_pos", JSON.stringify({ x: rect.left, y: rect.top }));
        } catch {}
      });
    })();
  </script>
</body>
</html>`;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(VIEWPORT_LAB_HTML);
});
app.post("/reroll-set", (req, res) => {
  try {
    const body = req.body || {};

    const poolLength = body.poolLength;
    const poolLengthUnit = body.poolLengthUnit;
    const customPoolLength = body.customPoolLength;

    const isCustomPool = poolLength === "custom";

    const unitsShort = isCustomPool
      ? (poolLengthUnit === "yards" ? "yd" : "m")
      : (poolLength === "25yd" ? "yd" : "m");

    const poolLen = isCustomPool
      ? Number(customPoolLength)
      : (poolLength === "25m" ? 25 : poolLength === "50m" ? 50 : poolLength === "25yd" ? 25 : null);

    if (!poolLen || !Number.isFinite(poolLen) || poolLen <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid pool length." });
    }

    const targetDistance = Number(body.targetDistance);
    if (!Number.isFinite(targetDistance) || targetDistance <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid targetDistance." });
    }

    const labelRaw = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Main";
    const label = canonicalLabelServer(labelRaw);

    const opts = normalizeOptionsServer(body);

    const avoidText = typeof body.avoidText === "string" ? body.avoidText.trim() : "";

    // Use rerollCount to generate deterministically different seeds each click
    const rerollCount = Number(body.rerollCount) || 1;
    
    // Generate a replacement body with the same label and distance
    // Use rerollCount to cycle through effort levels, plus seed for variety within each level
    for (let i = 0; i < 10; i++) {
      // Combine rerollCount with iteration to guarantee different seed each attempt
      const seed = ((rerollCount * 7919) + (i * 9973) + Date.now()) >>> 0;
      const next = buildOneSetBodyShared({
        label,
        targetDistance,
        poolLen,
        unitsShort,
        opts,
        seed,
        rerollCount: rerollCount  // Pass stable rerollCount for effort level cycling (i only varies seed)
      });

      if (!next) continue;
      if (avoidText && next.trim() === avoidText.trim()) continue;

      return res.json({ ok: true, setBody: next });
    }

    return res.status(500).json({ ok: false, error: "Reroll failed to produce a replacement set." });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }

  function canonicalLabelServer(labelRaw) {
    const raw = String(labelRaw || "").trim();
    const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
    const map = {
      "warm-up": "Warm up",
      "warm up": "Warm up",
      "warmup": "Warm up",
      "build": "Build",
      "drill": "Drill",
      "kick": "Kick",
      "pull": "Pull",
      "main": "Main",
      "main 1": "Main 1",
      "main 2": "Main 2",
      "cooldown": "Cool down",
      "cool down": "Cool down"
    };
    return map[key] || raw;
  }

  function normalizeOptionsServer(payload) {
    // These may come as booleans already (client does it) but keep robust.
    const b = (v) => v === true || v === "true" || v === "on" || v === 1;

    const strokes = {
      freestyle: b(payload.stroke_freestyle),
      backstroke: b(payload.stroke_backstroke),
      breaststroke: b(payload.stroke_breaststroke),
      butterfly: b(payload.stroke_butterfly)
    };

    // Always ensure at least freestyle is available
    if (!strokes.freestyle && !strokes.backstroke && !strokes.breaststroke && !strokes.butterfly) {
      strokes.freestyle = true;
    }

    return {
      focus: typeof payload.focus === "string" ? payload.focus : "allround",
      restPref: typeof payload.restPref === "string" ? payload.restPref : "balanced",
      thresholdPace: typeof payload.thresholdPace === "string" ? payload.thresholdPace : "",
      includeKick: b(payload.includeKick),
      includePull: b(payload.includePull),
      fins: b(payload.equip_fins),
      paddles: b(payload.equip_paddles),
      strokes
    };
  }

  function pickStrokeForSet(label, opts, seed) {
    const allowed = [];
    if (opts.strokes.freestyle) allowed.push("freestyle");
    if (opts.strokes.backstroke) allowed.push("backstroke");
    if (opts.strokes.breaststroke) allowed.push("breaststroke");
    if (opts.strokes.butterfly) allowed.push("butterfly");

    if (!allowed.length) return "freestyle";

    // Bias by label - warm-up, main, and build should default to freestyle
    const k = String(label || "").toLowerCase();
    if (k.includes("warm") || k.includes("main") || k.includes("build") || k.includes("cool")) {
      if (allowed.includes("freestyle")) return "freestyle";
    }

    const idx = (Number(seed >>> 0) % allowed.length);
    return allowed[idx];
  }

  function restSecondsFor(label, repDist, opts) {
    const k = String(label || "").toLowerCase();
    let base = 15;

    if (k.includes("warm")) base = 0;
    else if (k.includes("drill")) base = 20;
    else if (k.includes("kick")) base = 15;
    else if (k.includes("pull")) base = 15;
    else if (k.includes("build")) base = 15;
    else if (k.includes("main")) base = 20;
    else if (k.includes("cool")) base = 0;

    // Rep distance tweak
    if (repDist >= 200) base = Math.max(10, base - 5);
    if (repDist <= 50 && k.includes("main")) base = base + 10;

    // Rest preference
    const r = String(opts.restPref || "balanced");
    if (r === "short") base = Math.max(0, base - 5);
    if (r === "moderate") base = base + 0;
    if (r === "more") base = base + 10;

    return base;
  }

  function snapToPoolMultiple(dist, poolLen) {
    const d = Number(dist);
    if (!Number.isFinite(d) || d <= 0) return 0;
    const base = Number(poolLen);
    if (!Number.isFinite(base) || base <= 0) return d;
    return Math.round(d / base) * base;
  }

  function buildOneSetBodyServer({ label, targetDistance, poolLen, unitsShort, opts, seed }) {
    const base = poolLen;

    // Use a small library per set type, but force total distance exact.
    // We build segments and then adjust with an easy filler that remains a pool multiple.
    const k = String(label || "").toLowerCase();

    const stroke = pickStrokeForSet(label, opts, seed);
    const hasFins = !!opts.fins;
    const hasPaddles = !!opts.paddles;

    const isNonStandardPool = ![25, 50].includes(base);
    
    // Check if user provided threshold pace (for interval display)
    const hasThresholdPace = opts.thresholdPace && String(opts.thresholdPace).trim().length > 0;
    
    const makeLine = (reps, dist, text, restSec) => {
      const r = Number(reps);
      const d = Number(dist);
      const rest = Number(restSec);

      // Only show rest when threshold pace is provided (interval mode)
      let suffix = "";
      if (hasThresholdPace && Number.isFinite(rest) && rest > 0) {
        suffix = " rest " + String(rest) + "s";
      }

      const strokeText = (text || "").trim();
      
      // Add lap count for non-standard pools to help swimmers
      let lengthInfo = "";
      if (isNonStandardPool && d > 0 && base > 0 && d % base === 0) {
        const lengths = d / base;
        if (lengths > 1) {
          lengthInfo = " (" + lengths + " lengths)";
        }
      }
      
      return String(r) + "x" + String(d) + lengthInfo + " " + strokeText + suffix;
    };

    const lines = [];
    let remaining = snapToPoolMultiple(targetDistance, base);

    if (remaining <= 0) return null;

    // Helper to add a segment and reduce remaining
    const add = (reps, dist, note, rest) => {
      const seg = reps * dist;
      if (seg <= 0) return false;
      if (seg > remaining) return false;
      lines.push(makeLine(reps, dist, note, rest));
      remaining -= seg;
      return true;
    };

    // Choose patterns
    if (k.includes("warm")) {
      // Warm-up varies 1-3 segments for variety - NO DRILL in warm-up (drill belongs in Drill section)
      const options = [
        // 3 segments: swim + build + kick
        () => {
          const d200 = snapToPoolMultiple(200, base);
          if (d200 > 0) add(1, d200, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(4, d50, stroke + " build", restSecondsFor("build", d50, opts));
          const d25 = snapToPoolMultiple(25, base);
          if (d25 > 0) add(4, d25, "kick easy", restSecondsFor("kick", d25, opts));
        },
        // 2 segments: swim + build
        () => {
          const d300 = snapToPoolMultiple(300, base);
          if (d300 > 0) add(1, d300, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(6, d50, stroke + " build", restSecondsFor("build", d50, opts));
        },
        // 3 segments: swim + kick + easy swim
        () => {
          const d100 = snapToPoolMultiple(100, base);
          if (d100 > 0) add(2, d100, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(4, d50, "kick easy", restSecondsFor("kick", d50, opts));
          if (d50 > 0) add(4, d50, stroke + " easy", 0);
        },
        // 1 segment: simple long swim (for short warm-ups)
        () => {
          const d400 = snapToPoolMultiple(400, base);
          if (d400 > 0 && remaining >= d400) add(1, d400, stroke + " easy", 0);
        },
        // 2 segments: broken swim
        () => {
          const d100 = snapToPoolMultiple(100, base);
          if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " easy", restSecondsFor("warm", d100, opts));
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0 && remaining >= d50 * 4) add(4, d50, stroke + " build", restSecondsFor("build", d50, opts));
        }
      ];

      options[seed % options.length]();

      // Fallback: if pattern didn't add anything, add a simple swim
      if (lines.length === 0 && remaining > 0) {
        const d100 = snapToPoolMultiple(100, base);
        const d50 = snapToPoolMultiple(50, base);
        if (d100 > 0 && remaining >= d100) {
          const reps = Math.min(4, Math.floor(remaining / d100));
          if (reps > 0) add(reps, d100, stroke + " easy", 0);
        }
        if (d50 > 0 && remaining >= d50 && lines.length === 0) {
          const reps = Math.min(6, Math.floor(remaining / d50));
          if (reps > 0) add(reps, d50, stroke + " easy", 0);
        }
      }

      // Fill remaining with easy swim in 100s or 50s, not weird singles.
      fillEasy();
      return lines.join("\n");
    }

    if (k.includes("build")) {
      const d50 = snapToPoolMultiple(50, base);
      const d100 = snapToPoolMultiple(100, base);
      const d75 = snapToPoolMultiple(75, base);

      const buildDescriptions = [
        stroke + " build",
        stroke + " descend 1-3",
        stroke + " descend 1-4",
        stroke + " descend 1-5",
        stroke + " negative split",
        stroke + " build to fast",
        stroke + " smooth to strong",
        stroke + " odds easy evens fast",
        stroke + " every 3rd fast"
      ];
      const desc = buildDescriptions[seed % buildDescriptions.length];
      const desc2 = buildDescriptions[(seed + 1) % buildDescriptions.length];

      // Variety of patterns based on seed
      const patternChoice = seed % 4;
      if (patternChoice === 0) {
        if (d50 > 0 && remaining >= d50 * 6) add(6, d50, desc, restSecondsFor("build", d50, opts));
        if (d100 > 0 && remaining >= d100 * 4) add(4, d100, desc2, restSecondsFor("build", d100, opts));
      } else if (patternChoice === 1) {
        if (d100 > 0 && remaining >= d100 * 4) add(4, d100, desc, restSecondsFor("build", d100, opts));
        if (d50 > 0 && remaining >= d50 * 4) add(4, d50, desc2, restSecondsFor("build", d50, opts));
      } else if (patternChoice === 2) {
        if (d75 > 0 && remaining >= d75 * 4) add(4, d75, desc, restSecondsFor("build", d75, opts));
        if (d50 > 0 && remaining >= d50 * 6) add(6, d50, desc2, restSecondsFor("build", d50, opts));
      } else {
        if (d50 > 0 && remaining >= d50 * 8) add(8, d50, desc, restSecondsFor("build", d50, opts));
      }

      fillEasy("build");
      return lines.join("\n");
    }

    if (k.includes("drill")) {
      const d50 = snapToPoolMultiple(50, base);
      const d25 = snapToPoolMultiple(25, base);
      const d75 = snapToPoolMultiple(75, base);

      // Named drill library from CardGym cards - always use these
      const namedDrills = [
        "Catch-up", "Fist drill", "Fingertip drag", "DPS",
        "Shark fin", "Zipper", "Scull", "Corkscrew",
        "Single arm", "Long dog", "Tarzan", "Head up",
        "Hip rotation", "Paddle scull", "Kickboard balance", "6-3-6"
      ];
      
      // Primary drill: always use named drills
      const desc1 = namedDrills[seed % namedDrills.length];
      const desc2 = namedDrills[(seed + 7) % namedDrills.length];

      // Try to fill with reasonable reps based on what fits
      if (d50 > 0 && remaining >= d50 * 2) {
        const reps = Math.min(8, Math.floor(remaining / d50));
        if (reps >= 2) add(reps, d50, desc1, restSecondsFor("drill", d50, opts));
      }
      if (d25 > 0 && remaining >= d25 * 4) {
        const reps = Math.min(12, Math.floor(remaining / d25));
        if (reps >= 4) add(reps, d25, desc2, restSecondsFor("drill", d25, opts));
      }

      fillEasy("drill");
      return lines.join("\n");
    }

    if (k.includes("kick")) {
      const d50 = snapToPoolMultiple(50, base);
      const d75 = snapToPoolMultiple(75, base);
      const d100 = snapToPoolMultiple(100, base);
      const finNote = hasFins ? " with fins" : "";

      const kickDescriptions = [
        "kick steady", "kick choice", "kick fast", "kick build", "kick strong", "kick relaxed"
      ];
      const desc = kickDescriptions[seed % kickDescriptions.length] + finNote;

      // Try to fill with reasonable reps based on what fits
      if (d100 > 0 && remaining >= d100 * 2) {
        const reps = Math.min(6, Math.floor(remaining / d100));
        if (reps >= 2) add(reps, d100, desc, restSecondsFor("kick", d100, opts));
      }
      if (d75 > 0 && remaining >= d75 * 2) {
        const reps = Math.min(4, Math.floor(remaining / d75));
        if (reps >= 2) add(reps, d75, kickDescriptions[(seed + 1) % kickDescriptions.length] + finNote, restSecondsFor("kick", d75, opts));
      }
      if (d50 > 0 && remaining >= d50 * 2) {
        const reps = Math.min(8, Math.floor(remaining / d50));
        if (reps >= 2) add(reps, d50, kickDescriptions[(seed + 2) % kickDescriptions.length] + finNote, restSecondsFor("kick", d50, opts));
      }

      fillEasy("kick");
      return lines.join("\n");
    }

    if (k.includes("pull")) {
      const d50 = snapToPoolMultiple(50, base);
      const d100 = snapToPoolMultiple(100, base);
      const d150 = snapToPoolMultiple(150, base);
      const padNote = hasPaddles ? " with paddles" : "";

      const pullDescriptions = [
        "pull steady", "pull strong", "pull build", "pull descend", "pull smooth", "pull relaxed"
      ];
      const desc = pullDescriptions[seed % pullDescriptions.length] + padNote;

      // Try to fill with reasonable reps based on what fits
      if (d100 > 0 && remaining >= d100 * 2) {
        const reps = Math.min(6, Math.floor(remaining / d100));
        if (reps >= 2) add(reps, d100, desc, restSecondsFor("pull", d100, opts));
      }
      if (d50 > 0 && remaining >= d50 * 2) {
        const reps = Math.min(8, Math.floor(remaining / d50));
        if (reps >= 2) add(reps, d50, pullDescriptions[(seed + 1) % pullDescriptions.length] + padNote, restSecondsFor("pull", d50, opts));
      }

      fillEasy("pull");
      return lines.join("\n");
    }

    if (k.includes("cool")) {
      // Cool down should be simple and clean
      const d200 = snapToPoolMultiple(200, base);
      const d100 = snapToPoolMultiple(100, base);
      if (d200 > 0 && remaining >= d200) add(1, d200, stroke + " easy", 0);
      if (d100 > 0 && remaining >= d100) add(1, d100, "easy mixed", 0);
      fillEasy("cool");
      return lines.join("\n");
    }

    // Main (and Main 1/2)
    {
      const focus = String(opts.focus || "allround");

      const d50 = snapToPoolMultiple(50, base);
      const d100 = snapToPoolMultiple(100, base);
      const d200 = snapToPoolMultiple(200, base);
      const d25 = snapToPoolMultiple(25, base);

      if (focus === "sprint") {
        // Sprint focus: include full gas efforts
        if (d50 > 0 && remaining >= d50 * 8) add(8, d50, stroke + " fast build", restSecondsFor("main", d50, opts) + 10);
        if (d25 > 0 && remaining >= d25 * 6) add(6, d25, stroke + " max sprint", restSecondsFor("sprint", d25, opts) + 20);
        if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " hard", restSecondsFor("main", d100, opts));
      } else if (focus === "threshold") {
        if (d100 > 0 && remaining >= d100 * 10) add(10, d100, stroke + " best average", restSecondsFor("main", d100, opts));
        if (d200 > 0 && remaining >= d200 * 4) add(4, d200, stroke + " hard hold pace", restSecondsFor("main", d200, opts));
      } else if (focus === "endurance") {
        if (d200 > 0 && remaining >= d200 * 6) add(6, d200, stroke + " moderate", restSecondsFor("main", d200, opts));
        if (d100 > 0 && remaining >= d100 * 8) add(8, d100, stroke + " smooth", restSecondsFor("main", d100, opts));
      } else if (focus === "technique") {
        if (d100 > 0 && remaining >= d100 * 8) add(8, d100, stroke + " perfect form", restSecondsFor("main", d100, opts));
        if (d50 > 0 && remaining >= d50 * 8) add(8, d50, stroke + " focus stroke count", restSecondsFor("main", d50, opts));
      } else {
        // All round - 8 different coach-quality patterns with varied structures and zones
        const patternChoice = seed % 8;
        if (patternChoice === 0) {
          // Build to sprint finish
          if (d100 > 0 && remaining >= d100 * 6) add(6, d100, stroke + " build", restSecondsFor("main", d100, opts));
          if (d50 > 0 && remaining >= d50 * 4) add(4, d50, stroke + " fast", restSecondsFor("main", d50, opts) + 5);
          if (d25 > 0 && remaining >= d25 * 4) add(4, d25, stroke + " sprint all out", restSecondsFor("sprint", d25, opts) + 15);
        } else if (patternChoice === 1) {
          // Strong sustained with max finish
          if (d200 > 0 && remaining >= d200 * 3) add(3, d200, stroke + " hard", restSecondsFor("main", d200, opts));
          if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " strong", restSecondsFor("main", d100, opts));
          if (d50 > 0 && remaining >= d50 * 4) add(4, d50, stroke + " max effort", restSecondsFor("sprint", d50, opts) + 10);
        } else if (patternChoice === 2) {
          // Descend variations - pick based on seed
          const descendVariants = ["descend 1-3", "descend 1-4", "descend 1-5", "odds easy evens fast", "every 3rd hard", "negative split"];
          const descendDesc = stroke + " " + descendVariants[seed % descendVariants.length];
          if (d100 > 0 && remaining >= d100 * 12) add(12, d100, descendDesc, restSecondsFor("main", d100, opts));
          else if (d100 > 0 && remaining >= d100 * 8) add(8, d100, descendDesc, restSecondsFor("main", d100, opts));
          else if (d100 > 0 && remaining >= d100 * 4) add(4, d100, descendDesc, restSecondsFor("main", d100, opts));
        } else if (patternChoice === 3) {
          // Progressive build: moderate to strong to hard
          if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " moderate", restSecondsFor("main", d100, opts));
          if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " strong", restSecondsFor("main", d100, opts));
          if (d50 > 0 && remaining >= d50 * 4) add(4, d50, stroke + " race pace", restSecondsFor("sprint", d50, opts) + 10);
        } else if (patternChoice === 4) {
          // Ladder up and down: 50-100-200-100-50
          if (d50 > 0 && remaining >= d50 * 2) add(2, d50, stroke + " fast", restSecondsFor("main", d50, opts));
          if (d100 > 0 && remaining >= d100 * 2) add(2, d100, stroke + " strong", restSecondsFor("main", d100, opts));
          if (d200 > 0 && remaining >= d200 * 1) add(1, d200, stroke + " hard", restSecondsFor("main", d200, opts));
          if (d100 > 0 && remaining >= d100 * 2) add(2, d100, stroke + " strong", restSecondsFor("main", d100, opts));
          if (d50 > 0 && remaining >= d50 * 2) add(2, d50, stroke + " max sprint", restSecondsFor("sprint", d50, opts) + 10);
        } else if (patternChoice === 5) {
          // Broken swim with sprints
          if (d200 > 0 && remaining >= d200 * 4) add(4, d200, stroke + " steady", restSecondsFor("main", d200, opts));
          if (d25 > 0 && remaining >= d25 * 8) add(8, d25, stroke + " sprint all out", restSecondsFor("sprint", d25, opts) + 20);
        } else if (patternChoice === 6) {
          // 50s focus with mixed intensity
          if (d50 > 0 && remaining >= d50 * 8) add(8, d50, stroke + " odds easy evens fast", restSecondsFor("main", d50, opts));
          if (d50 > 0 && remaining >= d50 * 6) add(6, d50, stroke + " build 1-3", restSecondsFor("main", d50, opts));
          if (d50 > 0 && remaining >= d50 * 4) add(4, d50, stroke + " all out", restSecondsFor("sprint", d50, opts) + 10);
        } else {
          // Straight hard set with descend finish
          if (d100 > 0 && remaining >= d100 * 6) add(6, d100, stroke + " hard", restSecondsFor("main", d100, opts));
          if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " descend to max", restSecondsFor("main", d100, opts) + 5);
          if (d50 > 0 && remaining >= d50 * 2) add(2, d50, stroke + " max effort", restSecondsFor("sprint", d50, opts) + 15);
        }
      }

      fillEasy("main");
      return lines.join("\n");
    }

    function fillEasy(kind) {
      // Fill remaining with clean pool-multiple segments that look human.
      // Prefer 100s then 50s, and only as 1x if it is a standard distance.
      const d100 = snapToPoolMultiple(100, base);
      const d50 = snapToPoolMultiple(50, base);
      const d200 = snapToPoolMultiple(200, base);

      const k2 = String(kind || "").toLowerCase();

      // Named drills for filler
      const fillerDrills = ["Catch-up", "Fingertip drag", "Fist drill", "Scull", "Single arm"];
      const fillerDrill = fillerDrills[seed % fillerDrills.length];
      
      const note =
        k2.includes("main") ? (stroke + " steady") :
        k2.includes("drill") ? fillerDrill :
        k2.includes("kick") ? "kick relaxed" :
        k2.includes("pull") ? "pull relaxed" :
        k2.includes("build") ? (stroke + " build") :
        (stroke + " easy");

      while (remaining >= (d200 || base) && d200 > 0 && remaining % d200 === 0 && remaining >= d200) {
        // Only use a couple of 200s max
        if (lines.length >= 4) break;
        add(1, d200, note, restSecondsFor(kind || "easy", d200, opts));
      }

      if (d100 > 0) {
        const reps100 = Math.floor(remaining / d100);
        if (reps100 >= 2) {
          const r = Math.min(reps100, 6);
          add(r, d100, note, restSecondsFor(kind || "easy", d100, opts));
        }
      }

      if (d50 > 0) {
        const reps50 = Math.floor(remaining / d50);
        if (reps50 >= 2) {
          const r = Math.min(reps50, 10);
          add(r, d50, note, restSecondsFor(kind || "easy", d50, opts));
        }
      }

      // Last resort: one clean single that is still a pool multiple
      if (remaining > 0) {
        const allowedSingles = [200, 300, 400, 500, 600, 800, 1000].map(v => snapToPoolMultiple(v, base)).filter(v => v > 0);
        const canSingle = allowedSingles.includes(remaining);
        if (canSingle) {
          add(1, remaining, note, 0);
          return;
        }

        // Otherwise force 2x(remaining/2) if possible
        if (remaining % 2 === 0) {
          const half = remaining / 2;
          add(2, half, note, restSecondsFor(kind || "easy", half, opts));
          return;
        }

        // If stuck, do not output weirdness. Return null.
        return null;
      }
    }
  }
});
app.post("/generate-workout", (req, res) => {
  try {
    const body = req.body || {};

    const distance = Number(body.distance);
    const poolLength = body.poolLength;
    const customPoolLength = body.customPoolLength;
    const poolLengthUnit = body.poolLengthUnit;
    const lastWorkoutFp = typeof body.lastWorkoutFp === "string" ? body.lastWorkoutFp : "";

    if (!Number.isFinite(distance) || distance <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid distance." });
    }
    if (!poolLength || typeof poolLength !== "string") {
      return res.status(400).json({ ok: false, error: "Invalid pool selection." });
    }

    const isCustomPool = poolLength === "custom";

    const unitsShort = isCustomPool
      ? (poolLengthUnit === "yards" ? "yd" : "m")
      : (poolLength === "25yd" ? "yd" : "m");

    const poolLen = isCustomPool
      ? Number(customPoolLength)
      : (poolLength === "25m" ? 25 : poolLength === "50m" ? 50 : poolLength === "25yd" ? 25 : null);

    if (!poolLen || !Number.isFinite(poolLen) || poolLen <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid pool length." });
    }

    const opts = normalizeOptions(body);

    const targetTotal = snapToPoolMultiple(distance, poolLen);

    const seed = nowSeed();
    const workout = buildWorkout({
      targetTotal,
      poolLen,
      unitsShort,
      poolLabel: isCustomPool ? (String(poolLen) + unitsShort + " custom") : String(poolLength),
      thresholdPace: String(body.thresholdPace || ""),
      opts,
      seed
    });

    if (!workout || !workout.text) {
      return res.status(500).json({ ok: false, error: "Failed to build workout." });
    }

    const fp = fingerprintWorkoutText(workout.text);
    if (lastWorkoutFp && fp === lastWorkoutFp) {
      const seed2 = nowSeed();
      const workout2 = buildWorkout({
        targetTotal,
        poolLen,
        unitsShort,
        poolLabel: isCustomPool ? (String(poolLen) + unitsShort + " custom") : String(poolLength),
        thresholdPace: String(body.thresholdPace || ""),
        opts,
        seed: seed2
      });

      if (workout2 && workout2.text) {
        return res.json({ ok: true, workoutText: workout2.text, workoutName: workout2.name || "" });
      }
    }

    return res.json({ ok: true, workoutText: workout.text, workoutName: workout.name || "" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }

  function b(v) {
    return v === true || v === "true" || v === "on" || v === 1;
  }

  function normalizeOptions(payload) {
    const strokes = {
      freestyle: b(payload.stroke_freestyle),
      backstroke: b(payload.stroke_backstroke),
      breaststroke: b(payload.stroke_breaststroke),
      butterfly: b(payload.stroke_butterfly)
    };

    const anyStroke =
      strokes.freestyle || strokes.backstroke || strokes.breaststroke || strokes.butterfly;

    if (!anyStroke) {
      strokes.freestyle = true;
    }

    return {
      focus: typeof payload.focus === "string" ? payload.focus : "allround",
      restPref: typeof payload.restPref === "string" ? payload.restPref : "balanced",
      thresholdPace: typeof payload.thresholdPace === "string" ? payload.thresholdPace : "",
      includeKick: payload.includeKick === undefined ? true : b(payload.includeKick),
      includePull: b(payload.includePull),
      fins: b(payload.equip_fins),
      paddles: b(payload.equip_paddles),
      strokes,
      notes: typeof payload.notes === "string" ? payload.notes.trim() : ""
    };
  }

  function nowSeed() {
    const a = Date.now() >>> 0;
    const b2 = Math.floor(Math.random() * 0xffffffff) >>> 0;
    return (a ^ b2) >>> 0;
  }

  function fnv1a32(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function fingerprintWorkoutText(workoutText) {
    return String(fnv1a32(String(workoutText || "")));
  }

  function snapToPoolMultiple(dist, poolLen) {
    const d = Number(dist);
    if (!Number.isFinite(d) || d <= 0) return 0;
    const base = Number(poolLen);
    if (!Number.isFinite(base) || base <= 0) return d;
    return Math.round(d / base) * base;
  }

  function parsePaceToSecondsPer100(s) {
    const t = String(s || "").trim();
    if (!t) return null;

    if (/^\d{1,2}:\d{2}$/.test(t)) {
      const parts = t.split(":");
      const mm = Number(parts[0]);
      const ss = Number(parts[1]);
      if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
      return (mm * 60) + ss;
    }

    if (/^\d{2,3}$/.test(t)) {
      const v = Number(t);
      if (!Number.isFinite(v) || v <= 0) return null;
      return v;
    }

    return null;
  }

  function fmtMmSs(totalSeconds) {
    const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return String(mm) + ":" + String(ss).padStart(2, "0");
  }

  function estimateWorkoutTotalSeconds(workoutText, paceSecPer100) {
    if (!Number.isFinite(paceSecPer100) || paceSecPer100 <= 0) return null;

    const lines = String(workoutText || "").split(/\r?\n/);

    let currentLabel = "";
    let setBodyLines = [];
    let total = 0;

    const flush = () => {
      if (!setBodyLines.length) return;

      const body = setBodyLines.join("\n");
      const dist = computeSetDistanceFromBody(body);
      if (!Number.isFinite(dist) || dist <= 0) {
        setBodyLines = [];
        return;
      }

      const mult = paceMultiplierForLabel(currentLabel);
      const swim = (dist / 100) * paceSecPer100 * mult;
      const rest = computeRestSecondsFromBody(body);

      total += swim + rest;

      setBodyLines = [];
    };

    for (const line of lines) {
      const t = String(line || "").trim();
      if (!t) continue;

      if (
        t.startsWith("Requested:") ||
        t.startsWith("Total distance:") ||
        t.startsWith("Total lengths:") ||
        t.startsWith("Ends at start end:") ||
        t.startsWith("Est total time:")
      ) {
        continue;
      }

      const m = t.match(/^([^:]{2,30}):\s*(.+)$/);
      if (m) {
        flush();
        currentLabel = String(m[1] || "").trim();
        setBodyLines = [String(m[2] || "").trim()];
      } else {
        setBodyLines.push(t);
      }
    }

    flush();
    return total;
  }

  function computeSetDistanceFromBody(body) {
    const t = String(body || "");
    const re = /(\d+)\s*[x×]\s*(\d+)\s*(m|yd)?/gi;

    let sum = 0;
    let m;
    while ((m = re.exec(t)) !== null) {
      const reps = Number(m[1]);
      const dist = Number(m[2]);
      if (Number.isFinite(reps) && Number.isFinite(dist)) sum += reps * dist;
    }

    if (sum === 0) {
      const one = t.match(/(^|\s)(\d{2,5})(\s*(m|yd))?(\s|$)/);
      if (one) {
        const v = Number(one[2]);
        if (Number.isFinite(v) && v >= 50) sum = v;
      }
    }

    return sum > 0 ? sum : null;
  }

  function computeRestSecondsFromBody(body) {
    const t = String(body || "");
    const reSeg = /(\d+)\s*[x×]\s*(\d+)[^\n]*?rest\s*(\d+)\s*s/gi;
    let sum = 0;
    let m;
    while ((m = reSeg.exec(t)) !== null) {
      const reps = Number(m[1]);
      const rest = Number(m[3]);
      if (Number.isFinite(reps) && reps >= 2 && Number.isFinite(rest) && rest >= 0) {
        sum += (reps - 1) * rest;
      }
    }
    return sum;
  }

  function paceMultiplierForLabel(label) {
    const k = String(label || "").toLowerCase();
    if (k.includes("warm")) return 1.25;
    if (k.includes("build")) return 1.18;
    if (k.includes("drill")) return 1.30;
    if (k.includes("kick")) return 1.38;
    if (k.includes("pull")) return 1.25;
    if (k.includes("main")) return 1.05;
    if (k.includes("cool")) return 1.35;
    return 1.15;
  }

  // SIMPLIFIED SET BUILDER - Coach-like simple sets (4x100 kick descend 1-4)
  function buildOneSetBodyServerLocal({ label, targetDistance, poolLen, unitsShort, opts, seed }) {
    const base = poolLen;
    const target = snapToPoolMultiple(targetDistance, base);
    if (target <= 0) return null;

    const isNonStandardPool = ![25, 50].includes(base);
    const hasThresholdPace = opts.thresholdPace && String(opts.thresholdPace).trim().length > 0;

    const makeLine = (reps, dist, text, restSec) => {
      let suffix = "";
      if (hasThresholdPace && Number.isFinite(restSec) && restSec > 0) {
        suffix = " rest " + String(restSec) + "s";
      }
      let lengthInfo = "";
      if (isNonStandardPool && dist > 0 && base > 0 && dist % base === 0 && dist / base > 1) {
        lengthInfo = " (" + (dist / base) + " lengths)";
      }
      return String(reps) + "x" + String(dist) + lengthInfo + " " + (text || "").trim() + suffix;
    };

    const pickStroke = () => {
      const allowed = [];
      if (opts.strokes.freestyle) allowed.push("freestyle");
      if (opts.strokes.backstroke) allowed.push("backstroke");
      if (opts.strokes.breaststroke) allowed.push("breaststroke");
      if (opts.strokes.butterfly) allowed.push("butterfly");
      if (!allowed.length) return "freestyle";
      const k = String(label || "").toLowerCase();
      if ((k.includes("warm") || k.includes("cool")) && allowed.includes("freestyle")) return "freestyle";
      return allowed[seed % allowed.length];
    };

    const restFor = (repDist) => {
      const k = String(label || "").toLowerCase();
      let r = 15;
      if (k.includes("warm") || k.includes("cool")) r = 0;
      else if (k.includes("drill")) r = 20;
      else if (k.includes("kick") || k.includes("pull")) r = 15;
      else if (k.includes("main")) r = 20;
      if (repDist >= 200) r = Math.max(10, r - 5);
      if (opts.restPref === "short") r = Math.max(0, r - 5);
      if (opts.restPref === "more") r = r + 10;
      return r;
    };

    // Find best rep distance that fits target cleanly
    const findBestFit = (preferredDists) => {
      for (const d of preferredDists) {
        if (d > 0 && target % d === 0) {
          const reps = target / d;
          if (reps >= 2 && reps <= 20) return { reps, dist: d };
        }
      }
      // Fallback: find closest fit
      for (const d of preferredDists) {
        if (d > 0) {
          const reps = Math.floor(target / d);
          if (reps >= 2) return { reps, dist: d };
        }
      }
      return null;
    };

    const stroke = pickStroke();
    const k = String(label || "").toLowerCase();
    const hasFins = !!opts.fins;
    const hasPaddles = !!opts.paddles;

    // Named drills
    const drills = ["Catch-up", "Fist drill", "Fingertip drag", "DPS", "Shark fin", "Zipper", "Scull", "Corkscrew", "Single arm", "Long dog", "Tarzan", "Head up"];
    const drill = drills[seed % drills.length];

    // Build descriptions for variety
    const buildDescs = ["build", "descend 1-3", "descend 1-4", "negative split", "smooth to strong"];
    const buildDesc = buildDescs[seed % buildDescs.length];

    // Preferred distances by set type
    const d25 = snapToPoolMultiple(25, base);
    const d50 = snapToPoolMultiple(50, base);
    const d75 = snapToPoolMultiple(75, base);
    const d100 = snapToPoolMultiple(100, base);
    const d200 = snapToPoolMultiple(200, base);

    // WARM-UP: Simple easy swim
    if (k.includes("warm")) {
      const fit = findBestFit([d100, d50, d200, d75, d25].filter(x => x > 0));
      if (!fit) return makeLine(1, target, stroke + " easy", 0);
      return makeLine(fit.reps, fit.dist, stroke + " easy", 0);
    }

    // BUILD: Simple build set
    if (k.includes("build")) {
      const fit = findBestFit([d50, d100, d75, d25].filter(x => x > 0));
      if (!fit) return makeLine(1, target, stroke + " build", 0);
      return makeLine(fit.reps, fit.dist, stroke + " " + buildDesc, restFor(fit.dist));
    }

    // DRILL: Named drill
    if (k.includes("drill")) {
      const fit = findBestFit([d50, d25, d75].filter(x => x > 0));
      if (!fit) return makeLine(1, target, drill, 0);
      return makeLine(fit.reps, fit.dist, drill, restFor(fit.dist));
    }

    // KICK: Simple kick set
    if (k.includes("kick")) {
      const finNote = hasFins ? " with fins" : "";
      const kickDescs = ["kick " + buildDesc + finNote, "kick steady" + finNote, "kick fast" + finNote];
      const kickDesc = kickDescs[seed % kickDescs.length];
      const fit = findBestFit([d100, d50, d75, d25].filter(x => x > 0));
      if (!fit) return makeLine(1, target, "kick" + finNote, 0);
      return makeLine(fit.reps, fit.dist, kickDesc, restFor(fit.dist));
    }

    // PULL: Simple pull set
    if (k.includes("pull")) {
      const padNote = hasPaddles ? " with paddles" : "";
      const pullDescs = ["pull " + buildDesc + padNote, "pull steady" + padNote, "pull strong" + padNote];
      const pullDesc = pullDescs[seed % pullDescs.length];
      const fit = findBestFit([d100, d50, d200, d75].filter(x => x > 0));
      if (!fit) return makeLine(1, target, "pull" + padNote, 0);
      return makeLine(fit.reps, fit.dist, pullDesc, restFor(fit.dist));
    }

    // COOL-DOWN: Easy swim
    if (k.includes("cool")) {
      const fit = findBestFit([d100, d200, d50].filter(x => x > 0));
      if (!fit) return makeLine(1, target, stroke + " easy", 0);
      return makeLine(fit.reps, fit.dist, "easy choice", 0);
    }

    // MAIN SET: Coach-quality variety
    const focus = String(opts.focus || "allround");
    const mainDescs = {
      sprint: [stroke + " fast", stroke + " build to sprint", stroke + " max effort"],
      threshold: [stroke + " best average", stroke + " strong hold", stroke + " threshold pace"],
      endurance: [stroke + " steady", stroke + " smooth", stroke + " hold pace"],
      technique: [stroke + " perfect form", stroke + " focus DPS", stroke + " count strokes"],
      allround: [stroke + " " + buildDesc, stroke + " hard", stroke + " strong", stroke + " descend 1-4", stroke + " odds easy evens fast", stroke + " sprint", stroke + " max effort"]
    };
    const descs = mainDescs[focus] || mainDescs.allround;
    const mainDesc = descs[seed % descs.length];

    // Prefer 100s for main sets, then 50s, 200s
    const fit = findBestFit([d100, d50, d200, d75].filter(x => x > 0));
    if (!fit) return makeLine(1, target, stroke + " swim", 0);
    return makeLine(fit.reps, fit.dist, mainDesc, restFor(fit.dist));
  }

  // Snazzy workout name generator - inspired by CardGym cards
  function generateWorkoutName(totalDistance, opts, seed) {
    const focus = opts.focus || "allround";
    
    // Distance-based names
    const shortNames = [
      "Quick Dip", "Fast Lane", "Starter Set", "Warm Welcome",
      "Pool Opener", "Light Laps", "Easy Does It", "Swim Snack"
    ];
    const mediumNames = [
      "Steady State", "Lane Lines", "Rhythm & Flow", "Cruise Control",
      "Smooth Sailing", "Pool Party", "Stroke & Glide", "Lap Stack"
    ];
    const longNames = [
      "Distance Dash", "Long Haul", "Mile Maker", "Endurance Engine",
      "Big Swim", "Full Tank", "Deep Dive", "Marathon Mode"
    ];
    
    // Focus-based names
    const focusNames = {
      sprint: ["Speed Demon", "Fast Finish", "Sprint Session", "Power Push", "Quick Burst"],
      threshold: ["Threshold Test", "Pace Pusher", "T-Time", "Race Ready", "Tempo Tune"],
      endurance: ["Distance Day", "Steady Strong", "Long & Smooth", "Endurance Hour"],
      technique: ["Drill Time", "Form Focus", "Technique Tune", "Perfect Stroke"],
      allround: ["Mixed Bag", "Full Spectrum", "Variety Pack", "All-Rounder", "Balanced Swim"]
    };
    
    // Equipment-themed names
    const finsNames = ["Fin Frenzy", "Flipper Time", "Turbo Kick"];
    const paddlesNames = ["Power Paddles", "Arm Amplifier", "Pull Power"];
    
    let pool = [];
    
    // Add focus-specific names
    if (focusNames[focus]) {
      pool = pool.concat(focusNames[focus]);
    }
    
    // Add equipment-specific names
    if (opts.fins) pool = pool.concat(finsNames);
    if (opts.paddles) pool = pool.concat(paddlesNames);
    
    // Add distance-appropriate names
    if (totalDistance <= 1000) {
      pool = pool.concat(shortNames);
    } else if (totalDistance <= 2500) {
      pool = pool.concat(mediumNames);
    } else {
      pool = pool.concat(longNames);
    }
    
    // Fallback if pool somehow empty
    if (pool.length === 0) {
      pool = ["Swim Session", "Pool Workout", "Lap Time"];
    }
    
    // Use seed to deterministically select from pool
    return pool[seed % pool.length];
  }

  function buildWorkout({ targetTotal, poolLen, unitsShort, poolLabel, thresholdPace, opts, seed }) {
    const base = poolLen;
    const rawTotal = snapToPoolMultiple(targetTotal, base);
    const lengths = Math.round(rawTotal / base);
    const evenLengths = lengths % 2 === 0 ? lengths : lengths + 1;
    const total = evenLengths * base;

    const paceSec = parsePaceToSecondsPer100(thresholdPace);

    // Snazzy workout name generator (inspired by CardGym cards)
    const workoutName = generateWorkoutName(total, opts, seed);

    const includeKick = opts.includeKick && total >= snapToPoolMultiple(1500, base);
    const includePull = opts.includePull && total >= snapToPoolMultiple(1500, base);

    const wantBuild = total >= snapToPoolMultiple(1200, base);
    const wantDrill = true;

    const minMainPct = 0.30;
    const minMain = snapToPoolMultiple(Math.round(total * minMainPct), base);

    const warmTarget = snapToPoolMultiple(Math.round(total * 0.15), base);
    const coolTarget = snapToPoolMultiple(Math.round(total * 0.08), base);

    const availableForAncillary = total - minMain - coolTarget;

    const sets = [];

    const warm = Math.min(warmTarget, snapToPoolMultiple(Math.round(availableForAncillary * 0.35), base));
    sets.push({ label: "Warm up", dist: Math.max(warm, base * 4) });
    let usedAncillary = sets[0].dist;

    if (wantBuild && usedAncillary + base * 4 <= availableForAncillary) {
      const build = snapToPoolMultiple(Math.round(total * 0.08), base);
      const d = Math.min(build, availableForAncillary - usedAncillary);
      if (d >= base * 4) {
        sets.push({ label: "Build", dist: d });
        usedAncillary += d;
      }
    }

    if (wantDrill && usedAncillary + base * 4 <= availableForAncillary) {
      const drill = snapToPoolMultiple(Math.round(total * 0.12), base);
      const d = Math.min(drill, availableForAncillary - usedAncillary);
      if (d >= base * 4) {
        sets.push({ label: "Drill", dist: d });
        usedAncillary += d;
      }
    }

    if (includeKick && usedAncillary + base * 4 <= availableForAncillary) {
      const kick = snapToPoolMultiple(Math.round(total * 0.12), base);
      const d = Math.min(kick, availableForAncillary - usedAncillary);
      if (d >= base * 4) {
        sets.push({ label: "Kick", dist: d });
        usedAncillary += d;
      }
    } else if (includePull && usedAncillary + base * 4 <= availableForAncillary) {
      const pull = snapToPoolMultiple(Math.round(total * 0.12), base);
      const d = Math.min(pull, availableForAncillary - usedAncillary);
      if (d >= base * 4) {
        sets.push({ label: "Pull", dist: d });
        usedAncillary += d;
      }
    }

    const mainTotal = total - usedAncillary - coolTarget;

    if (mainTotal >= snapToPoolMultiple(2400, base)) {
      const m1 = snapToPoolMultiple(Math.round(mainTotal * 0.55), base);
      const m2 = snapToPoolMultiple(mainTotal - m1, base);
      sets.push({ label: "Main 1", dist: m1 });
      sets.push({ label: "Main 2", dist: m2 });
    } else {
      sets.push({ label: "Main", dist: snapToPoolMultiple(mainTotal, base) });
    }

    sets.push({ label: "Cool down", dist: coolTarget });

    // Post-process: snap all sections to even lengths and apply minimums
    applySectionMinimums(sets, total, base);

    const lines = [];
    
    // Add total distance to opts so set builder can check for short workouts
    const optsWithTotal = { ...opts, totalDistance: total };

    for (const s of sets) {
      const setLabel = s.label;
      const setDist = s.dist;

      // Set-level validation with reroll logic
      // Try up to 5 times to get a valid set body
      let body = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const candidateBody = buildOneSetBodyShared({
          label: setLabel,
          targetDistance: setDist,
          poolLen,
          unitsShort,
          opts: optsWithTotal,
          seed: (seed + fnv1a32(setLabel) + attempts) >>> 0,
          rerollCount: attempts
        });
        
        if (!candidateBody) {
          attempts++;
          continue;
        }
        
        // Validate the generated body
        const validation = validateSetBody(candidateBody, setDist, poolLen);
        if (validation.valid) {
          body = candidateBody;
          break;
        }
        
        attempts++;
      }

      if (!body) {
        const fallback = safeSimpleSetBody(setLabel, setDist, poolLen, opts);
        lines.push(setLabel + ": " + fallback.split("\n")[0]);
        for (const extra of fallback.split("\n").slice(1)) lines.push(extra);
        lines.push("");
        continue;
      }

      const bodyLines = body.split("\n");
      lines.push(setLabel + ": " + bodyLines[0]);
      for (const extra of bodyLines.slice(1)) lines.push(extra);
      lines.push("");
    }

    while (lines.length && String(lines[lines.length - 1]).trim() === "") lines.pop();

    // RED INJECTION: If no set has hard/fullgas wording, ~20% chance to promote one
    const hasRedEffort = lines.some(line => {
      const low = String(line).toLowerCase();
      return low.includes("hard") || low.includes("full gas") || low.includes("fullgas") || low.includes("all out");
    });
    
    if (!hasRedEffort && ((seed * 31337) >>> 0) % 5 === 0) {
      // Find a main or kick line to promote (not warmup or cooldown)
      for (let i = 0; i < lines.length; i++) {
        const line = String(lines[i]);
        const low = line.toLowerCase();
        if ((low.includes("main") || low.includes("kick")) && !low.includes("warm") && !low.includes("cool")) {
          // Replace "strong" or "fast" with "hard" or add "hard" if just "moderate"
          if (low.includes("strong")) {
            lines[i] = line.replace(/strong/gi, "hard");
          } else if (low.includes("fast")) {
            lines[i] = line.replace(/fast/gi, "hard");
          } else if (low.includes("moderate")) {
            lines[i] = line.replace(/moderate/gi, "strong");
          }
          break;
        }
      }
    }

    const footer = [];
    footer.push("");
    footer.push("Requested: " + String(targetTotal) + String(unitsShort));

    if (total % poolLen === 0) {
      const totalLengths = total / poolLen;
      footer.push("Total lengths: " + String(totalLengths) + " lengths");
      footer.push("Ends at start end: " + (totalLengths % 2 === 0 ? "yes" : "no"));
    }

    footer.push("Total distance: " + String(total) + String(unitsShort) + " (pool: " + String(poolLabel) + ")");

    if (Number.isFinite(paceSec) && paceSec > 0) {
      const estTotal = estimateWorkoutTotalSeconds(lines.join("\n"), paceSec);
      if (Number.isFinite(estTotal)) {
        footer.push("Est total time: " + fmtMmSs(estTotal));
      }
    }

    const full = lines.join("\n") + "\n" + footer.join("\n");

    return { text: full, name: workoutName };

    function pickFromTypical(totalD, baseD, choices, pct) {
      const target = totalD * pct;
      const snappedChoices = choices
        .map(v => snapToPoolMultiple(v, baseD))
        .filter(v => v > 0);

      let best = snappedChoices[0] || snapToPoolMultiple(target, baseD);
      let bestDiff = Math.abs(best - target);

      for (const c of snappedChoices) {
        const diff = Math.abs(c - target);
        if (diff < bestDiff) {
          best = c;
          bestDiff = diff;
        }
      }

      const wiggle = (seed % 3) - 1;
      const idx = Math.max(0, Math.min(snappedChoices.length - 1, snappedChoices.indexOf(best) + wiggle));
      if (snappedChoices[idx]) best = snappedChoices[idx];

      return best;
    }

    function safeSimpleSetBody(label, dist, poolLen2, opts2) {
      const base2 = poolLen2;
      const d100 = snapToPoolMultiple(100, base2);
      const d50 = snapToPoolMultiple(50, base2);

      const lines2 = [];
      let remaining2 = dist;

      const k = String(label || "").toLowerCase();
      const rest = (k.includes("main") ? 20 : k.includes("drill") ? 20 : k.includes("build") ? 15 : 0);

      if (d100 > 0) {
        const reps = Math.floor(remaining2 / d100);
        if (reps >= 2) {
          const use = Math.min(reps, 12);
          lines2.push(String(use) + "x" + String(d100) + " steady" + (rest > 0 ? " rest " + String(rest) + "s" : ""));
          remaining2 -= use * d100;
        }
      }

      if (d50 > 0 && remaining2 > 0) {
        const reps = Math.floor(remaining2 / d50);
        if (reps >= 2) {
          const use = Math.min(reps, 16);
          lines2.push(String(use) + "x" + String(d50) + " easy" + (rest > 0 ? " rest " + String(Math.max(10, rest - 5)) + "s" : ""));
          remaining2 -= use * d50;
        }
      }

      if (remaining2 > 0) {
        lines2.push("1x" + String(remaining2) + " easy");
        remaining2 = 0;
      }

      return lines2.join("\n");
    }
  }
});
app.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port " + String(PORT));
});
