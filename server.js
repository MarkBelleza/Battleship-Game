const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

//Handle connection requests from client(s)
const connections = [null, null]


//On connection
wss.on('connection', function connection(ws) {

    //Find an available player number (only 2 players at a time) ---
    let playerIndex = -1
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i
            break
        }
    }

    //Tell the connecting client what player number they are
    const playerIndexMessage = JSON.stringify({
        event: 'player-number',
        payload: playerIndex
    });
    ws.send(playerIndexMessage);
    console.log('Player', playerIndex, "has connected")

    //Ignore 3rd player joining
    if (playerIndex === -1) return
    connections[playerIndex] = false

    //Broadcast to everyone connected who connected
    const playerConnection = JSON.stringify({
        event: 'player-connection',
        payload: playerIndex
    });
    wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(playerConnection);
        }
    });

    //Handle Disconnect
    ws.on('close', () => {
        console.log('Player', playerIndex, 'disconnected')
        connections[playerIndex] = null
        //Broadcast to everyone who disconnected
        const playerDisconnect = JSON.stringify({
            event: 'player-disconnect',
            payload: playerIndex
        });
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(playerDisconnect);
            }
        });
        console.log(connections)
    })

    //Handle messages recieved
    //Handle on Ready player
    ws.on('message', function message(data) {
        const mssg = JSON.parse(data)

        console.log(mssg.event)

        if (mssg.event === 'player-ready') {
            const playerReady = JSON.stringify({
                event: 'enemy-ready',
                payload: playerIndex
            });
            connections[playerIndex] = true

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(playerReady);
                }
            });
        }

        //Check status of other players connected
        if (mssg.event === 'check-players') {
            const players = []
            for (const i in connections) {
                connections[i] === null ? players.push({ connected: false, ready: false }) :
                    players.push({ connected: true, ready: connections[i] })
            }
            const playerStatus = JSON.stringify({
                event: 'check-players',
                payload: players
            });
            ws.send(playerStatus)
        }

        //Check for fired position recieved
        if (mssg.event === 'fire') {

            //Send the tile id to the other player
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    const playerMove = JSON.stringify({
                        event: 'fire',
                        payload: mssg.payload
                    });
                    client.send(playerMove)
                }
            });
        }


        //Check for fire reply from other player that was attcked
        if (mssg.event === 'fire-reply') {

            //Send the resulting classList of the tile that was bomed to the player who attacked it
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    const playerMoveFeedback = JSON.stringify({
                        event: 'fire-reply',
                        payload: mssg.payload
                    });
                    client.send(playerMoveFeedback)
                }
            });
        }
    });


    //------------------------------------------------------------------

});

app.use(express.static('public'));

const port = 3000;

//Start server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});