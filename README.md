
# JS_PROJECT_2K23

Projet réalisé par Rigaud Kylian et Joigneault Clément

Lien vers le github du projet: https://github.com/cl-em/JS_PROJECT_2K23

- On a limité le nombre maximum d'animaux par équipe à 15, la population d'un joueur accroit de façon exponentielle

- Les tanières sont lié par un tunnel spatio-temporel (juste un bug), deux animaux d'une même équipe peuvent se reproduire, même si ils se retrouvent dans deux tanières différentes (#feature???).


<img src="./rongeur1.png" width="150">

## Les fonctionnalitées 
### Coté serveur
- serveur express, socket.io
- class Animal permettant de définir les animaux 
- génération du terrain
- gestion automatique des hôtes
- déroulement de la partie
- déplacement complexe et intelligent, l'animal ira là où il a besoin en fonction de sa faim et son hydratation
- l'animal peut aller directement à sa tanière si la tanière est à la porté de sa perception
- reproduction 
- combat entre 2 animaux de joueurs différents


### Coté client 
- le joueur peut choisir son pseudo, ses statistiques (perception, force, reproduction) et changer le nombre de joueurs de la partie s'il est hôte
- affichage du terrain avec d3
- les tanières sont mis en avant avec une image, les animaux également

![background](./background.png)