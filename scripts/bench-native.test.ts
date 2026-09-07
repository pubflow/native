import { describe, expect, it } from 'bun:test'
import { assertWorkerBudget, parseTotalUploadKib, WORKER_SIZE_BUDGET_KIB } from './cf-size.ts'

describe('parseTotalUploadKib', () => {
  it('parses KiB and MiB wrangler dry-run lines', () => {
    expect(parseTotalUploadKib('Total Upload: 1887.12 KiB / gzip: 333.45 KiB')).toEqual({
      uncompressed: 1887.12,
      gzip: 333.45,
    })
    const mib = parseTotalUploadKib('Total Upload: 1.80 MiB / gzip: 333.45 KiB')
    expect(mib?.uncompressed).toBeCloseTo(1.8 * 1024)
    expect(mib?.gzip).toBeCloseTo(333.45)
  })

  it('enforces the published budgets', () => {
    expect(WORKER_SIZE_BUDGET_KIB.starter).toBe(2.5 * 1024)
    expect(() => assertWorkerBudget('minimal', 900)).not.toThrow()
    expect(() => assertWorkerBudget('minimal', 2000)).toThrow(/minimal/)
  })
})
