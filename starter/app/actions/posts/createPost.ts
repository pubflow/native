import type { ActionContext } from '@pubflow/native/actions'

export const auth = true

export async function createPost(input: { title: string }, _ctx: ActionContext) {
  const title = String(input?.title || '').trim()
  if (!title) throw new Error('title is required')
  return { id: crypto.randomUUID(), title }
}
