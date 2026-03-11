"use client";

import React from "react";
import GospelDiscipleship from "@/01_App/(live) Gospel/Discipleship/GospelDiscipleship";
import "@/app/landing/landing-theme.css";

export default function GospelPage() {
  return (
    <div className="landing-container-creations" data-landing="gospel">
      <GospelDiscipleship />
    </div>
  );
}
