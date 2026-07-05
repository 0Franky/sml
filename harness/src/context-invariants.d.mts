import type { VarsQueue } from "./vars-queue.mjs";

export interface ContextViolation {
  code: string;
  severity: "error" | "warn";
  detail: string;
  taskId?: string;
}

export function checkContextInvariants(vq: VarsQueue): ContextViolation[];
export function isContextCoherent(vq: VarsQueue): boolean;
