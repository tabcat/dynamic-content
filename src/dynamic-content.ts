import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import type { BlockView } from 'multiformats/block/interface'

// takes description of the dynamic content (protocol + params)
// returns manifest (Block) and dynamic-content id (CID)
export async function DynamicContent (
  { protocol, param }: { protocol: string, param: any }
):
  Promise<{ id: CID, manifest: BlockView }>
{

  // create manifest
  const manifest = await Block.encode({ value: { protocol, param }, codec, hasher })

  // create dcid
  const dynamic = new TextEncoder().encode('dynamic')
  const bytes = new Uint8Array(dynamic.length + manifest.cid.multihash.digest.length)
  bytes.set(dynamic)
  bytes.set(manifest.cid.multihash.digest, dynamic.length)
  const cid = CID.create(
    manifest.cid.version,
    manifest.cid.code,
    await hasher.digest(bytes)
  )

  return { id: cid, manifest }
}

