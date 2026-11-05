import {
  type EditorialHome,
  type EditorialPostDetail,
  editorialHomeSchema,
  editorialPostDetailSchema,
} from '@/contracts/editorial'
import { api } from './client'

export async function getEditorialHome(signal?: AbortSignal): Promise<EditorialHome> {
  const response = await api.get('/editorial', { signal })
  return editorialHomeSchema.parse(response.data)
}

export async function getEditorialPost(
  slug: string,
  signal?: AbortSignal,
): Promise<EditorialPostDetail> {
  const response = await api.get(`/editorial/posts/${encodeURIComponent(slug)}`, { signal })
  return editorialPostDetailSchema.parse(response.data)
}
