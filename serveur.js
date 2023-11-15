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

let cases=[];
let terrain = {"roche":84,"prairie": 59,"eau":26};
let typeTerrain = ["roche","prairie","eau"];

// socket
io.on("connection",(socket)=>{
    socket.on("entree",(data)=>{
        joueurs.push(data);
        let max=3
        let x;
        while(terrain.eau>0 && terrain.prairie>0 && terrain.roche>0){
            x= Math.floor(Math.random()*max);
            if(terrain[typeTerrain[x]]==0){
                typeTerrain.pop
            }else{

            }
        }

    
        
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
