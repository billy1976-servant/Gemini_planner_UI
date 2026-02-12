"use client";

import React from "react";
import peopleSvg from "./assets/people_svg.svg";
import journeySvg from "./assets/journey_svg.svg";
import playSvg from "./assets/play_svg.svg";
import calendarSvg from "./assets/calendar_svg.svg";

/**
 * GlobalAppSkin - PURE VISUAL WRAPPER
 * 
 * Extracted from HIClarify's existing BottomNavBar
 * NO BEHAVIOR - NO LOGIC - NO HANDLERS
 * 
 * This component only provides the visual structure of the bottom navigation.
 * All functionality is removed - this is purely presentational.
 */

// Icon components - EXACT COPIES from original App.jsx

const HabitIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MaskIcon = ({ src, className, color }: { src: string; className?: string; color?: string }) => (
  <span
    className={className}
    style={{
      display: "inline-block",
      width: "100%",
      height: "100%",
      backgroundColor: color || "currentColor",
      maskImage: `url(${src})`,
      WebkitMaskImage: `url(${src})`,
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
    aria-hidden
  />
);

const CalendarIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={calendarSvg} className={className} color={color} />
);

const PeopleIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={peopleSvg} className={className} color={color} />
);

const JourneyIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={journeySvg} className={className} color={color} />
);

const PlayIcon = ({ className }: { className?: string }) => (
  <img src={playSvg} alt="Play" className={className} />
);

interface GlobalAppSkinProps {
  children: React.ReactNode;
}

export default function GlobalAppSkin({ children }: GlobalAppSkinProps) {
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalAppSkin.tsx:70',message:'GlobalAppSkin mounted',data:{childrenType:typeof children,hasChildren:!!children},timestamp:Date.now(),hypothesisId:'H1,H4'})}).catch(()=>{});
  }, []);
  // #endregion
  
  // STATIC VISUAL STRUCTURE - copied from original BottomNavBar
  // ALL behavior removed
  
  const iconByName = {
    "Habit": HabitIcon,
    "Calendar": CalendarIcon,
    "People": PeopleIcon,
    "Journey": JourneyIcon,
    "Overview": PlayIcon,
  };

  const centerItem = "Overview";
  const leftItems = ["Habit", "People"];
  const rightItems = ["Journey", "Calendar"];

  const renderItem = (name: string) => {
    const Icon = iconByName[name as keyof typeof iconByName];
    const isOverview = name === 'Overview';
    const isImageIcon = name === 'People' || name === 'Journey' || name === 'Calendar';
    const maskedColor = '#64748b'; // slate-500 (always inactive visual state)
    
    // Responsive sizes from original
    const desiredClass = isOverview
      ? 'h-12 w-12 sm:h-14 sm:w-14'
      : (name === 'Journey' || name === 'Calendar'
          ? 'h-11 w-11 sm:h-[52px] sm:w-[52px]'
          : ((name === 'Habit' || name === 'People')
              ? 'h-10 w-10 sm:h-12 sm:w-12'
              : (isImageIcon ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-8 w-8 sm:h-9 sm:w-9')));
    
    const textClasses = isOverview ? 'text-slate-600' : 'text-slate-500';
    
    return (
      <button 
        key={name}
        className={`flex flex-col items-center flex-1 min-w-0 sm:flex-none px-1 sm:px-4 pt-2 max-[400px]:pt-1 pb-1 ${textClasses}`}
        title={name}
        type="button"
        aria-label={name}
        style={{ pointerEvents: 'none' }} // Prevent interaction - visual only
      >
        {isImageIcon ? (
          <Icon className={desiredClass} color={maskedColor} />
        ) : (
          <Icon className={desiredClass} />
        )}
      </button>
    );
  };

  // #region agent log
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const logDimensions = () => {
      const rootEl = rootRef.current;
      const contentEl = contentRef.current;
      if (rootEl && contentEl) {
        fetch('http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GlobalAppSkin.tsx:121',message:'Shell dimensions',data:{rootHeight:rootEl.offsetHeight,rootScrollHeight:rootEl.scrollHeight,contentHeight:contentEl.offsetHeight,contentScrollHeight:contentEl.scrollHeight,viewportHeight:window.innerHeight},timestamp:Date.now(),hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      }
    };
    logDimensions();
    window.addEventListener('resize', logDimensions);
    return () => window.removeEventListener('resize', logDimensions);
  }, [children]);
  // #endregion

  return (
    <div 
      ref={rootRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%'
      }}
      data-shell="global-app-skin"
    >
      {/* Content Slot - grows to fill available space */}
      <div 
        ref={contentRef}
        style={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
        {children}
      </div>
      
      {/* Bottom Navigation Bar - EXACT COPY of visual structure */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-30">
        <nav className="w-full sm:max-w-2xl sm:mx-auto px-2">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 py-1">
            {leftItems.map(renderItem)}
            {centerItem && renderItem(centerItem)}
            {rightItems.map(renderItem)}
          </div>
        </nav>
      </div>
    </div>
  );
}
