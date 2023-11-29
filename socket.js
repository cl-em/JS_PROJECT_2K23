// console.log("test");
let socket = io();

// init
let nom = document.getElementById("name")
let repro = document.getElementById("repro");
let precep = document.getElementById("percep");
let force = document.getElementById("force");

//chat
let msg = document.getElementById("message");
let chat = document.getElementById("chat");

function entree(){
    let joueur = {name: nom.value,repro:repro.value,precep: precep.value,force:force.value};

    socket.emit("entree",joueur);
}

function message(){
    let message = {auteur:nom.value,text:msg.value};
    socket.emit("message",message);
    msg.innerText="";
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

socket.on("getJoueurs",(data)=>{
    joueurs=data;
})

let colors = {"roche":"#AAAAAA","prairie":"#86DC3D","eau":"#1AA7EC"}
socket.on("entree",(cases)=>{
    cases.forEach(element => {
        d3.select("#"+element[0]).attr("fill",colors[element[1]]);
    });
});

socket.on("commencerJeu",(data)=>{
    animaux = data;
});

socket.on("jouerTour",(data)=>{
    joueurs.forEach((value)=>{
        data[value.name].forEach((animal)=>{
            d3.select("#"+animal.position).attr("fill","red");
        });
    });
});