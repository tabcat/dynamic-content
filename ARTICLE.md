# Hosting Dynamic Content on IPFS

The InterPlanetary File System (IPFS) is a distributed, peer-to-peer file system designed to make the web faster, safer, and more resilient. Although IPFS excels at hosting static content, hosting dynamic content remains a challenge. This article presents a design for hosting dynamic content on IPFS using InterPlanetary Linked Data (IPLD), InterPlanetary Name Service (IPNS), and Provider Records.

## Understanding Key Components

### IPLD

[IPLD](https://ipld.io/) is a data model for linking and addressing data across distributed systems. In IPFS, IPLD stores immutable data, providing [content-addressed storage](https://en.wikipedia.org/wiki/Content-addressable_storage). Data stored in IPLD has a unique [Content Identifier](https://docs.ipfs.tech/concepts/content-addressing/) (CID) derived from its content, ensuring data integrity.

### IPNS

[IPNS](https://docs.ipfs.tech/concepts/ipns/) is a decentralized naming system that allows you to create a mutable reference to an immutable CID. With IPNS, you can create a persistent address that always points to the latest version of your content, even as it changes over time.

### PeerID

A [Libp2p peerID](https://docs.libp2p.io/concepts/fundamentals/peers/#peer-id) is a unique identifier for each node in the network, derived from a [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). PeerIDs help find, identify, and communicate with other nodes.

### Provider Records

[Provider Records](https://docs.ipfs.tech/concepts/dht/) are a fundamental part of IPFS's Distributed Hash Table (DHT). When requesting IPFS content, a node queries the DHT for Provider Records associated with the requested CID. These records contain the PeerID of peers with the content, enabling the user to establish a connection and retrieve the data.

---
> **It's important to note that IPNS names can be derived from PeerIDs**
---

## Achieving Dynamicity

The main contribution is the novel use of Provider Records.
Instead of pointing from a CID to peerIDs of nodes hosting that content, they are used to point from a Dynamic-Content ID to IPNS names.
The resulting IPNS names each resolve to the latest CID of a device's local replica.

A device can query the provider records for dynamic content, then read from the remote replicas and merge them locally. All of this can happen without knowing any previous collaborators, or needing them to be online as long as their replica data is kept available via a pinner.


<img src="https://raw.githubusercontent.com/tabcat/dynamic-content/master/.assets/dynamic-content-diagram.png" width="333">

---
> The Merkle-DAG structure of IPFS enables traversing only the necessary pieces of content.
---

### Dynamic-Content IDs

When searching the network for static content, a CID is used to find providers in the DHT. When searching for dynamic content a CID is still used. However, this CID does not belong to any static content. Instead, it is a permutation of the CID of an immutable manifest document that describes the dynamic content:

```
manifest = { protocol: '/some-protocol/1.0.0', params: { network: 1 } }
cid = toCID(manifest)
dcid = toCID('dynamic' + cid)
```

### Example

Check out the code [example](https://github.com/tabcat/dynamic-content/blob/master/EXAMPLE.md).
It shows how everything works together.

## Viewed as a Replication Protocol

There exist protocols for dynamic content that use IPFS with Libp2p Gossipsub to replicate; one example is [OrbitDB](https://github.com/orbitdb).
In short, OrbitDB's replication protocol uses pubsub to find collaborators and share the latest root CIDs of replicas. Then these CIDs are used to fetch replicas from collaborators using IPFS.

The design presented in this article works similarly but replaces pubsub with Provider Records and IPNS. Essentially, all parts of replication get encoded into ~persistent IPFS components.

- Provider Records to find collaborators
- IPNS to point to the latest version of a replica

---
> Titling this article 'Replication on IPFS' might have been more accurate, but 'Hosting Dynamic Content on IPFS' sounded waaay better.
---

## Use-case: Edge-computed Applications

This design is particularly useful when paired with local-first databases.
These databases are partitioned (a.k.a. sharded) to only the interested parties.
It's common for only a few collaborators to be a part of a database, and there may be long periods without any of them online.
This context makes it challenging to build upon the history of collaborators, a challenge this design can potentially solve.

### Edge Devices

- Handle application logic and merging of replicas from other collaborators.
- Consist of a network of potentially unreliable peers that may come online and go offline at various times.
- Ensure the application history is available by commanding pinning servers.

### Pinning Servers

- Reliable storage servers that maintain the availability of dynamic content on IPFS.
- Pin IPLD replicas, and refresh IPNS and Provider Records for clients.
- Executes no app-specific code

### Replication

When other collaborators are online, use an application-specific replication protocol for real-time collaboration.
If not, query the DHT for collaborators' IPNS names to fetch and merge replicas from pinning servers. 
After committing changes to the local replica, periodically push updates to pinning servers and refresh the IPNS to reference the new root.

## Roadblock, Workaround, and Hopeful Future

It should be clear now that using Provider Records this way was not intented.
Which brings us to the roadblock...

[DHT servers validate that the peerIDs inside received Provider Records match the peerID of the node adding them.](https://github.com/libp2p/specs/tree/master/kad-dht#rpc-messages)

This check makes adding Provider Records for multiple peerIDs to the DHT difficult.
Not great if you want to participate in multiple pieces of dynamic content as each will require its own IPNS name.
The workaround, for now, will involve spinning up ephemeral libp2p nodes to add each IPNS name as a provider every [22hours](https://github.com/libp2p/specs/tree/master/kad-dht#content-provider-advertisement-and-discovery).

Hopefully, in the future, it will be possible to delegate keeping Provider and IPNS records fresh to pinning servers.
This feature is needed for the full implementation of the edge-computed applications use-case and is not yet possible.

## Get Involved

Sound interesting? Get involved! Come [chat](https://matrix.to/#/#hldb:matrix.org)!
[I](https://github.com/tabcat)'m working on this in [hldb/welo](https://github.com/hldb/welo).

