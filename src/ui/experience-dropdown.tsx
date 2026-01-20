"use client";
import { useSyncExternalStore } from "react";
import {
  getExperienceId,
  setExperienceId,
  subscribeExperience,
} from "@/state/view-store";
import experiences from "@/state/views";


export default function ExperienceDropdown() {
  const value = useSyncExternalStore(
    subscribeExperience,
    getExperienceId,
    () => "views.journal" // ✅ REQUIRED fallback
  );


  return (
    <select
      value={value}
      onChange={(e) => setExperienceId(e.target.value)}
    >
      {Object.keys(experiences).map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
}


