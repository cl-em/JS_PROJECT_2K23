const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io =  require("socket.io")(server); // bun
// const io = new require("socket.io")(serveur); // node.js

// declare toutes tes variables avec 'let' stp 
// 'var' c'est pareil mais en moins bien


// app get
server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888');
});

app.get('/', (request, response) => {
    // console.log("test");
    response.sendFile('index.html', {root: __dirname});
});

app.get("/socket", (request,response)=>{
    response.sendFile("./socket.js",{root:__dirname});
});

app.get("/hex",(request,response)=>{
    response.sendFile("./hex.js",{root:__dirname});
})

app.get("/css",(request,response)=>{
    response.sendFile("./style.css",{root:__dirname});
});

let joueurs=[];
let messages =[];
let  carreclick= [];

// socket
io.on("connection",(socket)=>{
    socket.on("entree",(data)=>{
        console.log(data.name);
    });

    // hex
    socket.on("auchargement",()=>{
        socket.emit("auchargement",carreclick);
    });
    
    socket.on("oncarre",data=>{
        carreclick.push(data);
        io.emit("oncarre",data);
    })

    // message
    socket.on("message",(data)=>{
        // messages.push(data);
        console.log(data.text);
        
        io.emit("message",data);
    })



});
