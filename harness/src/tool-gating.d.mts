/** Type declarations for tool-gating.mjs — scoperta tool (search + categoria) per modelli piccoli. */

export interface ToolItem {
  name: string;
  description?: string;
  /** "tool" (default) | "skill". */
  kind?: string;
}
export interface SearchHit {
  name: string;
  description: string;
  category: string;
  kind: string;
  score: number;
}
export interface CategoryEntry {
  name: string;
  description: string;
  category: string;
  kind: string;
}

export const CATEGORY_TOOLS: Record<string, string[]>;
export const ESSENTIAL_TOOLS: string[];
export function categorizeTool(name: string): string;
export function searchTools(items: ToolItem[], query: string, opts?: { limit?: number }): SearchHit[];
export function toolsInCategory(items: ToolItem[], category: string): CategoryEntry[];
export function listCategories(items: ToolItem[]): { category: string; count: number }[];
export function computeDefaultActive(allToolNames: string[]): string[];

declare const _default: {
  CATEGORY_TOOLS: typeof CATEGORY_TOOLS;
  ESSENTIAL_TOOLS: typeof ESSENTIAL_TOOLS;
  categorizeTool: typeof categorizeTool;
  searchTools: typeof searchTools;
  toolsInCategory: typeof toolsInCategory;
  listCategories: typeof listCategories;
  computeDefaultActive: typeof computeDefaultActive;
};
export default _default;
