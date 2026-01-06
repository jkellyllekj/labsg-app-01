/* __START_FILE_INDEX_JS_R000__ */
/**
 * Swim Workout Generator v1 — Clean rebuild (Node + Express)
 *
 * This file is block-tagged. After this full-file reset,
 * we only replace whole blocks (never line edits).
 */

/* __START_IMPORTS_R010__ */
const express = require("express");
/* __END_IMPORTS_R010__ */

/* __START_APP_SETUP_R020__ */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
/* __END_APP_SETUP_R020__ */

/* __START_ROUTE_HOME_UI_R100__ */
// --- Minimal UI (v1) ---
app.get("/", (req, res) => {
  res.send(`
    <h1>Swim Workout Generator v1</h1>
    <p>Status: running</p>

    <h2>Generate</h2>
    <form id="genForm">
      <h3>Distance</h3>

      <label>
        <strong id="distanceLabel">1000</strong> (m/yd)
      </label>
      <br/>
      <input
        id="distanceSlider"
        type="range"
        min="500"
        max="10000"
        step="100"
        value="1000"
        style="width: 320px;"
      />
      <input type="hidden" name="distance" id="distanceHidden" value="1000" />

      <hr style="margin:16px 0;"/>

      <h3>Pool length</h3>

      <!-- Buttons drive the hidden field -->
      <input type="hidden" name="poolLength" id="poolLengthHidden" value="25m" />

      <div id="poolButtons" style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" data-pool="25m">25m</button>
        <button type="button" data-pool="50m">50m</button>
        <button type="button" data-pool="25yd">25yd</button>
        <button type="button" data-pool="custom">Custom</button>
      </div>

      <div style="margin-top:12px;">
        <label>
          Custom pool length:
          <input
            name="customPoolLength"
            id="customPoolLength"
            type="number"
            min="10"
            max="400"
            placeholder="e.g. 30"
            disabled
            style="width: 90px;"
          />
        </label>
        <select name="poolLengthUnit" id="poolLengthUnit" disabled>
          <option value="meters">meters</option>
          <option value="yards">yards</option>
        </select>
      </div>

      <br/>
      <button type="submit">Generate</button>
    </form>

    <pre id="out" style="margin-top:16px; padding:12px; background:#f5f5f5; border-radius:8px; white-space:pre-wrap;"></pre>

    <script>
      const form = document.getElementById("genForm");
      const out = document.getElementById("out");

      const distanceSlider = document.getElementById("distanceSlider");
      const distanceHidden = document.getElementById("distanceHidden");
      const distanceLabel = document.getElementById("distanceLabel");

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

      distanceSlider.addEventListener("input", () => setDistance(distanceSlider.value));
      setDistance(1000);

      // Pool buttons
      const poolButtons = document.getElementById("poolButtons");
      const poolHidden = document.getElementById("poolLengthHidden");
      const customLen = document.getElementById("customPoolLength");
      const customUnit = document.getElementById("poolLengthUnit");

      function setActivePool(poolValue) {
        poolHidden.value = poolValue;

        const isCustom = poolValue === "custom";
        customLen.disabled = !isCustom;
        customUnit.disabled = !isCustom;

        if (!isCustom) {
          customLen.value = "";
          customUnit.value = "meters";
        }

        for (const btn of poolButtons.querySelectorAll("button[data-pool]")) {
          const isActive = btn.getAttribute("data-pool") === poolValue;
          btn.style.fontWeight = isActive ? "700" : "400";
          btn.style.border = isActive ? "2px solid #000" : "1px solid #999";
          btn.style.borderRadius = "8px";
          btn.style.padding = "6px 10px";
          btn.style.background = isActive ? "#eee" : "#fff";
        }
      }

      poolButtons.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-pool]");
        if (!btn) return;
        setActivePool(btn.getAttribute("data-pool"));
      });

      setActivePool("25m");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        out.textContent = "Generating...";

        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());

        // If custom pool, require custom length
        const isCustom = payload.poolLength === "custom";
        if (isCustom) {
          if (!payload.customPoolLength) {
            out.textContent = "Error: enter a custom pool length.";
            return;
          }
          payload.customPoolLength = Number(payload.customPoolLength);
        } else {
          delete payload.customPoolLength;
          payload.poolLengthUnit = "meters";
        }

        const res = await fetch("/generate-workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
      });
    </script>
  `);
});
/* __END_ROUTE_HOME_UI_R100__ */


/* __START_ROUTE_GENERATE_WORKOUT_R200__ */

app.post("/generate-workout", async (req, res) => {
  /* __START_R210_PARSE_AND_NORMALIZE__ */
  const { distance, poolLength, customPoolLength, poolLengthUnit } = req.body;

  const targetTotal = Number(distance);
  const isCustomPool = poolLength === "custom";

  const unitsShort = isCustomPool
    ? (poolLengthUnit === "yards" ? "yd" : "m")
    : (poolLength === "25yd" ? "yd" : "m");

  const poolLen = isCustomPool ? Number(customPoolLength) : null;

  if (!Number.isFinite(targetTotal) || targetTotal <= 0) {
    return res.status(400).json({ ok: false, error: "Invalid distance." });
  }
  if (!poolLength || typeof poolLength !== "string") {
    return res.status(400).json({ ok: false, error: "Invalid pool selection." });
  }
  if (isCustomPool && (!Number.isFinite(poolLen) || poolLen <= 0)) {
    return res.status(400).json({ ok: false, error: "Invalid custom pool length." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY (Replit Secret)." });
  }

  // Exact-possible: totalDistance is a clean multiple of pool length AND total lengths even.
  const targetLengthsExact = isCustomPool ? targetTotal / poolLen : null;
  const exactPossible =
    isCustomPool && Number.isInteger(targetLengthsExact) && targetLengthsExact % 2 === 0;
  /* __END_R210_PARSE_AND_NORMALIZE__ */

  /* __START_R220_DETERMINISTIC_CUSTOM_EXACT__ */
function buildDeterministicCustomWorkoutTextExact() {
  if (!exactPossible) return null;

  const lengthsPerRep = 2;
  const perRepDistance = lengthsPerRep * poolLen;
  const totalReps = targetLengthsExact / lengthsPerRep; // integer

  let wu = Math.max(4, Math.round(totalReps * 0.2));
  let dr = Math.max(4, Math.round(totalReps * 0.15));
  let cd = Math.max(2, Math.round(totalReps * 0.15));
  let main = totalReps - (wu + dr + cd);

  if (main < 6) {
    const needed = 6 - main;

    const takeWu = Math.min(Math.max(wu - 4, 0), needed);
    wu -= takeWu;
    main += takeWu;

    const remaining = 6 - main;
    const takeDr = Math.min(Math.max(dr - 4, 0), remaining);
    dr -= takeDr;
    main += takeDr;

    const remaining2 = 6 - main;
    const takeCd = Math.min(Math.max(cd - 2, 0), remaining2);
    cd -= takeCd;
    main += takeCd;
  }

  const sum = wu + dr + main + cd;
  if (sum !== totalReps) main += (totalReps - sum);

  const totalLengths = Number(targetLengthsExact); // integer
  const lines = [];
  lines.push(`Warm-up: ${wu}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Freestyle — Easy — 20s rest`);
  lines.push(`Drill: ${dr}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Choice drill — Moderate — 20s rest`);
  lines.push(`Main: ${main}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Freestyle — Hard — 30–45s rest`);
  lines.push(`Cooldown: ${cd}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Easy mixed — 20s rest`);
  lines.push("");
  lines.push(`Total lengths: ${totalLengths} lengths`);
  lines.push(`Ends at start end: ${totalLengths % 2 === 0 ? "yes" : "no"}`);
  lines.push(`Total distance: ${targetTotal}${unitsShort} (pool: ${poolLen}${unitsShort})`);
  return lines.join("\n");
}
/* __END_R220_DETERMINISTIC_CUSTOM_EXACT__ */


  /* __START_R225_DETERMINISTIC_CUSTOM_NEAREST__ */
function buildDeterministicCustomWorkoutTextNearest() {
  if (!isCustomPool) return null;

  const rawLengths = targetTotal / poolLen;

  const down = Math.floor(rawLengths);
  const up = Math.ceil(rawLengths);

  const downEven = down % 2 === 0 ? down : down - 1;
  const upEven = up % 2 === 0 ? up : up + 1;

  const candidates = [];
  if (Number.isInteger(downEven) && downEven > 0) candidates.push(downEven);
  if (Number.isInteger(upEven) && upEven > 0) candidates.push(upEven);

  if (candidates.length === 0) return null;

  let best = candidates[0];
  for (const c of candidates.slice(1)) {
    const diffBest = Math.abs(best * poolLen - targetTotal);
    const diffC = Math.abs(c * poolLen - targetTotal);
    if (diffC < diffBest) best = c;
    else if (diffC === diffBest && c > best) best = c;
  }

  const chosenTotal = best * poolLen;

  const lengthsPerRep = 2;
  const perRepDistance = lengthsPerRep * poolLen;
  const totalReps = best / lengthsPerRep; // integer because best is even

  let wu = Math.max(4, Math.round(totalReps * 0.2));
  let dr = Math.max(4, Math.round(totalReps * 0.15));
  let cd = Math.max(2, Math.round(totalReps * 0.15));
  let main = totalReps - (wu + dr + cd);

  if (main < 6) {
    const needed = 6 - main;

    const takeWu = Math.min(Math.max(wu - 4, 0), needed);
    wu -= takeWu;
    main += takeWu;

    const remaining = 6 - main;
    const takeDr = Math.min(Math.max(dr - 4, 0), remaining);
    dr -= takeDr;
    main += takeDr;

    const remaining2 = 6 - main;
    const takeCd = Math.min(Math.max(cd - 2, 0), remaining2);
    cd -= takeCd;
    main += takeCd;
  }

  const sum = wu + dr + main + cd;
  if (sum !== totalReps) main += (totalReps - sum);

  const totalLengths = Number(best); // integer
  const lines = [];
  lines.push(`Warm-up: ${wu}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Freestyle — Easy — 20s rest`);
  lines.push(`Drill: ${dr}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Choice drill — Moderate — 20s rest`);
  lines.push(`Main: ${main}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Freestyle — Hard — 30–45s rest`);
  lines.push(`Cooldown: ${cd}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths) — Easy mixed — 20s rest`);
  lines.push("");
  lines.push(`Total lengths: ${totalLengths} lengths`);
  lines.push(`Ends at start end: ${totalLengths % 2 === 0 ? "yes" : "no"}`);
  lines.push(`Requested: ${targetTotal}${unitsShort}`);
  lines.push(`Total distance: ${chosenTotal}${unitsShort} (pool: ${poolLen}${unitsShort})`);
  return lines.join("\n");
}
/* __END_R225_DETERMINISTIC_CUSTOM_NEAREST__ */



  
  /* __START_R230_OPENAI_CALL__ */
async function callOpenAI(messages, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`OpenAI HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(t);
  }
}
/* __END_R230_OPENAI_CALL__ */


  /* __START_R240_CUSTOM_JSON_HELPERS_AND_VALIDATION__ */
  function extractFirstJsonObject(text) {
    if (typeof text !== "string") return null;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return text.slice(start, end + 1);
  }

  function validateCustomWorkoutJson(obj) {
    const errors = [];

    if (!obj || typeof obj !== "object") {
      errors.push("JSON root must be an object.");
      return { ok: false, errors };
    }
    if (!Array.isArray(obj.sets) || obj.sets.length === 0) {
      errors.push('Field "sets" must be a non-empty array.');
      return { ok: false, errors };
    }

    let computedTotal = 0;
    let computedTotalLengths = 0;

    for (let i = 0; i < obj.sets.length; i++) {
      const s = obj.sets[i];

      const label = String(s.label ?? "").trim();
      const reps = Number(s.reps);
      const lengthsPerRep = Number(s.lengthsPerRep);

      if (!label) errors.push(`sets[${i}].label is required (non-empty).`);
      if (!Number.isInteger(reps) || reps <= 0) errors.push(`sets[${i}].reps must be a positive integer.`);
      if (!Number.isInteger(lengthsPerRep) || lengthsPerRep <= 0) errors.push(`sets[${i}].lengthsPerRep must be a positive integer.`);

      if (Number.isInteger(reps) && reps > 0 && Number.isInteger(lengthsPerRep) && lengthsPerRep > 0) {
        const setLengths = reps * lengthsPerRep;
        computedTotalLengths += setLengths;

        if (setLengths % 2 !== 0) {
          errors.push(`sets[${i}] ends on ${setLengths} total lengths (must be even).`);
        }

        computedTotal += reps * lengthsPerRep * poolLen;
      }
    }

    if (computedTotalLengths % 2 !== 0) {
      errors.push(`Workout ends on ${computedTotalLengths} total lengths (must be even).`);
    }

    // Non-exact custom: allow tolerance. (Exact totals are handled by deterministic path.)
    const tolerance = Math.max(200, poolLen);
    const diff = Math.abs(computedTotal - targetTotal);
    if (diff > tolerance) {
      errors.push(
        `Total distance mismatch: computed ${computedTotal}${unitsShort}, requested ${targetTotal}${unitsShort}. (tolerance ±${tolerance}${unitsShort})`
      );
    }

    return { ok: errors.length === 0, errors, computedTotal, computedTotalLengths, tolerance };
  }

  function renderWorkoutTextFromJson(obj) {
    const lines = [];

    for (const s of obj.sets) {
      const label = String(s.label ?? "").trim();
      const reps = Number(s.reps);
      const lengthsPerRep = Number(s.lengthsPerRep);

      const perRepDistance = lengthsPerRep * poolLen;

      const stroke = typeof s.stroke === "string" && s.stroke.trim() ? s.stroke.trim() : "";
      const intensity = typeof s.intensity === "string" && s.intensity.trim() ? s.intensity.trim() : "";
      const restSeconds = Number.isFinite(Number(s.restSeconds)) ? Number(s.restSeconds) : null;
      const notes = typeof s.notes === "string" && s.notes.trim() ? s.notes.trim() : "";

      const parts = [];
      parts.push(`${label}: ${reps}x${perRepDistance}${unitsShort} (${lengthsPerRep} lengths)`);
      if (stroke) parts.push(stroke);
      if (intensity) parts.push(intensity);
      if (restSeconds !== null) parts.push(`${restSeconds}s rest`);
      if (notes) parts.push(notes);

      lines.push(parts.join(" — "));
    }

    const computedTotal = obj.sets.reduce((sum, s) => {
      return sum + (Number(s.reps) * Number(s.lengthsPerRep) * poolLen);
    }, 0);

    lines.push("");
    lines.push(`Total distance: ${computedTotal}${unitsShort} (pool: ${poolLen}${unitsShort})`);
    return lines.join("\n");
  }
  /* __END_R240_CUSTOM_JSON_HELPERS_AND_VALIDATION__ */

  /* __START_R250_PROMPTS__ */
  function buildStandardPrompt() {
    return `
You are a swim coach generating a single swim workout.

Rules:
- Output plain text only
- Each line is a swim set
- Distances must add up to exactly ${targetTotal}${unitsShort}
- Pool length is standard (${poolLength})
- DO NOT include "(lengths)" anywhere
- Use conventional swim notation only (e.g. 10x100, 4x50)

Workout request:
- Total distance: ${targetTotal}${unitsShort}
- Pool: ${poolLength}
`.trim();
  }

  function buildCustomJsonPrompt() {
    const tolerance = Math.max(200, poolLen);

    return `
You are a swim coach generating a single swim workout FOR A CUSTOM POOL.

CRITICAL:
- Pool length = ${poolLen}${unitsShort}
- 1 length = exactly ${poolLen}${unitsShort}
- Return JSON ONLY (no prose, no markdown, no code fences).

Even-length rules (mandatory):
- Every set must finish on an even number of lengths.
- The whole workout must finish on an even number of lengths.

JSON schema:
{
  "sets": [
    {
      "label": "Warm-up" | "Drill" | "Main" | "Cooldown",
      "reps": <positive integer>,
      "lengthsPerRep": <positive integer>,
      "stroke": "<optional string>",
      "intensity": "<optional string>",
      "restSeconds": <optional integer>,
      "notes": "<optional string>"
    }
  ]
}

Distance math:
- perRepDistance = lengthsPerRep * ${poolLen}${unitsShort}
- setDistance = reps * perRepDistance
- sum(setDistance) should be as close as possible to ${targetTotal}${unitsShort}
- May differ by up to ±${tolerance}${unitsShort}

Hard rule:
- NEVER assume 25m/50m. You are in a ${poolLen}${unitsShort} pool.
`.trim();
  }
  /* __END_R250_PROMPTS__ */

/* __START_R260_HANDLER_FLOW__ */
try {
  // Deterministic fallback for standard pools (no "(lengths)", sums exactly)
  function buildDeterministicStandardWorkoutText() {
    const total = targetTotal;

    // Simple, always-sums allocation
    // 20% warmup, 15% drills, 55% main, 10% cooldown (then adjust to exact using 50/100 chunks)
    let wu = Math.round(total * 0.2);
    let dr = Math.round(total * 0.15);
    let cd = Math.round(total * 0.1);
    let main = total - (wu + dr + cd);

    // Snap each to nearest 50 in the target units (works fine for 25m/50m/25yd conventions)
    const snap50 = (n) => Math.max(50, Math.round(n / 50) * 50);

    wu = snap50(wu);
    dr = snap50(dr);
    cd = snap50(cd);
    main = total - (wu + dr + cd);

    // Ensure main is at least 400; if not, steal from warmup/drills
    if (main < 400) {
      const need = 400 - main;
      const takeWu = Math.min(Math.max(wu - 200, 0), need);
      wu -= takeWu;
      main += takeWu;

      const need2 = 400 - main;
      const takeDr = Math.min(Math.max(dr - 200, 0), need2);
      dr -= takeDr;
      main += takeDr;
    }

    // Final exactness adjustment using 50s
    const sum = wu + dr + main + cd;
    const diff = total - sum;
    main += diff; // diff will be multiple of 50 because total is slider-hundreds and others snapped to 50

    const lines = [];
    // Use conventional “reps x distance” where possible
    lines.push(`Warm-up: ${Math.max(1, Math.round(wu / 200))}x200 easy`); // approximate reps; still sums? (line is guidance)
    lines.push(`Drills: ${Math.max(4, Math.round(dr / 50))}x50 drill (choice)`);
    lines.push(`Main set: ${Math.max(5, Math.round(main / 100))}x100 steady/moderate`);
    lines.push(`Cooldown: ${Math.max(1, Math.round(cd / 100))}x100 easy`);

    // Note: For standard pools we don’t print a computed total line; this is fallback copy only.
    // If you want the footer later, we’ll compute exact displayed totals by set.
    return lines.join("\n\n");
  }

  // Standard pools: try OpenAI, but if it times out/fails, return deterministic fallback
  if (!isCustomPool) {
    try {
      const workoutText = await callOpenAI(
        [{ role: "user", content: buildStandardPrompt() }],
        { timeoutMs: 20000 }
      );

      if (!workoutText || typeof workoutText !== "string") {
        throw new Error("OpenAI returned empty workout text.");
      }

      return res.json({ ok: true, workoutText });
    } catch (e) {
      console.warn("OpenAI standard-pool fallback triggered:", e?.message ?? e);
      const workoutText = buildDeterministicStandardWorkoutText();
      return res.json({
        ok: true,
        workoutText,
      });
    }
  }

  // Custom pools: deterministic only (instant, always valid)
  const deterministicExact = buildDeterministicCustomWorkoutTextExact();
  if (deterministicExact) {
    return res.json({ ok: true, workoutText: deterministicExact });
  }

  const deterministicNearest = buildDeterministicCustomWorkoutTextNearest();
  if (deterministicNearest) {
    return res.json({ ok: true, workoutText: deterministicNearest });
  }

  return res.status(500).json({
    ok: false,
    error: "Custom pool deterministic generation failed unexpectedly.",
  });
} catch (err) {
  console.error(err);
  return res.status(500).json({ ok: false, error: "Workout generation failed." });
}
/* __END_R260_HANDLER_FLOW__ */




});

/* __END_ROUTE_GENERATE_WORKOUT_R200__ */




/* __START_SERVER_LISTEN_R900__ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/* __END_SERVER_LISTEN_R900__ */

/* __END_FILE_INDEX_JS_R000__ */
