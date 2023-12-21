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
    constructor(p,s){
        // p : position , s : sexe 
        this.sexe= s;
        this.position=p;
        this.stats = {
            eau: 5,//2 + Math.random() * 3.5,  // Génère un nombre entre 2 et 5.5
            faim: 5 // + Math.random() * 3.5  // Génère un nombre entre 2 et 5.5
        };
        // stat est pas défaut à 5, à 5 ils peuvent se reproduire
        this.reproductionTours = 5;
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


app.get("/:nomFichier",(request,response)=>{
    let file = request.params.nomFichier;
        response.sendFile(file,{root:__dirname});

});

let tour = 0;
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
let positionTanieres = [19,79,89,149];

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
        // data {name,repro,precep,force}
        if(nbJmax<=joueurs.length){
            socket.emit("msgserv","trop de joueurs");
            return ;
        }
        data["couleur"]=listeCouleurs[joueurs.length];
        // ajout de la couleur du joueurs 
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
            
        }
        let nbJoueurs= joueurs.length;
        if(nbJoueurs>=1)
            cases[19]="taniere";
        if(nbJoueurs>=2)
            cases[79]="taniere";
        if(nbJoueurs>=3)
            cases[89]="taniere";
        if(nbJoueurs>=4)
            cases[149]="taniere";
        
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
        // console.log(joueurs);
        
        if(nomASupprimer==hote.name){
            hote=joueurs[0];
        }
        io.emit("getJoueurs",joueurs);
        // console.log(hote);
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
                animaux[value.name].push(new Animal(positionTanieres[index],1)); // ajout d'un male
                animaux[value.name].push(new Animal(positionTanieres[index],0)); // et d'une femelle    
            }
        });
    io.emit("commencerJeu",animaux);

        /*Déroulement du jeu*/
        for(let i=0;i<1000;++i){
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

    /*const caseVide= (c,j) => {
        animaux[j.name].forEach((animal,index)=>{
            if(animal.position==c){
                return false;
            }
        });
        return true;
    };*/

    const caseVide = (c, j) => {
        const isPositionOccupied = animaux[j.name].some((animal) => {
            return animal.position === c;
        });
        
        return !isPositionOccupied;
        };

    const estTaniere = (p)=>{
        return cases[p] === "taniere";
    };

    function deplacementHautGauche(animal,j){
        if ((animal.position -13) > 0 && (!bordureG.includes(animal.position)) && (caseVide(animal.position-13,j) || estTaniere(animal.position-13))) {
            animal.position = animal.position -13;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }else{
            resteSurPlace(animal);
        }
    }

    function deplacementHautDroite(animal,j){
        if ((animal.position -12) > 0 && (!bordureD.includes(animal.position)) && (caseVide(animal.position-12,j) || estTaniere(animal.position-12))) {
            animal.position = animal.position -12;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }else{
            resteSurPlace(animal);
        }
    }

    function deplacementGauche(animal,j){
        if ((!bordureG.includes(animal.position)) && (caseVide(animal.position-1,j) || estTaniere(animal.position-1))) {
            animal.position = animal.position -1;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }else resteSurPlace(animal);
    }

    function deplacementDroite(animal,j){
        if ((!bordureD.includes(animal.position)) && (caseVide(animal.position+1,j) || estTaniere(animal.position+1))) {
            animal.position = animal.position + 1;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }else resteSurPlace(animal);
    }

    function deplacementBasGauche(animal,j){
        if ((animal.position + 12) < 168 && (!bordureG.includes(animal.position)) && (caseVide(animal.position+12,j) || estTaniere(animal.position+12))) {
            animal.position = animal.position + 12;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        } else resteSurPlace(animal);
    }

    function deplacementBasDroite(animal,j){
        if ((animal.position + 13) < 168 && (!bordureD.includes(animal.position)) && (caseVide(animal.position+13,j) || estTaniere(animal.position+13))) {
            animal.position = animal.position + 13;
            animal.stats.eau -= 1;
            animal.stats.faim -= 0.50;
        }else resteSurPlace(animal);
        
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
        let perception  = joueur.precep //stats a ajouter dans la classe animale pour pouvoir witch dessus*
        let listeDirection = [deplacementHautGauche, deplacementHautDroite, deplacementGauche, deplacementDroite, deplacementBasGauche, deplacementBasDroite] //liste qui contient toutes les fonctions de déplacements
        let listeEauP1 = [];
        let d = false;

        if(cases[animal.position]=="eau"){ //cas ou l'animal est deja sur de l'eau
            resteSurPlace(animal);
        }
        else{
                //Cas ou l'animal a 1 de perception, si il voit seulement les cases autour de lui

                if((cases[animal.position-13]=="eau") && perception>0 && (caseVide(animal.position-13,joueur))) //Ajoute ssi en haut a gauche c'est de l'eau
                    listeEauP1.push(deplacementHautGauche);

                if((cases[animal.position-12]=="eau") && perception>0 && (caseVide(animal.position-12,joueur))) //Ajoute ssi en haut a droite c'est de l'eau
                    listeEauP1.push(deplacementHautDroite);

                if((cases[animal.position-1]=="eau") && perception>0 && (caseVide(animal.position-1,joueur))) //Ajoute ssi a gauche c'est de l'eau
                    listeEauP1.push(deplacementGauche);

                if((cases[animal.position+1]=="eau") && perception>0 && (caseVide(animal.position+1,joueur))) //Ajoute ssi a droite c'est de l'eau
                    listeEauP1.push(deplacementDroite);

                if((cases[animal.position+12]=="eau") && perception>0 && (caseVide(animal.position+12,joueur))) //Ajoute ssi en bas a gauche c'est de l'eau
                    listeEauP1.push(deplacementBasGauche);

                if((cases[animal.position+13]=="eau") && perception >0 && (caseVide(animal.position+13,joueur))) //Ajoute ssi en bas a droite c'est de l'eau
                    listeEauP1.push(deplacementBasDroite);

                if(listeEauP1.length > 0){ //Va aléatoirement sur une case eau, si il en existe une
                    let rndmP1 = listeEauP1[Math.floor(Math.random() * listeEauP1.length)];
                    rndmP1(animal, joueur);
                    d = true;
                }

                //Cas ou l'animal a 2 de perceptions

                if(cases[animal.position-26]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche si eau deux fois en haut a gauche
                    deplacementHautGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position-24]=="eau" && perception > 1 && d == false){ //se déplace en haut a droite si eau deux fois en haut a droite
                    deplacementHautDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position-2]=="eau" && perception > 1 && d == false){ //se déplace a gauche si eau deux fois a gauche
                    deplacementGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+2]=="eau" && perception > 1 && d == false){ //se déplace a droite si eau deux fois a droite
                    deplacementDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+24]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche si eau deux fois en bas a gauche
                    deplacementBasGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+26]=="eau" && perception > 1 && d == false){ //se déplace en bas a droite si eau deux fois en bas a droite
                    deplacementBasDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position-14]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si eau en haut a gauche + gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-11]=="eau" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si eau en haut a droite + droite
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+11]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si eau en bas a gauche + gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+14]=="eau" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si eau en bas a droite + droite
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-25]=="eau" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si eau en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+25]=="eau" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si eau en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                //Cas ou l'animal a 3 de perception
                if(cases[animal.position-39]=="eau" && perception > 2 && d == false){ //1
                    deplacementHautGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position-36]=="eau" && perception > 2 && d == false){ //2 
                    deplacementHautDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+36]=="eau" && perception > 2 && d == false){ //3
                    deplacementBasGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+39]=="eau" && perception > 2 && d == false){ //4
                    deplacementBasDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+3]=="eau" && perception > 2 && d == false){ //5
                    deplacementDroite(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position-3]=="eau" && perception > 2 && d == false){ //6
                    deplacementGauche(animal,joueur)
                    d = true;
                }

                else if(cases[animal.position+27]=="eau" && perception > 2 && d == false){  //7
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+15]=="eau" && perception > 2 && d == false){  //8
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+10]=="eau" && perception > 2 && d == false){ //9
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+23]=="eau" && perception > 2 && d == false){ //10
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+37]=="eau" && perception > 2 && d == false){ //11
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position+38]=="eau" && perception > 2 && d == false){ //12
                    let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-10]=="eau" && perception > 2 && d == false){ //13
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-23]=="eau" && perception > 2 && d == false){ //14
                    let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-15]=="eau" && perception > 2 && d == false){ //15
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-27]=="eau" && perception > 2 && d == false){ //16
                    let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-38]=="eau" && perception > 2 && d == false){ //17
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }

                else if(cases[animal.position-37]=="eau" && perception > 2 && d == false){ //18
                    let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                    choix1(animal,joueur);
                    d = true;
                }



                else if(d == false){ //Si je vois aucune case d'eau, je me déplace aléatoirement
                    let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                    deplacementRndm(animal, joueur);
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
        
                    if((cases[animal.position-13]=="prairie") && perception>0 && (caseVide(animal.position-13,joueur))) //Ajoute ssi en haut a gauche c'est de l'prairie
                        listePrairieP1.push(deplacementHautGauche);
        
                    if((cases[animal.position-12]=="prairie") && perception>0 && (caseVide(animal.position-12,joueur))) //Ajoute ssi en haut a droite c'est de l'prairie
                        listePrairieP1.push(deplacementHautDroite);
        
                    if((cases[animal.position-1]=="prairie") && perception>0 && (caseVide(animal.position-1,joueur))) //Ajoute ssi a gauche c'est de l'prairie
                        listePrairieP1.push(deplacementGauche);
        
                    if((cases[animal.position+1]=="prairie") && perception>0 && (caseVide(animal.position+1,joueur))) //Ajoute ssi a droite c'est de l'prairie
                        listePrairieP1.push(deplacementDroite);
        
                    if((cases[animal.position+12]=="prairie") && perception>0 && (caseVide(animal.position+12,joueur))) //Ajoute ssi en bas a gauche c'est de l'prairie
                        listePrairieP1.push(deplacementBasGauche);
        
                    if((cases[animal.position+13]=="prairie") && perception >0 && (caseVide(animal.position+13,joueur))) //Ajoute ssi en bas a droite c'est de l'prairie
                        listePrairieP1.push(deplacementBasDroite);
        
                    if(listePrairieP1.length > 0){ //Va aléatoirement sur une case prairie, si il en existe une
                        let rndmP1 = listePrairieP1[Math.floor(Math.random() * listePrairieP1.length)];
                        rndmP1(animal, joueur);
                        d = true;
                    }
        
                    //Cas ou l'animal a 2 de perceptions
        
                    if(cases[animal.position-26]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche si prairie deux fois en haut a gauche
                        deplacementHautGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-24]=="prairie" && perception > 1 && d == false){ //se déplace en haut a droite si prairie deux fois en haut a droite
                        deplacementHautDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-2]=="prairie" && perception > 1 && d == false){ //se déplace a gauche si prairie deux fois a gauche
                        deplacementGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+2]=="prairie" && perception > 1 && d == false){ //se déplace a droite si prairie deux fois a droite
                        deplacementDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+24]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche si prairie deux fois en bas a gauche
                        deplacementBasGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+26]=="prairie" && perception > 1 && d == false){ //se déplace en bas a droite si prairie deux fois en bas a droite
                        deplacementBasDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-14]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si prairie en haut a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="prairie" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si prairie en haut a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si prairie en bas a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+14]=="prairie" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si prairie en bas a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-25]=="prairie" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si prairie en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+25]=="prairie" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si prairie en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    //Cas ou l'animal a 3 de perception
                    if(cases[animal.position-39]=="prairie" && perception > 2 && d == false){ //1
                        deplacementHautGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-36]=="prairie" && perception > 2 && d == false){ //2 
                        deplacementHautDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+36]=="prairie" && perception > 2 && d == false){ //3
                        deplacementBasGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+39]=="prairie" && perception > 2 && d == false){ //4
                        deplacementBasDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+3]=="prairie" && perception > 2 && d == false){ //5
                        deplacementDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-3]=="prairie" && perception > 2 && d == false){ //6
                        deplacementGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+27]=="prairie" && perception > 2 && d == false){  //7
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+15]=="prairie" && perception > 2 && d == false){  //8
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+10]=="prairie" && perception > 2 && d == false){ //9
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+23]=="prairie" && perception > 2 && d == false){ //10
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+37]=="prairie" && perception > 2 && d == false){ //11
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+38]=="prairie" && perception > 2 && d == false){ //12
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-10]=="prairie" && perception > 2 && d == false){ //13
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-23]=="prairie" && perception > 2 && d == false){ //14
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-15]=="prairie" && perception > 2 && d == false){ //15
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-27]=="prairie" && perception > 2 && d == false){ //16
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-38]=="prairie" && perception > 2 && d == false){ //17
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-37]=="prairie" && perception > 2 && d == false){ //18
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
        
        
                    else if(d == false){ //Si je vois aucune case d'prairie, je me déplace aléatoirement
                        let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                        deplacementRndm(animal, joueur);
                        d = true;
                    }
                }
        }

    function deplacementTanierePlusProche(joueur, animal){joueur
            let perception  = joueur.precep //stats a ajouter dans la classe animale pour pouvoir witch dessus
            let listeDirection = [deplacementHautGauche, deplacementHautDroite, deplacementGauche, deplacementDroite, deplacementBasGauche, deplacementBasDroite] //liste qui contient toutes les fonctions de déplacements
            let listeTaniereP1 = [];
            let d = false;
        
            if(cases[animal.position]=="taniere"){ //cas ou l'animal est deja sur de l'taniere
                resteSurPlace(animal);
            }
            else{
                    //Cas ou l'animal a 1 de perception, si il voit seulement les cases autour de lui
        
                    if((cases[animal.position-13]=="taniere") && perception>0) //Ajoute ssi en haut a gauche c'est de l'taniere
                        listeTaniereP1.push(deplacementHautGauche);
        
                    if((cases[animal.position-12]=="taniere") && perception>0) //Ajoute ssi en haut a droite c'est de l'taniere
                        listeTaniereP1.push(deplacementHautDroite);
        
                    if((cases[animal.position-1]=="taniere") && perception>0) //Ajoute ssi a gauche c'est de l'taniere
                        listeTaniereP1.push(deplacementGauche);
        
                    if((cases[animal.position+1]=="taniere") && perception>0) //Ajoute ssi a droite c'est de l'taniere
                        listeTaniereP1.push(deplacementDroite);
        
                    if((cases[animal.position+12]=="taniere") && perception>0) //Ajoute ssi en bas a gauche c'est de l'taniere
                        listeTaniereP1.push(deplacementBasGauche);
        
                    if((cases[animal.position+13]=="taniere") && perception >0) //Ajoute ssi en bas a droite c'est de l'taniere
                        listeTaniereP1.push(deplacementDroite);
        
                    if(listeTaniereP1.length > 0){ //Va aléatoirement sur une case taniere, si il en existe une
                        let rndmP1 = listeTaniereP1[Math.floor(Math.random() * listeTaniereP1.length)];
                        rndmP1(animal, joueur);
                        d = true;
                    }
        
                    //Cas ou l'animal a 2 de perceptions
        
                    if(cases[animal.position-26]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche si taniere deux fois en haut a gauche
                        deplacementHautGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-24]=="taniere" && perception > 1 && d == false){ //se déplace en haut a droite si taniere deux fois en haut a droite
                        deplacementHautDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-2]=="taniere" && perception > 1 && d == false){ //se déplace a gauche si taniere deux fois a gauche
                        deplacementGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+2]=="taniere" && perception > 1 && d == false){ //se déplace a droite si taniere deux fois a droite
                        deplacementDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+24]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche si taniere deux fois en bas a gauche
                        deplacementBasGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+26]=="taniere" && perception > 1 && d == false){ //se déplace en bas a droite si taniere deux fois en bas a droite
                        deplacementBasDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-14]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche ou a gauche si taniere en haut a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="taniere" && perception > 1 && d == false){ //se déplace en haut a droite ou a droite si taniere en haut a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-11]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche ou a gauche si taniere en bas a gauche + gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+14]=="taniere" && perception > 1 && d == false){ //se déplace en bas a droite ou a droite si taniere en bas a droite + droite
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-25]=="taniere" && perception > 1 && d == false){ //se déplace en haut a gauche ou en haut a droite si taniere en haut a gauche + en haut a droite ou en haut a droite + en haut a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+25]=="taniere" && perception > 1 && d == false){ //se déplace en bas a gauche ou en bas a droite si taniere en bas a gauche + en bas a droite ou en bas a droite + en bas a gauche
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    //Cas ou l'animal a 3 de perception
                    if(cases[animal.position-39]=="taniere" && perception > 2 && d == false){ //1
                        deplacementHautGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-36]=="taniere" && perception > 2 && d == false){ //2 
                        deplacementHautDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+36]=="taniere" && perception > 2 && d == false){ //3
                        deplacementBasGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+39]=="taniere" && perception > 2 && d == false){ //4
                        deplacementBasDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+3]=="taniere" && perception > 2 && d == false){ //5
                        deplacementDroite(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position-3]=="taniere" && perception > 2 && d == false){ //6
                        deplacementGauche(animal,joueur)
                        d = true;
                    }
        
                    else if(cases[animal.position+27]=="taniere" && perception > 2 && d == false){  //7
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+15]=="taniere" && perception > 2 && d == false){  //8
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+10]=="taniere" && perception > 2 && d == false){ //9
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+23]=="taniere" && perception > 2 && d == false){ //10
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementBasGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+37]=="taniere" && perception > 2 && d == false){ //11
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position+38]=="taniere" && perception > 2 && d == false){ //12
                        let choix1 = choisirDeplacementEntreDeux(deplacementBasGauche, deplacementBasDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-10]=="taniere" && perception > 2 && d == false){ //13
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-23]=="taniere" && perception > 2 && d == false){ //14
                        let choix1 = choisirDeplacementEntreDeux(deplacementDroite, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-15]=="taniere" && perception > 2 && d == false){ //15
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-27]=="taniere" && perception > 2 && d == false){ //16
                        let choix1 = choisirDeplacementEntreDeux(deplacementGauche, deplacementHautGauche);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-38]=="taniere" && perception > 2 && d == false){ //17
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
                    else if(cases[animal.position-37]=="taniere" && perception > 2 && d == false){ //18
                        let choix1 = choisirDeplacementEntreDeux(deplacementHautGauche, deplacementHautDroite);
                        choix1(animal,joueur);
                        d = true;
                    }
        
        
        
                    else if(d == false){ //Si je vois aucune case d'taniere, je me déplace aléatoirement
                        let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                        deplacementRndm(animal, joueur);
                        d = true;
                    }
                }
        }

    let peutReproduire = (j, t) =>{
        // j c'est un joueur donné
        let nbMales=0;
        let nbFemelles=0;
        let positionT=0;
        animaux[j.name].forEach((element,index)=>{
            if(cases[element.position]=="taniere" && element.stats.eau>=6 && element.stats.faim>=6  && element.reproductionTours>=5){
                if(element.sexe){
                    // si l'animal a assez de reproduire il est ajouter à la listes des animaux pouvant se reproduire
                    // et sa reproduction passe à 0;
                    ++nbMales;
                } else{
                    ++nbFemelles;
                }
                positionT=element.position;
                element.reproductionTours=0;
            }else{
                // si il n'a 5 de reproduction, on lui ajoute 1 à chaque tour
                ++element.reproductionTours;
            }
        });
        // ajout des animaux
        if(nbFemelles || nbMales)
            console.log(nbFemelles,nbMales);
        
        for(let i=0;i<Math.min(nbMales,nbFemelles)*j.repro;++i){
            console.log("animal ajoute");
            animaux[j.name].push(new Animal(positionT,(Math.random() < 0.5)));
        }

        
    }
        
    let bagarre = (j)=>{
        // j c'est un joueur donnée
        let nomJoueurSansJ = [];
        joueurs.forEach((element,index) =>{
            if(j.name!=element.name) nomJoueurSansJ.push(element.name);
        });
        // pour tous les animaux du J
        animaux[j.name].forEach((animalJ,indexJ)=>{
        
            // on regarde pour tous les autres animaux des autres joueurs
            nomJoueurSansJ.forEach((nom,indN)=>{
                animaux[nom].forEach((ani,ida)=>{
                    // si les 2 animaux sont sur la même case
                    if(animalJ.position==ani.position){
                        // si l'animal du J est plus fort alors il pousse l'autre animal
                        let listeDirection = [deplacementHautGauche, deplacementHautDroite, deplacementGauche, deplacementDroite, deplacementBasGauche, deplacementBasDroite] //liste qui contient toutes les fonctions de déplacements
                        let deplacementRndm = listeDirection[Math.floor(Math.random() * listeDirection.length)];
                        if(animalJ.stats.force > ani.stats.force){
                        let jperdant;
                            joueurs.forEach((element,indew)=>{
                                if(element.name==nom) jperdant = element;
                            });    
                            deplacementRndm(ani,jperdant);
                        }
                        else // si l'autre pousse
                            deplacementRndm(animalJ,j);
                        
                    }
                });
            });
        });
    };

    //--------------------------------------------------------------------------------------------------------

    function jouerTour() { /*Fonction qui permet de gérer chaque tour, les déplacements..*/
        joueurs.forEach((value, index) => {
            if (animaux[value.name]) {
                animaux[value.name].forEach((animal) => {

                    tour++;

                    if(animal.stats.eau > 6 && animal.stats.faim > 6){
                        deplacementTanierePlusProche(value, animal);
                    }

                    else if(animal.stats.eau <= animal.stats.faim){
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
                    // genre quelque part par là
                    bagarre(value);
                    peutReproduire(value, tour);
                });
            } else {
                console.log("animaux[value.name] est pas dÃ©fini");
            }
            io.emit("jouerTour", animaux);
        });
    }
    socket.on("commencerJeu",commencerJeu);
});