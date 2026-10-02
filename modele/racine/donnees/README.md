# Données de la plateforme

Tout le contenu structuré de la plateforme vit ici, en JSON. L'application (`app/`) le lit
et le modifie ; les fichiers Markdown lisibles sur GitHub en sont **générés**.

| Fichier | Contenu | Markdown généré |
|---|---|---|
| [dictionnaire.json](dictionnaire.json) | Termes, fichiers, commandes, outils, tags, statuts, importance | [dictionnaire.md](dictionnaire.md) |
| [pratiques.json](pratiques.json) | Bonnes pratiques, thèmes, états, historique des révisions | [pratiques.md](pratiques.md) |
| [parcours.json](parcours.json) | Les étapes (résumé, objectifs, notions, ressources, exercices, questions IA) | `NN-etape/README.md` |
| [metier.json](metier.json) | L'objectif : fiche métier ou niveau visé | [metier/README.md](../metier/README.md) |

> Les fichiers Markdown générés ne se modifient pas à la main : la modification
> serait écrasée au prochain enregistrement.

**Exception : les cours.** Le texte de chaque étape (schémas, tableaux, exemples,
pièges) est dans `NN-etape/cours.md`, écrit à la main selon
[\_modeles/style.md](../_modeles/style.md). Il n'est pas en JSON parce
qu'il est long et riche en mise en forme. L'application l'affiche dans la page de
l'étape, en lecture seule : il est intégré au moment du build (`npm run dev` le
recharge à chaque modification).

## Lancer l'application

Prérequis : Node.js 22 ou plus.

```bash
cd app
npm install        # la première fois seulement
npm run dev        # ouvre http://localhost:5173
```

Chaque modification est **écrite dans le JSON concerné**, après validation de
l'ensemble, et tous les Markdown sont régénérés. Il reste à committer avec Git.

Construite en site statique (`npm run build`, dossier `dist/`), l'application
passe en **mode navigateur** : les modifications restent dans le navigateur, et
*Exporter* télécharge un fichier unique avec les quatre jeux, à reporter dans
`donnees/`.

### Sections de l'application

- **Accueil** : avancement global, étape à reprendre, compteurs, nouveautés de la veille,
  pratique à appliquer.
- **Parcours** : une page par étape, en onglets : cours (`cours.md`), notions à cocher
  (reliées au dictionnaire), exercices (énoncé, fait), ressources (lu, avis, notes),
  questions à poser au professeur. Le bilan est calculé.
- **Dictionnaire** : recherche, filtres, fiche de chaque mot (statut, « +1 vu », mots
  liés, notes).
- **Pratiques** : classées par thème, case « je l'applique », badge des révisions
  récentes de la veille.
- **Objectif** : la fiche métier ou le niveau visé, avec l'avancement de chaque
  compétence calculé à partir des étapes qui la couvrent.

L'interface **suit** l'apprentissage (cases, statuts, notes). Le **contenu** (étapes,
cours, mots, pratiques) s'écrit avec `/apprentissage:mettre-a-jour`, ou à la main dans
le JSON puis `npm run normaliser`.

## Contrôles

Dans `app/` :

- `npm run valider` : vérifie les quatre fichiers et leurs références croisées
  (étapes du parcours, liens vers le dictionnaire), et signale les cours ou énoncés
  manquants.
- `npm run normaliser` : applique les règles calculées et régénère tous les Markdown.

Sur GitHub, chaque push vérifie aussi que `npm run normaliser` ne change plus rien.

## Dictionnaire (dictionnaire.json)

### Structure d'une entrée

```json
{
  "id": "index",
  "terme": "Index",
  "type": "terme",
  "categorie": "fondamentaux",
  "definition": "Structure qui accélère la recherche dans une table…",
  "etapes": [2],
  "tags": ["base", "essentiel", "mature"],
  "liens": ["table", "requete"],
  "statut": "en-cours",
  "commentaire": "Mes notes personnelles",
  "ressources": [{ "titre": "Documentation officielle", "url": "https://…" }],
  "actualites": [{ "date": "2026-10-05", "titre": "Nouvel événement…", "url": "https://…" }],
  "vus": 2,
  "source": "manuel",
  "ajoute_le": "2026-09-30",
  "modifie_le": "2026-10-01"
}
```

| Champ | Signification |
|---|---|
| `type` | `terme`, `outil` ou `thematique` |
| `liens` | identifiants des mots liés (sens unique ; l'interface affiche le sens inverse) |
| `statut` | `a-decouvrir`, `en-attente`, `en-cours`, `acquis`, `pas-interesse` |
| `tags` | identifiants de tags, voir le tableau ci-dessous |
| `actualites` | nouveautés ajoutées par la veille hebdomadaire |
| `vus` | nombre de fois où je l'ai croisée moi-même (bouton « +1 vu ») ; facultatif, 0 par défaut |
| `source` | `manuel` ou `veille` (entrée créée par la veille) |

## Bonnes pratiques (pratiques.json)

Le tableau `pratiques` de `pratiques.json` regroupe les bonnes pratiques du sujet. La **veille hebdomadaire** les fait évoluer (voir
[veille/PROMPT.md](../veille/PROMPT.md)).

```json
{
  "id": "verifier-avant",
  "titre": "Vérifier le plan d'exécution avant d'ajouter un index",
  "theme": "pratique",
  "etat": "recommandee",
  "pourquoi": "Un index inutile ralentit les écritures…",
  "comment": ["Lire le plan, repérer le parcours complet de table, puis indexer."],
  "liens": ["index"],
  "sources": [{ "titre": "Documentation officielle", "url": "https://…" }],
  "historique": [{ "date": "2026-10-12", "note": "Ce qui a changé", "url": "https://…" }],
  "appliquee": false,
  "source": "manuel",
  "ajoute_le": "2026-10-01",
  "modifie_le": "2026-10-01"
}
```

| Champ | Signification |
|---|---|
| `theme` | identifiant de `themes` (liste en haut du fichier) |
| `etat` | `recommandee`, `a-surveiller` (évolue ou fait débat), `depassee` (gardée pour mémoire) |
| `liens` | identifiants des entrées du dictionnaire concernées |
| `historique` | révisions successives, ajoutées par la veille ; une révision de moins de 30 jours affiche « Mise à jour » |
| `appliquee` | **donnée personnelle** : je l'applique dans mes projets. La veille n'y touche jamais |

En mode navigateur, les pratiques du dépôt remplacent celles gardées dans le
navigateur à chaque chargement, sauf la case `appliquee`.

## Parcours (parcours.json)

Une étape :

```json
{
  "id": 2,
  "dossier": "02-index",
  "libelle": "Les index",
  "optionnel": false,
  "resume": "…",
  "objectifs": ["…"],
  "notions": [{ "id": "index", "libelle": "À quoi sert un index", "liens": ["index"], "acquise": false }],
  "ressources": [{ "id": "doc-index", "titre": "…", "url": "https://…", "type": "tutoriel", "langue": "FR", "lu": false, "avis": "", "notes": "" }],
  "exercices": [{ "id": "premier-index", "titre": "…", "notion": "…", "consigne": "…", "dossier": "01-premier-index", "fait": false }],
  "questions_ia": ["…"]
}
```

- `dossier` : nom du dossier de l'étape à la racine du dépôt ; son `README.md` est
  généré, son `cours.md` est écrit à la main.
- `optionnel` : l'étape ne compte pas dans l'avancement global.
- `liens` d'une notion : identifiants d'entrées du dictionnaire.
- `type` d'une ressource : identifiant de `types_ressources`.
- `dossier` d'un exercice : sous-dossier de `NN-etape/exercices/` qui contient son
  `enonce.md` et ses fichiers de travail.
- L'avancement d'une étape est la moyenne des notions acquises, ressources lues et
  exercices faits : il n'est jamais saisi.

## Métier (metier.json)

`intitule`, `sous_titre`, `resume`, `infos` (`{ libelle, valeur }`) puis des
`sections`, chacune d'un `type` :

| Type | Contenu |
|---|---|
| `texte` | `texte` |
| `liste`, `numerotee` | `items` : liste de phrases |
| `tableau` | `colonnes` et `lignes` (autant de cellules que de colonnes) |
| `competences` | `lignes` : `{ bloc, competence, niveau, etapes: [1, 3] }` ; l'avancement vient des étapes |

Dans tous les textes, `**gras**`, `==surligné==` et `[texte](https://…)` sont acceptés.

## Tags

| Groupe | Valeurs |
|---|---|
| Niveau | `base`, `avance`, `expert` |
| Priorité | `essentiel`, `optionnel` |
| Nature | `aller-plus-loin`, `autre-solution` |
| Cycle de vie | `emergent`, `mature`, `en-declin` |

D'autres groupes peuvent s'ajouter selon le sujet (par exemple *Coût / licence* pour
des outils, *Certification* pour préparer un examen) : `groupes_tags` puis `tags`.

## Importance

L'importance n'est pas saisie : elle est **calculée** à partir du nombre
d'occurrences d'une notion.

> occurrences = `vus` + nombre de semaines distinctes où la veille l'a citée (dans `actualites`)

| Occurrences | Importance |
|---|---|
| 0 à 2 | 1 · Mentionnée |
| 3 à 5 | 2 · Courante |
| 6 à 9 | 3 · Importante |
| 10 et plus | 4 · Essentielle, avec ajout automatique du tag **Essentiel** |

- Les seuils et les libellés se règlent dans `importance` en haut du JSON
  (`seuils`, `libelles`, `tag_auto`).
- Le tag automatique est **ajouté** au dernier niveau, mais n'est jamais retiré :
  un Essentiel posé à la main reste.
- L'interface l'applique à chaque modification. Après une édition manuelle du JSON,
  lancer `npm run normaliser` (dans `app/`), qui applique la règle et régénère
  les Markdown.

## Faire évoluer le dictionnaire

- **Nouvelle valeur de tag, de statut ou de type** : l'ajouter dans la liste
  correspondante en haut de `dictionnaire.json` (`tags`, `statuts`, `types`). Les
  étapes, elles, sont celles de `parcours.json`. L'interface s'adapte
  automatiquement.
- **Nouveau champ** : l'ajouter aux entrées, puis dans
  `app/src/pages/DictionnairePage.jsx` pour l'afficher.
- **Contrôle** : `npm run valider` (dans `app/`) vérifie les identifiants, les liens
  et les valeurs. Sur GitHub, chaque push vérifie aussi que `npm run normaliser`
  ne change plus rien.
