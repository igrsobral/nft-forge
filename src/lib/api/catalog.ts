import {
  nftDetailSchema,
  nftListQuerySchema,
  nftListResponseSchema,
  type NftDetail,
  type NftListQuery,
  type NftListResponse,
} from '@/contracts/catalog'
import { api } from './client'

export async function listNfts(
  params: NftListQuery,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const response = await api.get('/nfts', { params: nftListQuerySchema.parse(params), signal })
  return nftListResponseSchema.parse(response.data)
}

export async function getNft(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
  const response = await api.get(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return nftDetailSchema.parse(response.data)
}

export async function tickNftPrice(nftId: string): Promise<void> {
  await api.post(`/dev/nfts/${encodeURIComponent(nftId)}/tick`)
}
