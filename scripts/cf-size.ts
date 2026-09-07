export const WORKER_SIZE_BUDGET_KIB = {
  starter: 2.5 * 1024,
  minimal: 1.2 * 1024,
  'custom-hono-server': 1.2 * 1024,
}

function toKib(value: number, unit: string): number {
  return unit.toLowerCase().startsWith('mi') ? value * 1024 : value
}

/** Parse Wrangler `Total Upload: 1887.12 KiB / gzip: 333.45 KiB` (KiB or MiB). */
export function parseTotalUploadKib(output: string): { uncompressed: number; gzip: number } | null {
  const match = output.match(
    /Total Upload:\s+([\d.]+)\s+(KiB|MiB)\s*\/\s*gzip:\s+([\d.]+)\s+(KiB|MiB)/i,
  )
  if (!match) return null
  return {
    uncompressed: toKib(Number(match[1]), match[2]),
    gzip: toKib(Number(match[3]), match[4]),
  }
}

export function assertWorkerBudget(appId: keyof typeof WORKER_SIZE_BUDGET_KIB, uncompressedKib: number): void {
  const budget = WORKER_SIZE_BUDGET_KIB[appId]
  if (uncompressedKib > budget) {
    throw new Error(
      `[pubflow-native] ${appId} Worker is ${uncompressedKib.toFixed(1)} KiB (budget ${budget} KiB uncompressed)`,
    )
  }
}
