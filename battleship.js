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

//Create Ships Class
class Ship{
    constructor(name, length, alias){
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

//Create game board
const width = 10
function createBoard(user){
    const board = document.createElement('div')
    board.classList.add('game-board')
    board.style.backgroundColor = 'grey'
    board.id = user


    //create the grid (100 tiles)
    for(let i = 0; i < 100; i++) {
        const tile = document.createElement('div')
        tile.classList.add('tile')
        tile.id = i
        board.append(tile)
    } 

    boardsContainer.append(board)

}
createBoard('player')
createBoard('computer')

function createDraggableShips(){
    //Create ship elements
    for(let i = 0; i < ships.length; i++){
        const ship = document.createElement('div')
        ship.classList.add(ships[i].name)
        ship.id = `${i}`
        ship.draggable = true
        if(i < 3){
            ship.classList.add('small-preview')
        }
        else if (i < 5 && i > 2){
            ship.classList.add('medium-preview')
        }
        else if (i < 7 && i > 4){
            ship.classList.add('large-preview')
        }
        else{
            ship.classList.add('destroyer-preview')
        }
        shipsContainer.append(ship)
    }
    //Add event listeners to the ships to be draggable
    const playerShips = Array.from(shipsContainer.children)
    const playerBoardTiles = document.querySelectorAll('#player div')

    playerShips.forEach(ship => ship.addEventListener('dragstart', dragStart))
    playerBoardTiles.forEach(tile =>{
    tile.addEventListener('dragover', dragOver)
    tile.addEventListener('drop', dropShip)
})
}
createDraggableShips()

function dragStart(e){
    notDropped = false
    draggedShip = e.target
}

function dragOver(e){
    e.preventDefault()
}

function dropShip(e){
    const startPoint = e.target.id
    const ship = ships[draggedShip.id]
    addShipPiece(ship, 'player', startPoint)
    if (!notDropped){
        draggedShip.remove()
    }
}

//Flip button
let angle = 0
function flip() {
    const ships = Array.from(shipsContainer.children)
    angle = (angle === 0 ) ? 90 : 0; //To make sure can flip multiple times
    ships.forEach(ship => ship.style.transform = `rotate(${angle}deg)`)
}
flipBttn.addEventListener('click', flip)


let notDropped
//Adding Ships to both boards
function addShipPiece(ship, user, startPoint){
    const allBoardBlocks = document.querySelectorAll( '#' + user + ' div')

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
        startIndex:
        startIndex - ship.length * width + width
        
    let shipBlocks = [] //The block(s)/tile(s) from a ship
    for(let i = 0; i < ship.length; i++){
        if (isHorizontal){
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i])
        } else{
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i * width])
        }
    }

    //Make sure the ships are not being cut
    //Consider horizontal
    let validPos
    if (isHorizontal){
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
        shipBlocks.forEach(shipBlock =>{
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
       if (user == 'computer') addShipPiece(ship, 'computer')
       if (user == 'player') notDropped = true
    }
}
//Initialize the ships in the computer board on the first visit of the web page
ships.forEach(ship =>{
    addShipPiece(ship, 'computer')
})


let gameStart = false
function resetBoard(){
    angle = 0
    const playerBoardTiles = document.querySelectorAll('#player div')
    if(!gameStart){ //If the game has not started yet, then reset the board
        playerBoardTiles.forEach(tile => {
            for(let i = 0; i < ships.length; i++){
                if(tile.classList.contains(ships[i].name)){
                    tile.classList.remove(ships[i].name)
                    tile.classList.remove('taken')
                }
            }
        })

        //Make sure no other ships are inside the ships container before adding new ships
        while(shipsContainer.firstChild){
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
    'Cruiser' : 3,
    'Submarine' : 2,
    'Battleship' : 2,
    'Destroyer' : 1
}

let initialCountShipsComputer = {
    'Cruiser' : 3,
    'Submarine' : 2,
    'Battleship' : 2,
    'Destroyer' : 1
}
function displayScore(user){
    if(user === 'player'){
        playerShipsLeft.textContent = `(${initialCountShipsPlayer['Cruiser']}) Cruiser  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Submarine']}) Submarine  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Battleship']}) Battleship  `
        playerShipsLeft.textContent += `(${initialCountShipsPlayer['Destroyer']}) Destroyer  `

    }else if(user === 'computer'){
        enemyShipsLeft.textContent = `(${initialCountShipsComputer['Cruiser']}) Cruiser  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Submarine']}) Submarine  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Battleship']}) Battleship  `
        enemyShipsLeft.textContent += `(${initialCountShipsComputer['Destroyer']}) Destroyer  `
    }
}
displayScore('player')
displayScore('computer')

function resetGame(){
    angle = 0
    playerHits = []
    computerHits = []
    playerDownedShips = []
    computerDownedShips = []

    gameOver = false
    gameStart = false

    initialCountShipsPlayer = {
        'Cruiser' : 3,
        'Submarine' : 2,
        'Battleship' : 2,
        'Destroyer' : 1
    }
    

    initialCountShipsComputer = {
        'Cruiser' : 3,
        'Submarine' : 2,
        'Battleship' : 2,
        'Destroyer' : 1
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
    ships.forEach(ship =>{
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
}

function createPlayAgainBttn(){
    const playBttn = document.createElement('button')
    playBttn.id = 'replay-button'
    playBttn.textContent = 'PLAY AGAIN'
    bttnContainer.append(playBttn)

    playBttn.addEventListener('click', resetGame)
}

function winCondition(user){
    if(gameOver){
        if (user === 'player'){
            turnDisplay.textContent = "Game Over!!"
            infoDisplay.textContent = "You have won! :)"
        }
        else if (user === 'computer'){
            turnDisplay.textContent = "Game Over!!"
            infoDisplay.textContent = "The enemy have won! :("
        }
    
        createPlayAgainBttn()
    }
}

function idicateDownedShips(user){
    if(user === 'player'){
        const compBoardTiles = document.querySelectorAll('#computer div')
        for(let i = 0; i < playerDownedShips.length; i++){
            compBoardTiles.forEach(tile => {
                if(tile.classList.contains(playerDownedShips[i])){
                    tile.style.backgroundColor = 'black'
                }
            })
        }
    }
    else if(user === 'computer'){
        const playerBoardTiles = document.querySelectorAll('#player div')
        for(let i = 0; i < computerDownedShips.length; i++){
            playerBoardTiles.forEach(tile => {
                if(tile.classList.contains(computerDownedShips[i])){
                    tile.style.backgroundColor = 'black'
                }
            })
        }
    }
}

function checkScoreCondition(userHits, user){
    //Evaluate all the ships that have been downed
    ships.forEach(ship =>{
        if(userHits.filter(shipHit => shipHit === ship.name).length === ship.length){
            //remove the ship in the userHit array and add that ship to the downedShips array
            if (user === 'player'){
                infoDisplay.textContent = "You have downed the enemy's " + ship.alias
                initialCountShipsComputer[ship.alias] -= 1
                playerDownedShips.push(ship.name)
                playerHits = userHits.filter(shipHit => shipHit !== ship.name)
                gameOver = playerDownedShips.length === 8 ? true : false
            }
            else if (user === 'computer'){
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

function startGame(){
    if(!gameStart){
        if (shipsContainer.children.length != 0){
            infoDisplay.textContent = 'Drop down your battleships!!'
        } else{
            console.log('here')
            const compBoardTiles =  document.querySelectorAll('#computer div')
            compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
            infoDisplay.textContent = 'Begin!'
            turnDisplay.textContent = "Your turn!"
            gameStart = true
        }
    }
}
startBttn.addEventListener('click', startGame)


const classToFilterOut = ['taken', 'hit', 'tile']
//Handle Player's turn
function playerClick(e){
    if (!gameOver){
        //If Player hits an already hit tile, then go again
        if(e.target.classList.contains('missed') || e.target.classList.contains('hit')){
            infoDisplay.textContent = 'Invalid bomb placement! Try a different tile.'
            playerClick()
            return
        }
        //If player hits a ship then add hit class to tile selected, check score and go again
        else if (e.target.classList.contains('taken')){
            e.target.classList.add('hit')
            e.target.style.backgroundColor = 'red'
            infoDisplay.textContent = 'That is a hit!'

            //Get the name of the ship hit
            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => !classToFilterOut.includes(className))
            playerHits.push(...classes)

            checkScoreCondition(playerHits, 'player')
            displayScore('computer') //Update computer score accordingly

            idicateDownedShips('player')
            playerClick()
            return
        }
        //If player misses, keep track of selected tile
        else if (!e.target.classList.contains('taken')){
            infoDisplay.textContent = 'You missed this time'
            e.target.classList.add('missed')
            e.target.style.backgroundColor = 'white'
        }
        playerTurn = false
        const compBoardTiles = document.querySelectorAll('#computer div')
        compBoardTiles.forEach(tile => tile.replaceWith(tile.cloneNode(true))) //Remove event listener
        computerTurn()
    }
}


//Handle Computer's turn
function computerTurn(){
    turnDisplay.textContent = "Computer's turn! Waiting..."
    if(!gameOver){
        setTimeout(()=>{
        let computerAttack = Math.floor(Math.random() * width * width)
        const playerBoardTiles = document.querySelectorAll('#player div')

        //If computer hits an already hit tile then go again
        if(playerBoardTiles[computerAttack].classList.contains('hit') ||
            playerBoardTiles[computerAttack].classList.contains('missed')) 
        { 
            computerTurn()
            return

        }
        //If computer hits a battleship then add hit class to tile, check score and go again
        else if(playerBoardTiles[computerAttack].classList.contains('taken') &&
            !playerBoardTiles[computerAttack].classList.contains('hit'))
        { 
            playerBoardTiles[computerAttack].classList.add('hit')
            playerBoardTiles[computerAttack].style.backgroundColor = 'red'
            infoDisplay.textContent = 'Your ship has been hit!'

            //Get the name of the ship hit
            let classes = Array.from(playerBoardTiles[computerAttack].classList)
            classes = classes.filter(className => !classToFilterOut.includes(className))
            computerHits.push(...classes)

            checkScoreCondition(computerHits, 'computer')
            displayScore('player') //Update player score accordingly

            idicateDownedShips('computer')
            computerTurn()
            return
    
        } 
        //if computer misses keep track of tile selected
        else if(!playerBoardTiles[computerAttack].classList.contains('taken')) {
            infoDisplay.textContent = 'The computer missed!'
            playerBoardTiles[computerAttack].classList.add('missed')
        }
        }, 1000)
        
       setTimeout(()=>{
            playerTurn = true
            turnDisplay.textContent = ''
            const compBoardTiles = document.querySelectorAll('#computer div')
            compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
       }, 1500)
       
    }
}


function computerBoardShipInvisible(){
    const computerBoard = document.querySelectorAll('#computer div')
    computerBoard.forEach(tile =>tile.style.backgroundColor = 'grey')
}

computerBoardShipInvisible()





