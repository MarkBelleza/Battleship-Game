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

    // //listen for messages
    // ws.on('message', message => {
    //     console.log(message)
    //     if (message === 'player-ready') {
    //         wss.clients.forEach(function each(client) {
    //             if (client !== ws && client.readyState === WebSocket.OPEN) {
    //                 client.send('enemy-ready');
    //                 connections[playerIndex] = true
    //                 console.log(connections)
    //             }
    //         });
    //     }
    //     // ws.send('You sent -> ' + message); //send to client
    // });

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
            event: 'player-connection',
            payload: playerIndex
        });
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(playerDisconnect);
            }
        });
    })

    //Handle on Ready player
    ws.on('message', function message(data) {
        const mssg = JSON.parse(data)
        if (mssg.event === 'player-ready') {
            const playerReady = JSON.stringify({
                event: 'enemy-ready',
                payload: playerIndex
            });
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(playerReady);

                    connections[playerIndex] = true
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

    });

    //------------------------------------------------------------------

});

app.use(express.static('public'));

const port = 3000;

//Start server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});