---
name: creer
description: Crée de zéro une plateforme d'apprentissage sur un sujet (application React avec cours, schémas, dictionnaire, exercices, bonnes pratiques et suivi de l'avancement), avec le design Contraste Fin du plugin design. À utiliser quand l'utilisateur veut apprendre un nouveau sujet et démarrer une plateforme ou un parcours pour lui.
argument-hint: "[sujet] [dossier]"
disable-model-invocation: true
---

# Créer une plateforme d'apprentissage

Demande de l'utilisateur : $ARGUMENTS

Ressources (lis-les avant de commencer) :
- `${CLAUDE_PLUGIN_ROOT}/pedagogie/STYLE.md` : **règles de rédaction**. Elles valent pour tout
  ce que tu écris : cours, définitions, énoncés, et tes messages à l'utilisateur.
- `${CLAUDE_PLUGIN_ROOT}/modele/racine/donnees/README.md` : format des données.
- `${CLAUDE_PLUGIN_ROOT}/modele/racine/_modeles/cours.md` et `exercice.md` : modèles.
- Le guide du plugin `design` (`design/GUIDE.md`) : son chemin est affiché par le script de
  l'étape 3 (« Plugin design : … »). Lis-le pour choisir la couleur.

Le plugin `design` est une dépendance : il est installé avec celui-ci. S'il est introuvable,
le script le dit ; propose alors `/plugin install design@atelier`, ou un clone de
`https://github.com/Soria54/agent-design.git` passé avec `--design <dossier>`.

## 1. Comprendre le besoin

Il te faut :
- le **sujet** et son périmètre ;
- le **dossier** de destination (par défaut : un nouveau dossier au nom du sujet, à côté du
  dossier courant) ;
- le **niveau de départ** de l'utilisateur ;
- l'**objectif** : un métier, un niveau, un examen, un projet à réaliser ;
- le **temps** disponible par semaine, si possible.

Prends ce que contient la demande. Pose **une seule question groupée**, en liste, pour ce
qui manque. Ne demande pas ce que tu peux déduire.

## 2. Proposer un plan et le faire valider

Recherche d'abord le sujet (documentation officielle, cours reconnus) avec WebSearch et
WebFetch. Puis présente, en suivant STYLE.md :

- **Les étapes** : 4 à 8, numérotées, chacune avec un libellé court et un résumé d'une ligne.
  Marque « optionnelle » une étape d'approfondissement.
- **Un schéma du parcours** en texte (conversation), par exemple :
  ```
  01 Bases ──▶ 02 … ──▶ 03 … ──▶ 04 Projet
  ```
- **La couleur** de mise en évidence : choisie avec le tableau « Choisir la couleur d'un
  projet » du guide `design`, annoncée en une phrase (« Je prends Mizu : c'est un sujet de
  lecture et de documentation. »). À défaut, `mizu` va bien à l'apprentissage.
- **L'objectif** affiché dans la page « Objectif » (intitulé et 3 à 6 compétences).

**Attends la validation de l'utilisateur** avant d'écrire quoi que ce soit.

## 3. Créer le squelette

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/creer-plateforme.mjs" <dossier> \
  --titre "<Titre court>" --sujet "<Le sujet en une phrase>" \
  --couleur <couleur> --objectif "<Intitulé de l'objectif>"
```

Le script :
- crée `app/` avec le modèle du plugin `design` (`create-project.mjs`, couleur appliquée),
  puis ajoute les pages de la plateforme ;
- copie la racine : `donnees/` vides, `veille/`, `_modeles/` (dont `style.md`),
  `deploiement/`, Docker, workflow GitHub, `README.md`, `CLAUDE.md`, `plateforme.json`.

## 4. Remplir les données

Écris les fichiers de `donnees/` en respectant `donnees/README.md` :

1. **`parcours.json`** : une entrée par étape validée.
   - `dossier` de la forme `01-nom-court`.
   - 3 à 6 `notions`, chacune reliée (`liens`) aux mots du dictionnaire.
   - 2 à 5 `ressources` **vérifiées** (l'URL répond, la source est fiable), en français si
     possible, sinon `"langue": "EN"`.
   - 1 à 3 `exercices` avec un `dossier` (`01-nom`).
   - 2 à 4 `questions_ia` : des questions pour **comprendre**, pas pour faire à sa place.
   - Toutes les cases à `false` : `acquise`, `lu`, `fait`.
2. **`dictionnaire.json`** : 15 à 40 mots.
   - `categories` adaptées au sujet (3 à 8).
   - Chaque définition : 1 ou 2 phrases courtes, selon STYLE.md.
   - Tags : un de niveau, un de cycle de vie ; `essentiel` pour les mots indispensables.
   - Ajoute un groupe de tags propre au sujet seulement s'il sert (coût, certification…).
   - `statut: "a-decouvrir"`, `vus: 0`, `source: "manuel"`.
3. **`pratiques.json`** : 5 à 10 bonnes pratiques du domaine. Adapte les `themes`.
4. **`metier.json`** : l'objectif, avec une section `competences` reliée aux étapes. Une
   section `liste` « Ce qu'il ne faut pas faire » est souvent utile.

5. **`memoire/apprenant.md`** : complète le « Profil » (niveau de départ, objectif, temps
   disponible) et « Ce qui m'aide » avec ce que l'utilisateur a dit à l'étape 1. Ce fichier
   est importé par `CLAUDE.md` : toutes les sessions dans la plateforme le connaîtront, et
   `/apprentissage:professeur` le tiendra à jour.

Puis :
```bash
cd <dossier>/app && node scripts/cli.js valider && node scripts/cli.js normaliser
```

`normaliser` génère aussi `memoire/etat.md` (avancement), importé par `CLAUDE.md`.

## 5. Rédiger les cours et les énoncés

Pour chaque étape, lance le sous-agent **`apprentissage:redacteur`**. Lance-les **en
parallèle** (un message, plusieurs appels). Donne à chacun :
- le chemin de la plateforme et le numéro de l'étape ;
- le chemin de `${CLAUDE_PLUGIN_ROOT}/pedagogie/STYLE.md` ;
- le contexte de l'utilisateur (niveau, objectif) ;
- les étapes voisines (pour les liens « Pour aller plus loin »).

Chaque rédacteur écrit `NN-etape/cours.md` et `NN-etape/exercices/<dossier>/enonce.md`. Il
ne modifie pas `donnees/` : il renvoie les ressources supplémentaires qu'il a trouvées.
Ajoute-les toi-même dans `parcours.json`.

Relis ensuite chaque cours avec la liste « Vérifier avant de livrer » de STYLE.md. Corrige.

## 6. Compléter

- `veille/sources.md` : les sources officielles et les actualités du domaine.
- `veille/PROMPT.md` : précise, dans « Ce qu'il faut chercher », ce qui bouge vraiment dans ce
  domaine. Si le sujet évolue peu (histoire, mathématiques…), dis-le à l'utilisateur : la
  veille hebdomadaire est alors facultative.
- `README.md` : remplace la phrase sous « Les étapes » par un tableau `| # | Étape | Notions |`.

## 7. Vérifier

```bash
cd <dossier> && git init -b main
cd app && npm install
npm run valider && npm run normaliser
npm run lint && npm run format:check && npm run build
node "<plugin design>/scripts/audit.mjs" .
```

- Tout doit passer. L'audit ne doit trouver aucune classe de palette ni couleur en dur hors
  de `src/styles/highlight.css` (généré). Le style inline de `Progress` est attendu.
- `npm run valider` doit n'afficher **aucun** point à compléter.
- Captures avec le script du plugin `design` :
  ```bash
  npm i --no-save playwright
  npx vite --port 5199 --strictPort &
  node "<plugin design>/scripts/screenshots.mjs" --url http://localhost:5199 --out captures \
    --routes / "/#/parcours/1" "/#/dictionnaire" "/#/pratiques" "/#/metier"
  ```
  Regarde-les, sur ordinateur et sur mobile. Corrige ce qui déborde ou s'écarte du guide.
  Les schémas Mermaid se chargent en différé : vérifie-les dans `/#/parcours/1` si besoin.
  Arrête le serveur ensuite.

## 8. Livrer

- Commit initial (les hooks Husky vérifient le message) :
  `feat: create learning platform for <sujet>`. Jamais `--no-verify`.
- Ne pousse pas et ne crée pas de dépôt GitHub sans demande. Propose-le.
- Résume, selon STYLE.md :
  - le dossier et la commande `cd app && npm run dev` ;
  - les étapes (liste numérotée) ;
  - la couleur et pourquoi ;
  - ce qui reste à faire (veille à programmer, hébergement : `deploiement/README.md`) ;
  - les commandes suivantes : `/apprentissage:mettre-a-jour`, `/apprentissage:professeur`.
