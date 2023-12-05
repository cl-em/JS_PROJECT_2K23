let socket = io();

/*Permet de récupérer le nom ainsi que les stats définies*/
let nom = document.getElementById("name");
let repro = document.getElementById("nbr1");
let precep = document.getElementById("nbr2");
let force = document.getElementById("nbr3");

/*Pour le chat*/
let msg = document.getElementById("message");
let chat = document.getElementById("chat");

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function entree(){ /*Quand le joueur se connecte, via le bouton connexion*/
    let joueur = {name: nom.value,repro:repro.value,precep: precep.value,force:force.value}; /*Initialise le joueur*/
    document.getElementById('messageConnexion').textContent = "Connecté en tant que " + nom.value; /*Affiche un message de connexion*/
    socket.emit("entree",joueur);
}

function sortie(){ /*Quand le joueur se déconnecte, via le bouton déconnexion*/
    document.getElementById('messageConnexion').textContent = ''; /*Supprime le message de connexion*/
    socket.emit("sortie",nom.value);
    nom.value="";
}

function message(){ /*Pour gérer le chat*/
    let message = {auteur:nom.value,text:msg.value};
    socket.emit("message",message);
    msg.innerText="";
}

function commencerJeu(){
    socket.emit("commencerJeu");
}
socket.on("msgserv",(msg)=>{
    document.getElementById("veuillez").innerText=msg;
});

socket.on("message",(data)=>{ /*Pour envoyer des gifs dans le chat __'*/
    if(data.text.endsWith(".gif")){
        chat.innerHTML+="<p>"+data.auteur+"</p>"+`<img src="${data.text}" width="100" height=100/>`
    }else{
    chat.innerText+=data.auteur+" : "+data.text+"\n";
    }   
});

let joueurs;
let animaux;
let damier;

socket.on("getJoueurs",(data)=>{
    joueurs=data;
})

let colors = {"roche":"#AAAAAA","prairie":"#86DC3D","eau":"#1AA7EC","taniere":"#582900"}
const resetDamier = () =>{
    damier.forEach((element,index)=>{
        d3.select("#h"+index).attr("fill",colors[element]);
    });
}
socket.on("entree",(cases)=>{
    damier = cases;
    // cases.forEach(element => {
    //     d3.select("#"+element[0]).attr("fill",colors[element[1]]);
    // });

    for(let i=0;i<cases.length;++i){
        d3.select("#h"+i).attr("fill",colors[cases[i]]);
    }
});

socket.on("commencerJeu",(data)=>{
    animaux = data;
});

socket.on("jouerTour",(data)=>{

    resetDamier();
    animaux = data;
    joueurs.forEach((value)=>{
        data[value.name].forEach((animal)=>{
            d3.select("#h"+animal.position).attr("fill",value.couleur);
        });
    });
});