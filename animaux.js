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