"use client";

/**
 * Mobile bottom navigation bar.
 * Re-exports the shared bottom nav UI from GlobalAppSkin so mobile layout
 * owns the shell contract; dev layout keeps its own copy inside the stage/frame.
 */
export { BottomNavOnly as BottomNav } from "@/04_Presentation/shells/GlobalAppSkin";
