"use client";

import React from "react";
import GospelDiscipleship from "@/01_App/(live) Gospel/Discipleship/GospelDiscipleship";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";
import "@/app/landing/landing-theme.css";

const SCREEN_PATH = "(live) Gospel/Discipleship/GospelDiscipleship";

export default function GospelPage() {
  return (
    <div className="landing-container-creations" data-landing="gospel">
      <TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={GospelDiscipleship} />
    </div>
  );
}
