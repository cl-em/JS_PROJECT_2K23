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

// permet de récupérer la liste des joueurs
socket.on("getJoueurs",(data)=>{
    joueurs=data;
})

// colorie damier en fonction du type de la case (roche,prairie,eau,taniere)
let colors = {"roche":"#AAAAAA","prairie":"#86DC3D","eau":"#1AA7EC","taniere":"#582900"}
const resetDamier = () =>{
    let elementAsupprimer=[];
    let b = document.getElementsByClassName("brochet");
    for(let i=0;i<b.length;++i) {
        elementAsupprimer.push(b[i]);
        // console.log(i);
    }

    elementAsupprimer.forEach((element,index)=>{
        element.remove();
    });

    damier.forEach((element,index)=>{
        d3.select("#h"+index).attr("fill",colors[element]);
    });
}

// permet de récupérer toutes les cases du damier et colorie le damier 
socket.on("entree",(cases)=>{
    damier = cases;
    for(let i=0;i<cases.length;++i){
        if(cases[i]=="taniere"){
            let bbox = document.getElementById("h"+i).getBBox();
            let damier = document.getElementById("tablier");
            damier.innerHTML+=`<image class="taniere"
                                href = http://localhost:8888/taniere.png
                                x="${bbox.x-5}"
                                y="${bbox.y-6}"
                                width="50"  
                                height="60" 
                            />`
            

        }else{
            d3.select("#h"+i).attr("fill",colors[cases[i]]);
        }
    }
});

// récupérer la liste des animaux 
// animaux est un dictionnaire qui a pour clé le nom du joueur et pour valeur une liste contenant la liste des animaux
socket.on("commencerJeu",(data)=>{
    animaux = data;
});

// permet de jouer un tour, récupère le dictionnaire des animaux mis à jour et met en couleur une case où un animal se trouve dessus
// chaque joueur a une couleur différente
socket.on("jouerTour",(data)=>{
    // dico key : nom des joueurs, value : liste de Aminal

    resetDamier();
    animaux = data;
    joueurs.forEach((value)=>{
    // jooueurs liste avec des joueurs {name,repro,precep,force,couleur} // couelur de l'animal
        data[value.name].forEach((animal)=>{
            //d3.select("#h"+animal.position).attr("fill",value.couleur);
            let bbox = document.getElementById("h"+animal.position).getBBox();
            // console.log(hex);
            let damier = document.getElementById("tablier");
            damier.innerHTML+=`<image class="brochet"
                                href="https://cdn.discordapp.com/attachments/1053644743009112154/1187396592723038450/rongeur1.png?ex=6596bc40&is=65844740&hm=96a717f1e769abd058976943512275105b9454b676d4f9561ec87f8a77f659a1&"
                                x="${bbox.x-5}"  
                                y="${bbox.y-6}"  
                                width="50"  
                                height="60" 
                            />`;
        });
    });
});