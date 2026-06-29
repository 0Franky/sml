/** Type declarations for context-assembler.mjs (assembla <context> dalle lane del vars-queue). */
import type { VarsQueue } from "./vars-queue.mjs";

export interface AssembleOpts {
  sinceMs?: number;
  maxChanges?: number;
  includePrivateVars?: boolean;
  now?: number;
}

export function assembleContext(vq: VarsQueue, opts?: AssembleOpts): string;
export default assembleContext;
