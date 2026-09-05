import type { ActionContext } from '@pubflow/native/actions'

export const auth = true
export const allowedTypes = ['admin', 'editor']

export async function secret(_ctx: ActionContext) {
  return { ok: true, scope: 'admin,editor' }
}
