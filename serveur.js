/*Initialisations*/
const express = require('express');
const app = express();
const http = require('http');
const { type } = require('os');
const server = http.createServer(app);
const io =  require("socket.io")(server); /*bun*/
//const io = new require("socket.io")(server); /*node.js*/


/*Initialisation de la classe 'Animal'*/
class Animal{
    constructor(p){
        this.sexe=false;
        this.position=p;
        this.stats={eau:10,faim:10};
    }

    enVie(){ /*Méthode*/
        return !(this.stats.eau<=0 || this.stats.faim<=0)
    }   
}


/*app.get*/
server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888');
});

app.get('/', (request, response) => {
    response.sendFile('index.html', {root: __dirname});
});

// permet au client de récupérer les fichiers dont il a besoin
// les fichiers dont il a besoin sont mit dans une liste pour évité qu'il accède à n'importe quel fichier

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


let joueurs=[]; /*{name: name.value,repro:repro.value,precep: precep.value,force:force.value}*/
let hote;
let nbJmax=1;
// couleurs des animaux des joueurs 
let listeCouleurs=["red","purple","yellow","blue"];

// toutes les cases du tablier sont stocker dans cette variable : index = identifiant de la case, valeur = "type"
let cases=[];

let terrain = {"roche":84,"prairie": 59,"eau":26}; /*~50% ~35% ~15%*/
let typeTerrain = ["roche","prairie","eau","taniere"];

/*Position des tanières sur le damier*/
let positionTanieres = [6,77,88,159];

/*Socket*/
io.on("connection",(socket)=>{

    // lors du chargement de la pache si un damier existe déjà, on l'affiche
    socket.on("auchargement",()=>{
        if(cases.length!=0){
            socket.emit("entree",cases,joueurs);
        }
    });
    // modifie le nombre maximum de joueur dans la partie et on vérifie que cette modification est bien faite pas l'hôte
    socket.on("nbJoueurs",(nombre,nomJ)=>{
        if(nomJ==hote.name)
            nbJmax=nombre;
    
    });

    // à l'entrée on vérifie s'il y a pas trop de joueur et si il n'y a pas hôte le nouveau joueur le devient
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
        
        /*Création de listec, une liste qui contient chaque "position" sur le damier, chaque hexagone*/
        let listec = [];
        for(let i=0; i<=168; i++){
            listec.push(i);
        }
        
        function listecElemRndm(){ /*Fonction qui retourne aléatoirement un élément parmi listec et l'enleve de listec*/
            if (listec.length > 0){
                let rndm = Math.floor(Math.random() * listec.length);
                let elem = listec[rndm];
                listec.splice(rndm, 1);
                return elem;
            } 
        }
        
        /*Génération aléatoire du terrain*/
        if(cases.length==0){
            
            let max = typeTerrain.length-1;
            let rndmTerrain;
            
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

    // à la sortie d'un joueur on l'enlève de la liste des joueurs et si c'était l'hôte, on change l'hôte
    // on envoie la nouvelle liste de joueur aux clients
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
    
    
    /*Messages*/
    socket.on("message",(data)=>{
        io.emit("message",data);
    });

    let animaux = {};

    async function commencerJeu (){ /*Fonction pour lancer le jeu*/
        joueurs.forEach((value,index)=>{
            animaux[value.name]=[];
            for(let i=0;i<1;++i){ /*Permet de set le nombre d'animaux au spawn par joueurs*/
                animaux[value.name].push(new Animal(positionTanieres[index]));
            }
        });
        io.emit("commencerJeu",animaux);

        /*Déroulement du jeu*/
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
    function sleep(ms) { /*Fonction qui gère le délai entre les tours*/
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    function jouerTour() { /*Fonction qui permet de gérer chaque tour, les déplacements..*/
    const bordureD = Array.from({ length: 13 }, (_, index) => 12 + 13 * index); /*Liste composée de l'ensemble des coordonnées des hexagones qui se situent a gauche*/
    const bordureG = Array.from({ length: 13 }, (_, index) => 13 * index); /*Liste composée de l'ensemble des coordonnées des hexagones qui se situent a droite*/

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
                    
                    if(cases[animal.position]=="prairie"){ /*Nourrit l'animal si il se trouve sur de la prairie et re-set ses stats a 10 si il dépasse (10 étant le seuil)*/
                        animal.stats.faim+=2;
                        if((animal.stats.faim>10)){
                            animal.stats.faim = 10;
                        }
                    }else if(cases[animal.position]=="eau"){ /*Hydrate l'animal si il se trouve sur de l'eau et re-set ses stats a 10 si il dépasse (10 étant le seuil)*/
                        animal.stats.eau+=3;
                        if((animal.stats.eau>10)){
                            animal.stats.eau = 10;
                        }
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