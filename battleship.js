const optionContainer = document.querySelector('.ships-container')
const flipBttn = document.querySelector('#flip-button')
const boardsContainer = document.querySelector('#boards-container')


let angle = 0
function flip() {
    const ships = Array.from(optionContainer.children)
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



//Computer adding its ships to the board randomly
function addShipPiece(ship){
    const allBoardBlocks = document.querySelectorAll('#computer div')
    let randomBool = Math.random() < 0.5
    let isHorizontal = randomBool
    let randomStartIndex = Math.floor(Math.random() * width * width) //random # 0 - 99

    let shipBlocks = []
    for(let i = 0; i < ship.length; i++){
        if (isHorizontal){
            shipBlocks.push(allBoardBlocks[Number(randomStartIndex) + i])
        } else{
            shipBlocks.push(allBoardBlocks[Number(randomStartIndex) + i * width])
        }
    }

    shipBlocks.forEach(shipBlock =>{
        shipBlock.classList.add(ship.name)
        shipBlock.classList.add('taken')
    })
}

ships.forEach(ship =>{
    addShipPiece(ship)
})
