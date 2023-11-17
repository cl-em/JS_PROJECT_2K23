const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io =  require("socket.io")(server); // bun
// const io = new require("socket.io")(server); // node.js

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

let fileList = ["hex.js",
"index.html",
"lol.png",
"socket.js",
"style.css"];

app.get("/:nomFichier",(request,response)=>{
    let file = request.params.nomFichier;
    if(fileList.includes(file)){
        response.sendFile(file,{root:__dirname});
    }
});

let joueurs=[];

let cases=[];

let terrain = {"roche":84,"prairie": 59,"eau":26};
let typeTerrain = ["roche","prairie","eau"];

// socket
io.on("connection",(socket)=>{

    socket.on("auchargement",()=>{
        if(cases.length!=0){
            socket.emit("entree",cases);
        }
    });

    socket.on("entree",(data)=>{
        joueurs.push(data);
        console.log(data);
        if(cases.length==0){
            let max=typeTerrain.length;
            let x;
            let id=0;
            while(terrain.eau>0 || terrain.prairie>0 || terrain.roche>0){
                x= Math.floor(Math.random()*max);
                if(terrain[typeTerrain[x]]==0){
                    typeTerrain.splice(typeTerrain.indexOf(typeTerrain[x]),1);
                    --max;
                }else{
                    cases.push(["h"+id,typeTerrain[x]]);
                    terrain[typeTerrain[x]]=terrain[typeTerrain[x]]-1;
                    ++id;
                }
            }
            socket.emit("entree",cases);
        }else{
            console.log("bah ca marche pas");
        }
    });
    
    // message 
    socket.on("message",(data)=>{
        // messages.push(data);
        console.log(data.text);
        
        io.emit("message",data);
    })



});
