import repl from 'repl'
await import('./index.js')

console.log('--- interactive example ---')

await Promise.all([
  client1.start(),
  client2.start(),
  server.start()
])

// random timeout, nice
// clients fail to dial without this
await new Promise(resolve => setTimeout(resolve, 1000))

await connect(client1)
console.log('client1: online')
await connect(client2)
console.log('client2: online')

console.log(
`
  Usage:
  
  globals
  
  client1: helia client node (sender)
  client2: helia client node (receiver)
  server: helia ipld/ipns pinner and dht server
  
  // compare the 2 clients sets
  set1: client1's set variable
  set2: client2's set variable
  
  await connect(<client>)       // connects client to server
  await disconnect(<client>)    // disconnects client from server
  
  await update(...<string[]>)   // create and publish changes from client1 - requires client1 to be connected
  await sync()                  // syncs changes to client2 - requires client2 to be connected
`
)

repl.start('> ').on('exit', async () => {
  console.log('stopping helia nodes')
  await Promise.all([
    client1.stop(),
    client2.stop(),
    server.stop()
  ])
  process.exit(0)
})
