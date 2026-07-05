export interface Scaffolding {
  awareness: string;
  tail: string;
  resources: string;
}

export function buildMemoryScaffolding(
  level: "full" | "lean" | "off",
  opts?: { toolGating?: string; discoverableCats?: string },
): Scaffolding;

export function registerScaffolding(
  level: "full" | "lean" | "off",
  opts?: { toolGating?: string; discoverableCats?: string },
): Scaffolding;

export function getRegisteredScaffolding(): Scaffolding;
