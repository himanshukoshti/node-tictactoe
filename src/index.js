const path = require('path')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
// const { Server } = require("socket.io");
const socketio = require('socket.io')

app.use(cors());

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

const io = socketio(server)

// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:3000"
//     }
// });

const PORT = process.env.PORT || 3000;

let users = []
let turn = 'X'
let board = ["","","","","","","","",""]

io.on('connection', (socket) => {
    console.log("A user connected")

    socket.on('joinRoom', ({username, roomcode}, callback)=>{
        let usersCount = 0
        users.forEach((user)=>{
          if(user.roomCode == roomcode){
            usersCount+=1
          }
        })
      
        if(usersCount === 2){
          socket.emit('full');
          return
        }
    
        if(usersCount === 0){
          turn = 'X'
          board = ["","","","","","","","",""]
        }

        // add user to users array
        let user = {
          id: socket.id,
          name: username,
          symbol: usersCount === 0 ? 'X' : usersCount === 1 ? 'O' : '',
          number: (users.length+1),
          roomCode: roomcode
        }

        socket.join(user.roomCode)

        console.log(user)

        if(usersCount < 2){
          users.push(user)
          usersCount+=1
        }
        socket.emit("setUser", user)

        if(usersCount === 2){
          io.emit('start', {
            users: users,
            turn: turn,
            board: board
          })
          socket.emit('turn', turn)
          io.sockets.emit('turn', turn)
        }

        socket.on('move', (data)=>{
          board = data.board
          turn = data.turn
          io.emit('move', {
              board,
              turn,
              i: data.i
          })
          turn = turn === 'X' ? 'O' : 'X'
          io.sockets.emit('turn', turn)
    
          // checking for the winner or game over
          let draw = false
          let winner = ''
          
          const checkRow = () => {
            let ans = false;
            for (let i = 0; i < 9; i += 3) {
              ans |= (board[i] === board[i + 1] &&
              board[i] === board[i + 2] &&
              board[i] !== '')
            }
            return ans;
          }
    
          // Checks for the win condition in cols
          const checkCol = () => {
            let ans = false;
            for (let i = 0; i < 3; i++) {
              ans |= (board[i] === board[i + 3] &&
              board[i] === board[i + 6] &&
              board[i] !== '')
            }
            return ans;
          }
    
          // Checks for the win condition in diagonals
          const checkDiagonal = () => {
            return ((board[0] === board[4] &&
            board[0] === board[8] && board[0] !== '') ||
            (board[2] === board[4] && board[2] === board[6] &&
            board[2] !== ''));
          }
    
          // Checks if at all a win condition is present
          const checkWin = () => {
            return (checkRow() || checkCol() || checkDiagonal());
          }
    
          // Checks for a tie
          const checkTie = () => {
            let count = 0;
            board.forEach((cell) => {
              if (cell !== '') {
                count++;
              }
            })
            return count === 9;
          }
    
          // Setting the winner in case of a win
          if (checkWin()) {
            winner = (turn === 'O' ? "X" : "O");
          } else if (checkTie()) {
            // Setting the winner to tie in case of a tie
            draw = true 
          }
    
          if(winner !== ''){
            io.emit('winner', winner)
          }
    
          if(draw){
            io.emit('winner', 'Draw')
          }
        })
    })

    socket.on('disconnect', ()=>{
      users = users.filter((user)=>user.id !== socket.id)
    })
});

server.listen(PORT, () => {
  console.log('listening on http://localhost:'+PORT+'/');
});

