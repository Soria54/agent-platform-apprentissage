# Consigne de la veille hebdomadaire

Consigne suivie par l'agent de veille. La modifier suffit à faire évoluer la veille.

## Objectif

Chaque semaine, repérer ce qui a changé sur **{{sujet}}**, puis enrichir le dictionnaire
et les bonnes pratiques (dossier `donnees/`).

Le contexte de l'apprenant est dans [../CLAUDE.md](../CLAUDE.md).

## Ce qu'il faut chercher (7 derniers jours)

1. **Nouveautés** qui touchent les notions des étapes (`donnees/parcours.json`).
   Changements qui rendent un cours faux en priorité.
2. **Nouveaux termes ou outils** devenus courants dans le domaine.
3. **Bonnes pratiques** nouvelles, révisées ou devenues dépassées.

Sources à privilégier : [sources.md](sources.md).

- Toujours citer une source vérifiable (site officiel, notes de version, publication
  reconnue).
- Ne rien inventer : si rien de nouveau pour un sujet, ne rien écrire.

## Ce qu'il faut modifier

Dans `donnees/dictionnaire.json` :

- **Entrée existante** : ajouter un élément à `actualites` :
  `{ "date": "AAAA-MM-JJ", "titre": "phrase courte en français", "url": "…" }`.
- **Nouvelle entrée** (5 au maximum par semaine) :
  - structure décrite dans `donnees/README.md` ;
  - `"source": "veille"`, `"statut": "a-decouvrir"` ;
  - un tag de niveau et un tag de cycle de vie ;
  - une définition courte, selon [../_modeles/style.md](../_modeles/style.md) ;
  - des `liens` vers les entrées existantes et au moins une ressource fiable.
- **Tag de cycle de vie** : le changer seulement si une source le justifie, et le
  signaler dans le rapport.

Dans `donnees/pratiques.json` :

- **Pratique révisée** : mettre à jour `pourquoi` ou `comment`, ajouter une ligne à
  `historique` (`{ "date", "note", "url" }`), la source dans `sources`, et
  `modifie_le`.
- **État** : `a-surveiller` ou `depassee` seulement si une source le justifie, noté dans
  `historique`. Ne jamais supprimer une pratique.
- **Nouvelle pratique** (3 au maximum par semaine) : `"source": "veille"`,
  `"etat": "recommandee"`, `"appliquee": false`, un thème existant, une source, des
  `liens`.

**Ne jamais modifier** :
- les données personnelles : `statut`, `commentaire`, `vus` des mots, `appliquee` des
  pratiques ;
- `donnees/parcours.json`, `donnees/metier.json` et les `cours.md`.

Un cours devenu faux ou une ressource à ajouter **se proposent dans le rapport**.

## Puis

1. Écrire `veille/rapports/AAAA-Sxx.md` (semaine ISO), selon `_modeles/style.md` :
   - **en tête** : ce qui rend un cours faux, avec le fichier concerné ;
   - un résumé en 5 puces au maximum ;
   - les nouveautés, les entrées ajoutées, les pratiques révisées, chacune avec sa
     source et l'étape concernée.
2. Dans `app/` : `npm ci && npm run valider && npm run normaliser`. La validation doit
   passer. Lister dans le rapport les mots qui ont changé d'importance.
3. Committer sur une branche `veille/AAAA-Sxx` et ouvrir une pull request « Veille
   AAAA-Sxx » qui reprend le résumé. Ne pas la fusionner.

Rédiger en français.
