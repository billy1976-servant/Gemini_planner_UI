/**
 * LLM Plan Agent — calls OpenAI-compatible API to produce a structured markdown report.
 * Report contains labeled sections; JSON is extracted by the caller (app.ts).
 */

export type PlanningPayload = {
  description: string;
  contractsSummary: {
    verbs: string[];
    layoutNodeTypes: string[];
    expectedParamsKeys: string[];
    tsx25Components: string[];
  };
  registrySnapshot: {
    engines: string[];
    templates: string[];
    structureTypes: string[];
  };
  rules: {
    tsxOnly: boolean;
    noJsonCompiler: boolean;
    noRouter: boolean;
    noHardcodedState: boolean;
    noHardcodedStrings: boolean;
    newEnginesMustExistInRegistry: boolean;
  };
};

/** Parsed plan built from report sections (used after extraction in app.ts). */
export type AgentPlanOutput = {
  slug: string;
  wrapper: string;
  enginesUsed: string[];
  newEngines: string[];
  structureConfig: {
    wrapper: string;
    nodes: Array<{
      id: string;
      type: string;
      params?: Record<string, string>;
      verbs?: string[];
      children?: string[];
    }>;
    nodeOrder: string[];
  };
  contentDraft: Record<string, unknown>;
  compliance: Record<string, unknown>;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

const REPORT_SECTIONS = `
Your response MUST be a structured markdown report with exactly these sections (use these headers verbatim):

# PLAN REPORT

## SUMMARY
Short summary of the app. First line must be: Slug: <kebab-case-app-name>

## WRAPPER
Single line: template name only (must be one of registrySnapshot.templates), e.g. TSXScreenWithEnvelope

## ENGINES USED
Comma-separated list of engine names (each must be in registrySnapshot.engines), or NONE

## NEW ENGINES
Must be NONE or empty (rules.newEnginesMustExistInRegistry is true)

## STRUCTURE CONFIG (JSON)
A single JSON object: { "wrapper": string, "nodes": [ { "id", "type", "params?", "verbs?", "children?" } ], "nodeOrder": string[] }
- nodes[].type: Grid, Row, Column, Stack, or one of tsx25Components
- nodes[].params keys must match expected params for that type
- nodes[].verbs must be from contractsSummary.verbs only

## CONTENT DRAFT (JSON)
A single JSON object, e.g. { "screen": { "title": "", ... } }. No hardcoded state keys.

## COMPLIANCE
A single JSON object with keys: verbsLoaded, nodeTypesLoaded, wrapperSelected, componentsUsed, verbsUsed, enginesUsed, newEnginesProposed: [], routerUsage: "NONE", hardcodedStrings: false, hardcodedStateKeys: false, componentsValidated: true, paramsValidated: true
`;

function buildSystemPrompt(): string {
  return `You are a strict TSX app planner. You must respond with a structured markdown report only. No raw JSON at top level.
${REPORT_SECTIONS}
Output only the markdown report. Under each "## ... (JSON)" section, put exactly one JSON object (the first and only block of \`{ ... }\` in that section).`;
}

function buildUserMessage(payload: PlanningPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Call the Agent (LLM). Returns the raw report string (markdown). Caller must extract JSON and validate.
 */
export async function planWithAgent(payload: PlanningPayload): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Set it to use the LLM plan agent (e.g. export OPENAI_API_KEY=sk-...)."
    );
  }

  const body = {
    model: process.env.OPENAI_APP_MODEL ?? DEFAULT_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserMessage(payload) },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  };

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing content.");
  }

  return content.trim();
}
