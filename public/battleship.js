const shipsContainer = document.querySelector('.ships-container')
const flipBttn = document.querySelector('#flip-button')
const resetBttn = document.querySelector('#reset-button')
const boardsContainer = document.querySelector('#boards-container')
const startBttn = document.querySelector('#start-button')
const infoDisplay = document.querySelector('#info')
const turnDisplay = document.querySelector('#turn-display')
const bttnContainer = document.querySelector('#buttons-container')
const scoreBoard = document.querySelector('#score')
const playerShipsLeft = document.querySelector('#your-ships')
const enemyShipsLeft = document.querySelector('#enemy-ships')
const singlePlayerButton = document.querySelector('#single-player-button')
const multiplayerButton = document.querySelector('#multiplayer-button')
const players = document.querySelector('#players')

//Multiplayer related variables
let currentPlayer = 'user'
let gameMode = ''
let playerNum = 0
let ready = false
let enemyReady = false
let allShipsPlaced = false
let shotFired = -1

// Select mode to play
singlePlayerButton.addEventListener('click', startSinglePlayer)
multiplayerButton.addEventListener('click', startMultiPlayer)

//Create Ships Class
class Ship {
    constructor(name, length, alias) {
        this.name = name
        this.length = length
        this.alias = alias
    }
}

const boat1 = new Ship('small-1', 1, 'Cruiser')
const boat2 = new Ship('small-2', 1, 'Cruiser')
const boat3 = new Ship('small-3', 1, 'Cruiser')
const ship1 = new Ship('medium-1', 2, 'Submarine')
const ship2 = new Ship('medium-2', 2, 'Submarine')
const submarine1 = new Ship('large-1', 3, 'Battleship')
const submarine2 = new Ship('large-2', 3, 'Battleship')
const navy = new Ship('destroyer', 4, 'Destroyer')

const ships = [boat1, boat2, boat3,
    ship1, ship2,
    submarine1, submarine2,
    navy]

//Multi Player
function startMultiPlayer() {
    if (gameMode === '') {
        gameMode = 'multiplayer'

        // Create WebSocket connection.
        const socket = new WebSocket("ws://localhost:3000");

        //Get your player number
        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'player-number') {
                const num = data.payload;
                if (num === -1) {
                    infoDisplay.innerHTML = 'Server currently full, enjoy single player';
                    gameMode = ''
                    socket.close();
                    return
                } else {
                    playerNum = parseInt(num);
                    if (playerNum === 1) currentPlayer = "enemy";

                    infoDisplay.innerHTML = 'Joined server!';

                    //remove unnecessary buttons
                    singlePlayerButton.classList.add('invisible')
                    multiplayerButton.classList.add('invisible')


                    //Get other player status
                    const checkOtherUsers = JSON.stringify({
                        event: 'check-players',
                    });
                    socket.send(checkOtherUsers)
                }
            }

            //Notify everyone about another player connecting/disconnecting
            if (data.event === 'player-connection') {
                const num2 = data.payload;
                console.log('Annoucement: Player number', num2, 'has joined')
                playerJoinedDisc(num2)
            }

            //Notify evryone about player Ready status
            if (data.event === 'enemy-ready') {
                const num3 = data.payload
                console.log('Annoucement: Player number', num3, 'is READY')
                enemyReady = true
                playerReady(num3) //Update Ready visuals
                if (ready) startMultiPlayerGame(socket)
            }

            //Check player status
            if (data.event === 'check-players') {
                const status = data.payload
                status.forEach((p, i) => {
                    if (p.connected) playerJoinedDisc(i)
                    if (p.ready) {
                        playerReady(i)
                        if (i !== playerNum) enemyReady = true
                    }
                })
            }

            //On fire recieved (recieved by other player)
            if (data.event === 'fire') {
                const tileAttacked = document.querySelectorAll('#player div')[parseInt(data.payload)]
                const tileClasses = JSON.stringify({
                    event: 'fire-reply',
                    payload: tileAttacked.classList
                });

                enemyTurn(parseInt(data.payload)) //Update my board
                socket.send(tileClasses)
                startMultiPlayerGame(socket) //Switch turn
            }


            //On fire reply recieved (recieving classList) (update attacker's board)
            if (data.event === 'fire-reply') {
                userTurn(data.payload) //TODO: HANDLE UPDATING THE ATTACKER'S BOARD AFTER RECIEVING MSSG FROM  OTHER PLAYER
                startMultiPlayerGame(socket)
            }


            function playerJoinedDisc(num) {
                //get corresponding player-1/2 id in document
                let player = document.querySelector(`#player-${parseInt(num) + 1}`)
                player.querySelector('.connected span').classList.toggle('green')

                //if player that joined is us, then have indicator which baord we are
                if (parseInt(num) === playerNum) {
                    player.querySelector('.connected').style.fontWeight = 'bold'
                }
            }

        });
        //Ready button click
        startBttn.addEventListener('click', () => {
            if (allShipsPlaced) {
                startMultiPlayerGame(socket)
            }
            else {
                infoDisplay.innerHTML = "Drop down your battleships!!"
            }
        })



        let enemyBoard = document.querySelectorAll('#computer div')
        //Setup event listeners for firing (at the start of game)
        enemyBoard.forEach(tile => {
            tile.addEventListener('click', () => {
                if (currentPlayer === 'user' && ready && enemyReady) {
                    shotFired = parseInt(tile.id) //position of tile fired
                    const fired = JSON.stringify({
                        event: 'fire',
                        payload: tile.id
                    });
                    socket.send(fired) //Send position of where we fired at
                }
            })
        })
    }
}

//Logic for Multiplayer
function startMultiPlayerGame(socket) {
    if (!gameStart) {
        if (!ready) {
            //Broadcast to everyone this player is ready
            const readyUp = JSON.stringify({
                event: 'player-ready',
            });
            socket.send(readyUp) //Notify other player you are ready, they will update their client
            ready = true
            playerReady(playerNum) //Update Ready visuals
        }

        if (enemyReady) {
            if (currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Your Turn'
            }
            if (currentPlayer === 'enemy') {
                turnDisplay.innerHTML = 'Enemy Turn'
            }
            gameStart = true
        }
    }
}

//Single Player
function startSinglePlayer() {
    if (gameMode === '') {
        gameMode = 'singlePlayer'
        multiplayerButton.classList.add('invisible')
        singlePlayerButton.classList.add('invisible')

        infoDisplay.innerHTML = 'Single Player Mode'

        players.classList.add('invisible')
        ships.forEach(ship => {
            addShipPiece(ship, 'computer')
        })

        startBttn.addEventListener('click', startSinglePlayerGame)
    }
}

//Logic for Single Player
function startSinglePlayerGame() {
    if (!gameStart) {
        if (shipsContainer.children.length != 0) {
            infoDisplay.textContent = 'Drop down your battleships!!'
        } else {
            const compBoardTiles = document.querySelectorAll('#computer div')
            compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
            infoDisplay.textContent = 'Begin!'
            turnDisplay.textContent = "Your turn!"
            gameStart = true
        }
    }
}

//Create game board
const width = 10
function createBoard(user) {
    const board = document.createElement('div')
    board.classList.add('game-board')
    board.style.backgroundColor = 'grey'
    board.id = user

    //create the grid (100 tiles)
    for (let i = 0; i < 100; i++) {
        const tile = document.createElement('div')
        tile.classList.add('tile')
        tile.id = i
        board.append(tile)
    }

    boardsContainer.append(board)

}
createBoard('player')
createBoard('computer')


function createDraggableShips() {
    //Create ship elements
    for (let i = 0; i < ships.length; i++) {
        const ship = document.createElement('div')
        ship.classList.add(ships[i].name)
        ship.id = `${i}`
        ship.draggable = true
        if (i < 3) {
            ship.classList.add('small-preview')
        }
        else if (i < 5 && i > 2) {
            ship.classList.add('medium-preview')
        }
        else if (i < 7 && i > 4) {
            ship.classList.add('large-preview')
        }
        else {
            ship.classList.add('destroyer-preview')
        }
        shipsContainer.append(ship)
    }
    //Add event listeners to the ships to be draggable
    const playerShips = Array.from(shipsContainer.children)
    const playerBoardTiles = document.querySelectorAll('#player div')

    playerShips.forEach(ship => ship.addEventListener('dragstart', dragStart))
    playerBoardTiles.forEach(tile => {
        tile.addEventListener('dragover', dragOver)
        tile.addEventListener('drop', dropShip)
    })
}
createDraggableShips()


function dragStart(e) {
    notDropped = false
    draggedShip = e.target
}


function dragOver(e) {
    e.preventDefault()
}


function dropShip(e) {
    const startPoint = e.target.id
    const ship = ships[draggedShip.id]
    addShipPiece(ship, 'player', startPoint)
    if (!notDropped) {
        draggedShip.remove()
    }
    if (shipsContainer.children.length === 0) allShipsPlaced = true
}


//Flip button
let angle = 0
function flip() {
    const ships = Array.from(shipsContainer.children)
    angle = (angle === 0) ? 90 : 0; //To make sure can flip multiple times
    ships.forEach(ship => ship.style.transform = `rotate(${angle}deg)`)
}
flipBttn.addEventListener('click', flip)


let notDropped
//Adding Ships to both boards
function addShipPiece(ship, user, startPoint) {
    const allBoardBlocks = document.querySelectorAll('#' + user + ' div')

    let isHorizontal = user === 'player' ? angle === 0 : Math.random() < 0.5 //True or False, True for horizontal

    let randomStartIndex = Math.floor(Math.random() * width * width) //random # 0 - 99
    let startIndex = startPoint ? startPoint : randomStartIndex


    //Make sure the ships are within the board (does not pass the tile 99, in the board)
    //Consider horizontal
    let validStartPoint = isHorizontal ?
        startIndex <= width * width - ship.length ?
            startIndex :
            width * width - ship.length :
        //Consider vertical
        startIndex <= width * width - ship.length * width ?
            startIndex :
            startIndex - ship.length * width + width

    let shipBlocks = [] //The block(s)/tile(s) from a ship
    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i])
        } else {
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i * width])
        }
    }

    //Make sure the ships are not being cut
    //Consider horizontal
    let validPos
    if (isHorizontal) {
        shipBlocks.every((shipBlock, index) =>
            validPos = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)))
    } else {
        //Consider vertical
        shipBlocks.every((shipBlock, index) =>
            validPos = shipBlocks[0].id < 90 + (width * index + 1))
    }

    //Make sure the ships do not overlap
    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))


    if (validPos && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
        if (user == 'computer') addShipPiece(ship, 'computer')
        if (user == 'player') notDropped = true
    }
}



let gameStart = false
function resetBoard() {
    angle = 0
    const playerBoardTiles = document.querySelectorAll('#player div')
    if (!gameStart) { //If the game has not started yet, then reset the board
        playerBoardTiles.forEach(tile => {
            for (let i = 0; i < ships.length; i++) {
                if (tile.classList.contains(ships[i].name)) {
                    tile.classList.remove(ships[i].name)
                    tile.classList.remove('taken')
                }
            }
        })

        //Make sure no other ships are inside the ships container before adding new ships
        while (shipsContainer.firstChild) {
            shipsContainer.removeChild(shipsContainer.firstChild)
        }
        createDraggableShips()
    }
}
resetBttn.addEventListener('click', resetBoard)


let gameOver = false
let playerTurn

let playerHits = []
let computerHits = []

let playerDownedShips = [] //Ships the player has destroyed from the enemy's board
let computerDownedShips = [] //Ships the computer has destroyed from the player's board

let initialCountShipsPlayer = {
    'Cruiser': 3,
    'Submarine': 2,
    'Battleship': 2,
    'Destroyer': 1
}

let initialCountShipsComputer = {
    'Cruiser': 3,
    'Submarine': 2,
    'Battleship': 2,
    'Destroyer': 1
}

function displayScore(user) {
    if (user === 'player') {
        playerShipsLeft.textContent = `(${initialCountShipsPlayer['Cruiser']}) Cruiser  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Submarine']}) Submarine  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Battleship']}) Battleship  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Destroyer']}) Destroyer  `

    } else if (user === 'computer') {
        enemyShipsLeft.textContent = `(${initialCountShipsComputer['Cruiser']}) Cruiser  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Submarine']}) Submarine  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Battleship']}) Battleship  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Destroyer']}) Destroyer  `
    }
}
displayScore('player')
displayScore('computer')


function resetGame() {
    //Reset all related variables
    gameMode = ''
    angle = 0
    playerHits = []
    computerHits = []
    playerDownedShips = []
    computerDownedShips = []
    gridNumberIndex = Array.from(Array(100).keys())

    //Multiplater related variables
    currentPlayer = 'user'
    gameMode = ''
    playerNum = 0
    ready = false
    enemyReady = false
    allShipsPlaced = false
    shotFired = -1

    hitCountPlayer = 0
    missCountPlayer = 0

    hitCountComputer = 0
    missCountComputer = 0

    gameOver = false
    gameStart = false

    initialCountShipsPlayer = {
        'Cruiser': 3,
        'Submarine': 2,
        'Battleship': 2,
        'Destroyer': 1
    }

    initialCountShipsComputer = {
        'Cruiser': 3,
        'Submarine': 2,
        'Battleship': 2,
        'Destroyer': 1
    }

    //Delete and re create computer and player boards
    const computerBoard = boardsContainer.querySelector('#computer')
    const playerBoard = boardsContainer.querySelector('#player')
    boardsContainer.removeChild(computerBoard)
    boardsContainer.removeChild(playerBoard)
    createBoard('player')
    createBoard('computer')

    //Populate computer board with ships and provide player with draggable ships
    resetBoard()
    ships.forEach(ship => {
        addShipPiece(ship, 'computer')
    })

    //Delete the play again button
    const playBttn = document.querySelector('#replay-button')
    bttnContainer.removeChild(playBttn)

    turnDisplay.textContent = ""
    infoDisplay.textContent = ""

    //Reset score
    displayScore('player')
    displayScore('computer')
    computerBoardShipInvisible()
    displayHitMissStatus('player')
    displayHitMissStatus('computer')
    players.classList.remove('invisible')

    multiplayerButton.classList.remove('invisible')
    singlePlayerButton.classList.remove('invisible')
    scoreBoard.classList.remove('invisible')
    if (gameMode === 'multiplayer') socket.close();
    console.log('here')
}


function createPlayAgainBttn() {
    const playBttn = document.createElement('button')
    playBttn.id = 'replay-button'
    playBttn.textContent = 'PLAY AGAIN'
    bttnContainer.append(playBttn)

    playBttn.addEventListener('click', resetGame)
}


function winCondition(user) {
    if (gameOver) {
        if (user === 'player') {
            turnDisplay.textContent = "Game Over!!"
            infoDisplay.textContent = "You have won! :)"
        }
        else if (user === 'computer') {
            turnDisplay.textContent = "Game Over!!"
            infoDisplay.textContent = "The enemy have won! :("
        }

        createPlayAgainBttn()
    }
}


function idicateDownedShips(user) {
    if (user === 'player') {
        const compBoardTiles = document.querySelectorAll('#computer div')
        for (let i = 0; i < playerDownedShips.length; i++) {
            compBoardTiles.forEach(tile => {
                if (tile.classList.contains(playerDownedShips[i])) {
                    tile.style.backgroundColor = 'black'
                }
            })
        }
    }
    else if (user === 'computer') {
        const playerBoardTiles = document.querySelectorAll('#player div')
        for (let i = 0; i < computerDownedShips.length; i++) {
            playerBoardTiles.forEach(tile => {
                if (tile.classList.contains(computerDownedShips[i])) {
                    tile.style.backgroundColor = 'black'
                }
            })
        }
    }
}


function checkScoreCondition(userHits, user) {
    //Evaluate all the ships that have been downed
    ships.forEach(ship => {
        if (userHits.filter(shipHit => shipHit === ship.name).length === ship.length) {
            //remove the ship in the userHit array and add that ship to the downedShips array
            if (user === 'player') {
                infoDisplay.textContent = "You have downed the enemy's " + ship.alias
                initialCountShipsComputer[ship.alias] -= 1
                playerDownedShips.push(ship.name)
                playerHits = userHits.filter(shipHit => shipHit !== ship.name)
                gameOver = playerDownedShips.length === 8 ? true : false
            }
            else if (user === 'computer') {
                infoDisplay.textContent = "The enemy have downed your " + ship.alias
                initialCountShipsPlayer[ship.alias] -= 1
                computerDownedShips.push(ship.name)
                computerHits = userHits.filter(shipHit => shipHit !== ship.name)
                gameOver = computerDownedShips.length === 8 ? true : false
            }
        }
    })
    //Check condition for game over
    winCondition(user)
}

//Update Ready visuals
function playerReady(num) {
    //get corresponding player-1/2 id in document
    let player = players.querySelector(`#player-${parseInt(num) + 1}`)
    player.querySelector('.ready span').classList.toggle('green')

    //if player that joined is us, then have indicator which baord we are
    if (parseInt(num) === playerNum) {
        player.querySelector('.ready').style.fontWeight = 'bold'
    }
}

//Player's attacks counter
let hitCountPlayer = 0
let missCountPlayer = 0

//Computer's attack counter
let hitCountComputer = 0
let missCountComputer = 0

function displayHitMissStatus(user) {
    if (user === 'player') {
        const playerHitCount = document.querySelector('#player-hit')
        const playerMissCount = document.querySelector('#player-miss')

        playerHitCount.textContent = hitCountPlayer
        playerMissCount.textContent = missCountPlayer
    }
    else if (user === 'computer') {
        const computerHitCount = document.querySelector('#computer-hit')
        const computerMissCount = document.querySelector('#computer-miss')

        computerHitCount.textContent = hitCountComputer
        computerMissCount.textContent = missCountComputer
    }
}
const classToFilterOut = ['taken', 'hit', 'tile']

function userTurn(prividedClassList) {
    //Use provided classList to check for conditions
    const classListObj = Object.values(prividedClassList)

    //Get the tile that is was attacked by user in current client
    const computerBoard = document.querySelectorAll('#computer div')
    const enemyTile = computerBoard[shotFired]

    if (!gameOver && currentPlayer === 'user') {
        //If Player hits an already hit tile, then go again
        if (classListObj.includes('missed') || classListObj.includes('hit')) {
            infoDisplay.textContent = 'Invalid bomb placement! Try a different tile.'
            return
        }
        //If player hits a ship then add hit class to tile selected, check score and go again
        else if (classListObj.includes('taken')) {
            enemyTile.classList.add('hit')
            enemyTile.style.backgroundColor = 'red'
            infoDisplay.textContent = 'That is a hit! Go Again!'

            //Get the name of the ship hit
            let classes = Array.from(classListObj)
            classes = classes.filter(className => !classToFilterOut.includes(className))
            playerHits.push(...classes)
            enemyTile.classList.add(...classes) //Add the ship class of enemy's board to client side

            checkScoreCondition(playerHits, 'player')
            displayScore('computer') //Update enemy score accordingly
            hitCountPlayer += 1
            displayHitMissStatus('player')

            idicateDownedShips('player')
            return
        }
        //If player misses, keep track of selected tile
        else if (!classListObj.includes('taken')) {
            infoDisplay.textContent = 'You missed this time'
            enemyTile.classList.add('missed')
            enemyTile.style.backgroundColor = 'white'
            missCountPlayer += 1
            displayHitMissStatus('player') //Update computer score accordingly
        }
        playerTurn = false
        currentPlayer = 'enemy'
    }
}

//Handle Player's turn
function playerClick(e) {
    if (!gameOver) {
        //If Player hits an already hit tile, then go again
        if (e.target.classList.contains('missed') || e.target.classList.contains('hit')) {
            infoDisplay.textContent = 'Invalid bomb placement! Try a different tile.'
            playerClick()
            return
        }
        //If player hits a ship then add hit class to tile selected, check score and go again
        else if (e.target.classList.contains('taken')) {
            e.target.classList.add('hit')
            e.target.style.backgroundColor = 'red'
            infoDisplay.textContent = 'That is a hit! Go Again!'

            //Get the name of the ship hit
            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => !classToFilterOut.includes(className))
            playerHits.push(...classes)

            checkScoreCondition(playerHits, 'player')
            displayScore('computer') //Update computer score accordingly
            hitCountPlayer += 1
            displayHitMissStatus('player')

            idicateDownedShips('player')
            playerClick()
            return
        }
        //If player misses, keep track of selected tile
        else if (!e.target.classList.contains('taken')) {
            infoDisplay.textContent = 'You missed this time'
            e.target.classList.add('missed')
            e.target.style.backgroundColor = 'white'
            missCountPlayer += 1
            displayHitMissStatus('player') //Update computer score accordingly
        }
        playerTurn = false
        const compBoardTiles = document.querySelectorAll('#computer div')
        compBoardTiles.forEach(tile => tile.replaceWith(tile.cloneNode(true))) //Remove event listener
        computerTurn()
    }
}

function enemyTurn(computerAttack) {
    if (!gameOver) {
        const playerBoardTiles = document.querySelectorAll('#player div')

        //If enemy hits a battleship then add hit class to tile, check score and go again
        if (playerBoardTiles[computerAttack].classList.contains('taken') &&
            !playerBoardTiles[computerAttack].classList.contains('hit')) {
            playerBoardTiles[computerAttack].classList.add('hit')
            playerBoardTiles[computerAttack].style.backgroundColor = 'red'
            infoDisplay.textContent = 'Your ship has been hit!'

            //Get the name of the ship hit
            let classes = Array.from(playerBoardTiles[computerAttack].classList)
            classes = classes.filter(className => !classToFilterOut.includes(className))
            computerHits.push(...classes)

            checkScoreCondition(computerHits, 'computer')
            displayScore('player') //Update player score accordingly
            hitCountComputer += 1
            displayHitMissStatus('computer')

            idicateDownedShips('computer')
            return

        }
        //if computer misses keep track of tile selected
        else if (!playerBoardTiles[computerAttack].classList.contains('taken')) {
            infoDisplay.textContent = 'The enemy missed! Your turn!'
            playerBoardTiles[computerAttack].classList.add('missed')
            missCountComputer += 1
            displayHitMissStatus('computer') //Update player score accordingly
        }



        playerTurn = true
        turnDisplay.textContent = ''
        currentPlayer = 'user'
    }
}

//Handle Computer's turn
let gridNumberIndex = Array.from(Array(100).keys())
function computerTurn() {
    turnDisplay.textContent = "Computer's turn! Waiting..."
    if (!gameOver) {
        setTimeout(() => {
            let randomIndex = Math.floor(Math.random() * gridNumberIndex.length)
            let computerAttack = gridNumberIndex[randomIndex]
            const playerBoardTiles = document.querySelectorAll('#player div')

            //If computer hits a battleship then add hit class to tile, check score and go again
            if (playerBoardTiles[computerAttack].classList.contains('taken') &&
                !playerBoardTiles[computerAttack].classList.contains('hit')) {
                playerBoardTiles[computerAttack].classList.add('hit')
                playerBoardTiles[computerAttack].style.backgroundColor = 'red'
                infoDisplay.textContent = 'Your ship has been hit!'

                //Get the name of the ship hit
                let classes = Array.from(playerBoardTiles[computerAttack].classList)
                classes = classes.filter(className => !classToFilterOut.includes(className))
                computerHits.push(...classes)

                checkScoreCondition(computerHits, 'computer')
                displayScore('player') //Update player score accordingly
                hitCountComputer += 1
                displayHitMissStatus('computer')

                idicateDownedShips('computer')
                gridNumberIndex = gridNumberIndex.filter(tile => tile !== computerAttack)
                computerTurn()
                return

            }
            //if computer misses keep track of tile selected
            else if (!playerBoardTiles[computerAttack].classList.contains('taken')) {
                infoDisplay.textContent = 'The computer missed!'
                playerBoardTiles[computerAttack].classList.add('missed')
                gridNumberIndex = gridNumberIndex.filter(tile => tile !== computerAttack)
                missCountComputer += 1
                displayHitMissStatus('computer') //Update player score accordingly
            }
        }, 1000)

        setTimeout(() => {
            playerTurn = true
            turnDisplay.textContent = ''
            const compBoardTiles = document.querySelectorAll('#computer div')
            compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
        }, 1500)
    }
}


function computerBoardShipInvisible() {
    const computerBoard = document.querySelectorAll('#computer div')
    computerBoard.forEach(tile => tile.style.backgroundColor = 'grey')
}
computerBoardShipInvisible()





