// src/engine/types/ui-node.ts
export type UIParams = {
    surface?: any;
    text?: any;
    media?: any;
    sequence?: any;
    trigger?: any;
    field?: any;
    collection?: any;
  };
  
  
  export type UINodeProps = {
    id?: string;
    content?: any;
    behavior?: any;
    layout?: any;
    params?: UIParams;
    children?: any;
  };
