/**
 * plan-runner.js — HI SYSTEM AUTONOMOUS EXECUTOR
 * Approval-based auto-builder: load context, show phase overview, ask approval,
 * execute phase steps (auto where possible, confirm otherwise), sync MASTER_TASK_LIST and CHANGELOG.
 * Safety: never delete existing systems unless step says migration; JSON work must not break TSX; if uncertain, pause and ask.
 * No npm dependencies; Node built-ins only.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const HI_SYSTEM = path.join(ROOT, "docs", "HI_SYSTEM");

const CONTEXT_FILES = [
  "MAP.md",
  "SYSTEM_MASTER_PLAN.md",
  "MASTER_TASK_LIST.md",
  "WORKFLOW_RULES.md",
];

function readContextFile(name) {
  const filePath = path.join(HI_SYSTEM, name);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function loadSystemContext() {
  const loaded = [];
  for (const name of CONTEXT_FILES) {
    const content = readContextFile(name);
    if (content !== null) loaded.push(name);
    else console.warn("[plan-runner] Missing:", path.join("docs", "HI_SYSTEM", name));
  }
  return loaded;
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function getPhaseSteps(content, phaseNum) {
  const phaseRegex = new RegExp(
    `## Phase ${phaseNum} — ([^\\n]+)[\\s\\S]*?### Steps\\s*\\n([\\s\\S]*?)(?=### Depends On|## Phase \\d+|---|$)`,
    "i"
  );
  const m = content.match(phaseRegex);
  if (!m) return { name: "", steps: [], stepsRaw: "" };
  const name = m[1].trim();
  const stepsBlock = m[2];
  const stepLines = stepsBlock.match(/^\d+\.\s+\[[ x]\].+$/gm) || [];
  return { name, steps: stepLines, stepsRaw: stepsBlock };
}

function getPhaseOverview(content) {
  const phases = [];
  let totalUnchecked = 0;
  let totalChecked = 0;
  let firstIncompletePhase = null;
  for (let n = 1; n <= 8; n++) {
    const { name, steps } = getPhaseSteps(content, n);
    if (!steps.length) continue;
    let u = 0,
      c = 0;
    steps.forEach((line) => {
      if (/\[x\]/.test(line)) c++;
      else if (/\[ \]/.test(line)) u++;
    });
    const total = c + u;
    const pct = total ? Math.round((c / total) * 100) : 0;
    totalUnchecked += u;
    totalChecked += c;
    if (firstIncompletePhase === null && u > 0) firstIncompletePhase = n;
    phases.push({ num: n, name, unchecked: u, checked: c, total, pct });
  }
  return { phases, totalUnchecked, totalChecked, firstIncompletePhase };
}

function showPhaseOverview() {
  const content = readContextFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return null;
  }
  const { phases, totalUnchecked, totalChecked, firstIncompletePhase } = getPhaseOverview(content);
  const totalSteps = totalUnchecked + totalChecked;
  const overallPct = totalSteps ? Math.round((totalChecked / totalSteps) * 100) : 0;

  console.log("\n--- Phase Overview ---\n");
  phases.forEach((p) => {
    const highlight = p.num === firstIncompletePhase ? "  << NEXT" : "";
    console.log(
      "Phase " + p.num + " — " + p.name + ": " + p.checked + "/" + p.total + " (" + p.pct + "%)" + highlight
    );
  });
  console.log("\nTotal remaining steps:", totalUnchecked);
  console.log("Overall:", totalChecked + "/" + totalSteps, "(" + overallPct + "%)\n");
  return { firstIncompletePhase, totalUnchecked };
}

function markStepDone(phaseNum, stepNum) {
  const taskPath = path.join(HI_SYSTEM, "MASTER_TASK_LIST.md");
  let content = fs.readFileSync(taskPath, "utf8");
  const phaseRegex = new RegExp(
    `(## Phase ${phaseNum} — [^\\n]+[\\s\\S]*?### Steps\\s*\\n)([\\s\\S]*?)(?=### Depends On)`,
    "i"
  );
  const phaseMatch = content.match(phaseRegex);
  if (!phaseMatch) return false;
  const stepsBlock = phaseMatch[2];
  const stepLineRegex = new RegExp(`^(\\s*)(\\d+)\\. \\[ \\](\\s+.+)$`, "gm");
  let stepIndex = 0;
  let newStepsBlock = stepsBlock.replace(stepLineRegex, (match, indent, num, rest) => {
    stepIndex++;
    if (parseInt(num, 10) === stepNum) {
      return indent + num + ". [x]" + rest;
    }
    return match;
  });
  if (newStepsBlock === stepsBlock) return false;
  content = content.replace(phaseMatch[1] + phaseMatch[2], phaseMatch[1] + newStepsBlock);
  fs.writeFileSync(taskPath, content, "utf8");
  return true;
}

function appendChangelogEntry(text) {
  const changelogPath = path.join(HI_SYSTEM, "CHANGELOG.md");
  const date = new Date().toISOString().slice(0, 10);
  const entry = `\n### ${date} — ${text}\n`;
  fs.appendFileSync(changelogPath, entry, "utf8");
}

function updateMapTimestamp() {
  const mapPath = path.join(HI_SYSTEM, "MAP.md");
  let mapContent = fs.readFileSync(mapPath, "utf8");
  const stamp = "Last reviewed: " + new Date().toISOString();
  if (/^Last reviewed: .+$/m.test(mapContent)) {
    mapContent = mapContent.replace(/^Last reviewed: .+$/m, stamp);
  } else {
    mapContent = stamp + "\n\n" + mapContent;
  }
  fs.writeFileSync(mapPath, mapContent, "utf8");
}

// --- Step handlers: mechanical actions only. Safety: no delete unless migration; JSON must not break TSX.
function tryExecuteStep(phaseNum, stepNum, stepLine) {
  const desc = stepLine.replace(/^\d+\.\s+\[[ x]\]\s*/, "").trim();

  if (phaseNum === 1 && stepNum === 2) {
    const buttonPath = path.join(ROOT, "src", "compounds", "ui", "definitions", "button.json");
    if (!fs.existsSync(buttonPath)) return { done: false, reason: "button.json not found" };
    let json;
    try {
      json = JSON.parse(fs.readFileSync(buttonPath, "utf8"));
    } catch (e) {
      return { done: false, reason: "button.json invalid JSON" };
    }
    if (json.variants && json.variants.icon) return { done: true, reason: "icon variant already present" };
    if (!json.variants) json.variants = {};
    json.variants.icon = {
      surface: { background: "color.surface", padding: "padding.xs" },
      text: { color: "color.primary", size: "textSize.md", weight: "textWeight.medium" },
      trigger: { hoverFeedback: "soft", pressFeedback: "light", cursor: "pointer" },
    };
    fs.writeFileSync(buttonPath, JSON.stringify(json, null, 2), "utf8");
    return { done: true, reason: "Added icon variant to button.json" };
  }

  return { done: false, reason: "requires_manual" };
}

async function executePhaseAutonomous(rl, phaseNum) {
  const content = readContextFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const { name, steps } = getPhaseSteps(content, phaseNum);
  const unchecked = steps
    .map((line) => {
      const m = line.match(/^(\d+)\.\s+\[ \]\s+(.+)$/);
      return m ? { stepNum: parseInt(m[1], 10), line: m[0], desc: m[2].trim() } : null;
    })
    .filter(Boolean);

  if (!unchecked.length) {
    console.log("Phase", phaseNum, "has no unchecked steps.");
    return;
  }

  console.log("\n--- Executing Phase", phaseNum, "—", name, "---\n");
  console.log("WORKFLOW_RULES: read docs before modifying; no duplicate systems; update PLAN_ACTIVE/CHANGELOG/MAP.\n");
  console.log("Safety: JSON pipeline work must not break TSX pipeline. If uncertain, we pause and ask.\n");

  for (const { stepNum, line, desc } of unchecked) {
    console.log("Step", stepNum + ":", desc.slice(0, 80) + (desc.length > 80 ? "..." : ""));

    const result = tryExecuteStep(phaseNum, stepNum, line);
    if (result.done) {
      console.log("  [AUTO]", result.reason);
      markStepDone(phaseNum, stepNum);
      appendChangelogEntry("Phase " + phaseNum + " step " + stepNum + ": " + result.reason);
      continue;
    }

    if (result.reason === "requires_manual") {
      console.log("  [MANUAL] This step requires implementation (e.g. in Cursor).");
      const ans = await prompt(rl, "  Mark step as done after you complete it? (y/n): ");
      if (ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes") {
        markStepDone(phaseNum, stepNum);
        appendChangelogEntry("Phase " + phaseNum + " step " + stepNum + " completed (manual).");
        console.log("  Marked done.");
      } else {
        console.log("  Skipped. You can run this phase again later.");
        return;
      }
    } else {
      console.log("  [BLOCKED]", result.reason);
      const ans = await prompt(rl, "  Mark step as done anyway? (y/n): ");
      if (ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes") {
        markStepDone(phaseNum, stepNum);
        appendChangelogEntry("Phase " + phaseNum + " step " + stepNum + " marked done (blocked: " + result.reason + ").");
      }
    }
  }

  updateMapTimestamp();
  console.log("\nPhase", phaseNum, "run complete. MAP.md timestamp updated.");

  const nextPhase = phaseNum < 8 ? phaseNum + 1 : null;
  if (nextPhase) {
    const ans = await prompt(rl, "Phase complete. Execute next phase (Phase " + nextPhase + ")? (y/n): ");
    if (ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes") {
      await executePhaseAutonomous(rl, nextPhase);
    }
  }
}

function reassessAndSync() {
  const taskPath = path.join(HI_SYSTEM, "MASTER_TASK_LIST.md");
  let content = readContextFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  let checkedCount = 0;
  const buttonPath = path.join(ROOT, "src", "compounds", "ui", "definitions", "button.json");
  if (fs.existsSync(buttonPath)) {
    const text = fs.readFileSync(buttonPath, "utf8");
    if (text.includes('"icon"')) {
      if (markStepDone(1, 2)) checkedCount++;
    }
  }
  appendChangelogEntry("Reassess & Sync: auto-checked " + checkedCount + " items from MASTER_TASK_LIST.");
  updateMapTimestamp();
  console.log("Reassess done. Auto-checked", checkedCount, "items; CHANGELOG and MAP.md updated.");
}

function showProgress() {
  const content = readContextFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const { phases, totalUnchecked, totalChecked } = getPhaseOverview(content);
  const totalSteps = totalUnchecked + totalChecked;
  const pct = totalSteps ? Math.round((totalChecked / totalSteps) * 100) : 0;
  console.log("\nTotal:", totalUnchecked, "unchecked,", totalChecked, "checked,", pct + "% complete\n");
  phases.forEach((p) => {
    console.log("Phase " + p.num + " — " + p.name + ": " + p.checked + "/" + p.total + " (" + p.pct + "%)");
  });
}

function showMenu() {
  console.log("\nHI SYSTEM AUTONOMOUS EXECUTOR\n");
  console.log("1. Execute Next Phase");
  console.log("2. Execute Specific Phase");
  console.log("3. Reassess & Sync Tasks");
  console.log("4. Show Progress");
  console.log("5. Exit\n");
}

async function main() {
  const loaded = loadSystemContext();
  console.log("[plan-runner] System context loaded:", loaded.length + "/" + CONTEXT_FILES.length);
  loaded.forEach((f) => console.log("  -", f));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    showMenu();
    const choice = await prompt(rl, "Choice (1-5): ");

    if (choice.trim() === "1") {
      const overview = showPhaseOverview();
      if (!overview) continue;
      const phaseNum = overview.firstIncompletePhase;
      if (phaseNum == null) {
        console.log("No incomplete phase; all phases have at least some steps done.");
        continue;
      }
      const ans = await prompt(rl, "Execute Phase " + phaseNum + " automatically? (y/n): ");
      if (ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes") {
        await executePhaseAutonomous(rl, phaseNum);
      } else {
        console.log("Returning to menu.");
      }
      continue;
    }

    if (choice.trim() === "2") {
      showPhaseOverview();
      const phaseInput = await prompt(rl, "Enter phase number (1-8): ");
      const phaseNum = parseInt(phaseInput, 10);
      if (phaseNum < 1 || phaseNum > 8) {
        console.log("Invalid phase.");
        continue;
      }
      const ans = await prompt(rl, "Execute Phase " + phaseNum + " automatically? (y/n): ");
      if (ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes") {
        await executePhaseAutonomous(rl, phaseNum);
      } else {
        console.log("Returning to menu.");
      }
      continue;
    }

    if (choice.trim() === "3") {
      reassessAndSync();
      continue;
    }

    if (choice.trim() === "4") {
      showProgress();
      continue;
    }

    if (choice.trim() === "5") {
      console.log("Goodbye.");
      process.exit(0);
    }

    console.log("Invalid choice. Use 1-5.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
