/**
 * Atoms — Core primitives. Single source: atoms.json + these components.
 * Exported atoms are wrapped with OriginTraceStamp for data-screen/layout/section/molecule/atom/json-path.
 */
import { withOriginTraceStamp } from "@/03_Runtime/diagnostics/OriginTraceContext";
import CollectionAtomBase from "./collection";
import ConditionAtomBase from "./condition";
import FieldAtomBase from "./field";
import FocusRingAtomBase from "./focus-ring";
import MediaAtomBase from "./media";
import SequenceAtomBase from "./sequence";
import ShellAtomBase from "./shell";
import SkeletonAtomBase from "./skeleton";
import SpinnerAtomBase from "./spinner";
import SurfaceAtomBase from "./surface";
import TextAtomBase from "./text";
import TriggerAtomBase from "./trigger";

export const CollectionAtom = withOriginTraceStamp(CollectionAtomBase, "collection");
export const ConditionAtom = withOriginTraceStamp(ConditionAtomBase, "condition");
export const FieldAtom = withOriginTraceStamp(FieldAtomBase, "field");
export const FocusRingAtom = withOriginTraceStamp(FocusRingAtomBase, "focus-ring");
export const MediaAtom = withOriginTraceStamp(MediaAtomBase, "media");
export const SequenceAtom = withOriginTraceStamp(SequenceAtomBase, "sequence");
export const ShellAtom = withOriginTraceStamp(ShellAtomBase, "shell");
export const SkeletonAtom = withOriginTraceStamp(SkeletonAtomBase, "skeleton");
export const SpinnerAtom = withOriginTraceStamp(SpinnerAtomBase, "spinner");
export const SurfaceAtom = withOriginTraceStamp(SurfaceAtomBase, "surface");
export const TextAtom = withOriginTraceStamp(TextAtomBase, "text");
export const TriggerAtom = withOriginTraceStamp(TriggerAtomBase, "trigger");
