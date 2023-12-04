const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
// const io =  require("socket.io")(server); // bun
const io = new require("socket.io")(server); // node.js

class Animal{
    constructor(p){
        this.sexe=false; //est ce vraiment necessaire
        this.position=p;
        this.stats={eau:10,faim:10};
    }

    enVie(){
        return !(this.stats.eau==0 || this.stats.faim==10)
    }   
}

let a = new Animal();

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
"animaux.js",
"style.css"];

app.get("/:nomFichier",(request,response)=>{
    let file = request.params.nomFichier;
    if(fileList.includes(file)){
        response.sendFile(file,{root:__dirname});
    }
});

let joueurs=[];
// liste d'objet de type {name,repro,precep,force}

let cases=[];

let terrain = {"roche":84,"prairie": 59,"eau":26};
let typeTerrain = ["roche","prairie","eau"];

// socket
io.on("connection",(socket)=>{
    socket.on("auchargement",()=>{
        if(cases.length!=0){
            socket.emit("entree",cases,joueurs);
        }
    });

    socket.on("entree",(data)=>{
        joueurs.push(data);

        let listec = [];
        for(let i=0; i<=168; i++){
            listec.push(i);
        }

        function listecElemRndm(){
            if (listec.length > 0){
                let rndm = Math.floor(Math.random() * listec.length);
                let elem = listec[rndm];
                listec.splice(rndm, 1);
                return elem;
            } 
        }

        if(cases.length==0){

            let max = typeTerrain.length;
            let rndmTerrain;

            while(terrain.eau>0 || terrain.prairie>0 || terrain.roche>0){
                x= Math.floor(Math.random()*max);
                if(terrain[typeTerrain[x]]==0){
                    typeTerrain.splice(typeTerrain.indexOf(typeTerrain[x]),1);
                    --max;
                }
                else{
                    c = listecElemRndm();
                    cases.push(["h"+c,typeTerrain[x]]);
                    terrain[typeTerrain[x]]=terrain[typeTerrain[x]]-1;
                }
            }
        }

        socket.emit("entree",cases);
        io.emit("getJoueurs",joueurs);
    });
    
    // message 
    socket.on("message",(data)=>{
        // messages.push(data);
        console.log(data.text);
        
        io.emit("message",data);
    });

    let animaux = {};
    let position = [0,12,156,168];

    async function commencerJeu (){
        joueurs.forEach((value,index)=>{
            animaux[value.name]=[];
            for(let i=0;i<10;++i){
                animaux[value.name].push(new Animal(position[index]));
            }
        });
        io.emit("commencerJeu",animaux);

        //deroulement du jeu
        for(let i=0;i<10;++i){
            jouerTour();
            await sleep(500);
        }
    }
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    const jouerTour = () =>{
        let choix;
        joueurs.forEach((value,index)=>{
            animaux[value.name].forEach((animal)=>{
                choix= Math.floor(Math.random()*7)+1;
                
                switch(choix){
                    case 2 : 
                        animal.position+=-13-1;
                    case 3 : 
                        animal.position+=-13;
                    case 4: 
                        animal.position+=-1;
                    case 5: 
                        animal.position+=1;
                    case 6: 
                        animal.position+=13-1;
                    case 7 :
                        animal.position +=13;
                    default:
                        // verifie si l'animal est bien dans le plateau 
                        // soustraction des attribut en fonction du mouvement
                        if(choix!=0 && animal.position>=0 && animal.position<=168 && animal.position%13!=0 && animal.position%13!=12){
                            animal.stats.eau-=1;
                            animal.stats.faim-=0.50;
                        }else{
                            animal.stats.eau-=0.5;
                            animal.stats.faim-=0.25;

                            // replace l'animal dans le damier
                            if(animal.position<0)
                                animal.position=0;
                            else if(animal.position>168) animal.position=168;
                        
                        }
                }
            });
        });

        io.emit("jouerTour",animaux);
    }

    socket.on("commencerJeu",commencerJeu);

});