function deplacementTanierePlusProche(joueur, animal){
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