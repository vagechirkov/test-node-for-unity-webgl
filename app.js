const WebSocket = require('ws')
const express = require('express');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

// create new websocket server
const wss = new WebSocket.Server({ server })

// empty object to store all players
var players = {}

// add general WebSocket error handler
wss.on('error', function error (error) {
  console.error('WebSocket error', error)
})

// on new client connect
wss.on('connection', function connection (client) {
  console.log('new client connected')
  // on new message recieved
  client.on('message', function incoming (data) {
    // get data from string
    var [udid, x, y, z] = data.toString().split('\t')
    // store data to players object
    players[udid] = {
      position: {
        x: parseFloat(x),
        y: parseFloat(y) + 1,
        z: parseFloat(z)
      },
      timestamp: Date.now()
    }
    // save player udid to the client
    client.udid = udid
  })
})

function broadcastUpdate () {
  // broadcast messages to all clients
  wss.clients.forEach(function each (client) {
    // filter disconnected clients
    if (client.readyState !== WebSocket.OPEN) return
    // filter out current player by client.udid
    var otherPlayers = Object.keys(players).filter(udid => udid !== client.udid)
    // create array from the rest
    var otherPlayersPositions = otherPlayers.map(udid => players[udid])
    // send it
    client.send(JSON.stringify({players: otherPlayersPositions}))

    // print info in the console
    // console.log(`${client.udid} - ${otherPlayers.length} players`)
    // console.log(otherPlayersPositions)
  })
}

// call broadcastUpdate every 0.03s
setInterval(broadcastUpdate, 30)
