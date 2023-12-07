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
        this.stats={eau:5,faim:5};
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
let positionTanieres = [6,78,90,162];

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
                // console.log(index);
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

    //------------------------------------------------------------------------------------------------------

const bordureD = Array.from({ length: 13 }, (_, index) => 12 + 13 * index); /*Liste composée de l'ensemble des coordonnées des hexagones qui se situent a droite*/
const bordureG = Array.from({ length: 13 }, (_, index) => 13 * index); /*Liste composée de l'ensemble des coordonnées des hexagones qui se situent a gauche*/

    function deplacementHautGauche(animal){
        if ((animal.position -13) > 0 && (!bordureG.includes(animal.position))) {
            animal.position = animal.position -13;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function deplacementHautDroite(animal){
        if ((animal.position -12) > 0 && (!bordureD.includes(animal.position))) {
            animal.position = animal.position -12;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function deplacementGauche(animal){
        if ((!bordureG.includes(animal.position))) {
            animal.position = animal.position -1;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function deplacementDroite(animal){
        if ((!bordureD.includes(animal.position))) {
            animal.position = animal.position + 1;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function deplacementBasGauche(animal){
        if ((animal.position + 12) < 168 && (!bordureG.includes(animal.position))) {
            animal.position = animal.position + 12;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function deplacementBasDroite(animal){
        if ((animal.position + 13) < 168 && (!bordureD.includes(animal.position))) {
            animal.position = animal.position + 13;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }
    }

    function resteSurPlace(animal){
        animal.position = animal.position //Cas ou il reste sur place
        animal.stats.eau -= 0.5;
        animal.stats.faim -= 0.25;
    }

    function choisirDeplacementEntreDeux(fonction1, fonction2){
        var random = Math.random();
        if (random < 0.5) {
            return fonction1;
        } else {
            return fonction2;
        }
    }

    function deplacementEauPlusProche(joueur, animal){
        let perception  = joueur.precep //stats a ajouter dans la classe animale pour pouvoir witch dessus
        let listeDirection = [deplacementHautGauche, deplacementHautDroite, deplacementGauche, deplacementDroite, deplacementBasGauche, deplacementBasDroite] //liste qui contient toutes les fonctions de déplacements
        let listeEauP1 = [];
        let d = false;

        if(cases[animal.position]=="eau"){ //cas ou l'animal est deja sur de l'eau
            resteSurPlace(animal);
        }
        else{
                //Cas ou l'animal a 1 de perception, si il voit seulement les cases autour de lui

                if((cases[animal.position-13]=="eau") && perception>0) //Ajoute ssi en haut a gauche c'est de l'eau
                    listeEauP1.push(animal.position-13);

                if((cases[animal.position-12]=="eau") && perception>0) //Ajoute ssi en haut a droite c'est de l'eau
                    listeEauP1.push(animal.position-12);

                if((cases[animal.position-1]=="eau") && perception>0) //Ajoute ssi a gauche c'est de l'eau
                    listeEauP1.push(animal.position-1);

                if((cases[animal.position+1]=="eau") && perception>0) //Ajoute ssi a droite c'est de l'eau
                    listeEauP1.push(animal.position+1);

                if((cases[animal.position+12]=="eau") && perception>0) //Ajoute ssi en bas a gauche c'est de l'eau
                    listeEauP1.push(animal.position+12);

                if((cases[animal.position+13]=="eau") && perception >0) //Ajoute ssi en bas a droite c'est de l'eau
                    listeEauP1.push(animal.position+13);

                if(listeEauP1.length > 0){ //Va aléatoirement sur une case eau, si il en existe une
                    let rndmP1 = listeEauP1[Math.floor(Math.random() * listeEauP1.length)];
                    animal.position = rndmP1;
                    animal.stats.eau -= 1;
                    animal.stats.faim -= 0.50;
                    d = true;
                }

                //Cas ou l'animal a 2 de perceptions

                if(cases[animal.position-26]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche si eau deux fois en haut a gauche
                    deplacementHautGauche(animal);
                    d = true;
                }

                else if(cases[animal.position-24]=="eau" && perception > 1 && d == false){ //se déplace en haut a droite si eau deux fois en haut a droite
                    deplacementHautDroite(animal);
                    d = true;
                }

                else if(cases[animal.position-2]=="eau" && perception > 1 && d == false){ //se déplace a gauche si eau deux fois a gauche
                    deplacementGauche(animal);
                    d = true;
                }

                else if(cases[animal.position+2]=="eau" && perception > 1 && d == false){ //se déplace a droite si eau deux fois a droite
                    deplacementDroite(animal);
                    d = true;
                }

                else if(cases[animal.position+24]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche si eau deux fois en bas a gauche
                    deplacementBasGauche(animal);
                    d = true;
                }

                else if(cases[animal.position+26]=="eau" && perception > 1 && d == false){ //se déplace en bas a droite si eau deux fois en bas a droite
                    deplacementBasDroite(animal);
                    d = true;
                }

                else if(cases[animal.position-14]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si eau en haut a gauche + gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-11]=="eau" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si eau en haut a droite + droite
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+11]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si eau en bas a gauche + gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+14]=="eau" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si eau en bas a droite + droite
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-25]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si eau en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+25]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si eau en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                //Cas ou l'animal a 3 de perception
                if(cases[animal.position-39]=="eau" && perception > 2 && d == false){ //1
                    deplacementHautGauche(animal);
                    d = true;
                }

                else if(cases[animal.position-36]=="eau" && perception > 2 && d == false){ //2 
                    deplacementHautDroite(animal);
                    d = true;
                }

                else if(cases[animal.position+36]=="eau" && perception > 2 && d == false){ //3
                    deplacementBasGauche(animal);
                    d = true;
                }

                else if(cases[animal.position+39]=="eau" && perception > 2 && d == false){ //4
                    deplacementBasDroite(animal);
                    d = true;
                }

                else if(cases[animal.position+3]=="eau" && perception > 2 && d == false){ //5
                    deplacementDroite(animal);
                    d = true;
                }

                else if(cases[animal.position-3]=="eau" && perception > 2 && d == false){ //6
                    deplacementGauche(animal);
                    d = true;
                }

                else if(cases[animal.position+27]=="eau" && perception > 2 && d == false){  //7
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+15]=="eau" && perception > 2 && d == false){  //8
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+10]=="eau" && perception > 2 && d == false){ //9
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+23]=="eau" && perception > 2 && d == false){ //10
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+37]=="eau" && perception > 2 && d == false){ //11
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position+38]=="eau" && perception > 2 && d == false){ //12
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-10]=="eau" && perception > 2 && d == false){ //13
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-23]=="eau" && perception > 2 && d == false){ //14
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-15]=="eau" && perception > 2 && d == false){ //15
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-27]=="eau" && perception > 2 && d == false){ //16
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-38]=="eau" && perception > 2 && d == false){ //17
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }

                else if(cases[animal.position-37]=="eau" && perception > 2 && d == false){ //18
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal);
                    d = true;
                }



                else if(d == false){ //Si je vois aucune case d'eau, je me déplace aléatoirement
                    let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                    deplacementRndm(animal);
                    d = true;
                }
            }
        }

    function deplacementPrairiePlusProche(joueur, animal){
            let perception  = joueur.precep //stats a ajouter dans la classe animale pour pouvoir witch dessus
            let listeDirection = [deplacementHautGauche, deplacementHautDroite, deplacementGauche, deplacementDroite, deplacementBasGauche, deplacementBasDroite] //liste qui contient toutes les fonctions de déplacements
            let listePrairieP1 = [];
            let d = false;
        
            if(cases[animal.position]=="prairie"){ //cas ou l'animal est deja sur de l'prairie
                resteSurPlace(animal);
            }
            else{
                    //Cas ou l'animal a 1 de perception, si il voit seulement les cases autour de lui
        
                    if((cases[animal.position-13]=="prairie") && perception>0) //Ajoute ssi en haut a gauche c'est de l'prairie
                        listePrairieP1.push(animal.position-13);
        
                    if((cases[animal.position-12]=="prairie") && perception>0) //Ajoute ssi en haut a droite c'est de l'prairie
                        listePrairieP1.push(animal.position-12);
        
                    if((cases[animal.position-1]=="prairie") && perception>0) //Ajoute ssi a gauche c'est de l'prairie
                        listePrairieP1.push(animal.position-1);
        
                    if((cases[animal.position+1]=="prairie") && perception>0) //Ajoute ssi a droite c'est de l'prairie
                        listePrairieP1.push(animal.position+1);
        
                    if((cases[animal.position+12]=="prairie") && perception>0) //Ajoute ssi en bas a gauche c'est de l'prairie
                        listePrairieP1.push(animal.position+12);
        
                    if((cases[animal.position+13]=="prairie") && perception >0) //Ajoute ssi en bas a droite c'est de l'prairie
                        listePrairieP1.push(animal.position+13);
        
                    if(listePrairieP1.length > 0){ //Va aléatoirement sur une case prairie, si il en existe une
                        let rndmP1 = listePrairieP1[Math.floor(Math.random() * listePrairieP1.length)];
                        animal.position = rndmP1;
                        animal.stats.prairie -= 1;
                        animal.stats.faim -= 0.50;
                        d = true;
                    }
        
                    //Cas ou l'animal a 2 de perceptions
        
                    if(cases[animal.position-26]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche si prairie deux fois en haut a gauche
                        deplacementHautGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-24]=="prairie" && perception > 1 && d == false){ //se déplace en haut a droite si prairie deux fois en haut a droite
                        deplacementHautDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-2]=="prairie" && perception > 1 && d == false){ //se déplace a gauche si prairie deux fois a gauche
                        deplacementGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+2]=="prairie" && perception > 1 && d == false){ //se déplace a droite si prairie deux fois a droite
                        deplacementDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+24]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche si prairie deux fois en bas a gauche
                        deplacementBasGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+26]=="prairie" && perception > 1 && d == false){ //se déplace en bas a droite si prairie deux fois en bas a droite
                        deplacementBasDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-14]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si prairie en haut a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="prairie" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si prairie en haut a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si prairie en bas a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+14]=="prairie" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si prairie en bas a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-25]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si prairie en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+25]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si prairie en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    //Cas ou l'animal a 3 de perception
                    if(cases[animal.position-39]=="prairie" && perception > 2 && d == false){ //1
                        deplacementHautGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-36]=="prairie" && perception > 2 && d == false){ //2 
                        deplacementHautDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+36]=="prairie" && perception > 2 && d == false){ //3
                        deplacementBasGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+39]=="prairie" && perception > 2 && d == false){ //4
                        deplacementBasDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+3]=="prairie" && perception > 2 && d == false){ //5
                        deplacementDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-3]=="prairie" && perception > 2 && d == false){ //6
                        deplacementGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+27]=="prairie" && perception > 2 && d == false){  //7
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+15]=="prairie" && perception > 2 && d == false){  //8
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+10]=="prairie" && perception > 2 && d == false){ //9
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+23]=="prairie" && perception > 2 && d == false){ //10
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+37]=="prairie" && perception > 2 && d == false){ //11
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+38]=="prairie" && perception > 2 && d == false){ //12
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-10]=="prairie" && perception > 2 && d == false){ //13
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-23]=="prairie" && perception > 2 && d == false){ //14
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-15]=="prairie" && perception > 2 && d == false){ //15
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-27]=="prairie" && perception > 2 && d == false){ //16
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-38]=="prairie" && perception > 2 && d == false){ //17
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-37]=="prairie" && perception > 2 && d == false){ //18
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
        
        
                    else if(d == false){ //Si je vois aucune case d'prairie, je me déplace aléatoirement
                        let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                        deplacementRndm(animal);
                        d = true;
                    }
                }
        }

    function deplacementTanierePlusProche(joueur, animal){
            let perception  = joueur.precep //stats a ajouter dans la classe animale pour pouvoir witch dessus
            let listeDirection = [deplacementPrairiePlusProche, deplacementEauPlusProche] //liste qui contient toutes les fonctions de déplacements
            let listeTaniereP1 = [];
            let d = false;
        
            if(cases[animal.position]=="taniere"){ //cas ou l'animal est deja sur de l'taniere
                resteSurPlace(animal);
            }
            else{
                    //Cas ou l'animal a 1 de perception, si il voit seulement les cases autour de lui
        
                    if((cases[animal.position-13]=="taniere") && perception>0) //Ajoute ssi en haut a gauche c'est de l'taniere
                        listeTaniereP1.push(animal.position-13);
        
                    if((cases[animal.position-12]=="taniere") && perception>0) //Ajoute ssi en haut a droite c'est de l'taniere
                        listeTaniereP1.push(animal.position-12);
        
                    if((cases[animal.position-1]=="taniere") && perception>0) //Ajoute ssi a gauche c'est de l'taniere
                        listeTaniereP1.push(animal.position-1);
        
                    if((cases[animal.position+1]=="taniere") && perception>0) //Ajoute ssi a droite c'est de l'taniere
                        listeTaniereP1.push(animal.position+1);
        
                    if((cases[animal.position+12]=="taniere") && perception>0) //Ajoute ssi en bas a gauche c'est de l'taniere
                        listeTaniereP1.push(animal.position+12);
        
                    if((cases[animal.position+13]=="taniere") && perception >0) //Ajoute ssi en bas a droite c'est de l'taniere
                        listeTaniereP1.push(animal.position+13);
        
                    if(listeTaniereP1.length > 0){ //Va aléatoirement sur une case taniere, si il en existe une
                        let rndmP1 = listeTaniereP1[Math.floor(Math.random() * listeTaniereP1.length)];
                        animal.position = rndmP1;
                        animal.stats.taniere -= 1;
                        animal.stats.faim -= 0.50;
                        d = true;
                    }
        
                    //Cas ou l'animal a 2 de perceptions
        
                    if(cases[animal.position-26]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche si taniere deux fois en haut a gauche
                        deplacementHautGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-24]=="taniere" && perception > 1 && d == false){ //se déplace en haut a droite si taniere deux fois en haut a droite
                        deplacementHautDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-2]=="taniere" && perception > 1 && d == false){ //se déplace a gauche si taniere deux fois a gauche
                        deplacementGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+2]=="taniere" && perception > 1 && d == false){ //se déplace a droite si taniere deux fois a droite
                        deplacementDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+24]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche si taniere deux fois en bas a gauche
                        deplacementBasGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+26]=="taniere" && perception > 1 && d == false){ //se déplace en bas a droite si taniere deux fois en bas a droite
                        deplacementBasDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-14]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si taniere en haut a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="taniere" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si taniere en haut a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si taniere en bas a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+14]=="taniere" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si taniere en bas a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-25]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si taniere en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+25]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si taniere en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    //Cas ou l'animal a 3 de perception
                    if(cases[animal.position-39]=="taniere" && perception > 2 && d == false){ //1
                        deplacementHautGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-36]=="taniere" && perception > 2 && d == false){ //2 
                        deplacementHautDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+36]=="taniere" && perception > 2 && d == false){ //3
                        deplacementBasGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+39]=="taniere" && perception > 2 && d == false){ //4
                        deplacementBasDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+3]=="taniere" && perception > 2 && d == false){ //5
                        deplacementDroite(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-3]=="taniere" && perception > 2 && d == false){ //6
                        deplacementGauche(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+27]=="taniere" && perception > 2 && d == false){  //7
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+15]=="taniere" && perception > 2 && d == false){  //8
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+10]=="taniere" && perception > 2 && d == false){ //9
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+23]=="taniere" && perception > 2 && d == false){ //10
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+37]=="taniere" && perception > 2 && d == false){ //11
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position+38]=="taniere" && perception > 2 && d == false){ //12
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-10]=="taniere" && perception > 2 && d == false){ //13
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-23]=="taniere" && perception > 2 && d == false){ //14
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-15]=="taniere" && perception > 2 && d == false){ //15
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-27]=="taniere" && perception > 2 && d == false){ //16
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-38]=="taniere" && perception > 2 && d == false){ //17
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
                    else if(cases[animal.position-37]=="taniere" && perception > 2 && d == false){ //18
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal);
                        d = true;
                    }
        
        
        
                    else if(d == false){ //Si je vois aucune case d'taniere, je me déplace aléatoirement
                        let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                        deplacementRndm(animal);
                        d = true;
                    }
                }
        }

    //--------------------------------------------------------------------------------------------------------

    function jouerTour() { /*Fonction qui permet de gérer chaque tour, les déplacements..*/
        joueurs.forEach((value, index) => {
            if (animaux[value.name]) {
                animaux[value.name].forEach((animal) => {

                    if(animal.stats.eau >= 6 && animal.stats.faim > 6){
                        deplacementTanierePlusProche(value, animal);
                    }

                    else if(animal.stats.faim > 8){
                        deplacementEauPlusProche(value, animal);
                    }
                    else{
                        deplacementPrairiePlusProche(value, animal);
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

    /*function jouerTour() { /*Fonction qui permet de gérer chaque tour, les déplacements..
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
                            if ((animal.position + 13) < 168 && (!bordureD.includes(animal.position))) {
                                animal.position = animal.position + 13;
                                animal.stats.eau -= 1;
                                animal.stats.faim -= 0.50;
                                break;
                            }
                        case 6: //Cas ou il se déplace en bas a gauche.
                            if ((animal.position + 12) < 168 && (!bordureG.includes(animal.position))) {
                                animal.position = animal.position + 12;
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
                    
                    if(cases[animal.position]=="prairie"){ /*Nourrit l'animal si il se trouve sur de la prairie et re-set ses stats a 10 si il dépasse (10 étant le seuil)
                        animal.stats.faim+=2;
                        if((animal.stats.faim>10)){
                            animal.stats.faim = 10;
                        }
                    }else if(cases[animal.position]=="eau"){ /*Hydrate l'animal si il se trouve sur de l'eau et re-set ses stats a 10 si il dépasse (10 étant le seuil)
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
    }*/

    socket.on("commencerJeu",commencerJeu);

});