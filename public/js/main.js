let user = null
let users = []
let turn = ''
let board = [];

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let value = params;

const username = value.Username
let roomcode = ''
if(value.Roomcode){
    roomcode = value.Roomcode
}else{
    roomcode = Math.random().toString(36).substring(2,10);
}

console.log(username)
console.log(roomcode)

const socket = io()

// var socket = io('http://localhost:3000/', [
//     {
//         transports: ['websocket']
//     }
// ]);

socket.emit('joinRoom', {username, roomcode})

socket.on('connect', function(){
    user = null
    board = []
    console.log('connected')
})

socket.on('full', ()=>{
    console.log("Room is full")
})

socket.on('setUser', function(data){
    user = data
    console.log(user)
    document.getElementById('piece').innerHTML = `Your piece ${user.symbol}`
})

socket.on('start', (data)=>{
    users = data.users;
    turn = data.turn;
    board = data.board;
    renderBoard()
    const opponent = users.find((player)=>user.id !== player.id)
    document.getElementById('opponent').innerHTML = `Game with ${opponent.name}`
})

socket.on('turn', (data)=>{
    turn = data
    if(user.symbol == turn){
        document.getElementById('turn').innerHTML = 'Your move'
    }
    else{
        document.getElementById('turn').innerHTML = 'Their move'
    }
    // console.log(`It's ${turn} turn`)
})

socket.on('move', (data)=>{
    board = data.board
    turn = data.turn
    renderBoard()
})

socket.on('winner', (data)=>{
    // console.log(`winner is ${data}`)
    let winnerName = 'Draw'
    users.find((user)=>{
        if(user.symbol === data){
            winnerName = user.name
        }
    })

    let modal = document.getElementById("myModal");
    let span = document.getElementsByClassName("close")[0];
    
    function Modal() {
        modal.style.display = "block";
        let winnerHtml = document.getElementById("winner");
        winnerHtml.innerHTML = `Winner is ${winnerName}`
    }
    
    Modal()

    span.onclick = function() {
      modal.style.display = "none";
    }
    
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
})

socket.on('disconnect', function(){
    console.log('disconnected')
})

window.onload = function(){
    renderBoard()
}

function renderBoard(){
    let boardDiv = document.getElementById("board");
    let boardHTML = "";
    for(let i=0; i<board.length; i++){
        boardHTML += `<div onclick="handleClick(${i})" class="col-4 box ${board[i]==='O' ? 'bg-red' : board[i]==='X' ? 'bg-green' : ''}">${board[i]}</div>`
    }
    boardDiv.innerHTML = boardHTML;
}

function handleClick(index){
    if(board[index]===''){
        if(turn === user.symbol){
            board[index] = user.symbol
            socket.emit('move', {
                board,
                turn,
                index: index
            })
        }
    }
}