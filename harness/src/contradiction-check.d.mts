export interface Predicate { key: string; op: string; value: unknown; }
export interface Decision { id: string; statement?: string | null; assumptions: Predicate[]; }
export interface Conflict {
  decision_id: string;
  statement: string | null;
  assumption: Predicate;
  fact: Predicate;
  reason: string;
}
export function contradicts(p1: Predicate, p2: Predicate): boolean;
export function checkContradiction(newFacts: Predicate | Predicate[], decisions: Decision[]): Conflict[];
declare const _default: typeof checkContradiction;
export default _default;
