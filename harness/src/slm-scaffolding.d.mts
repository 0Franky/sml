export function buildMemoryScaffolding(
  level: "full" | "lean" | "off",
  opts?: { toolGating?: string; discoverableCats?: string },
): { awareness: string; tail: string; resources: string };
