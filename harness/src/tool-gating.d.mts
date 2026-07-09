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

/** Profilo del set-attivo (ortogonale ai MODI di tool-gating). */
export type ToolProfile = "core" | "minimal" | "standard" | "full" | "custom";

export const CATEGORY_TOOLS: Record<string, string[]>;
export const ESSENTIAL_TOOLS: string[];
export const TOOL_PROFILES: ToolProfile[];
export const PROFILE_CORE: string[];
export const PROFILE_MINIMAL: string[];
export function profileToolNames(profile: string, custom?: string[]): string[] | null;
export function categorizeTool(name: string): string;
export function searchTools(items: ToolItem[], query: string, opts?: { limit?: number }): SearchHit[];
export function toolsInCategory(items: ToolItem[], category: string): CategoryEntry[];
export function listCategories(items: ToolItem[]): { category: string; count: number }[];
export function computeDefaultActive(allToolNames: string[], opts?: { profile?: string; custom?: string[] }): string[];

declare const _default: {
  CATEGORY_TOOLS: typeof CATEGORY_TOOLS;
  ESSENTIAL_TOOLS: typeof ESSENTIAL_TOOLS;
  TOOL_PROFILES: typeof TOOL_PROFILES;
  PROFILE_CORE: typeof PROFILE_CORE;
  PROFILE_MINIMAL: typeof PROFILE_MINIMAL;
  profileToolNames: typeof profileToolNames;
  categorizeTool: typeof categorizeTool;
  searchTools: typeof searchTools;
  toolsInCategory: typeof toolsInCategory;
  listCategories: typeof listCategories;
  computeDefaultActive: typeof computeDefaultActive;
};
export default _default;
