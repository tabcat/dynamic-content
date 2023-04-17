
# Hosting Dynamic End-user apps on IPFS

There are a few issues using a purely peer-to-peer apps on end-user devices.
The issues have to do with end-user devices often not being reliable peers.
This can result in application data being trapped on user devices.

This article presents a general design for keeping dynamic\* content available on IPFS.

## Data Availability

Dynamic-content, especially in a peer-to-peer setting, is a logical data structure made up of immutable data on separate machines.

Creating immutable and mutable content with IPLD and IPNS is simple.
Continuing to host that content is less simple as it involves keeping machines online.
Fortunately tools and services which make this part easier do exist.



Data needs to remain available for it to be useful to other machines.

Dynamic content is often made of immutable data.
Dynamic content is often kept available by a large network of peers all storing copies of the data.
Protocol peers, sharing the same parameters, gossip transactions and read the latest state from their local copies.

Dynamic content can be made of immutable data.
But without an identifier there is no way to reference it or find it on the DHT

Often dynamic content, in a p2p setting, is kept available by a large network of peers all storing the same data.


Pinning services will "pin" (host) IPLD/IPNS data/records for users.
They are a simple and convenient way for users to keep content available over IPFS.

Often 

## Dynamic vs Mutable Content

Dynamic and mutable content are both content that can change.
However for the purpose of this article, dynamic content can safely be changed by one to many peers.

An IPNS Record is an example of mutable content.
It's value can be changed but it’s not safe for peers publish changes without coordinating outside of the protocol.

Peer-to-peer databases and blockchains are examples of dynamic content.
These can safely be changed over time by multiple peers creating [concurrent] transactions.

## Replicas of Dynamic Content

## Storing Replicas in IPLD

## Publishing updated Replicas to IPNS

## Dynamic-Content IDs on IPFS

Content IDs (aka CIDs) are used to key immutable content on the IPFS-DHT. 
Dynamic-Content IDs would be used to key dynamic content.

### Provider Records for Dynamic Content

## Overview of complete System

## Edge-computed Applications

The point of this design is to allow for dynamic p2p applications that need 0 reliable peers.

Although there is a small caveat
still need to be online before leaving to replicate data

## Open Questions






An example of dynamic content in this context would be a peer-to-peer database like OrbitDB or a blockchain like *your fave chain here*.

## Provider Records for Dynamic Content

## Off-loading Availability

### Algorithm

## Examining Use-Cases

### Edge Computed Applications

## Code Example

## 



# Availability layer for Dynamic Content on IPFS

There are a few issues using a pure peer-to-peer model for apps on edge devices.
These issues have to do with edge devices often not being reliable peers.
This can result in significant pieces of application data being trapped offline.

This article presents a general design for keeping dynamic content available on IPFS.

## Dynamic Content vs Mutable Content

Dynamic and mutable content are both content that can change.
However for the purpose of this article, *dynamic* content can safely be changed by multiple peers.

An IPNS Record is an example of mutable content.
It can be changed but it's not safe for peers to update the content without first coordinating.

An example of dynamic content in this context would be a peer-to-peer database like OrbitDB or a blockchain like *\*your fave chain here\**.

## Provider Records for Dynamic Content

On the IPFS DHT, Provider Records are used to resolve the providers for a piece of immutable content.
They tie a multihash to a list of multiaddrs.

A provider record for dynamic content would work similarly.
The difference is that it would tie a logical id to a list of IPNS keys.

OrbitDB uses an immutable document called a manifest to refer to a database.
The manifest contains config that keeps it logically unique from other databases.
The logical id for the database inside the DHT would be some deterministic permutation of the manifest CID.

## Back to Availability/Uptime

How does this solve uptime issues for end users of p2p consumer-facing applications?
Why not simply add reliable peers running the same software to the system?

Adding reliable peers would definitely work.
However it requires running more niche software.
It's likely more than a few protocols will be used for dynamic content on IPFS.

End users keeping their dynamic content available may be solved more generally:

Each application peer manages it's local replica of the dynamic content.
The replica is made up of immutable IPLD blocks.
Assume replicas are structured to have a single root CID.
Each local replica has an associated and unique IPNS Key.
A logical id is derived from the parameters used for the dynamic content.

When an application peer comes online it looks for other online peers.
If no other peers are online it queries the DHT for the dynamic content Provider Record.
After a peer updates it's local replica it gets a new root CID.
New root CIDs are published in IPNS Revisions.
Before a peer goes offline it publishes a dynamic content Provider Record.

IPFS nodes with IPLD/IPNS pinning services are used to keep content available after the peer has gone offline.

In the future it could make sense to have the pinning services also republish signed DHT records.
This would enable dynamic content to survive periods without any peers online for >48hrs.

This design should be easier to self-host and can lever much of existing infrastructure.

## Edge-Computed Application

The point of this design is to allow for dynamic p2p applications that need 0 reliable peers.
Unreliable user devices are computing all of the application logic and ordering reliable IPLD/IPNS pinners to keep the data available.
*A human wrote this article*

