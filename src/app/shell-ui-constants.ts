/**
 * Shell UI constants: single source for screen bounds gutter and nav strip height.
 * Used by layout (AppViewport, nav anchor), GlobalAppSkin (strip alignment), and PersistentLauncher (FAB position).
 */
export const SCREEN_GUTTER_X = 24;
export const NAV_STRIP_HEIGHT = 64;
export const FAB_GAP = 12;
/** Bottom nav strip: distance from bottom of AppViewport (px). */
export const NAV_BOTTOM_INSET = 12;
/** FAB: distance from bottom and right of AppViewport (px). */
export const FAB_BOTTOM_INSET = 24;
export const FAB_RIGHT_INSET = 24;
/** Breakpoint (min-width in px) above which we treat as desktop/tablet (icon row left-aligned). Below = phone (centered). */
export const SCREEN_UI_BREAKPOINT_PX = 768;
