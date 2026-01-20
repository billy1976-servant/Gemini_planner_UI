// src/state/views/index.ts


import journal from "./journal.json";
import life from "./life.json";
import metrics from "./metrics.json";
import minimal from "./minimal.json";
import monthly from "./monthly.json";
import tasks from "./tasks.json";
import timeline from "./timeline.json";
import track from "./track.json";
import weekly from "./weekly.json";
import decisions from "./decisions.json";


const views: Record<string, any> = {
  "views.journal": journal,
  "views.life": life,
  "views.metrics": metrics,
  "views.minimal": minimal,
  "views.monthly": monthly,
  "views.tasks": tasks,
  "views.timeline": timeline,
  "views.track": track,
  "views.weekly": weekly,
  "views.decisions": decisions,
};


export default views;


