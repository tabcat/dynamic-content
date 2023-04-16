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
await client1.stop()

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
await client2.stop()

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
console.log('server: online')

const name1 = await ipns(client1, [dht(client1)])
const name2 = await ipns(client2, [dht(client2)])

const dynamicContent = await DynamicContent({
  protocol: '/dynamic-content-example/set/1.0.0',
  param: { network: 1 }
})
// await client1.blockstore.put(dynamicContent.block.cid, dynamicContent.block.bytes)

const set1: Set<string> = new Set()
const set2: Set<string> = new Set()

// client1 makes changes and goes offline
{
  // online
  console.log('client1: online')
  await client1.start()
  await client1.libp2p.dialProtocol((server.libp2p.getMultiaddrs())[0], '/ipfs/lan/kad/1.0.0')

  console.log('client1: added an update to the set')
  set1.add('nerf this')
  
  console.log('client1: encode and push data to host')
  const block = await Block.encode<string[], 113, 18>({ value: Array.from(set1), codec, hasher })
  await server.blockstore.put(block.cid, block.bytes)

  console.log('client1: publish ipns record of local replica')
  console.log(`client1: replica cid is ${block.cid}`)
  await name1.publish(client1.libp2p.peerId, block.cid)

  console.log('client1: publish ipns to dht')
  /**
   * This is a hack.
   */
  await all(client1.libp2p.dht.provide(dynamicContent.id))

  console.log('client1: offline')
  await client1.stop()
}

console.log('--- no peers online, Zzzzz ---')
await new Promise(resolve => setTimeout(resolve, 3000))

// client2 comes online and merges changes
{
  console.log('client2: online')
  await client2.start()
  await client2.libp2p.dialProtocol((server.libp2p.getMultiaddrs())[0], '/ipfs/lan/kad/1.0.0')

  console.log('client2: check dht for ipns records of database peers')
  const [con] = await client2.libp2p.getConnections()
  const responses1 = await all(client2.libp2p.dht.findProviders(dynamicContent.id)) // first responses always empty for some reason
  const responses = await all(client2.libp2p.dht.findProviders(dynamicContent.id))
  const provider = responses.filter(r => r.name === 'PROVIDER')[0] as ProviderEvent
  const peerId = provider.providers[0].id
  console.log('client2: found ipns record of database peer')

  // resolve ipns record
  console.log('client2: resolving ipns record')
  const replica = await name2.resolve(peerId)
  console.log(`client2: replica cid is ${replica}`)

  console.log('client2: decoding replica bytes')
  const bytes = await client2.blockstore.get(replica)
  const block = await Block.decode<string[], 113, 18>({ bytes, codec, hasher })

  block.value.forEach(set2.add.bind(set2))
  console.log('client2: merged remote replica with local')
 
  console.log('client2: offline')
  await client2.stop()
}

await server.stop()
console.log('server: offline')

global.client1 = client1
global.client2 = client2
global.server = server
global.name1 = name1
global.name2 = name2
global.set1 = set1
global.set2 = set2
global.dynamicContent = dynamicContent

// @ts-expect-error
global.all = all
// @ts-expect-error
global.last = last
