function creeHexagone(rayon){
    let points = new Array();
    for(let i=0;i<6;++i){
        let angle = i*Math.PI /3;
        let x = Math.sin(angle)*rayon;
        let y = -Math.cos(angle)*rayon;
        points.push([Math.round(x*100)/100,Math.round(y*100)/100]);
    }
    return points;
}


function creerTablier(nblignes,nbcolonnes){

    let rayon = 25;
    let distance = rayon - (Math.sin(1*Math.PI /3) *rayon);
    let hex = creeHexagone(rayon);
    d3.select("#tablier").append("svg").attr("width",nbcolonnes*1.33*2*rayon).attr("height",nblignes*2*rayon).attr("id","svgTablier");

    
    for(let ligne=0;ligne<nblignes;ligne++){
        for(let colonne=0;colonne<nbcolonnes;colonne++){


            d="";
            for(h in hex){
                let x=hex[h][0] +(rayon-distance)*(2+ligne%2+2*colonne);
                let y=hex[h][1] + distance*2 +(rayon-distance*2)*(1+2*ligne);

                if(h==0)
                    d+="M"+x+" , "+y+" L";
                else  d+=""+x+" , "+y+" ";

            }
            d+="Z"
            d3.select("#svgTablier")
            .append("path")
            .attr("d",d)
            .attr("stroke","black").attr("fill","white")
            .attr("id","h"+(ligne*nblignes+colonne))
            .on("click",function(){
                let hexagoneId = d3.select(this).attr("id");
                // if(d3.select(this).attr("fill")=="white"){
                //     d3.select("#" + hexagoneId).attr("fill", "blue");

                // }else{
                //     d3.select("#" + hexagoneId).attr("fill", "white");
                // }
                
                socket.emit("oncarre",hexagoneId);

            });
        }
    }
}

// d3.select("#tablier").append("circle").attr("cy","50").attr("cx","50").attr("r","25").attr("fill","red");
creerTablier(11,11);




// let socket = io();
socket.emit("auchargement");

socket.on("oncarre",data=>{
    d3.select("#" + data).attr("fill", "blue");
});

socket.on("auchargement",(data)=>{
    data.forEach(element => {
        d3.select("#"+element).attr("fill","blue");
    });
});