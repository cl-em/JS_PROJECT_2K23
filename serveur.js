const express = require('express');
const app = express();
const http = require('http');
const { type } = require('os');
const server = http.createServer(app);
const io =  require("socket.io")(server); // bun
// const io = new require("socket.io")(server); // node.js

class Animal{
    constructor(p){
        this.sexe=false;
        this.position=p;
        this.stats={eau:10,faim:10};
    }

    enVie(){
        return !(this.stats.eau<=0 || this.stats.faim<=0)
    }   
}

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
let hote;
let nbJmax=1;
let listeCouleurs=["red","purple","yellow","blue"];
// liste d'objet de type {name,repro,precep,force,couleur}

let cases=[];

let terrain = {"roche":84,"prairie": 59,"eau":26};
let typeTerrain = ["roche","prairie","eau","taniere"];

// position tanieres
let positionTanieres = [6,77,88,159];

// socket
io.on("connection",(socket)=>{
    socket.on("auchargement",()=>{
        if(cases.length!=0){
            socket.emit("entree",cases,joueurs);
        }
    });
    socket.on("nbJoueurs",(nombre,nomJ)=>{
        if(nomJ==hote.name)
            nbJmax=nombre;

    });

    socket.on("entree",(data)=>{
        if(nbJmax<=joueurs.length){
            socket.emit("msgserv","trop de joueurs");
            return ;
        }
        data["couleur"]=listeCouleurs[joueurs.length];
        joueurs.push(data);

        if(hote==null){
            hote=data;
        }
        

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

            let max = typeTerrain.length-1;
            let rndmTerrain;
            // typeTerrain.splice(typeTerrain.indexOf("taniere"), 1);

            while(terrain.eau>0 || terrain.prairie>0 || terrain.roche>0){
                x= Math.floor(Math.random()*max);
                if(terrain[typeTerrain[x]]==0){
                    typeTerrain.splice(typeTerrain.indexOf(typeTerrain[x]),1);
                    --max;
                }
                else{
                    c = listecElemRndm();
                    // cases.push(["h"+c,typeTerrain[x]]);
                    cases[c]=typeTerrain[x];
                    terrain[typeTerrain[x]]=terrain[typeTerrain[x]]-1;
                }
            }
            // listec.splice(6, 1);
            // listec.splice(77,1);
            // listec.splice(88, 1);
            // listec.splice(159,1);

            cases[6]="taniere";
            cases[78]="taniere";
            cases[90]="taniere";
            cases[162]="taniere";
        }

        socket.emit("entree",cases);
        io.emit("getJoueurs",joueurs);
    });


    socket.on("sortie",nomASupprimer=>{
        let newJoueurs=[];
        joueurs.forEach(joueur=>{
            if(joueur.name!=nomASupprimer)
                newJoueurs.push(joueur);
        });
        joueurs=newJoueurs;
        console.log(joueurs);

        if(nomASupprimer==hote.name){
            hote=joueurs[0];
        }
        io.emit("getJoueurs",joueurs);
        console.log(hote);
    });

    
    // message 
    socket.on("message",(data)=>{
        io.emit("message",data);
    });

    let animaux = {};

    async function commencerJeu (){
        joueurs.forEach((value,index)=>{
            animaux[value.name]=[];
            for(let i=0;i<10;++i){
                animaux[value.name].push(new Animal(positionTanieres[index]));
            }
        });
        io.emit("commencerJeu",animaux);

        //deroulement du jeu
        for(let i=0;i<50;++i){
            jouerTour();
            joueurs.forEach((joueur,index)=>{
                animaux[joueur.name].forEach((animal,index)=>{
                    if(!animal.enVie()){
                        animaux[joueur.name].splice(index,1);
                    }
                });
            });

            await sleep(750);
        }
    }
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    function jouerTour() {
    const bordureD = Array.from({ length: 13 }, (_, index) => 12 + 13 * index);
    const bordureG = Array.from({ length: 13 }, (_, index) => 13 * index);

        joueurs.forEach((value, index) => {
            if (animaux[value.name]) {
                animaux[value.name].forEach((animal) => {
                    let choix = Math.floor(Math.random() * 7);
    
                    switch (choix) {
                        case 1: //Cas ou il se déplace en haut a gauche.
                            if ((animal.position -13) > 0 && (!bordureG.includes(animal.position))) {
                                animal.position = animal.position -13;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 2: //Cas ou il se déplace en haut a droite.
                            if ((animal.position -12) > 0 && (!bordureD.includes(animal.position))) {
                                animal.position = animal.position -12;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 3: //Cas ou il se déplace vers la gauche.
                            if ((!bordureG.includes(animal.position))) {
                                animal.position = animal.position -1;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 4: //Cas ou il se déplace vers la droite.
                            if ((!bordureD.includes(animal.position))) {
                                animal.position = animal.position + 1;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 5: //Cas ou il se déplace en bas a droite.
                            if ((animal.position + 14) < 168 && (!bordureD.includes(animal.position))) {
                                animal.position = animal.position + 14;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 6: //Cas ou il se déplace en bas a gauche.
                            if ((animal.position + 13) < 168 && (!bordureG.includes(animal.position))) {
                                animal.position = animal.position + 13;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        default:
                            animal.position = animal.position //Cas ou il reste sur place
                            animal.stats.eau -= 0.5;
                            animal.stats.faim -= 0.25;
                            break;
                    }

                    if(cases[animal.position]=="prairie"){
                        animal.stats.faim+=2;
                    }else if(cases[animal.position]=="eau"){
                        animal.stats.eau+=3;
                    }

                });
            } else {
                console.log("animaux[value.name] est pas dÃ©fini");
            }
        });
        io.emit("jouerTour", animaux);
    }

    socket.on("commencerJeu",commencerJeu);

});