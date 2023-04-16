import repl from 'repl'
await import('./index.js')

console.log('--- interactive example ---')
await Promise.all([
  client1.start(),
  client2.start(),
  server.start()
])
console.log('all nodes online')

// random timeout, nice
await new Promise(resolve => setTimeout(resolve, 1000))

console.log('connecting clients to server')
await client1.libp2p.dialProtocol((server.libp2p.getMultiaddrs())[0], '/ipfs/lan/kad/1.0.0')
await client2.libp2p.dialProtocol((server.libp2p.getMultiaddrs())[0], '/ipfs/lan/kad/1.0.0')

repl.start('> ').on('exit', () => process.exit(0))
