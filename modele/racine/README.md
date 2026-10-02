# {{titre}}

{{sujet}}

Plateforme d'apprentissage créée avec le plugin `apprentissage` du hub `atelier`.

## Démarrer

```bash
cd app
npm install        # la première fois seulement
npm run dev        # ouvre http://localhost:5173
```

- Les cases cochées, statuts et notes sont **écrits dans [donnees/](donnees/)**.
- Il reste à committer avec Git.

## Les étapes

La liste et l'avancement sont dans l'application (section **Parcours**) et dans
chaque `NN-etape/README.md`.

Chaque étape a :
- `cours.md` : **le cours**, avec schémas ;
- `README.md` : **généré** (objectifs, notions, ressources, exercices, bilan) ;
- `exercices/` : un dossier par exercice, avec son `enonce.md`.

## Ce que contient l'application

| Section | Contenu |
|---|---|
| Accueil | Avancement, étape à reprendre, nouveautés de la veille |
| Parcours | Cours, notions, exercices, ressources, questions |
| Dictionnaire | Mots du domaine, statut, mots liés, notes |
| Pratiques | Bonnes pratiques, case « je l'applique » |
| Objectif | Ce que je vise, avancement par compétence |

Option **Lecture confortable** en bas de page : texte plus grand et plus espacé.

## Faire évoluer la plateforme

Avec le plugin `apprentissage` dans Claude Code :

| Commande | Rôle |
|---|---|
| `/apprentissage:mettre-a-jour` | Ajouter une étape, compléter un cours, des mots, des exercices, lancer la veille, mettre l'application à niveau |
| `/apprentissage:professeur` | Une session de professeur sur le sujet, qui connaît la plateforme |

Format des données : [donnees/README.md](donnees/README.md). Style des cours :
[_modeles/style.md](_modeles/style.md).

## Sur téléphone

```bash
cp .env.example .env
docker compose up -d --build     # http://<machine>:8080
```

Hébergement, accès sécurisé et synchronisation GitHub :
[deploiement/README.md](deploiement/README.md).

## Organisation

```
{{name}}/
├── app/              ← application React (design Contraste Fin)
├── donnees/          ← source de vérité (JSON) + Markdown générés
├── metier/           ← objectif, généré
├── NN-etape/         ← cours.md, README.md généré, exercices/
├── veille/           ← consigne et rapports de la veille
├── _modeles/         ← modèles de cours et d'exercice, style.md
├── deploiement/      ← hébergement
└── plateforme.json   ← version du modèle, couleur, sujet
```
