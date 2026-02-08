"use client";
import { UIState } from "@/engine/core/ui-state";
import { dispatchState } from "@/state/state-store";
import { trace } from "@/devtools/interaction-tracer.store";


export const BehaviorEngine = {
  /* =============================================
     INTERACTIONS (FULLY WIRED) — also dispatch interaction.record for state
     ============================================= */


  "interact.tap": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.tap", payload: args });
    console.log("✔ TAP", args);
    UIState.set("interaction.tap", args);
    dispatchState("interaction.record", { type: "tap", payload: args });
  },


  "interact.double": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.double", payload: args });
    console.log("✔ DOUBLE", args);
    UIState.set("interaction.double", args);
    dispatchState("interaction.record", { type: "double", payload: args });
  },


  "interact.long": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.long", payload: args });
    console.log("✔ LONG", args);
    UIState.set("interaction.long", args);
    dispatchState("interaction.record", { type: "long", payload: args });
  },


  "interact.dragX": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.dragX", payload: args });
    console.log("✔ DRAG HORIZONTAL", args);
    UIState.set("interaction.drag.horizontal", args);
    dispatchState("interaction.record", { type: "drag", payload: { ...args, direction: "horizontal" } });
  },


  "interact.dragY": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.dragY", payload: args });
    console.log("✔ DRAG VERTICAL", args);
    UIState.set("interaction.drag.vertical", args);
    dispatchState("interaction.record", { type: "drag", payload: { ...args, direction: "vertical" } });
  },


  "interact.dragXY": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.dragXY", payload: args });
    console.log("✔ DRAG FREE", args);
    UIState.set("interaction.drag.free", args);
    dispatchState("interaction.record", { type: "drag", payload: { ...args, direction: "free" } });
  },


  "interact.scrollUp": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.scrollUp", payload: args });
    console.log("✔ SCROLL UP", args);
    UIState.set("interaction.scroll.up", args);
    dispatchState("interaction.record", { type: "scroll", payload: { ...args, direction: "up" } });
  },


  "interact.scrollDown": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.scrollDown", payload: args });
    console.log("✔ SCROLL DOWN", args);
    UIState.set("interaction.scroll.down", args);
    dispatchState("interaction.record", { type: "scroll", payload: { ...args, direction: "down" } });
  },


  "interact.swipeLeft": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.swipeLeft", payload: args });
    console.log("✔ SWIPE LEFT", args);
    UIState.set("interaction.swipe.left", args);
    dispatchState("interaction.record", { type: "swipe", payload: { ...args, direction: "left" } });
  },


  "interact.swipeRight": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.swipeRight", payload: args });
    console.log("✔ SWIPE RIGHT", args);
    UIState.set("interaction.swipe.right", args);
    dispatchState("interaction.record", { type: "swipe", payload: { ...args, direction: "right" } });
  },


  "interact.swipeUp": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.swipeUp", payload: args });
    console.log("✔ SWIPE UP", args);
    UIState.set("interaction.swipe.up", args);
    dispatchState("interaction.record", { type: "swipe", payload: { ...args, direction: "up" } });
  },


  "interact.swipeDown": (args: any) => {
    trace({ time: Date.now(), type: "action", label: "interact.swipeDown", payload: args });
    console.log("✔ SWIPE DOWN", args);
    UIState.set("interaction.swipe.down", args);
    dispatchState("interaction.record", { type: "swipe", payload: { ...args, direction: "down" } });
  },


  /* =============================================
     NAVIGATION (FULLY WIRED)
     ============================================= */


  "nav.goScreen": (ctx, args) => {
    if (ctx?.setScreen) ctx.setScreen(args?.screenId);
    return { target: args?.screenId };
  },


  "nav.goModal": (ctx, args) => {
    if (ctx?.openModal) ctx.openModal(args?.modalId);
    return { target: args?.modalId };
  },


  "nav.goFlow": (ctx, args) => {
    if (ctx?.setFlow) ctx.setFlow(args?.flowId);
    return { target: args?.flowId };
  },


  "nav.backOne": (ctx: any) => {
    if (ctx?.goBack) ctx.goBack(1);
    return { target: "back:1" };
  },


  "nav.backAll": (ctx: any) => {
    if (ctx?.goBack) ctx.goBack("all");
    return { target: "back:all" };
  },


  "nav.backRoot": (ctx: any) => {
    if (ctx?.goRoot) ctx.goRoot();
    return { target: "root" };
  },


  "nav.openPanel": (ctx: any, args: any) => {
    if (ctx?.openPanel) ctx.openPanel(args?.panelId);
    return { target: args?.panelId ? `panel:${args.panelId}` : undefined };
  },


  "nav.openSheet": (ctx: any, args: any) => {
    if (ctx?.openSheet) ctx.openSheet(args?.sheetId);
    return { target: args?.sheetId ? `sheet:${args.sheetId}` : undefined };
  },


  "nav.closePanel": (ctx: any, args: any) => {
    if (ctx?.closePanel) ctx.closePanel(args?.panelId);
    return { target: "panel:close" };
  },


  "nav.closeSheet": (ctx: any, args: any) => {
    if (ctx?.closeSheet) ctx.closeSheet(args?.sheetId);
    return { target: "sheet:close" };
  },


  "nav.routeInternal": (ctx, args) => {
    if (ctx?.navigate) ctx.navigate(args?.path);
    return { target: args?.path };
  },


  "nav.routeExternal": (_ctx, args) => {
    if (args?.url) window.location.href = args.url;
  },


  /* =============================================
     IMAGE-DOMAIN STUBS (wire to state; no layout/render yet)
     ============================================= */
  cropMedia: (args: any) => {
    console.log("✔ [stub] cropMedia", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "cropMedia", args },
    });
  },
  applyFilter: (args: any) => {
    console.log("✔ [stub] applyFilter", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "applyFilter", args },
    });
  },
  applyFrame: (args: any) => {
    console.log("✔ [stub] applyFrame", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "applyFrame", args },
    });
  },
  applyLayout: (args: any) => {
    console.log("✔ [stub] applyLayout", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "applyLayout", args },
    });
  },
  addOverlay: (args: any) => {
    console.log("✔ [stub] addOverlay", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "addOverlay", args },
    });
  },
  adjustSpeed: (args: any) => {
    console.log("✔ [stub] adjustSpeed", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "adjustSpeed", args },
    });
  },
  addAudioOverlay: (args: any) => {
    console.log("✔ [stub] addAudioOverlay", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "addAudioOverlay", args },
    });
  },
  adjustAudioSpeed: (args: any) => {
    console.log("✔ [stub] adjustAudioSpeed", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "adjustAudioSpeed", args },
    });
  },
  cropCanvas: (args: any) => {
    console.log("✔ [stub] cropCanvas", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "cropCanvas", args },
    });
  },
  adjustMapMotion: (args: any) => {
    console.log("✔ [stub] adjustMapMotion", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "adjustMapMotion", args },
    });
  },
  cropLive: (args: any) => {
    console.log("✔ [stub] cropLive", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "cropLive", args },
    });
  },
  applyLiveFilter: (args: any) => {
    console.log("✔ [stub] applyLiveFilter", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "applyLiveFilter", args },
    });
  },
  adjustMotion: (args: any) => {
    console.log("✔ [stub] adjustMotion", args);
    dispatchState("state.update", {
      key: "lastMediaAction",
      value: { handler: "adjustMotion", args },
    });
  },
};


