import type { ActionContext } from '@pubflow/native/actions'

export const auth = true

/** Last argument is always ActionContext. No input → only ctx. */
export async function me(ctx: ActionContext) {
  return ctx.session
}
