/* __START_FILE_INDEX_JS_R000__ */
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

/* __START_IMPORTS_R010__ */
const express = require("express");
/* __END_IMPORTS_R010__ */

/* __START_APP_SETUP_R020__ */
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
/* __END_APP_SETUP_R020__ */

/* __START_ROUTE_HOME_UI_R100__ */
app.get("/", (req, res) => {
  /* __START_ROUTE_HOME_UI_HTML_R110__ */
  const HOME_HTML = `
    <style>
      @keyframes dolphin-swim {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        25% { transform: translateX(4px) rotate(-5deg); }
        50% { transform: translateX(8px) rotate(0deg); }
        75% { transform: translateX(4px) rotate(5deg); }
      }
      .dolphin-swim {
        display: inline-block;
        animation: dolphin-swim 0.8s ease-in-out infinite;
      }
    </style>
    <h1 style="margin:0 0 6px 0;">Swim Workout Generator v1</h1>
    <div style="margin:0 0 18px 0; color:#333;">Status: running</div>

    <div style="max-width:920px;">
      <h2 style="margin:0 0 10px 0;">Generate</h2>

      <form id="genForm" style="padding:14px; border:1px solid #e2e2e2; border-radius:12px; background:#fff;">
        <div style="display:flex; gap:18px; flex-wrap:wrap; align-items:flex-start;">
          <div style="min-width:320px;">
            <h3 style="margin:0 0 10px 0;">Distance</h3>

            <label style="display:block; margin-bottom:6px;">
              <strong id="distanceLabel">1500</strong> <span style="color:#555;">(m or yd)</span>
            </label>

            <input
              id="distanceSlider"
              type="range"
              min="500"
              max="10000"
              step="100"
              value="1500"
              style="width: 320px;"
            />
            <input type="hidden" name="distance" id="distanceHidden" value="1500" />
          </div>

          <div style="min-width:360px;">
            <h3 style="margin:0 0 10px 0;">Pool length</h3>

            <input type="hidden" name="poolLength" id="poolLengthHidden" value="25m" />

            <div id="poolButtons" style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" data-pool="25m" style="background:#111; color:#fff; border:2px solid #111; padding:6px 14px; border-radius:8px; cursor:pointer;">25m</button>
              <button type="button" data-pool="50m" style="background:#fff; color:#111; border:2px solid #ccc; padding:6px 14px; border-radius:8px; cursor:pointer;">50m</button>
              <button type="button" data-pool="25yd" style="background:#fff; color:#111; border:2px solid #ccc; padding:6px 14px; border-radius:8px; cursor:pointer;">25yd</button>
              <button type="button" data-pool="custom" style="background:#fff; color:#111; border:2px solid #ccc; padding:6px 14px; border-radius:8px; cursor:pointer;">Custom</button>
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

            <div style="margin-top:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">
                Threshold pace (per 100, optional) Example 1:20
              </label>
              <input
                name="thresholdPace"
                id="thresholdPace"
                type="text"
                placeholder="e.g. 1:30"
                style="width: 120px; padding:6px 8px; border-radius:10px; border:1px solid #ccc;"
              />
              <div style="margin-top:6px; font-size:12px; color:#666;">
                If set, the app estimates times per set and total. It assumes freestyle threshold pace.
              </div>
            </div>

            <div style="margin-top:12px;">
              <button type="button" id="toggleAdvanced" style="border:0; background:transparent; color:#111; cursor:pointer; padding:0; font-weight:600;">
                ▶ Advanced options
              </button>
            </div>

            <div id="advancedWrap" style="display:none; margin-top:10px; padding:14px; border:1px solid #ddd; border-radius:12px; background:#fafafa;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
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
                  <select name="focus" id="focus" style="padding:8px 10px; border-radius:10px; border:1px solid #bbb; width:100%; font-size:14px;">
                    <option value="allround">All round</option>
                    <option value="endurance">Endurance</option>
                    <option value="threshold">Threshold</option>
                    <option value="sprint">Sprint</option>
                    <option value="technique">Technique</option>
                  </select>
                </div>
                <div>
                  <div style="font-weight:700; margin-bottom:6px; color:#222;">Rest preference</div>
                  <select name="restPref" id="restPref" style="padding:8px 10px; border-radius:10px; border:1px solid #bbb; width:100%; font-size:14px;">
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
                  style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #bbb; border-radius:10px; resize:vertical; font-size:14px;"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button type="submit" style="padding:8px 12px; border-radius:10px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
            Generate
          </button>
          <button id="copyBtn" type="button" style="margin-left:8px; padding:8px 12px; border-radius:10px; border:1px solid #777; background:#fff; color:#111; cursor:pointer;" disabled>
            Copy
          </button>
          <span id="statusPill" style="margin-left:10px; font-size:13px; color:#555;"></span>
        </div>
      </form>

      <div id="resultWrap" style="margin-top:16px; padding:14px; background:#f6f6f6; border-radius:12px; border:1px solid #e7e7e7;">
        <div id="errorBox" style="display:none; margin-bottom:10px; padding:10px; background:#fff; border:1px solid #e7e7e7; border-radius:10px;"></div>

        <div id="cards" style="display:none;"></div>

        <div id="footerBox" style="display:none; margin-top:12px; padding:10px; background:#fff; border:1px solid #e7e7e7; border-radius:10px;"></div>

        <pre id="raw" style="display:none; margin-top:12px; padding:12px; background:#fff; border-radius:10px; border:1px solid #e7e7e7; white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:13px; line-height:1.35;"></pre>
      </div>
    </div>
  `;
  /* __END_ROUTE_HOME_UI_HTML_R110__ */

  /* __START_ROUTE_HOME_UI_JS_OPEN_R120__ */
  const HOME_JS_OPEN = `
    <script>
  `;
  /* __END_ROUTE_HOME_UI_JS_OPEN_R120__ */

  /* __START_ROUTE_HOME_UI_JS_DOM_R130__ */
  const HOME_JS_DOM = `
      const form = document.getElementById("genForm");
      const errorBox = document.getElementById("errorBox");
      const statusPill = document.getElementById("statusPill");

      const cards = document.getElementById("cards");
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
  `;
  /* __END_ROUTE_HOME_UI_JS_DOM_R130__ */

  /* __START_ROUTE_HOME_UI_JS_HELPERS_R140__ */
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

      function getWorkoutId(payload, workoutText) {
        const base = JSON.stringify({ payload: payload, workoutText: workoutText });
        const h = fnv1a(base);
        return "w" + String(h);
      }

      function loadGoalsMap() {
        try {
          const rawStr = localStorage.getItem("swg_v1_goals");
          if (!rawStr) return {};
          const obj = JSON.parse(rawStr);
          return (obj && typeof obj === "object") ? obj : {};
        } catch {
          return {};
        }
      }

      function saveGoalsMap(map) {
        try {
          localStorage.setItem("swg_v1_goals", JSON.stringify(map));
        } catch {
        }
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
  `;
  /* __END_ROUTE_HOME_UI_JS_HELPERS_R140__ */

  /* __START_ROUTE_HOME_UI_JS_PARSERS_R150__ */
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
  /* __END_ROUTE_HOME_UI_JS_PARSERS_R150__ */

  /* __START_ROUTE_HOME_UI_JS_RENDER_R160__ */
  /* __START_ROUTE_HOME_UI_JS_RENDER_CORE_R161__ */
  const HOME_JS_RENDER_CORE = `
      function clearUI() {
        errorBox.style.display = "none";
        errorBox.innerHTML = "";

        cards.style.display = "none";
        cards.innerHTML = "";

        footerBox.style.display = "none";
        footerBox.innerHTML = "";

        raw.style.display = "none";
        raw.textContent = "";

        statusPill.innerHTML = "";
        copyBtn.disabled = true;
        copyBtn.dataset.copyText = "";

        window.__swgSummary = null;
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
        
        // Warm-up and cool-down are always easy (green)
        if (text.includes("warm") || text.includes("cool")) return "easy";
        
        // Sprint keywords (red)
        const sprintWords = ["sprint", "all out", "max effort", "race pace", "100%"];
        for (const w of sprintWords) if (text.includes(w)) return "sprint";
        
        // Hard keywords (orange)
        const hardWords = ["fast", "strong", "hard", "best average", "race", "threshold"];
        for (const w of hardWords) if (text.includes(w)) return "hard";
        
        // Moderate-high keywords (yellow)
        const modHighWords = ["descend", "build", "negative split", "push"];
        for (const w of modHighWords) if (text.includes(w)) return "mod-high";
        
        // Moderate keywords (blue)
        const modWords = ["steady", "smooth", "drill", "technique", "focus", "form", "choice"];
        for (const w of modWords) if (text.includes(w)) return "moderate";
        
        // Easy keywords (green)
        const easyWords = ["easy", "relaxed", "recovery", "loosen"];
        for (const w of easyWords) if (text.includes(w)) return "easy";
        
        // Default: moderate for technique sets, hard for main
        if (text.includes("main")) return "hard";
        return "moderate";
      }

      function colorStyleForEffort(effort) {
        // Effort-based colors matching Kapisko style:
        // Level 1 (easy): GREEN - warm-up, cool-down, easy swims
        // Level 2 (moderate): BLUE - steady, drill, technique
        // Level 3 (mod-high): YELLOW/CREAM - build, descend
        // Level 4 (hard): ORANGE - fast, strong, threshold
        // Level 5 (sprint): RED - all out, race pace
        if (effort === "easy") return "background:#dcfce7; border-left:4px solid #22c55e; border-top:1px solid #bbf7d0; border-right:1px solid #bbf7d0; border-bottom:1px solid #bbf7d0;";
        if (effort === "moderate") return "background:#dbeafe; border-left:4px solid #3b82f6; border-top:1px solid #93c5fd; border-right:1px solid #93c5fd; border-bottom:1px solid #93c5fd;";
        if (effort === "mod-high") return "background:#fef9c3; border-left:4px solid #eab308; border-top:1px solid #fde047; border-right:1px solid #fde047; border-bottom:1px solid #fde047;";
        if (effort === "hard") return "background:#ffedd5; border-left:4px solid #f97316; border-top:1px solid #fdba74; border-right:1px solid #fdba74; border-bottom:1px solid #fdba74;";
        if (effort === "sprint") return "background:#fee2e2; border-left:4px solid #ef4444; border-top:1px solid #fca5a5; border-right:1px solid #fca5a5; border-bottom:1px solid #fca5a5;";
        return "background:#fff; border:1px solid #e7e7e7;";
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

        const chips = [];

        if (s.poolText) chips.push("Pool: " + s.poolText);

        if (info.requestedLine) chips.push(info.requestedLine);
        else if (Number.isFinite(s.requested)) chips.push("Requested: " + String(s.requested) + String(s.units || ""));

        if (info.totalDistanceLine) chips.push(info.totalDistanceLine.replace("Total distance:", "Total:").trim());
        else if (Number.isFinite(s.requested)) chips.push("Total: " + String(s.requested) + String(s.units || ""));

        if (info.totalLengthsLine) chips.push(info.totalLengthsLine);
        if (info.endsLine) chips.push(info.endsLine);
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
        f.push("<div style=\\"font-weight:700; margin-bottom:6px;\\">Total</div>");
        f.push("<div style=\\"display:flex; flex-wrap:wrap; gap:10px;\\">");

        for (const c of deduped) {
          f.push("<div style=\\"padding:6px 10px; border:1px solid #eee; border-radius:999px; background:#fafafa;\\">" + safeHtml(c) + "</div>");
        }

        f.push("</div>");
        footerBox.innerHTML = f.join("");
        footerBox.style.display = "block";
      }
  `;
  /* __END_ROUTE_HOME_UI_JS_RENDER_CORE_R161__ */

  /* __START_ROUTE_HOME_UI_JS_RENDER_CARDS_R162__ */
  const HOME_JS_RENDER_CARDS = `
      function computeSetDistanceFromBody(body) {
        const t = String(body || "");

        // Support x and ×
        const re = /(\\d+)\\s*[x×]\\s*(\\d+)\\s*(m|yd)?/gi;

        let sum = 0;
        let m;
        while ((m = re.exec(t)) !== null) {
          const reps = Number(m[1]);
          const dist = Number(m[2]);
          if (Number.isFinite(reps) && Number.isFinite(dist)) sum += reps * dist;
        }

        // Also support single swims like "600 easy" without 1x
        // Only if no NxD was found.
        if (sum === 0) {
          const one = t.match(/(^|\\s)(\\d{2,5})(\\s*(m|yd))?(\\s|$)/);
          if (one) {
            const v = Number(one[2]);
            if (Number.isFinite(v) && v >= 50) sum = v;
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

        const workoutId = getWorkoutId(payload, workoutText);
        const goalsMap = loadGoalsMap();
        const goalsForWorkout = goalsMap[workoutId] || {};

        const paceSec = parsePaceToSecondsPer100(payload.thresholdPace || "");

        const html = [];
        html.push('<div style="font-weight:700; margin-bottom:10px;">Your Workout</div>');
        html.push('<div style="display:flex; flex-direction:column; gap:10px;">');

        let idx = 0;

        for (const s of sections) {
          idx += 1;

          const label = s.label ? s.label : ("Set " + idx);
          const body = s.bodies.filter(Boolean).join("\\n");

          const setDist = computeSetDistanceFromBody(body);

          const estSec = estimateSwimSeconds(body, paceSec, label);

          const rightChips = [];
          if (Number.isFinite(setDist)) rightChips.push(String(setDist));
          if (Number.isFinite(estSec)) rightChips.push("Est: " + fmtMmSs(estSec));

          const goalKey = String(idx);
          const existingGoal = typeof goalsForWorkout[goalKey] === "string" ? goalsForWorkout[goalKey] : "";

          const effortLevel = getEffortLevel(label, body);
          const boxStyle = colorStyleForEffort(effortLevel);

          html.push('<div style="' + boxStyle + ' border-radius:12px; padding:12px;">');

          html.push('<div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">');

          html.push('<div style="min-width:0; flex:1;">');
          html.push('<div style="font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:10px;">');
          html.push('<span>' + safeHtml(label) + '</span>');
          html.push(
            '<button type="button" data-reroll-set="' +
              safeHtml(String(idx)) +
              '" style="padding:4px 8px; border-radius:10px; border:1px solid #ccc; background:#fff; cursor:pointer; font-size:14px;" title="Reroll this set">' +
              '🎲' +
            "</button>"
          );
          html.push("</div>");
          html.push('<div data-set-body="' + safeHtml(String(idx)) + '" style="white-space:pre-wrap; line-height:1.35; color:#111;">' + safeHtml(body) + "</div>");
          html.push("</div>");

          html.push('<div style="flex:0 0 auto; display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap; justify-content:flex-end; max-width:260px;">');
          for (const chip of rightChips) {
            html.push('<div style="padding:6px 10px; border:1px solid #eee; border-radius:999px; background:#fafafa; font-size:13px;">' + safeHtml(chip) + "</div>");
          }
          html.push("</div>");

          html.push("</div>");

          html.push('<div style="margin-top:10px;">');
          html.push('<label style="display:block; font-size:12px; color:#555; margin-bottom:4px;">Goal (optional)</label>');
          html.push(
            '<input data-goal-input="' +
              safeHtml(goalKey) +
              '" value="' +
              safeHtml(existingGoal) +
              '" placeholder="Short goal for this set" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #ddd; border-radius:10px;" />'
          );
          html.push("</div>");

          html.push("</div>");
        }

        html.push("</div>");

        cards.innerHTML = html.join("");
        cards.style.display = "block";

        const inputs = cards.querySelectorAll("input[data-goal-input]");
        for (const inp of inputs) {
          inp.addEventListener("input", () => {
            const key = inp.getAttribute("data-goal-input");
            const next = inp.value;

            const m = loadGoalsMap();
            if (!m[workoutId]) m[workoutId] = {};
            m[workoutId][key] = next;
            saveGoalsMap(m);
          });
        }

        const rerollButtons = cards.querySelectorAll("button[data-reroll-set]");
        for (const btn of rerollButtons) {
          btn.addEventListener("click", async () => {
            const setIndex = Number(btn.getAttribute("data-reroll-set"));
            const bodyEl = cards.querySelector('[data-set-body="' + String(setIndex) + '"]');
            if (!bodyEl) return;

            const currentBody = bodyEl.textContent || "";
            const currentDist = computeSetDistanceFromBody(currentBody);

            if (!Number.isFinite(currentDist)) {
              renderError("Cannot reroll this set", ["Set distance could not be parsed. Ensure it contains NxD segments like 8x50, 4x100, or a single distance like 600."]);
              return;
            }

            btn.disabled = true;
            btn.textContent = "Rolling";

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
                  avoidText: currentBody
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

              bodyEl.textContent = nextBody;

              // Update card color based on new effort level
              const cardContainer = bodyEl.closest('[style*="border-radius:12px"]');
              if (cardContainer) {
                const label = sections[setIndex - 1] && sections[setIndex - 1].label ? sections[setIndex - 1].label : "";
                const newEffort = getEffortLevel(label, nextBody);
                const newStyle = colorStyleForEffort(newEffort);
                cardContainer.style.cssText = newStyle + " border-radius:12px; padding:12px;";
              }
            } catch (e) {
              renderError("Reroll failed", [String(e && e.message ? e.message : e)]);
            } finally {
              btn.disabled = false;
              btn.textContent = "🎲";
            }
          });
        }

        renderFooterTotalsAndMeta(footerLines);

        return true;
      }
  `;
  /* __END_ROUTE_HOME_UI_JS_RENDER_CARDS_R162__ */

  /* __START_ROUTE_HOME_UI_JS_RENDER_GLUE_R163__ */
  const HOME_JS_RENDER_GLUE = `
      function renderAll(payload, workoutText) {
        captureSummary(payload, workoutText);
        const ok = renderCards(payload, workoutText);
        return ok;
      }
  `;
  /* __END_ROUTE_HOME_UI_JS_RENDER_GLUE_R163__ */

  const HOME_JS_RENDER = HOME_JS_RENDER_CORE + HOME_JS_RENDER_CARDS + HOME_JS_RENDER_GLUE;
  /* __END_ROUTE_HOME_UI_JS_RENDER_R160__ */

  /* __START_ROUTE_HOME_UI_JS_EVENTS_R170__ */
  const HOME_JS_EVENTS = `
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
          btn.style.fontWeight = isActive ? "600" : "400";
          btn.style.border = isActive ? "2px solid #111" : "2px solid #ccc";
          btn.style.borderRadius = "8px";
          btn.style.padding = "6px 14px";
          btn.style.background = isActive ? "#111" : "#fff";
          btn.style.color = isActive ? "#fff" : "#111";
          btn.style.cursor = "pointer";
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

      toggleAdvanced.addEventListener("click", () => {
        const open = advancedWrap.style.display !== "none";
        if (open) {
          advancedWrap.style.display = "none";
          toggleAdvanced.textContent = "▶ Advanced options";
        } else {
          advancedWrap.style.display = "block";
          toggleAdvanced.textContent = "▼ Advanced options";
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
        clearUI();

        statusPill.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;"><span class="dolphin-swim">🐬</span> Generating...</span>';

        const payload = formToPayload();

        const isCustom = payload.poolLength === "custom";
        if (isCustom) {
          if (!payload.customPoolLength) {
            statusPill.innerHTML = "";
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
            statusPill.innerHTML = "";
            const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ("HTTP " + res.status);
            renderError("Request failed", [msg].filter(Boolean));
            return;
          }

          if (!data || data.ok !== true) {
            statusPill.innerHTML = "";
            const msg = data && data.error ? data.error : "Unknown error.";
            renderError("Generation failed", [msg].filter(Boolean));
            return;
          }

          statusPill.innerHTML = "";

          const workoutText = String(data.workoutText || "").trim();

          if (!workoutText) {
            renderError("No workout returned", ["workoutText was empty."]);
            return;
          }

          const ok = renderAll(payload, workoutText);
          if (!ok) {
            raw.textContent = workoutText;
            raw.style.display = "block";
          }

          const fp = fingerprintWorkoutText(workoutText);
          saveLastWorkoutFingerprint(fp);

          copyBtn.disabled = false;
          copyBtn.dataset.copyText = workoutText;
        } catch (err) {
          statusPill.innerHTML = "";
          renderError("Network error", [String(err && err.message ? err.message : err)]);
        }
      });
  `;
  /* __END_ROUTE_HOME_UI_JS_EVENTS_R170__ */

  /* __START_ROUTE_HOME_UI_JS_CLOSE_R190__ */
  const HOME_JS_CLOSE = `
    </script>
  `;
  /* __END_ROUTE_HOME_UI_JS_CLOSE_R190__ */

  /* __START_ROUTE_HOME_UI_SEND_R195__ */
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Swim Workout Generator</title>
</head>
<body style="padding:20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
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
  /* __END_ROUTE_HOME_UI_SEND_R195__ */
});
/* __END_ROUTE_HOME_UI_R100__ */

/* __START_ROUTE_REROLL_SET_R180__ */
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

    // Generate a replacement body with the same label and distance
    for (let i = 0; i < 10; i++) {
      const seed = (Date.now() + (i * 9973)) >>> 0;
      const next = buildOneSetBodyServer({
        label,
        targetDistance,
        poolLen,
        unitsShort,
        opts,
        seed
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

    const makeLine = (reps, dist, text, restSec) => {
      const r = Number(reps);
      const d = Number(dist);
      const rest = Number(restSec);

      let suffix = "";
      if (Number.isFinite(rest) && rest > 0) suffix = " rest " + String(rest) + "s";

      const strokeText = (text || "").trim();
      return String(r) + "x" + String(d) + " " + strokeText + suffix;
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
      // Warm-up varies 1-3 segments for variety
      const options = [
        // 3 segments: swim + build + drill
        () => {
          const d200 = snapToPoolMultiple(200, base);
          if (d200 > 0) add(1, d200, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(4, d50, stroke + " build", restSecondsFor("build", d50, opts));
          const d25 = snapToPoolMultiple(25, base);
          if (d25 > 0) add(4, d25, "choice drill", restSecondsFor("drill", d25, opts));
        },
        // 2 segments: swim + build
        () => {
          const d300 = snapToPoolMultiple(300, base);
          if (d300 > 0) add(1, d300, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(6, d50, stroke + " build", restSecondsFor("build", d50, opts));
        },
        // 3 segments: swim + kick + drill
        () => {
          const d100 = snapToPoolMultiple(100, base);
          if (d100 > 0) add(2, d100, stroke + " easy", 0);
          const d50 = snapToPoolMultiple(50, base);
          if (d50 > 0) add(4, d50, "kick easy", restSecondsFor("kick", d50, opts));
          if (d50 > 0) add(4, d50, "drill swim", restSecondsFor("drill", d50, opts));
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

      if (d50 > 0 && remaining >= d50 * 6) add(6, d50, stroke + " build", restSecondsFor("build", d50, opts));
      if (d100 > 0 && remaining >= d100 * 4) add(4, d100, stroke + " descend 1 to 4", restSecondsFor("build", d100, opts));

      fillEasy("build");
      return lines.join("\n");
    }

    if (k.includes("drill")) {
      const d50 = snapToPoolMultiple(50, base);
      const d25 = snapToPoolMultiple(25, base);
      const d75 = snapToPoolMultiple(75, base);

      const drillDescriptions = [
        "25 drill 25 swim", "choice drill", "drill focus technique",
        "catchup drill", "fingertip drag drill", "fist drill"
      ];
      const desc = drillDescriptions[seed % drillDescriptions.length];

      // Try to fill with reasonable reps based on what fits
      if (d50 > 0 && remaining >= d50 * 2) {
        const reps = Math.min(8, Math.floor(remaining / d50));
        if (reps >= 2) add(reps, d50, desc, restSecondsFor("drill", d50, opts));
      }
      if (d25 > 0 && remaining >= d25 * 4) {
        const reps = Math.min(12, Math.floor(remaining / d25));
        if (reps >= 4) add(reps, d25, drillDescriptions[(seed + 1) % drillDescriptions.length], restSecondsFor("drill", d25, opts));
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

      if (focus === "sprint") {
        if (d50 > 0 && remaining >= d50 * 12) add(12, d50, stroke + " fast", restSecondsFor("main", d50, opts) + 10);
        if (d100 > 0 && remaining >= d100 * 6) add(6, d100, stroke + " strong", restSecondsFor("main", d100, opts));
      } else if (focus === "threshold") {
        if (d100 > 0 && remaining >= d100 * 10) add(10, d100, stroke + " best average", restSecondsFor("main", d100, opts));
        if (d200 > 0 && remaining >= d200 * 4) add(4, d200, stroke + " steady strong", restSecondsFor("main", d200, opts));
      } else if (focus === "endurance") {
        if (d200 > 0 && remaining >= d200 * 6) add(6, d200, stroke + " steady", restSecondsFor("main", d200, opts));
        if (d100 > 0 && remaining >= d100 * 8) add(8, d100, stroke + " smooth", restSecondsFor("main", d100, opts));
      } else if (focus === "technique") {
        if (d100 > 0 && remaining >= d100 * 8) add(8, d100, stroke + " perfect form", restSecondsFor("main", d100, opts));
        if (d50 > 0 && remaining >= d50 * 8) add(8, d50, stroke + " focus stroke count", restSecondsFor("main", d50, opts));
      } else {
        // All round
        if (d100 > 0 && remaining >= d100 * 8) add(8, d100, stroke + " steady", restSecondsFor("main", d100, opts));
        if (d200 > 0 && remaining >= d200 * 3) add(3, d200, stroke + " strong", restSecondsFor("main", d200, opts));
        if (d50 > 0 && remaining >= d50 * 6) add(6, d50, stroke + " fast finish", restSecondsFor("main", d50, opts) + 5);
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

      const note =
        k2.includes("main") ? (stroke + " steady") :
        k2.includes("drill") ? "drill swim" :
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
/* __END_ROUTE_REROLL_SET_R180__ */

/* __START_ROUTE_GENERATE_WORKOUT_R200__ */
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
        return res.json({ ok: true, workoutText: workout2.text });
      }
    }

    return res.json({ ok: true, workoutText: workout.text });
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

  // FIX: generator needs its own set builder (reroll route has one, but it is scoped there)
  function buildOneSetBodyServerLocal({ label, targetDistance, poolLen, unitsShort, opts, seed }) {
    const base = poolLen;

    const makeLine = (reps, dist, text, restSec) => {
      const r = Number(reps);
      const d = Number(dist);
      const rest = Number(restSec);

      let suffix = "";
      if (Number.isFinite(rest) && rest > 0) suffix = " rest " + String(rest) + "s";

      const strokeText = (text || "").trim();
      return String(r) + "x" + String(d) + " " + strokeText + suffix;
    };

    const pickStrokeForSet = (label2) => {
      const allowed = [];
      if (opts.strokes.freestyle) allowed.push("freestyle");
      if (opts.strokes.backstroke) allowed.push("backstroke");
      if (opts.strokes.breaststroke) allowed.push("breaststroke");
      if (opts.strokes.butterfly) allowed.push("butterfly");
      if (!allowed.length) return "freestyle";

      const k = String(label2 || "").toLowerCase();
      if ((k.includes("main") || k.includes("build")) && allowed.includes("freestyle")) return "freestyle";

      const idx = (Number(seed >>> 0) % allowed.length);
      return allowed[idx];
    };

    const restSecondsFor = (label2, repDist) => {
      const k = String(label2 || "").toLowerCase();
      let baseRest = 15;

      if (k.includes("warm")) baseRest = 0;
      else if (k.includes("drill")) baseRest = 20;
      else if (k.includes("kick")) baseRest = 15;
      else if (k.includes("pull")) baseRest = 15;
      else if (k.includes("build")) baseRest = 15;
      else if (k.includes("main")) baseRest = 20;
      else if (k.includes("cool")) baseRest = 0;

      if (repDist >= 200) baseRest = Math.max(10, baseRest - 5);
      if (repDist <= 50 && k.includes("main")) baseRest = baseRest + 10;

      const r = String(opts.restPref || "balanced");
      if (r === "short") baseRest = Math.max(0, baseRest - 5);
      if (r === "more") baseRest = baseRest + 10;

      return baseRest;
    };

    const add = (lines, remainingObj, reps, dist, note, rest) => {
      const seg = reps * dist;
      if (seg <= 0) return false;
      if (seg > remainingObj.value) return false;
      lines.push(makeLine(reps, dist, note, rest));
      remainingObj.value -= seg;
      return true;
    };

    const fillEasy = (lines, remainingObj, kind, stroke) => {
      const d100 = snapToPoolMultiple(100, base);
      const d50 = snapToPoolMultiple(50, base);
      const d200 = snapToPoolMultiple(200, base);

      const k2 = String(kind || "").toLowerCase();

      const note =
        k2.includes("main") ? (stroke + " steady") :
        k2.includes("drill") ? "drill swim" :
        k2.includes("kick") ? "kick relaxed" :
        k2.includes("pull") ? "pull relaxed" :
        k2.includes("build") ? (stroke + " build") :
        (stroke + " easy");

      while (remainingObj.value >= (d200 || base) && d200 > 0 && remainingObj.value % d200 === 0 && remainingObj.value >= d200) {
        if (lines.length >= 4) break;
        add(lines, remainingObj, 1, d200, note, restSecondsFor(kind || "easy", d200));
      }

      if (d100 > 0) {
        const reps100 = Math.floor(remainingObj.value / d100);
        if (reps100 >= 2) {
          const r = Math.min(reps100, 6);
          add(lines, remainingObj, r, d100, note, restSecondsFor(kind || "easy", d100));
        }
      }

      if (d50 > 0) {
        const reps50 = Math.floor(remainingObj.value / d50);
        if (reps50 >= 2) {
          const r = Math.min(reps50, 10);
          add(lines, remainingObj, r, d50, note, restSecondsFor(kind || "easy", d50));
        }
      }

      if (remainingObj.value > 0) {
        const allowedSingles = [200, 300, 400, 500, 600, 800, 1000]
          .map(v => snapToPoolMultiple(v, base))
          .filter(v => v > 0);

        const canSingle = allowedSingles.includes(remainingObj.value);
        if (canSingle) {
          add(lines, remainingObj, 1, remainingObj.value, note, 0);
          return true;
        }

        if (remainingObj.value % 2 === 0) {
          const half = remainingObj.value / 2;
          add(lines, remainingObj, 2, half, note, restSecondsFor(kind || "easy", half));
          return true;
        }

        return false;
      }

      return true;
    };

    const lines = [];
    const remainingObj = { value: snapToPoolMultiple(targetDistance, base) };
    if (remainingObj.value <= 0) return null;

    const stroke = pickStrokeForSet(label);
    const hasFins = !!opts.fins;
    const hasPaddles = !!opts.paddles;
    const k = String(label || "").toLowerCase();

    if (k.includes("warm")) {
      const d200 = snapToPoolMultiple(200, base);
      const d50 = snapToPoolMultiple(50, base);
      const d25 = snapToPoolMultiple(25, base);

      const choice = seed % 3;

      if (choice === 0) {
        if (d200 > 0) add(lines, remainingObj, 1, d200, stroke + " easy", 0);
        if (d50 > 0) add(lines, remainingObj, 4, d50, stroke + " build", restSecondsFor("build", d50));
        if (d25 > 0) add(lines, remainingObj, 4, d25, "choice drill", restSecondsFor("drill", d25));
      } else if (choice === 1) {
        const d300 = snapToPoolMultiple(300, base);
        if (d300 > 0) add(lines, remainingObj, 1, d300, stroke + " easy", 0);
        if (d50 > 0) add(lines, remainingObj, 6, d50, stroke + " build", restSecondsFor("build", d50));
      } else {
        const d100 = snapToPoolMultiple(100, base);
        if (d100 > 0) add(lines, remainingObj, 2, d100, stroke + " easy", 0);
        if (d50 > 0) add(lines, remainingObj, 4, d50, "kick easy", restSecondsFor("kick", d50));
        if (d50 > 0) add(lines, remainingObj, 4, d50, "drill swim", restSecondsFor("drill", d50));
      }

      if (!fillEasy(lines, remainingObj, "warm", stroke)) return null;
      return lines.join("\n");
    }

    if (k.includes("build")) {
      const d50 = snapToPoolMultiple(50, base);
      const d100 = snapToPoolMultiple(100, base);

      if (d50 > 0 && remainingObj.value >= d50 * 6) add(lines, remainingObj, 6, d50, stroke + " build", restSecondsFor("build", d50));
      if (d100 > 0 && remainingObj.value >= d100 * 4) add(lines, remainingObj, 4, d100, stroke + " descend 1 to 4", restSecondsFor("build", d100));

      if (!fillEasy(lines, remainingObj, "build", stroke)) return null;
      return lines.join("\n");
    }

    if (k.includes("drill")) {
      const d50 = snapToPoolMultiple(50, base);
      const d25 = snapToPoolMultiple(25, base);
      const remaining = remainingObj.value;

      // Calculate how many reps of each distance fit
      if (d50 > 0) {
        const maxReps = Math.floor(remaining / d50);
        if (maxReps >= 6) {
          add(lines, remainingObj, 6, d50, "25 drill 25 swim", restSecondsFor("drill", d50));
        } else if (maxReps >= 4) {
          add(lines, remainingObj, 4, d50, "choice drill", restSecondsFor("drill", d50));
        } else if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d50, "drill focus technique", restSecondsFor("drill", d50));
        }
      }
      // Fill remaining with 25s if needed
      if (d25 > 0 && remainingObj.value >= d25 * 4) {
        const reps25 = Math.min(8, Math.floor(remainingObj.value / d25));
        if (reps25 >= 4) {
          add(lines, remainingObj, reps25, d25, "catchup drill", restSecondsFor("drill", d25));
        }
      }

      if (!fillEasy(lines, remainingObj, "drill", stroke)) return null;
      return lines.join("\n");
    }

    if (k.includes("kick")) {
      const d100 = snapToPoolMultiple(100, base);
      const d50 = snapToPoolMultiple(50, base);
      const d75 = snapToPoolMultiple(75, base);
      const finNote = hasFins ? " with fins" : "";
      const remaining = remainingObj.value;

      // Prefer 100s, then 75s, then 50s - always break into at least 2 reps
      if (d100 > 0) {
        const maxReps = Math.floor(remaining / d100);
        if (maxReps >= 4) {
          add(lines, remainingObj, 4, d100, "kick steady" + finNote, restSecondsFor("kick", d100));
        } else if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d100, "kick choice" + finNote, restSecondsFor("kick", d100));
        }
      }
      if (d75 > 0 && remainingObj.value >= d75 * 2) {
        const maxReps = Math.min(4, Math.floor(remainingObj.value / d75));
        if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d75, "kick build" + finNote, restSecondsFor("kick", d75));
        }
      }
      if (d50 > 0 && remainingObj.value >= d50 * 2) {
        const maxReps = Math.min(6, Math.floor(remainingObj.value / d50));
        if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d50, "kick fast" + finNote, restSecondsFor("kick", d50));
        }
      }

      if (!fillEasy(lines, remainingObj, "kick", stroke)) return null;
      return lines.join("\n");
    }

    if (k.includes("pull")) {
      const d100 = snapToPoolMultiple(100, base);
      const d50 = snapToPoolMultiple(50, base);
      const padNote = hasPaddles ? " with paddles" : "";
      const remaining = remainingObj.value;

      // Prefer 100s, then 50s - always break into at least 2 reps
      if (d100 > 0) {
        const maxReps = Math.floor(remaining / d100);
        if (maxReps >= 4) {
          add(lines, remainingObj, 4, d100, "pull steady" + padNote, restSecondsFor("pull", d100));
        } else if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d100, "pull strong" + padNote, restSecondsFor("pull", d100));
        }
      }
      if (d50 > 0 && remainingObj.value >= d50 * 2) {
        const maxReps = Math.min(6, Math.floor(remainingObj.value / d50));
        if (maxReps >= 2) {
          add(lines, remainingObj, maxReps, d50, "pull build" + padNote, restSecondsFor("pull", d50));
        }
      }

      if (!fillEasy(lines, remainingObj, "pull", stroke)) return null;
      return lines.join("\n");
    }

    if (k.includes("cool")) {
      const d200 = snapToPoolMultiple(200, base);
      const d100 = snapToPoolMultiple(100, base);

      if (d200 > 0 && remainingObj.value >= d200) add(lines, remainingObj, 1, d200, stroke + " easy", 0);
      if (d100 > 0 && remainingObj.value >= d100) add(lines, remainingObj, 1, d100, "easy mixed", 0);

      if (!fillEasy(lines, remainingObj, "cool", stroke)) return null;
      return lines.join("\n");
    }

    // Main
    {
      const focus = String(opts.focus || "allround");

      const d50 = snapToPoolMultiple(50, base);
      const d100 = snapToPoolMultiple(100, base);
      const d200 = snapToPoolMultiple(200, base);

      if (focus === "sprint") {
        if (d50 > 0 && remainingObj.value >= d50 * 12) add(lines, remainingObj, 12, d50, stroke + " fast", restSecondsFor("main", d50) + 10);
        if (d100 > 0 && remainingObj.value >= d100 * 6) add(lines, remainingObj, 6, d100, stroke + " strong", restSecondsFor("main", d100));
      } else if (focus === "threshold") {
        if (d100 > 0 && remainingObj.value >= d100 * 10) add(lines, remainingObj, 10, d100, stroke + " best average", restSecondsFor("main", d100));
        if (d200 > 0 && remainingObj.value >= d200 * 4) add(lines, remainingObj, 4, d200, stroke + " steady strong", restSecondsFor("main", d200));
      } else if (focus === "endurance") {
        if (d200 > 0 && remainingObj.value >= d200 * 6) add(lines, remainingObj, 6, d200, stroke + " steady", restSecondsFor("main", d200));
        if (d100 > 0 && remainingObj.value >= d100 * 8) add(lines, remainingObj, 8, d100, stroke + " smooth", restSecondsFor("main", d100));
      } else if (focus === "technique") {
        if (d100 > 0 && remainingObj.value >= d100 * 8) add(lines, remainingObj, 8, d100, stroke + " perfect form", restSecondsFor("main", d100));
        if (d50 > 0 && remainingObj.value >= d50 * 8) add(lines, remainingObj, 8, d50, stroke + " focus stroke count", restSecondsFor("main", d50));
      } else {
        if (d100 > 0 && remainingObj.value >= d100 * 8) add(lines, remainingObj, 8, d100, stroke + " steady", restSecondsFor("main", d100));
        if (d200 > 0 && remainingObj.value >= d200 * 3) add(lines, remainingObj, 3, d200, stroke + " strong", restSecondsFor("main", d200));
        if (d50 > 0 && remainingObj.value >= d50 * 6) add(lines, remainingObj, 6, d50, stroke + " fast finish", restSecondsFor("main", d50) + 5);
      }

      if (!fillEasy(lines, remainingObj, "main", stroke)) return null;
      return lines.join("\n");
    }
  }

  function buildWorkout({ targetTotal, poolLen, unitsShort, poolLabel, thresholdPace, opts, seed }) {
    const base = poolLen;
    const rawTotal = snapToPoolMultiple(targetTotal, base);
    const lengths = Math.round(rawTotal / base);
    const evenLengths = lengths % 2 === 0 ? lengths : lengths + 1;
    const total = evenLengths * base;

    const paceSec = parsePaceToSecondsPer100(thresholdPace);

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

    const lines = [];

    for (const s of sets) {
      const setLabel = s.label;
      const setDist = s.dist;

      const body = buildOneSetBodyServerLocal({
        label: setLabel,
        targetDistance: setDist,
        poolLen,
        unitsShort,
        opts,
        seed: (seed + fnv1a32(setLabel)) >>> 0
      });

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

    return { text: full };

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
/* __END_ROUTE_GENERATE_WORKOUT_R200__ */


/* __START_SERVER_LISTEN_R900__ */
app.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port " + String(PORT));
});
/* __END_SERVER_LISTEN_R900__ */

/* __END_FILE_INDEX_JS_R000__ */
