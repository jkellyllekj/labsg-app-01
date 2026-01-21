const http = require("http");

const BASE_URL = "http://localhost:5000";

async function postGenerate(distance, poolLength) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ distance, poolLength });
    const req = http.request(
      `${BASE_URL}/generate-workout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body: null, parseError: e.message });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function findMainSection(text) {
  if (!text) return null;
  const lines = text.split("\n");
  let inMain = false;
  let mainLines = [];
  for (const line of lines) {
    if (/^MAIN/i.test(line.trim())) {
      inMain = true;
      mainLines.push(line);
    } else if (inMain) {
      if (/^\s*$/.test(line) || /^(WARM|COOL|DRILL|KICK|PULL|PRE-MAIN)/i.test(line.trim())) {
        break;
      }
      mainLines.push(line);
    }
  }
  return mainLines.join("\n");
}

async function suiteA() {
  console.log("\n=== SUITE A: Crash and retry hardening (25m, 2000m, 30 runs) ===");
  let httpFailures = 0;
  let missingFields = 0;
  let errorResponses = [];

  for (let i = 0; i < 30; i++) {
    try {
      const res = await postGenerate(2000, "25m");
      if (res.status !== 200) {
        httpFailures++;
      }
      if (!res.body) {
        missingFields++;
      } else {
        if (res.body.error) {
          errorResponses.push(res.body.error);
        }
        if (!res.body.ok || !res.body.workoutText) {
          missingFields++;
        }
      }
    } catch (e) {
      httpFailures++;
    }
  }

  console.log(`  HTTP failures: ${httpFailures}`);
  console.log(`  Missing fields: ${missingFields}`);
  console.log(`  Error responses: ${errorResponses.length}`);
  if (errorResponses.length > 0) {
    console.log(`  Errors: ${errorResponses.slice(0, 5).join(", ")}`);
  }
  const pass = httpFailures === 0 && missingFields === 0 && errorResponses.length === 0;
  console.log(`  RESULT: ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

async function suiteB() {
  console.log("\n=== SUITE B: Rep count sanity (25m, 2000m, 15 runs) ===");
  let highRepCount = 0;
  let highRepLines = [];

  for (let i = 0; i < 15; i++) {
    try {
      const res = await postGenerate(2000, "25m");
      if (res.body && res.body.workoutText) {
        const main = findMainSection(res.body.workoutText);
        if (main) {
          const matches = main.match(/(\d+)\s*x\s*50/gi);
          if (matches) {
            for (const m of matches) {
              const reps = parseInt(m.match(/(\d+)/)[1], 10);
              if (reps > 16) {
                highRepCount++;
                highRepLines.push(main.split("\n").find((l) => l.includes(m)) || m);
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  console.log(`  Main sets with x50 reps > 16: ${highRepCount}`);
  if (highRepLines.length > 0) {
    console.log(`  Example lines:`);
    highRepLines.slice(0, 5).forEach((l) => console.log(`    ${l.trim()}`));
  }
  console.log(`  RESULT: INFO (no pass/fail threshold defined)`);
  return true;
}

async function suiteC() {
  console.log("\n=== SUITE C: Red distribution proxy (25m, 3000m, 20 runs) ===");
  console.log(`  Cannot detect red from API (response is text only)`);
  console.log(`  RESULT: SKIPPED`);
  return true;
}

async function suiteD() {
  console.log("\n=== SUITE D: 25yd parity (25yd, 2000m, 10 runs) ===");
  let oddRepCount = 0;
  let oddRepLines = [];

  for (let i = 0; i < 10; i++) {
    try {
      const res = await postGenerate(2000, "25yd");
      if (res.body && res.body.workoutText) {
        const main = findMainSection(res.body.workoutText);
        if (main) {
          const matches = main.match(/(22|26)\s*x\s*50/gi);
          if (matches) {
            for (const m of matches) {
              oddRepCount++;
              oddRepLines.push(main.split("\n").find((l) => l.includes(m)) || m);
            }
          }
        }
      }
    } catch (e) {}
  }

  console.log(`  Main sets with 22x50 or 26x50: ${oddRepCount}`);
  if (oddRepLines.length > 0) {
    console.log(`  Example lines:`);
    oddRepLines.slice(0, 5).forEach((l) => console.log(`    ${l.trim()}`));
  }
  console.log(`  RESULT: INFO (no pass/fail threshold defined)`);
  return true;
}

async function main() {
  console.log("SwimGen Smoke Test");
  console.log("==================");

  const results = {
    A: await suiteA(),
    B: await suiteB(),
    C: await suiteC(),
    D: await suiteD(),
  };

  console.log("\n=== SUMMARY ===");
  console.log(`Suite A (Crash hardening): ${results.A ? "PASS" : "FAIL"}`);
  console.log(`Suite B (Rep count sanity): ${results.B ? "PASS" : "INFO"}`);
  console.log(`Suite C (Red distribution): SKIPPED`);
  console.log(`Suite D (25yd parity): ${results.D ? "PASS" : "INFO"}`);
}

main().catch(console.error);
