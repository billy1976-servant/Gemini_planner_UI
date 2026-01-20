"use client";
import { UIState } from "@/engine/core/ui-state";


export const BehaviorEngine = {
  /* =============================================
     INTERACTIONS (FULLY WIRED)
     ============================================= */


  "interact.tap": (args) => {
    console.log("✔ TAP", args);
    UIState.set("interaction.tap", args);
  },


  "interact.double": (args) => {
    console.log("✔ DOUBLE", args);
    UIState.set("interaction.double", args);
  },


  "interact.long": (args) => {
    console.log("✔ LONG", args);
    UIState.set("interaction.long", args);
  },


  "interact.dragX": (args) => {
    console.log("✔ DRAG HORIZONTAL", args);
    UIState.set("interaction.drag.horizontal", args);
  },


  "interact.dragY": (args) => {
    console.log("✔ DRAG VERTICAL", args);
    UIState.set("interaction.drag.vertical", args);
  },


  "interact.dragXY": (args) => {
    console.log("✔ DRAG FREE", args);
    UIState.set("interaction.drag.free", args);
  },


  "interact.scrollUp": (args) => {
    console.log("✔ SCROLL UP", args);
    UIState.set("interaction.scroll.up", args);
  },


  "interact.scrollDown": (args) => {
    console.log("✔ SCROLL DOWN", args);
    UIState.set("interaction.scroll.down", args);
  },


  "interact.swipeLeft": (args) => {
    console.log("✔ SWIPE LEFT", args);
    UIState.set("interaction.swipe.left", args);
  },


  "interact.swipeRight": (args) => {
    console.log("✔ SWIPE RIGHT", args);
    UIState.set("interaction.swipe.right", args);
  },


  "interact.swipeUp": (args) => {
    console.log("✔ SWIPE UP", args);
    UIState.set("interaction.swipe.up", args);
  },


  "interact.swipeDown": (args) => {
    console.log("✔ SWIPE DOWN", args);
    UIState.set("interaction.swipe.down", args);
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


  "nav.backOne": (ctx) => {
    if (ctx?.goBack) ctx.goBack(1);
  },


  "nav.backAll": (ctx) => {
    if (ctx?.goBack) ctx.goBack("all");
  },


  "nav.backRoot": (ctx) => {
    if (ctx?.goRoot) ctx.goRoot();
  },


  "nav.openPanel": (ctx, args) => {
    if (ctx?.openPanel) ctx.openPanel(args?.panelId);
  },


  "nav.openSheet": (ctx, args) => {
    if (ctx?.openSheet) ctx.openSheet(args?.sheetId);
  },


  "nav.closePanel": (ctx, args) => {
    if (ctx?.closePanel) ctx.closePanel(args?.panelId);
  },


  "nav.closeSheet": (ctx, args) => {
    if (ctx?.closeSheet) ctx.closeSheet(args?.sheetId);
  },


  "nav.routeInternal": (ctx, args) => {
    if (ctx?.navigate) ctx.navigate(args?.path);
    return { target: args?.path };
  },


  "nav.routeExternal": (_ctx, args) => {
    if (args?.url) window.location.href = args.url;
  },
};


