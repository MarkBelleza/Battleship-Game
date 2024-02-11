const shipsContainer = document.querySelector('.ships-container')
const flipBttn = document.querySelector('#flip-button')
const boardsContainer = document.querySelector('#boards-container')


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


//Flip button
let angle = 0
function flip() {
    const ships = Array.from(shipsContainer.children)
    angle = (angle === 0 ) ? 90 : 0; //To make sure can flip multiple times
    ships.forEach(ship => ship.style.transform = `rotate(${angle}deg)`)
}
flipBttn.addEventListener('click', flip)



//Create Ships Class
class Ship{
    constructor(name, length){
        this.name = name
        this.length = length
    }
}

const boat1 = new Ship('small-1', 1)
const boat2 = new Ship('small-2', 1)
const boat3 = new Ship('small-3', 1)
const ship1 = new Ship('medium-1', 2)
const ship2 = new Ship('medium-2', 2)
const submarine1 = new Ship('large-1', 3)
const submarine2 = new Ship('large-2', 3)
const navy = new Ship('destroyer', 4)

const ships = [boat1, boat2, boat3, 
    ship1, ship2, 
    submarine1, submarine2, 
    navy]

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

    let validPos
    //Make sure the ships are not being cut
    //Consider horizontal
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

ships.forEach(ship =>{
    addShipPiece(ship, 'computer')
})

// Drag ships in Player's board
let draggedShip
const playerShips = Array.from(shipsContainer.children)
const playerBoardTiles = document.querySelectorAll('#player div')

playerShips.forEach(ship => ship.addEventListener('dragstart', dragStart))
playerBoardTiles.forEach(tile =>{
    tile.addEventListener('dragover', dragOver)
    tile.addEventListener('drop', dropShip)
})

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


const startBttn = document.querySelector('#start-button')
const infoDisplay = document.querySelector('#info')
const turnDisplay = document.querySelector('#turn-display')
let playerHits = []
let computerHits = []
let gameOver = false
let playerTurn

function startGame(){
    if (shipsContainer.children.length != 0){
        infoDisplay.textContent = 'Drop down your battleships!!'
    } else{
       const compBoardTiles =  document.querySelectorAll('#computer div')
       compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
       infoDisplay.textContent = 'Begin!'
       turnDisplay.textContent = "Your turn!"
       startBttn.replaceWith(startBttn.cloneNode(true))
    }
}
startBttn.addEventListener('click', startGame)


function playerClick(e){
    if (!gameOver){
        if(e.target.classList.contains('missed') || e.target.classList.contains('hit')){
            infoDisplay.textContent = 'Invalid bomb placement! Try a different spot.'
            playerClick()
            return
        }
        else if (e.target.classList.contains('taken')){
            e.target.classList.add('hit')
            e.target.style.backgroundColor = 'black'
            infoDisplay.textContent = 'That is a hit!'

            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => className !== 'taken')
            classes = classes.filter(className => className !== 'hit')
            classes = classes.filter(className => className !== 'tile')
            playerHits.push(...classes)
            console.log(playerHits)

            playerClick()
            return
        }
        else if (!e.target.classList.contains('taken')){
            infoDisplay.textContent = 'You missed this time'
            e.target.classList.add('missed')
        }
        playerTurn = false
        const compBoardTiles = document.querySelectorAll('#computer div')
        compBoardTiles.forEach(tile => tile.replaceWith(tile.cloneNode(true))) //Remove event listener
        computerTurn()
    }
}


function computerTurn(){
    console.log("before")
    turnDisplay.textContent = "Computer's turn! Waiting..."

    if(!gameOver){
     
        setTimeout(()=>{
        let computerAttack = Math.floor(Math.random() * width * width)
        const playerBoardTiles = document.querySelectorAll('#player div')

        if(playerBoardTiles[computerAttack].classList.contains('hit') ||
            playerBoardTiles[computerAttack].classList.contains('missed')) 
        { //If computer hits an already hit tile then go again
            computerTurn()
            return

        }
        else if(playerBoardTiles[computerAttack].classList.contains('taken') &&
            !playerBoardTiles[computerAttack].classList.contains('hit'))
        { //If computer hits a battleship then add hit to the tile and go again
            playerBoardTiles[computerAttack].classList.add('hit')
            playerBoardTiles[computerAttack].style.backgroundColor = 'black'
            infoDisplay.textContent = 'Your ship has been hit!'

            let classes = Array.from(playerBoardTiles[computerAttack].classList)
            classes = classes.filter(className => className !== 'taken')
            classes = classes.filter(className => className !== 'hit')
            classes = classes.filter(className => className !== 'tile')
            computerHits.push(...classes)
            console.log(computerHits)

            computerTurn()
            return
    
        } 
        else if(!playerBoardTiles[computerAttack].classList.contains('taken')) {
            infoDisplay.textContent = 'The computer missed!'
            playerBoardTiles[computerAttack].classList.add('missed')
        }
        }, 1000)
        
        setTimeout(()=>{
            playerTurn = true
            turnDisplay.textContent = 'Your turn!'
            const compBoardTiles = document.querySelectorAll('#computer div')
            compBoardTiles.forEach(tile => tile.addEventListener('click', playerClick))
        }, 2000)
       
    }
}






