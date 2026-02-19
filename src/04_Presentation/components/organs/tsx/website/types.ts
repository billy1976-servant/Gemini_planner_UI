export type TsxWebsiteNode = {
  id: string;
  type: string;
  props?: Record<string, any>;
};

export type TsxWebsiteContract = {
  industry?: string;
  palette?: string;
  nodes: TsxWebsiteNode[];
  nodeOrder: string[];
};
