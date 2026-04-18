/**
 * Learn target profile v2: richer universal TXT → DeckOutline (→ LandingDeckV1).
 * Reserved content keys use the `learn.*` prefix so other target profiles can ignore them.
 * See ./README.md for the supported contract.
 */
import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";
import { compileLearnAuthoringToDeck } from "@/lib/landing-deck/authoring/compile-learn-authoring";
import { learnSlideTypeToTemplateId } from "@/lib/landing-deck/authoring/learn-slide-type-map";
import type { DeckOutline, LearnSlideTypeV1, OutlineMediaRef, OutlineSlide } from "@/lib/landing-deck/outline/types";
import type { LandingDeckV1 } from "@/lib/landing-deck/schema";
import type { LandingContentBlock } from "@/lib/landing-content-blocks";
import type { LandingScreenDensity, LandingVisualTone } from "@/lib/landing-screen-presentation";
import {
  buildIdMaps,
  normalizeTxtAuthoringRawId,
  parseBlueprint,
  parseContent,
  slugify,
  type RawNode,
} from "@/lib/txt-authoring/parse-blueprint-content";

export type TxtProfileLearnV2Options = {
  shopUrl?: string;
  logoSrc?: string;
  logoAlt?: string;
  shopNowLabel?: string;
  stepTrackerTitle?: string;
  stepTrackerDescription?: string;
  /** When true, organ nodes are skipped instead of failing the compile. */
  allowOrgans?: boolean;
  /** Collect non-fatal profile warnings (flow ordering, etc.). */
  warnings?: string[];
  /** Primary CTA label on hero slides (link uses `shopUrl`). */
  heroLinkLabel?: string;
};

function sectionAnchorEligible(rawId: string): boolean {
  const parts = rawId.split(".");
  if (parts.length !== 2) return false;
  const [a, b] = parts;
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
  return Number(b) >= 2;
}

function subtreeEndIndex(nodes: RawNode[], sectionIndex: number): number {
  const sec = nodes[sectionIndex];
  for (let j = sectionIndex + 1; j < nodes.length; j++) {
    if (nodes[j].indent <= sec.indent) return j;
  }
  return nodes.length;
}

function parsePipeList(s: string): string[] {
  return s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** `Title :: sub | Title2 :: sub2` — checklist rows with subtitles. */
function parseChecklistSubRows(s: string): Array<{ title: string; sub: string }> {
  return s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((row) => {
      const idx = row.indexOf("::");
      if (idx < 0) return { title: row, sub: "" };
      return { title: row.slice(0, idx).trim(), sub: row.slice(idx + 2).trim() };
    });
}

function parseComparisonRows(s: string): Array<{ left: string; right: string; highlight?: "left" | "right" | "none" }> {
  return s
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((row) => {
      const parts = row.split("||").map((x) => x.trim());
      const left = parts[0] ?? "";
      const right = parts[1] ?? "";
      return { left, right };
    });
}

function parseTrackerMap(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon < 0) continue;
    const k = trimmed.slice(0, colon).trim();
    const v = trimmed.slice(colon + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function presentationFromLearnReveal(raw: string | undefined): OutlineSlide["presentation"] | undefined {
  if (!raw) return undefined;
  const r = raw.trim().toLowerCase();
  if (r === "none") return { reveal: "none" };
  if (r === "byblock" || r === "by_block") return { reveal: "byBlock" };
  return undefined;
}

function parseSlideModes(raw: string | undefined): DeckSlideMode[] | undefined {
  if (!raw?.trim()) return undefined;
  const out: DeckSlideMode[] = [];
  for (const p of raw.split("|").map((s) => s.trim()).filter(Boolean)) {
    if (p === "short" || p === "long") out.push(p);
  }
  return out.length ? out : undefined;
}

function pushDividerFromKey(
  sec: Record<string, string>,
  key: string,
  into: LandingContentBlock[]
): void {
  const sp = sec[key]?.trim().toLowerCase();
  if (sp === "sm" || sp === "md" || sp === "lg") into.push({ type: "divider", spacing: sp });
}

function pushTrustStrip(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const raw = sec["learn.trustStrip.items"]?.trim();
  if (!raw) return;
  const items = raw.split("|").map((s) => s.trim()).filter(Boolean).map((part) => {
    const c = part.indexOf(":");
    if (c > 0 && c < part.length - 1 && part.slice(0, c).length <= 24 && !part.includes("::")) {
      return { icon: part.slice(0, c).trim(), label: part.slice(c + 1).trim() };
    }
    return { label: part };
  });
  if (items.length) into.push({ type: "trustStrip", items });
}

function pushStatsBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const raw = sec["learn.stats.rows"]?.trim();
  if (!raw) return;
  const items = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((row) => {
      const parts = row.split("::").map((x) => x.trim());
      const label = parts[0] || "";
      const value = parts[1] || "";
      const hint = parts[2];
      return { label, value, ...(hint ? { hint } : {}) };
    })
    .filter((i) => i.label || i.value);
  if (items.length) into.push({ type: "stats", items });
}

function pushProofGridBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const rows = sec["learn.proofGrid.rows"]?.trim();
  if (!rows) return;
  const items = parseChecklistSubRows(rows).map(({ title, sub }) => ({
    title,
    ...(sub ? { sub } : {}),
  }));
  if (!items.length) return;
  into.push({
    type: "proofGrid",
    heading: sec["learn.proofGrid.heading"]?.trim() || undefined,
    items,
  });
}

function pushIconFeaturesBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const raw = sec["learn.iconFeatures.rows"]?.trim();
  if (!raw) return;
  const items = parseChecklistSubRows(raw).map(({ title, sub }) => ({
    title,
    ...(sub ? { sub } : {}),
  }));
  if (items.length) into.push({ type: "iconFeatures", items });
}

function pushTestimonialBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const quote = sec["learn.testimonial.quote"]?.trim();
  const author = sec["learn.testimonial.author"]?.trim();
  if (!quote || !author) return;
  const role = sec["learn.testimonial.role"]?.trim();
  const ratingRaw = sec["learn.testimonial.rating"]?.trim();
  const rating = ratingRaw ? Number(ratingRaw) : undefined;
  into.push({
    type: "testimonial",
    quote,
    author,
    ...(role ? { role } : {}),
    ...(rating != null && !Number.isNaN(rating) ? { rating } : {}),
  });
}

function pushRatingBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const valRaw = sec["learn.rating.value"]?.trim();
  if (!valRaw) return;
  const value = Number(valRaw);
  if (Number.isNaN(value)) return;
  const max = Number(sec["learn.rating.max"]?.trim() || "5") || 5;
  const rc = sec["learn.rating.reviewCount"]?.trim();
  const source = sec["learn.rating.source"]?.trim();
  into.push({
    type: "rating",
    value,
    max,
    ...(rc ? { reviewCount: Number(rc) || 0 } : {}),
    ...(source ? { source } : {}),
  });
}

function pushObjectionAnswerBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const objection = sec["learn.objectionAnswer.objection"]?.trim();
  const response = sec["learn.objectionAnswer.response"]?.trim();
  if (!objection || !response) return;
  into.push({ type: "objectionAnswer", objection, response });
}

function pushFaqBlock(sec: Record<string, string>, into: LandingContentBlock[]): void {
  const raw = sec["learn.faq.rows"]?.trim();
  if (!raw) return;
  const items = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((row) => {
      const idx = row.indexOf("::");
      if (idx < 0) return null;
      return { question: row.slice(0, idx).trim(), answer: row.slice(idx + 2).trim() };
    })
    .filter((x): x is { question: string; answer: string } => x != null && x.question.length > 0);
  if (!items.length) return;
  into.push({
    type: "faq",
    heading: sec["learn.faq.heading"]?.trim() || undefined,
    items,
  });
}

function resolveFlowToken(
  tok: string,
  rawByName: Record<string, string>,
  targetToRaw: Record<string, string>
): string | null {
  const t = tok.trim();
  if (rawByName[t]) return rawByName[t];
  const norm = normalizeTxtAuthoringRawId(t);
  if (norm && targetToRaw[norm]) return targetToRaw[norm];
  if (targetToRaw[t]) return targetToRaw[t];
  const slug = slugify(t);
  if (targetToRaw[slug]) return targetToRaw[slug];
  return null;
}

function orderRawIdsByFlow(
  orderedRawIds: string[],
  edges: Map<string, string>,
  warn: (m: string) => void
): string[] {
  const nodeSet = new Set(orderedRawIds);
  const successors = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  for (const id of orderedRawIds) {
    inDegree.set(id, 0);
    successors.set(id, new Set());
  }
  for (const [from, to] of edges) {
    if (!nodeSet.has(from) || !nodeSet.has(to)) continue;
    if (!successors.get(from)!.has(to)) {
      successors.get(from)!.add(to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }
  }
  const byDfs = (a: string, b: string) => orderedRawIds.indexOf(a) - orderedRawIds.indexOf(b);
  const q = orderedRawIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  q.sort(byDfs);
  const out: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    out.push(id);
    for (const to of successors.get(id) ?? []) {
      inDegree.set(to, (inDegree.get(to) ?? 0) - 1);
      if (inDegree.get(to) === 0) {
        q.push(to);
        q.sort(byDfs);
      }
    }
  }
  if (out.length < orderedRawIds.length) {
    warn("[txt-profile/learn-v2] Flow hints could not be fully ordered (cycle or missing target); using sequence/DFS order for remaining.");
    for (const id of orderedRawIds) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

function applySequenceHint(
  slideRawIds: string[],
  sequenceOrder: string[] | null,
  rawByName: Record<string, string>,
  targetToRaw: Record<string, string>,
  warn: (m: string) => void
): string[] {
  if (!sequenceOrder?.length) return slideRawIds;
  const seqPos = new Map<string, number>();
  for (let i = 0; i < sequenceOrder.length; i++) {
    const rid = resolveFlowToken(sequenceOrder[i], rawByName, targetToRaw);
    if (rid) seqPos.set(rid, i);
    else warn(`[txt-profile/learn-v2] SEQUENCE token not resolved: "${sequenceOrder[i]}"`);
  }
  const BIG = 1e6;
  return [...slideRawIds].sort((a, b) => {
    const ia = seqPos.has(a) ? seqPos.get(a)! : BIG;
    const ib = seqPos.has(b) ? seqPos.get(b)! : BIG;
    if (ia !== ib) return ia - ib;
    return slideRawIds.indexOf(a) - slideRawIds.indexOf(b);
  });
}

function inferKind(sec: Record<string, string>): LearnSlideTypeV1 {
  const explicit = (sec["learn.kind"] || "").trim().toLowerCase();
  if (
    explicit === "intro" ||
    explicit === "hero" ||
    explicit === "teach" ||
    explicit === "proof" ||
    explicit === "comparison" ||
    explicit === "quiz" ||
    explicit === "summary" ||
    explicit === "cta"
  ) {
    return explicit;
  }
  if (sec["learn.quiz.options"]?.trim()) return "quiz";
  if (sec["learn.scripture.text"]?.trim()) return "proof";
  if (sec["learn.compare.rows"]?.trim()) return "comparison";
  return "teach";
}

function slideIdForRaw(rawId: string): string {
  return `slide-${rawId.replace(/\./g, "-")}`;
}

function resolveSlideId(secContent: Record<string, string>, rawId: string): string {
  const sid = secContent["learn.slideId"]?.trim();
  return sid || slideIdForRaw(rawId);
}

function buildDeckRootSlides(
  contentMap: Record<string, Record<string, string>>,
  options: TxtProfileLearnV2Options
): OutlineSlide[] {
  const c = contentMap["1.0"] ?? {};
  const kind = (c["learn.kind"] || "").trim().toLowerCase();
  const title = (c.title || c["learn.title"] || "Welcome").trim();
  const body = (c["learn.intro.body"] || c["learn.hero.body"] || "").trim();
  const subtitle = (c.subtitle || c["learn.hero.subtitle"] || "").trim();
  const reveal = presentationFromLearnReveal(c["learn.reveal"]);

  const rootSlideId = (suffix: string) => c["learn.slideId"]?.trim() || suffix;

  if (kind === "intro") {
    const rich: LandingContentBlock[] = [];
    if (body) rich.push({ type: "paragraph", text: body });
    return [
      {
        id: rootSlideId("slide-intro-root"),
        learnSlideType: "intro",
        templateId: learnSlideTypeToTemplateId("intro"),
        title,
        stepLabel: title,
        presentation: reveal ?? { reveal: "byBlock" },
        richContent: rich.length ? rich : [{ type: "paragraph", text: " " }],
        inlineMedia: [],
      },
    ];
  }

  if (kind === "hero") {
    const rich: LandingContentBlock[] = [];
    if (body) rich.push({ type: "paragraph", text: body });
    const hid = rootSlideId("slide-hero-root");
    return [
      {
        id: hid,
        learnSlideType: "hero",
        templateId: learnSlideTypeToTemplateId("hero"),
        title,
        stepLabel: title,
        subtitle: subtitle || undefined,
        presentation: reveal ?? { reveal: "byBlock" },
        richContent: rich.length ? rich : [{ type: "paragraph", text: " " }],
        inlineMedia: [],
        buttons: [
          {
            type: "link",
            label: options.heroLinkLabel ?? options.shopNowLabel ?? "Continue",
            hrefKey: "shopUrl",
            nodeId: `${hid}-link`,
          },
        ],
      },
    ];
  }

  return [];
}

export function txtAuthoringToDeckOutlineLearnProfileV2(
  blueprintText: string,
  contentText: string,
  options: TxtProfileLearnV2Options = {}
): DeckOutline {
  const warnSink = options.warnings ?? [];
  const warn = (m: string) => {
    warnSink.push(m);
  };

  const { nodes, sequenceOrder } = parseBlueprint(blueprintText);
  const contentMap = parseContent(contentText) as Record<string, Record<string, string>>;

  const { rawByName, targetToRaw } = buildIdMaps(nodes);

  const filteredNodes: RawNode[] = [];
  for (const n of nodes) {
    if (n.type === "organ") {
      if (options.allowOrgans) {
        warn(`[txt-profile/learn-v2] Skipping organ "${n.name}" (${n.rawId}).`);
        continue;
      }
      throw new Error(`[txt-profile/learn-v2] Blueprint has organ node "${n.name}" (${n.rawId}); not supported (set allowOrgans to skip).`);
    }
    filteredNodes.push(n);
  }

  const rootMeta = contentMap["1.0"] ?? {};
  const deckTitle = rootMeta.title?.trim() || "Deck";
  const deckMedia: Record<string, OutlineMediaRef> = {};

  const flowEdges = new Map<string, string>();
  const sectionSlides: Array<{ rawId: string; slide: OutlineSlide }> = [];
  const dfsOrderRawIds: string[] = [];

  for (let i = 0; i < filteredNodes.length; i++) {
    const n = filteredNodes[i];
    if (n.type.toLowerCase() !== "section") continue;
    if (!sectionAnchorEligible(n.rawId)) continue;

    const secContent = contentMap[n.rawId] ?? {};
    const kind = inferKind(secContent);
    const hasCompareRows = !!secContent["learn.compare.rows"]?.trim();
    const hasScripture =
      !!secContent["learn.scripture.text"]?.trim() || !!secContent["learn.scripture.reference"]?.trim();
    const teachBody =
      !!secContent["learn.heading.text"]?.trim() ||
      hasScripture ||
      !!secContent["learn.expandable.title"]?.trim() ||
      hasCompareRows;

    const end = subtreeEndIndex(filteredNodes, i);
    const cards: RawNode[] = [];
    const fields: RawNode[] = [];
    let stepperSteps: string | undefined;

    for (let j = i + 1; j < end; j++) {
      const ch = filteredNodes[j];
      const t = ch.type.toLowerCase();
      if (t === "card") cards.push(ch);
      if (t === "field") fields.push(ch);
      if (t === "stepper") {
        const sc = contentMap[ch.rawId] ?? {};
        const st = sc.steps?.trim();
        if (st) stepperSteps = st;
      }
    }

    const canOmitCards =
      kind === "quiz" ||
      kind === "summary" ||
      kind === "cta" ||
      kind === "intro" ||
      kind === "hero" ||
      (kind === "teach" && teachBody) ||
      (kind === "comparison" && hasCompareRows) ||
      (kind === "proof" && hasScripture);

    if (!canOmitCards && cards.length === 0) continue;
    if (kind === "comparison" && cards.length === 0 && !hasCompareRows) continue;
    if (kind === "proof" && cards.length === 0 && !hasScripture) continue;

    if (n.target?.trim()) {
      const to = resolveFlowToken(n.target.trim(), rawByName, targetToRaw);
      if (to) flowEdges.set(n.rawId, to);
      else warn(`[txt-profile/learn-v2] Could not resolve flow target "${n.target}" from section ${n.rawId}.`);
    }

    const title = (secContent.title || n.name || "Slide").trim();
    const slideId = resolveSlideId(secContent, n.rawId);

    const head: LandingContentBlock[] = [];
    const body: LandingContentBlock[] = [];
    const tail: LandingContentBlock[] = [];

    const badge = secContent["learn.badge"]?.trim();
    if (badge) head.push({ type: "badge", text: badge });

    const checklistDetailed = secContent["learn.checklist.rows"]?.trim();
    const checklistHeading = secContent["learn.checklist.heading"]?.trim();
    if (kind === "cta" && checklistDetailed) {
      const items = parseChecklistSubRows(checklistDetailed);
      if (items.length) {
        head.push({
          type: "checklist",
          heading: checklistHeading || "Key points",
          items,
        });
      }
    }

    pushTrustStrip(secContent, head);
    pushStatsBlock(secContent, head);
    pushIconFeaturesBlock(secContent, head);

    const hText = secContent["learn.heading.text"]?.trim();
    const hLevelRaw = secContent["learn.heading.level"]?.trim();
    const hLevel = Math.min(6, Math.max(1, Number(hLevelRaw || "3") || 3));
    if (hText) head.push({ type: "heading", level: hLevel, text: hText });
    pushProofGridBlock(secContent, head);

    const mediaKey = secContent["learn.media.key"]?.trim();
    const imgSrc = secContent["learn.media.image"]?.trim();
    const imgAlt = secContent["learn.media.imageAlt"]?.trim() || title;
    const vidSrc = secContent["learn.media.video"]?.trim();
    const fullBleedImg = (secContent["learn.media.fullBleed"] || "").trim() === "1";

    const qtextQuiz = kind === "quiz" ? secContent["learn.quiz.question"]?.trim() : undefined;
    if (qtextQuiz) body.push({ type: "paragraph", text: qtextQuiz });

    for (const card of cards) {
      const cc = contentMap[card.rawId] ?? {};
      const b = (cc.body || "").trim();
      if (b) body.push({ type: "paragraph", text: b });
    }
    for (const field of fields) {
      const fc = contentMap[field.rawId] ?? {};
      const label = (fc.label || "").trim();
      if (label) body.push({ type: "paragraph", text: label });
    }

    if (stepperSteps) {
      const items = parsePipeList(stepperSteps);
      if (items.length) {
        body.push({
          type: "checklist",
          heading: secContent["learn.steps.heading"]?.trim() || "Steps",
          items: items.map((t) => ({ title: t, sub: "" })),
        });
      }
    }

    const secSteps = secContent.steps?.trim();
    if (secSteps && secSteps.includes("|")) {
      const items = parsePipeList(secSteps);
      if (items.length) {
        body.push({
          type: "checklist",
          heading: secContent["learn.steps.heading"]?.trim() || "Steps",
          items: items.map((t) => ({ title: t, sub: "" })),
        });
      }
    }

    pushRatingBlock(secContent, tail);
    pushTestimonialBlock(secContent, tail);

    const scriptureText = secContent["learn.scripture.text"]?.trim();
    const scriptureRef = secContent["learn.scripture.reference"]?.trim();
    if (scriptureText || scriptureRef) {
      tail.push({ type: "scripture", text: scriptureText || " ", reference: scriptureRef || undefined });
    }

    pushObjectionAnswerBlock(secContent, tail);

    const compareRowsRaw = secContent["learn.compare.rows"]?.trim();
    if (compareRowsRaw) {
      const rows = parseComparisonRows(compareRowsRaw).filter((r) => r.left || r.right);
      if (rows.length) {
        const ls = secContent["learn.compare.layoutStyle"]?.trim().toLowerCase();
        tail.push({
          type: "comparison",
          heading: secContent["learn.compare.heading"]?.trim() || undefined,
          columnLabels: {
            left: secContent["learn.compare.columnLeft"]?.trim() || undefined,
            right: secContent["learn.compare.columnRight"]?.trim() || undefined,
          },
          rows,
          ...(ls === "cards" || ls === "table" ? { layoutStyle: ls } : {}),
        });
      }
    }

    pushFaqBlock(secContent, tail);
    pushDividerFromKey(secContent, "learn.divider.beforeExpandable", tail);

    const exTitle = secContent["learn.expandable.title"]?.trim();
    const exBody = secContent["learn.expandable.body"]?.trim();
    if (exTitle) {
      tail.push({ type: "expandable", title: exTitle, body: exBody || " " });
    }
    pushDividerFromKey(secContent, "learn.divider.afterExpandable", tail);

    const richContent: LandingContentBlock[] = [...head, ...body, ...tail];

    let quizSelect: OutlineSlide["quizSelect"] | undefined;
    if (kind === "quiz") {
      const inputId = secContent["learn.quiz.inputId"]?.trim() || `quiz-${n.rawId.replace(/\./g, "-")}`;
      const optionsStr = secContent["learn.quiz.options"]?.trim();
      if (!optionsStr) {
        throw new Error(`[txt-profile/learn-v2] Quiz section ${n.rawId} needs learn.quiz.options (pipe-separated).`);
      }
      const labels = parsePipeList(optionsStr);
      if (!labels.length) {
        throw new Error(`[txt-profile/learn-v2] Quiz section ${n.rawId}: learn.quiz.options parsed empty.`);
      }
      const valueList = parsePipeList(secContent["learn.quiz.values"]?.trim() || "");
      const opts = labels.map((label, idx) => ({
        value: valueList[idx] ?? String.fromCharCode("a".charCodeAt(0) + idx),
        label,
      }));
      quizSelect = {
        inputId,
        label: secContent["learn.quiz.fieldLabel"]?.trim() || "Your answer",
        options: opts,
        gateMessage: secContent["learn.quiz.gateMessage"]?.trim() || undefined,
      };
    }

    const inlineMedia: NonNullable<OutlineSlide["inlineMedia"]> = [];
    if (mediaKey && imgSrc) {
      deckMedia[mediaKey] = { type: "image", src: imgSrc, alt: imgAlt };
    } else if (imgSrc) {
      inlineMedia.push({
        type: "image",
        src: imgSrc,
        alt: imgAlt,
        ...(fullBleedImg ? { fullBleed: true } : {}),
      });
    }
    if (vidSrc) {
      inlineMedia.push({ type: "video", src: vidSrc, caption: secContent["learn.media.videoCaption"]?.trim() || undefined });
    }

    const pres = presentationFromLearnReveal(secContent["learn.reveal"]);
    const nextButtonLabel = secContent["learn.nextLabel"]?.trim() || undefined;
    const modes = parseSlideModes(secContent["learn.modes"]);
    const vtRaw = secContent["learn.visualTone"]?.trim();
    const visualTone: LandingVisualTone | undefined =
      vtRaw === "soft" || vtRaw === "bold" || vtRaw === "default" ? (vtRaw as LandingVisualTone) : undefined;
    const dRaw = secContent["learn.density"]?.trim();
    const density: LandingScreenDensity | undefined =
      dRaw === "comfortable" || dRaw === "compact" ? (dRaw as LandingScreenDensity) : undefined;
    const lightTheme = (secContent["learn.lightTheme"] || "").trim() === "1";

    let bullets: string[] | undefined;
    if (kind === "summary") {
      const b = secContent["learn.summary.bullets"]?.trim();
      if (b) bullets = parsePipeList(b);
    }

    let richOut: OutlineSlide["richContent"] | undefined;
    if (kind === "cta") {
      richOut = richContent.length > 0 ? richContent : undefined;
    } else if (kind === "summary") {
      richOut = bullets?.length ? undefined : richContent.length > 0 ? richContent : [{ type: "paragraph", text: " " }];
    } else {
      richOut =
        richContent.length > 0
          ? richContent
          : [{ type: "paragraph", text: "—" }];
    }

    const templateId = learnSlideTypeToTemplateId(kind);
    const slide: OutlineSlide = {
      id: slideId,
      learnSlideType: kind,
      templateId,
      title,
      stepLabel: secContent["learn.stepLabel"]?.trim() || title,
      subtitle: secContent.subtitle?.trim() || secContent["learn.subtitle"]?.trim() || undefined,
      presentation:
        pres ?? (kind === "summary" ? undefined : { reveal: "byBlock" }),
      richContent: richOut,
      inlineMedia,
      ...(mediaKey && imgSrc ? { mediaKeys: [mediaKey] } : {}),
      ...(quizSelect ? { quizSelect } : {}),
      ...(nextButtonLabel ? { nextButtonLabel } : {}),
      ...(bullets?.length ? { bullets } : {}),
      ...(modes ? { modes } : {}),
      ...(visualTone ? { visualTone } : {}),
      ...(density ? { density } : {}),
      ...(lightTheme ? { lightTheme: true } : {}),
    };

    const trackerRaw = secContent["learn.quiz.trackerMap"]?.trim();
    if (kind === "quiz" && trackerRaw) {
      const map = parseTrackerMap(trackerRaw);
      if (Object.keys(map).length) {
        slide.trackerValueLabels = map;
        slide.trackerEnabled = true;
      }
    }

    if (kind === "hero" && (secContent["learn.hero.skipLink"] || "").trim() !== "1") {
      slide.buttons = [
        {
          type: "link",
          label: options.heroLinkLabel ?? options.shopNowLabel ?? "Continue",
          hrefKey: "shopUrl",
          nodeId: `${slide.id}-hero-link`,
        },
      ];
    }

    sectionSlides.push({ rawId: n.rawId, slide });
    dfsOrderRawIds.push(n.rawId);
  }

  const deckRootSlides = buildDeckRootSlides(contentMap, options);

  let orderedSectionSlides = sectionSlides;
  let hinted = dfsOrderRawIds;
  hinted = applySequenceHint(hinted, sequenceOrder, rawByName, targetToRaw, warn);
  const topo = orderRawIdsByFlow(hinted, flowEdges, warn);
  const byRaw = new Map(sectionSlides.map((s) => [s.rawId, s.slide]));
  orderedSectionSlides = topo.map((rid) => ({ rawId: rid, slide: byRaw.get(rid)! })).filter((x) => x.slide);

  const slides: OutlineSlide[] = [...deckRootSlides, ...orderedSectionSlides.map((s) => s.slide)];

  if (slides.length === 0) {
    throw new Error(
      "[txt-profile/learn-v2] No slides produced. Add eligible Section nodes (x.y with y≥2) and content, or set learn.kind on 1.0 — see profiles/learn/README.md."
    );
  }

  const outline: DeckOutline = {
    meta: {
      outlineFormatVersion: 3,
      title: deckTitle,
      shopUrl: options.shopUrl ?? "https://example.com",
      logoSrc: rootMeta["learn.logoSrc"]?.trim() || options.logoSrc || "/favicon.ico",
      logoAlt: rootMeta["learn.logoAlt"]?.trim() || options.logoAlt || deckTitle,
      shopNowLabel: options.shopNowLabel ?? "Continue",
      stepTrackerTitle: rootMeta["learn.stepTrackerTitle"]?.trim() || options.stepTrackerTitle || deckTitle,
      stepTrackerDescription:
        rootMeta["learn.stepTrackerDescription"]?.trim() || options.stepTrackerDescription || "",
      showResponses: (rootMeta["learn.showResponses"] || "").trim() === "1",
      responsePlaceholder: rootMeta["learn.responsePlaceholder"]?.trim() || "",
      ...(rootMeta["learn.deckPalette"]?.trim() ? { deckPalette: rootMeta["learn.deckPalette"].trim() } : {}),
    },
    ...(Object.keys(deckMedia).length ? { media: deckMedia } : {}),
    slides,
  };

  return outline;
}

export function compileTxtAuthoringToLandingDeckLearnProfileV2(
  blueprintText: string,
  contentText: string,
  options?: TxtProfileLearnV2Options
): { ok: true; deck: LandingDeckV1 } | { ok: false; errors: string[]; report?: string } {
  const outline = txtAuthoringToDeckOutlineLearnProfileV2(blueprintText, contentText, options ?? {});
  return compileLearnAuthoringToDeck(outline);
}
