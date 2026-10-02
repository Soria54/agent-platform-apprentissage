---
name: mettre-a-jour
description: Met à jour une plateforme d'apprentissage existante - ajouter ou compléter une étape, un cours, des schémas, des mots, des exercices, des ressources ou des pratiques, réécrire un cours au format court et en listes, lancer la veille, ou mettre l'application à la dernière version du modèle (y compris migrer un ancien parcours comme parcours-ia ou parcours-big-data). À utiliser dans le dépôt d'une plateforme quand l'utilisateur veut la faire évoluer.
argument-hint: "[ce qu'il faut changer] [dossier]"
disable-model-invocation: true
---

# Mettre à jour une plateforme d'apprentissage

Demande de l'utilisateur : $ARGUMENTS

Ressources :
- `${CLAUDE_PLUGIN_ROOT}/pedagogie/STYLE.md` : **règles de rédaction**, pour tout ce que tu
  écris, y compris tes messages.
- `donnees/README.md` de la plateforme : format des données.
- `_modeles/cours.md` et `_modeles/exercice.md` de la plateforme.

La plateforme est le dossier indiqué, sinon le dossier courant. Elle contient
`donnees/parcours.json`. Lis `plateforme.json`, `CLAUDE.md` et `donnees/parcours.json`
avant de commencer.

## Règles communes

- **Données personnelles intouchables**, sauf demande explicite : `acquise`, `lu`, `fait`,
  `avis`, `notes` (parcours), `statut`, `commentaire`, `vus` (dictionnaire), `appliquee`
  (pratiques).
- Ne supprime jamais un mot ni une pratique : passe une pratique à `depassee`.
- Vérifie les faits (WebSearch, WebFetch) avant de les écrire. Cite la source dans les
  ressources.
- Après toute modification de `donnees/` :
  ```bash
  cd app && npm run valider && npm run normaliser
  ```
- Dépôt git propre avant de commencer (`git status`), sinon demande quoi faire.
- Travaille sur une branche `maj/<sujet-court>` créée depuis la branche courante.
- Commits en anglais, conventional commits (`feat(content): …`, `docs(course): …`). Jamais
  `--no-verify`. Pas de push sans demande.

## 1. Choisir le type de mise à jour

Déduis-le de la demande. Si elle est vague, propose cette liste et demande lequel :

| Type | Exemples |
|---|---|
| **A. Contenu** | Ajouter une étape, compléter un cours, ajouter des mots, des exercices |
| **B. Style** | Réécrire un cours trop long, ajouter des schémas et des points en évidence |
| **C. Veille** | Lancer la veille de la semaine maintenant |
| **D. Application** | Nouvelle version du modèle ou du design, migrer un ancien parcours |

Annonce en 3 lignes ce que tu vas faire. Pour A et D, **attends la validation**.

## A. Contenu

- **Nouvelle étape** :
  1. Propose : libellé, résumé, notions, place dans le parcours. Attends la validation.
  2. Ajoute-la dans `parcours.json` (même règles que `/apprentissage:creer`, étape 4).
     Pour l'insérer au milieu, renumérote les `id` et les `dossier` suivants (`git mv`), et
     mets à jour les `etapes` du dictionnaire et des compétences de `metier.json`.
  3. Ajoute les mots nouveaux dans `dictionnaire.json`.
  4. Lance le sous-agent `apprentissage:redacteur` pour le cours et les énoncés.
- **Compléter un cours** : lis le cours, puis ajoute ce qui manque en gardant sa structure.
  Délègue au rédacteur si c'est plus qu'une section.
- **Mots, pratiques, ressources, exercices** : ajoute-les en respectant le format. Relie
  chaque nouveau mot à ses voisins (`liens`) et à ses étapes.

## B. Style

1. Lis les cours concernés (tous si la demande est générale).
2. Fais un bilan court par cours, avec la liste « Vérifier avant de livrer » de STYLE.md :
   paragraphes trop longs, schéma absent, mises en évidence trop nombreuses ou absentes,
   sigles non développés.
3. Réécris, un cours à la fois (ou un rédacteur par cours, en parallèle) :
   - **garde tout le fond** : faits, exemples, code, liens ;
   - change la forme : listes, phrases courtes, schéma, `==…==`, encadrés `[!IMPORTANT]` ;
   - montre le résultat d'un premier cours et attends l'avis de l'utilisateur avant de
     faire les autres.

## C. Veille

Suis `veille/PROMPT.md` à la lettre : il dit quoi chercher, quoi modifier, et comment
livrer (rapport, branche `veille/AAAA-Sxx`, pull request si le dépôt a un distant). Si le
dépôt n'a pas de distant, commite sur la branche et dis-le.

Pour une veille automatique chaque semaine, propose une tâche planifiée (routine Claude Code
ou GitHub Actions) qui lance cette consigne. Ne la crée que sur demande.

## D. Application

Met `app/` à la dernière version du modèle : composants du plugin `design`, pages de la
plateforme, scripts. **Ne touche pas** à `donnees/`, aux cours, aux exercices, à
`README.md` ni à `CLAUDE.md` (sauf s'il manque).

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/mettre-a-niveau.mjs" <plateforme> [--couleur <couleur>] [--infra]
```

- `--infra` : remplace aussi Dockerfile, docker-compose.yml, `.github/workflows/plateforme.yml`
  et `deploiement/`. À utiliser si l'utilisateur le veut, ou pour une migration.
- Le script refuse un dépôt avec des modifications non commitées.

### Migrer un ancien parcours (parcours-ia, parcours-big-data…)

Ces dépôts ont le même format de données, mais une ancienne application sans le design
Contraste Fin.

1. Choisis la couleur avec le guide `design` et annonce-la. Demande le sujet en une phrase
   s'il n'est pas clair dans le `README.md`.
2. Lance le script avec `--titre`, `--sujet`, `--couleur` et `--infra`.
3. Le script signale les anciens fichiers : vérifie-les puis supprime-les (`git rm`), par
   exemple `.github/workflows/parcours.yml` (remplacé par `plateforme.yml`) ou
   `metier/<ancien-nom>.md` (remplacé par `metier/README.md`). Corrige les liens vers eux
   (`README.md`, `veille/PROMPT.md`, `CLAUDE.md`).
4. Champs inconnus du nouveau modèle (par exemple `cloud` sur une étape) : garde-les dans le
   JSON, ils ne gênent pas. Signale-les à l'utilisateur.
5. Un `projet-fil-rouge/` ou d'autres dossiers propres au dépôt restent tels quels.

### Après le script

```bash
cd app && npm install
npm run valider && npm run lint && npm run format:check && npm run build
```

Puis l'audit et les captures du plugin `design` (voir `/apprentissage:creer`, étape 7).
Compare avec l'ancienne version si c'est une migration. Commit :
`refactor(app): upgrade to platform template <version>`.

## Livrer

Résume selon STYLE.md :
- la branche et les commits ;
- ce qui a changé (liste) ;
- ce qui reste à faire ou à vérifier ;
- pour une veille : les points qui rendent un cours faux, en premier.
