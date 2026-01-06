/* __START_FILE_INDEX_JS_R000__ */
/**
 * Swim Workout Generator v1
 * Clean rebuild (Node + Express)
 *
 * Working Method: This file is block-tagged. After this one-time replacement,
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
      <br/><br/>

      <label>
        Or type it:
        <input
          name="distance"
          id="distanceInput"
          type="number"
          value="1000"
          min="100"
          max="10000"
          step="100"
          required
          style="width: 120px;"
        />
      </label>

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

      // Distance controls
      const distanceSlider = document.getElementById("distanceSlider");
      const distanceInput = document.getElementById("distanceInput");
      const distanceLabel = document.getElementById("distanceLabel");

      function snap100(n) {
        const x = Number(n);
        if (!Number.isFinite(x)) return 1000;
        return Math.round(x / 100) * 100;
      }

      function setDistance(val) {
        const snapped = snap100(val);
        distanceSlider.value = String(snapped);
        distanceInput.value = String(snapped);
        distanceLabel.textContent = String(snapped);
      }

      distanceSlider.addEventListener("input", () => setDistance(distanceSlider.value));
      distanceInput.addEventListener("input", () => setDistance(distanceInput.value));
      setDistance(1000);

      // Pool buttons
      const poolButtons = document.getElementById("poolButtons");
      const poolHidden = document.getElementById("poolLengthHidden");
      const customLen = document.getElementById("customPoolLength");
      const customUnit = document.getElementById("poolLengthUnit");

      function setActivePool(poolValue) {
        poolHidden.value = poolValue;

        // UI: enable/disable custom fields
        const isCustom = poolValue === "custom";
        customLen.disabled = !isCustom;
        customUnit.disabled = !isCustom;

        if (!isCustom) {
          customLen.value = "";
          customUnit.value = "meters";
        }

        // Button styling (minimal)
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

        // Force distance to a snapped integer
        payload.distance = snap100(payload.distance);

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
// --- API: AI generate (v1) ---
app.post("/generate-workout", async (req, res) => {
  try {
    const { distance, poolLength, customPoolLength, poolLengthUnit } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY secret" });
    }

    // Basic request validation (v1)
    if (!Number.isFinite(distance) || distance < 100 || distance > 10000) {
      return res.status(400).json({ ok: false, error: "Invalid distance" });
    }

    const isCustom = poolLength === "custom";
    if (isCustom) {
      const pl = Number(customPoolLength);
      if (!Number.isFinite(pl) || pl < 10 || pl > 400) {
        return res
          .status(400)
          .json({ ok: false, error: "Custom pool selected but customPoolLength is invalid" });
      }
      if (poolLengthUnit !== "meters" && poolLengthUnit !== "yards") {
        return res.status(400).json({ ok: false, error: "Invalid poolLengthUnit" });
      }
    }

    const OpenAI = require("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isStandardPool = poolLength === "25m" || poolLength === "50m" || poolLength === "25yd";
    const poolLine =
      poolLength === "custom"
        ? `custom: ${customPoolLength} ${poolLengthUnit}`
        : poolLength;

    const basePrompt = `
You are an experienced swim coach writing a pool-valid swim workout.

Pool:
- Pool length: ${poolLine}
- Pool type: ${isStandardPool ? "standard" : "non-standard"}

Session target:
- Total distance: ${distance}

Rules:
- Primary output is metres or yards consistent with the pool.
- Pool length is explicit and must never be rounded.
- Every SET must finish on an even number of lengths.
- The FULL WORKOUT must finish on an even number of lengths.
- Intervals inside a set may be odd, as long as the set total resolves even.

Display rules:
- If pool type is STANDARD (25m, 50m, 25yd):
  - Use conventional notation only (e.g. 10x100, 8x50).
  - DO NOT show length counts in parentheses.
- If pool type is NON-STANDARD:
  - Include length clarity in parentheses when needed (e.g. 4x216m (8 lengths)).

Distance accuracy:
- Standard pools must match the total distance exactly.
- Non-standard pools may be close (±100–200) only if it improves symmetry and finish position.

Structure:
- Warm-up
- Drills/Skills
- Main Set
- Cool-down

Drills:
- Use globally recognised drills only.
- If unsure, say "technique drill (choose preferred variation)".

Output:
- Plain text only.
- Clear section headers.
- No Markdown formatting.
- No explanations of rules.

Self-check before responding:
- All sets pool-valid.
- Workout finishes where it started.
- Display rules followed for pool type.
`.trim();

    // ---------- Validity Gate Helpers (v1) ----------
    function parseFirstDistanceMetersOrYards(text) {
      // Extract first distance token like "150m" or "216yd" or "216"
      // We only use this for validating lines that ALSO contain "(N lengths)".
      const m = String(text).match(/(\d+)\s*(m|yd)\b/i);
      if (m) return { value: Number(m[1]), unit: m[2].toLowerCase() };
      const n = String(text).match(/(?:^|\s)(\d+)(?:\s|$)/);
      if (n) return { value: Number(n[1]), unit: null };
      return null;
    }

    function extractLengthsCount(line) {
      const m = String(line).match(/\(\s*(\d+)\s*lengths?\s*\)/i);
      return m ? Number(m[1]) : null;
    }

    function validateNonStandardWorkoutMath(workoutText, poolLenNum) {
      // Only validate lines that contain "(N lengths)"
      // Requirement: the distance mentioned on that line must equal poolLenNum * N.
      // Additionally require N to be even (set ends even lengths).
      const lines = String(workoutText).split(/\r?\n/);

      const failures = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nLengths = extractLengthsCount(line);
        if (!nLengths) continue;

        if (nLengths % 2 !== 0) {
          failures.push({
            lineNo: i + 1,
            reason: `Odd lengths (${nLengths})`,
            line,
          });
          continue;
        }

        const dist = parseFirstDistanceMetersOrYards(line);
        if (!dist || !Number.isFinite(dist.value)) {
          failures.push({
            lineNo: i + 1,
            reason: "Could not parse distance on line with lengths",
            line,
          });
          continue;
        }

        const expected = poolLenNum * nLengths;

        if (dist.value !== expected) {
          failures.push({
            lineNo: i + 1,
            reason: `Distance/length mismatch (got ${dist.value}, expected ${expected})`,
            line,
          });
        }
      }

      return { ok: failures.length === 0, failures };
    }

    async function callCoachOnce(promptText) {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an experienced swim coach. Correctness and pool validity come first. Follow the user's rules exactly.",
          },
          { role: "user", content: promptText },
        ],
        temperature: 0.4,
      });

      return completion.choices?.[0]?.message?.content?.trim() || "";
    }

    // ---------- Generate + Validate (v1) ----------
    let workoutText = await callCoachOnce(basePrompt);

    if (isCustom) {
      const poolLenNum = Number(customPoolLength);

      // 1st pass validate
      let v = validateNonStandardWorkoutMath(workoutText, poolLenNum);

      if (!v.ok) {
        // One repair attempt only
        const repairPrompt = `
The workout below contains INVALID pool math for a non-standard pool.

Pool length is exactly: ${poolLenNum} ${poolLengthUnit}

RULES FOR REPAIR (must follow):
- Any line that includes "(N lengths)" must have distance exactly equal to poolLength * N.
- N must be even on each "(N lengths)" line (set ends even lengths).
- Keep the same overall structure (Warm-up / Drills/Skills / Main Set / Cool-down).
- Keep total distance target as close as before (do not change goal unless necessary).
- Plain text only. No markdown.

Workout to repair:
${workoutText}
`.trim();

        workoutText = await callCoachOnce(repairPrompt);

        // 2nd pass validate
        v = validateNonStandardWorkoutMath(workoutText, poolLenNum);

        if (!v.ok) {
          return res.status(422).json({
            ok: false,
            error: "Invalid pool math in AI output (custom pool).",
            details: v.failures,
            workoutText,
          });
        }
      }
    }

    res.json({ ok: true, workoutText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Generation failed" });
  }
});
/* __END_ROUTE_GENERATE_WORKOUT_R200__ */





/* __START_SERVER_LISTEN_R900__ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/* __END_SERVER_LISTEN_R900__ */

/* __END_FILE_INDEX_JS_R000__ */
