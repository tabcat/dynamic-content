import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import type { BlockView } from 'multiformats/block/interface'

export async function DynamicContent
  ({ protocol, param }: { protocol: string, param: any }):
  Promise<{ id: CID, block: BlockView }>
{
  const block = await Block.encode({ value: { protocol, param }, codec, hasher })
  const dynamic = new TextEncoder().encode('dynamic')
  const bytes = new Uint8Array(dynamic.length + block.cid.multihash.digest.length)
  bytes.set(dynamic)
  bytes.set(block.cid.multihash.digest, dynamic.length)

  const cid = CID.create(
    block.cid.version,
    block.cid.code,
    await hasher.digest(bytes)
  )

  return { id: cid, block }
}

