import { createHelia } from 'helia'
import { createLibp2p, Libp2p, Libp2pOptions } from 'libp2p'
import { kadDHT } from '@libp2p/kad-dht'
import { mdns } from '@libp2p/mdns'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { MemoryBlockstore } from 'blockstore-core'
import { MemoryDatastore } from 'datastore-core'
import { ipns, IPNS } from '@helia/ipns'
import { pubsub } from '@helia/ipns/routing'
import { dht } from '@helia/ipns/routing'
import { ipnsValidator } from 'ipns/validator'
import { ipnsSelector } from 'ipns/selector'
import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import { Block as BlockType } from 'multiformats/interface'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import all from 'it-all'
import last from 'it-last'
import type { Helia } from '@helia/interface'
import type { ProviderEvent } from '@libp2p/interface-dht'
import type { Stream } from '@libp2p/interface-connection'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { BlockView } from 'multiformats/interface'

import './globals.js'
import { createHeliaNode } from './create-helia.js'
import { DynamicContent } from './dynamic-content.js'

const client1 = await createHeliaNode({
  dht: kadDHT({
    validators: {
      ipns: ipnsValidator
    },
    selectors: {
      ipns: ipnsSelector
    },
    clientMode: true
  }),
})

const client2 = await createHeliaNode({
  dht: kadDHT({
    validators: {
      ipns: ipnsValidator
    },
    selectors: {
      ipns: ipnsSelector
    },
    clientMode: true
  })
})

const server = await createHeliaNode({
  dht: kadDHT({
    validators: {
      ipns: ipnsValidator
    },
    selectors: {
      ipns: ipnsSelector
    }
  })
})
console.log('server is pinning ipld/ipns and serving dht records')

const name1 = await ipns(client1, [dht(client1)])
const name2 = await ipns(client2, [dht(client2)])

const dynamicContent = await DynamicContent({
  protocol: '/dynamic-content-example/set/1.0.0',
  param: { network: 1 }
})

// (dcid -> ipns)
// add ipns record into dht
const advertise = (client: Helia) => async () => await all(client.libp2p.dht.provide(dynamicContent.id))
// look for peers in the dht
const query = (client: Helia) => async () => {
  let i = 0
  let providers: ProviderEvent[] = []
  while (providers.length === 0 && i < 3) {
    const responses = await all(client.libp2p.dht.findProviders(dynamicContent.id))
    providers = responses.filter(r => r.name === 'PROVIDER') as ProviderEvent[]
    i++
  }

  if (i > 0) {
    console.log('dht query returned empty response')
  }

  if (i === 3) {
    throw new Error('cannot find providers')
  }
  
  return providers[0].providers[0].id
}

// (ipns -> cid)
// update ipns record
const publish = (client: Helia, name: IPNS) => async (cid: CID) => await name.publish(client.libp2p.peerId, cid)
// resolve ipns record
const resolve = (name: IPNS) => async (peerId: PeerId) => await name.resolve(peerId)

// (cid -> data)
// push data to reliable host
const push = async (b: BlockView<string[], 113, 18, 1>) => await server.blockstore.put(b.cid, b.bytes)
// pull data over ipfs
const pull = (client: Helia) => async (cid: CID) => await client.blockstore.get(cid)

// (data -> set)
// encode set to ipld
const encode = async (s: Set<string>) =>
  await Block.encode<string[], 113, 18>({ value: Array.from(set1), codec, hasher })
// decode set from ipld
const decode = async (bytes: Uint8Array) =>
  new Set((await Block.decode<string[], 113, 18>({ bytes, codec, hasher })).value)

// (set + set)
// add value to set
const add = (s: Set<string>) => (v: string) => s.add(v)
// merge local and remote replicas
const merge = (l: Set<string>, r: Set<string>) => r.forEach(l.add.bind(l))

const set1: Set<string> = new Set()
const set2: Set<string> = new Set()

// write to client1
const update = async (...values: string[]) => {
  const diff = Array.from(values).filter(value => !set1.has(value))
  for (const value of values) { set1.add(value) }
  console.log(`client1: added new values to set { ${diff.join(', ')} }`)
  const block = await encode(set1)
  console.log(`client1: encoded to raw data`)
  await push(block)
  console.log(`client1: pushed data to pinner`)
  await publish(client1, name1)(block.cid)
  console.log(`client1: published ipns:${client1.libp2p.peerId} with value cid:${block.cid}`)
  await advertise(client1)()
  console.log(`client1: advertised ipns:${client1.libp2p.peerId} as set provider`)
}
// sync to client2
const sync = async () => {
  const peerId = await query(client2)()
  console.log(`client2: found ipns:${peerId} as set provider`)
  const cid = await resolve(name2)(peerId)
  console.log(`client2: resolved ipns:${peerId} to ${cid}`)
  const bytes = await pull(client2)(cid)
  console.log(`client2: resolved ipfs:${cid} to raw data`)
  const set1 = await decode(bytes)
  console.log(`client2: decoded raw data`)
  const diff = Array.from(set1).filter(value => !set2.has(value))
  merge(set2, set1)
  console.log(`client2: added new values to set { ${diff.join(', ')} }`)
}

const connect = async (client: Helia) => { await client.libp2p.dialProtocol((server.libp2p.getMultiaddrs())[0], '/ipfs/lan/kad/1.0.0') }
const disconnect = async (client: Helia) => await client.libp2p.getConnections().forEach(connection => connection.close())

// client1 makes changes and goes offline
{
  // online
  await connect(client1)
  console.log('client1: online')

  await update('nerf this')
  console.log('client1: updated the set')

  await disconnect(client1)
  console.log('client1: offline')
}

console.log('--- no peers online, Zzzzz ---')
await new Promise(resolve => setTimeout(resolve, 3000))

// client2 comes online and merges changes
{
  await connect(client2)
  console.log('client2: online')

  await sync()
  console.log('client2: synced the updates')

  await disconnect(client2)
  console.log('client2: offline')
}

await Promise.all([
  client1.stop(),
  client2.stop(),
  server.stop()
])

global.client1 = client1
global.client2 = client2
global.server = server
global.name1 = name1
global.name2 = name2
global.set1 = set1
global.set2 = set2
global.dynamicContent = dynamicContent
global.update = update
global.sync = sync
global.connect = connect
global.disconnect = disconnect
