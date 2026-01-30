/**
 * plan-runner.js — HI SYSTEM PLANNER
 * Reads HI_SYSTEM docs as system brain; interactive menu for Next Step, Execute Phase,
 * Reassess System, Update Plan, Add Idea, Show Progress, Exit.
 * No npm dependencies; Node built-ins only.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const HI_SYSTEM = path.join(ROOT, "docs", "HI_SYSTEM");

const BRAIN_FILES = [
  "START_HERE.md",
  "MAP.md",
  "SYSTEM_MASTER_PLAN.md",
  "MASTER_TASK_LIST.md",
  "PLAN_ACTIVE.md",
  "WORKFLOW_RULES.md",
];

function readBrainFile(name) {
  const filePath = path.join(HI_SYSTEM, name);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function loadBrain() {
  let ok = 0;
  for (const name of BRAIN_FILES) {
    if (readBrainFile(name) !== null) ok++;
    else console.warn("[plan-runner] Missing:", path.join("docs", "HI_SYSTEM", name));
  }
  return ok;
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function showMenu() {
  console.log("\nHI SYSTEM PLANNER\n");
  console.log("1. Next Step");
  console.log("2. Execute Phase");
  console.log("3. Reassess System");
  console.log("4. Update Plan");
  console.log("5. Add Idea");
  console.log("6. Show Progress");
  console.log("7. Exit\n");
}

// --- Behavior 1: Next Step ---
function nextStep() {
  const content = readBrainFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const uncheckedRegex = /^\d+\.\s+\[ \]\s+.+$/m;
  const match = content.match(uncheckedRegex);
  if (!match) {
    console.log("No unchecked steps; all done for now.");
    return;
  }
  const phaseHeadingRegex = /## Phase \d+ — [^\n]+/g;
  let lastPhase = "Unknown phase";
  let pos = 0;
  let phaseMatch;
  const stepIndex = content.indexOf(match[0]);
  while ((phaseMatch = phaseHeadingRegex.exec(content)) !== null) {
    if (phaseMatch.index < stepIndex) lastPhase = phaseMatch[0].replace(/^## /, "");
    else break;
  }
  console.log("Recommended next:", match[0].trim());
  console.log("Phase:", lastPhase);
}

// --- Behavior 2: Execute Phase ---
function getPhaseSteps(content, phaseNum) {
  const phaseRegex = new RegExp(
    `## Phase ${phaseNum} — ([^\\n]+)[\\s\\S]*?### Steps\\s*\\n([\\s\\S]*?)(?=### Depends On|## Phase \\d+|---|$)`,
    "i"
  );
  const m = content.match(phaseRegex);
  if (!m) return { name: "", steps: [] };
  const name = m[1].trim();
  const stepsBlock = m[2];
  const stepLines = stepsBlock.match(/^\d+\.\s+\[[ x]\].+$/gm) || [];
  return { name, steps: stepLines };
}

async function executePhase(rl) {
  const content = readBrainFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const phaseInput = await prompt(rl, "Enter phase number (1-8): ");
  const phaseNum = parseInt(phaseInput, 10);
  if (phaseNum < 1 || phaseNum > 8) {
    console.log("Invalid phase. Use 1-8.");
    return;
  }
  const { name, steps } = getPhaseSteps(content, phaseNum);
  if (!steps.length) {
    console.log("No steps found for phase", phaseNum);
    return;
  }
  console.log("\nPhase " + phaseNum + " — " + name + "\n");
  steps.forEach((line) => console.log("  " + line));
  const stepInput = await prompt(rl, "\nEnter step number to begin (or 0 to cancel): ");
  const stepNum = parseInt(stepInput, 10);
  if (stepNum === 0) {
    console.log("Cancelled.");
    return;
  }
  const stepLine = steps.find((s) => s.startsWith(stepNum + "."));
  if (stepLine) {
    console.log("\nSelected:", stepLine.trim());
    console.log("Reminder: update PLAN_ACTIVE.md before starting; append CHANGELOG.md when done (per WORKFLOW_RULES).");
  } else {
    console.log("Step number not in this phase.");
  }
}

// --- Behavior 3: Reassess System ---
// Heuristics are best-effort; only high-confidence checks auto-mark [x].
// Heuristics are best-effort; only high-confidence checks auto-mark [x].
function reassessHeuristics() {
  const results = [];
  const buttonPath = path.join(ROOT, "src", "compounds", "ui", "definitions", "button.json");
  if (fs.existsSync(buttonPath)) {
    const text = fs.readFileSync(buttonPath, "utf8");
    if (text.includes('"icon"')) results.push({ phase: 1, step: 2 });
  }
  return results;
}

function reassessSystem() {
  const taskPath = path.join(HI_SYSTEM, "MASTER_TASK_LIST.md");
  let content = readBrainFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const toCheck = reassessHeuristics();
  let checkedCount = 0;
  for (const { phase, step } of toCheck) {
    const phaseRegex = new RegExp(
      `(## Phase ${phase} — [^\\n]+[\\s\\S]*?### Steps\\s*\\n)([\\s\\S]*?)(?=### Depends On)`,
      "i"
    );
    const phaseMatch = content.match(phaseRegex);
    if (!phaseMatch) continue;
    const stepsBlock = phaseMatch[2];
    const stepLineRegex = new RegExp(`^(\\s*)(\\d+)\\. \\[ \\](\\s+.+)$`, "m");
    const stepLineMatch = stepsBlock.match(stepLineRegex);
    if (!stepLineMatch) continue;
    const stepNumInList = parseInt(stepLineMatch[2], 10);
    if (stepNumInList !== step) continue;
    const oldLine = stepLineMatch[0].trimStart();
    const newLine = stepLineMatch[1] + stepLineMatch[2] + ". [x]" + stepLineMatch[3];
    const fullOld = phaseMatch[1] + phaseMatch[2];
    const fullNew = phaseMatch[1] + phaseMatch[2].replace(stepLineMatch[0], newLine);
    if (content.indexOf(fullOld) !== -1) {
      content = content.replace(fullOld, fullNew);
      checkedCount++;
    }
  }
  if (checkedCount > 0) fs.writeFileSync(taskPath, content, "utf8");

  const changelogPath = path.join(HI_SYSTEM, "CHANGELOG.md");
  const date = new Date().toISOString().slice(0, 10);
  const entry = `\n### ${date} — Reassess (plan-runner)\n- Auto-checked ${checkedCount} items from MASTER_TASK_LIST; MAP Last reviewed updated.\n`;
  fs.appendFileSync(changelogPath, entry, "utf8");

  const mapPath = path.join(HI_SYSTEM, "MAP.md");
  let mapContent = fs.readFileSync(mapPath, "utf8");
  const stamp = "Last reviewed: " + new Date().toISOString();
  if (/^Last reviewed: .+$/m.test(mapContent)) {
    mapContent = mapContent.replace(/^Last reviewed: .+$/m, stamp);
  } else {
    mapContent = stamp + "\n\n" + mapContent;
  }
  fs.writeFileSync(mapPath, mapContent, "utf8");

  console.log("Reassess done. Auto-checked", checkedCount, "items; CHANGELOG and MAP.md updated.");
}

// --- Behavior 4: Update Plan ---
async function updatePlanAsync(rl) {
  const content = readBrainFile("SYSTEM_MASTER_PLAN.md");
  if (!content) {
    console.log("SYSTEM_MASTER_PLAN.md not found.");
    return;
  }
  const headings = content.match(/^## Phase \d+ — [^\n]+|^## Phase Summary[^\n]*/gm) || [];
  headings.forEach((h, i) => console.log((i + 1) + ". " + h.replace(/^## /, "")));
  const sel = await prompt(rl, "Select phase (1-" + headings.length + ") to edit manually, or 0 to cancel: ");
  const n = parseInt(sel, 10);
  if (n === 0) {
    console.log("Cancelled.");
    return;
  }
  if (n < 1 || n > headings.length) {
    console.log("Invalid selection.");
    return;
  }
  const filePath = path.join(HI_SYSTEM, "SYSTEM_MASTER_PLAN.md");
  const editor = process.env.EDITOR || process.env.VISUAL || (process.platform === "win32" ? "notepad" : "code");
  spawn(editor, [filePath], { stdio: "inherit", shell: true });
  console.log("Opening", filePath, "in", editor, "...");
}

// --- Behavior 5: Add Idea ---
async function addIdea(rl) {
  const backlogPath = path.join(HI_SYSTEM, "BACKLOG.md");
  if (!fs.existsSync(backlogPath)) {
    fs.writeFileSync(
      backlogPath,
      "# Backlog\n\nAppend ideas below; one per line or block with date.\n\n---\n",
      "utf8"
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  const idea = await prompt(rl, "Idea (one line): ");
  const line = "- " + date + ": " + (idea || "(no text)") + "\n";
  fs.appendFileSync(backlogPath, line, "utf8");
  console.log("Appended to BACKLOG.md.");
}

// --- Behavior 6: Show Progress ---
function showProgress() {
  const content = readBrainFile("MASTER_TASK_LIST.md");
  if (!content) {
    console.log("MASTER_TASK_LIST.md not found.");
    return;
  }
  const unchecked = (content.match(/^\d+\.\s+\[ \]\s+/gm) || []).length;
  const checked = (content.match(/^\d+\.\s+\[x\]\s+/gm) || []).length;
  const total = unchecked + checked;
  const pct = total ? Math.round((checked / total) * 100) : 0;
  console.log("Total:", unchecked, "unchecked,", checked, "checked,", pct + "% complete\n");

  for (let phaseNum = 1; phaseNum <= 8; phaseNum++) {
    const { name, steps } = getPhaseSteps(content, phaseNum);
    if (!steps.length) continue;
    let c = 0,
      u = 0;
    steps.forEach((line) => {
      if (/\[x\]/.test(line)) c++;
      else if (/\[ \]/.test(line)) u++;
    });
    const phaseTotal = c + u;
    const phasePct = phaseTotal ? Math.round((c / phaseTotal) * 100) : 0;
    console.log("Phase " + phaseNum + " — " + name + ": " + c + "/" + phaseTotal + " (" + phasePct + "%)");
  }
}

// --- Behavior 7: Exit ---
function exit() {
  console.log("Goodbye.");
  process.exit(0);
}

async function main() {
  const loaded = loadBrain();
  console.log("[plan-runner] Docs loaded:", loaded + "/" + BRAIN_FILES.length);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    showMenu();
    const choice = await prompt(rl, "Choice (1-7): ");
    switch (choice.trim()) {
      case "1":
        nextStep();
        break;
      case "2":
        await executePhase(rl);
        break;
      case "3":
        reassessSystem();
        break;
      case "4":
        await updatePlanAsync(rl);
        break;
      case "5":
        await addIdea(rl);
        break;
      case "6":
        showProgress();
        break;
      case "7":
        exit();
        return;
      default:
        console.log("Invalid choice. Use 1-7.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
