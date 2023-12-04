// console.log("test");
let socket = io();

// init
let nom = document.getElementById("name");
let repro = document.getElementById("nbr1");
let precep = document.getElementById("nbr2");
let force = document.getElementById("nbr3");

//chat
let msg = document.getElementById("message");
let chat = document.getElementById("chat");

function entree(){
    let joueur = {name: nom.value,repro:repro.value,precep: precep.value,force:force.value};
    document.getElementById('messageConnexion').textContent = "Connecté en tant que " + nom.value;
    socket.emit("entree",joueur);
}

function sortie(){
    document.getElementById('messageConnexion').textContent = '';
    socket.emit("sortie");
}

function message(){
    let message = {auteur:nom.value,text:msg.value};
    socket.emit("message",message);
    msg.innerText="";
}

function commencerJeu(){
    socket.emit("commencerJeu");
}

socket.on("message",(data)=>{
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

let colors = {"roche":"#AAAAAA","prairie":"#86DC3D","eau":"#1AA7EC"}
const resetDamier = () =>{
    damier.forEach(element=>{
        d3.select("#"+element[0]).attr("fill",colors[element[1]]);
    });
}
socket.on("entree",(cases)=>{
    damier = cases;
    cases.forEach(element => {
        d3.select("#"+element[0]).attr("fill",colors[element[1]]);
    });
});

socket.on("commencerJeu",(data)=>{
    animaux = data;

    resetDamier();

    joueurs.forEach((value)=>{
        data[value.name].forEach((animal)=>{
            d3.select("#h"+animal.position).attr("fill","red");
        });
    });

});

socket.on("jouerTour",(data)=>{

    resetDamier();
    animaux = data;
    joueurs.forEach((value)=>{
        data[value.name].forEach((animal)=>{
            d3.select("#h"+animal.position).attr("fill","red");
        });
    });
});