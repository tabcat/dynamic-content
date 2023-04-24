# Hosting Dynamic Content on IPFS

The InterPlanetary File System (IPFS) is a distributed, peer-to-peer file system designed to make the web faster, safer, and more resilient. Although IPFS excels at hosting static content, hosting dynamic content remains a challenge. This article presents a design for hosting dynamic content on IPFS using InterPlanetary Linked Data (IPLD), InterPlanetary Name Service (IPNS), and Provider Records.

## Understanding Key Components

### IPLD

IPLD is a data model and set of protocols for linking and addressing data across various distributed systems. In IPFS, IPLD is used to store immutable data, providing content-addressed storage. Each piece of data stored in IPLD has a unique Content Identifier (CID) derived from its content, ensuring data integrity.

### IPNS

IPNS is a decentralized naming system that allows you to create a mutable reference to an immutable CID. With IPNS, you can create a persistent address that always points to the latest version of your content, even as it changes over time.

### Provider Records

Provider Records are a fundamental part of IPFS's Distributed Hash Table (DHT). They help users locate peers who store specific content, identified by its CID. When a user requests content, the DHT is queried for the Provider Records associated with the requested CID. These records contain information about the peers who have the content, enabling the user to establish a connection and retrieve the data.

## Achieving Dynamicity

Combining these three components enables dynamic content hosting on IPFS. The final component involves using Provider Records for dynamic content in a similar way to how they are used for static content. Instead of pointing to peerIDs of potentially online IPFS nodes, they point to peerIDs being used as IPNS names. So, when querying the DHT for providers of dynamic content, the returned providers are IPNS names. These IPNS names then point to the CID of the latest version of a device's local replica.

In distributed systems, dynamic content is often logical, composed of the local replicas of multiple machines and rules about read/write operations. The design encodes this model into IPFS: Query DHT for collaborators' IPNS -> Resolve IPNS to CIDs of remote replica -> Query DHT for providers of the remote replica CID -> Fetch, traverse, and merge remote replica with local replica.

### Dynamic-Content IDs

When searching for static content, a CID is used to find providers in the DHT. When searching for dynamic content a CID is still used. However this CID does not belong to any static content. Instead it is created by permutating the CID of a manifest document describing the dynamic content:

```
manifest = { protocol: '/some-protocol/1.0.0', params: { network: 1 } }
cid = toCID(manifest)
dcid = toCID('dynamic' + cid)
```

### Example

Check out the code example.
It shows how everything works together.

## Usecase: Edge-computed Applications

This design may be especially useful with local-first databases.
These databases are sharded/partitioned to the interested parties.
It's common for only a few collaborators to be a part of a database, and there may be long periods without any of them online.
This presents a challenge of availability and ability to build upon history of peers.
A challenge this design can potentially solve.

### Client-side Processing

Handles the application logic. 
commands pinning servers to keep the latest history of the application available to collaborators.
handles merging replicas from other collaborators.

### Pinning Servers

reliable servers keeping dynamic content available by pinning IPLD and refreshing IPNS/Signed Provider Records for clients.
they run no application-specific code.
requires delegated republishing of IPNS and Provider Records to the DHT.
using UCANs to delegate this is being talked about but work around this is further off.
until then the client must come online to refresh the records before they disappear (usually after 40hours).

### Replication

Not good to use this as main replication method.
Use this general way for asynchronous replication of dynamic content with pinning servers and offline collaborators.
only requires publishing provider records when needed to refresh them. and republishing IPNS every few minutes after making changes.
Use more specialized protocols for synchronous replication with online collaborators.
