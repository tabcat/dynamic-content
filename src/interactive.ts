import repl from 'repl'
await import('./index.js')

console.log(`
--- interactive example ---
`)

await connect(client1)
await connect(client2)

global.help = 
`
  Usage:
  
  globals

  help: this message
  
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
console.log(help)

repl.start('> ').on('exit', async () => {
  await Promise.all([
    client1.stop(),
    client2.stop(),
    server.stop()
  ])
  process.exit(0)
})
