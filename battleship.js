const shipsContainer = document.querySelector('.ships-container')
const flipBttn = document.querySelector('#flip-button')
const boardsContainer = document.querySelector('#boards-container')


let angle = 0
function flip() {
    const ships = Array.from(shipsContainer.children)
    angle = (angle === 0 ) ? 90 : 0; //To make sure can flip multiple times
    ships.forEach(ship => ship.style.transform = `rotate(${angle}deg)`)
}

flipBttn.addEventListener('click', flip)

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



//Create Ships Class
class Ship{
    constructor(name, length){
        this.name = name
        this.length = length
    }
}

const boat1 = new Ship('small', 1)
const boat2 = new Ship('small', 1)
const boat3 = new Ship('small', 1)
const ship1 = new Ship('medium', 2)
const ship2 = new Ship('medium', 2)
const submarine1 = new Ship('large', 3)
const submarine2 = new Ship('large', 3)
const navy = new Ship('destroyer', 4)

const ships = [boat1, boat2, boat3, 
    ship1, ship2, 
    submarine1, submarine2, 
    navy]

let notDropped

//Computer adding its ships to the board randomly
function addShipPiece(user, ship, startId){
    const allBoardBlocks = document.querySelectorAll( '#' + user + ' div')

    let isHorizontal = user === 'player' ? angle === 0 : Math.random() < 0.5 //True or False, True for horizontal
    
    let randomStartIndex = Math.floor(Math.random() * width * width) //random # 0 - 99
    let startIndex = startId ? startId : randomStartIndex


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
        
    let shipBlocks = [] //The block(s) from a ship
    for(let i = 0; i < ship.length; i++){
        if (isHorizontal){
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i])
        } else{
            shipBlocks.push(allBoardBlocks[Number(validStartPoint) + i * width])
        }
    }

    let valid
    //Make sure the ships are not being cut
    //Consider horizontal
    if (isHorizontal){
        shipBlocks.every((shipBlock, index) => 
        valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)))
    } else {
        //Consider vertical
        shipBlocks.every((shipBlock, index) =>
        valid = shipBlocks[0].id < 90 + (width * index + 1))
    }

    //Make sure the ships do not overlap
    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))

    //Make sure adjacent blocks are not taken
    // if (isHorizontal){

    // } else{

    // }


    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock =>{
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
       if (user == 'computer') addShipPiece('computer', ship)
       if (user == 'player') notDropped = true
    }
}

ships.forEach(ship =>{
    addShipPiece('computer', ship)
})

// Drag ships in Player's board
let draggedShip
const playerShips = Array.from(shipsContainer.children)
const playerBoardBlocks = document.querySelectorAll('#player div')

playerShips.forEach(ship => ship.addEventListener('dragstart', dragStart))
playerBoardBlocks.forEach(tile =>{
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
    const startId = e.target.id
    const ship = ships[draggedShip.id]
    addShipPiece('player', ship, startId)
    if (!notDropped){
        draggedShip.remove()
    }
}
