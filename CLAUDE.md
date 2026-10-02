# agent-platform-apprentissage : plugin Claude Code `apprentissage`

Ce dépôt est le plugin **`apprentissage`**. Il crée et met à jour des **plateformes
d'apprentissage** personnelles sur un sujet, et spécialise une session en professeur. Il est
distribué par le hub **`atelier`** (dépôt `Soria54/Atelier`).

- **Langue** : documentation, skills et interface en français. Commits en anglais,
  conventional commits.
- **Origine** : modèle tiré de `Soria54/parcours-ia` et `Soria54/parcours-big-data` (même
  format de données). Ne pas modifier ces dépôts depuis ici.
- **Design** : délégué au plugin `design` (`Soria54/agent-design`), déclaré en
  `dependencies` dans `plugin.json`. Ses règles (`design/GUIDE.md`) s'appliquent à `app/`.

## Profil de l'utilisateur (validé)

- Dyslexique : explications **courtes mais ouvertes**, **listes** plutôt que paragraphes,
  **schémas**, **points importants mis en évidence**.
- Ces règles sont dans `pedagogie/STYLE.md`, copié dans chaque plateforme
  (`_modeles/style.md`). Toute évolution passe par ce fichier.

## Organisation

| Chemin | Rôle |
|---|---|
| `.claude-plugin/plugin.json` | Manifeste (`name: apprentissage`, `dependencies: ["design"]`). **Augmenter `version` à chaque modification livrée** |
| `skills/creer/` | `/apprentissage:creer` : plan validé, squelette, données, cours (sous-agents), vérification |
| `skills/mettre-a-jour/` | `/apprentissage:mettre-a-jour` : contenu, style, veille, application (dont migration d'un ancien parcours) |
| `skills/professeur/` | `/apprentissage:professeur` : session de professeur sur un sujet |
| `agents/redacteur.md` | Rédige `cours.md` et `enonce.md` d'une étape ; ne touche pas `donnees/` |
| `pedagogie/STYLE.md` | Règles de rédaction |
| `modele/app/` | Fichiers posés **par-dessus** le modèle `design` (`create-project.mjs`) |
| `modele/racine/` | Racine d'une plateforme (données vides, veille, Docker, CI, déploiement) |
| `scripts/lib.mjs` | Recherche du plugin design, construction de `app/`, remplacement des `{{…}}` |
| `scripts/creer-plateforme.mjs` | Crée une plateforme vide |
| `scripts/mettre-a-niveau.mjs` | Remplace `app/` (garde `node_modules`), ajoute les fichiers de racine manquants (`--infra` pour les remplacer) |

## Points techniques

- **Construction de `app/`** : `create-project.mjs` du plugin design, puis suppression de
  `HomePage.jsx` et `services/`, copie de `modele/app/`, ajout des exports `ui` manquants
  dans `index.js`, fusion de `package.json` (scripts `valider`, `normaliser`, `start`,
  `prepare`, dépendance `mermaid`).
- **Plugin design introuvable ?** Ordre de recherche : `--design`, `DESIGN_PLUGIN_ROOT`,
  `claude plugin list --json`, `~/.claude/plugins/cache/*/design/*`, `../agent-design`.
- **Placeholders** : `{{titre}}`, `{{sujet}}`, `{{name}}`, `{{couleur}}`, `{{objectif}}`,
  échappés selon le type de fichier. **Pas de placeholder dans le JS** : le titre et le
  sujet se lisent dans `plateforme.json` (`src/lib/plateforme.js`, `server.js`).
- **Husky dans `app/`** : `prepare: cd .. && husky app/.husky`. Les hooks tournent depuis la
  racine : `cd app && …`. commitlint lit `--edit "$1"` **depuis la racine du dépôt**.
- **Routage par `#`** (`createHashRouter`) : le build statique marche partout.
- **Cours** : `import.meta.glob('../../../*/cours.md')` dans `src/lib/cours.js`. Markdown
  maison (`src/lib/markdown.js`) : `==surligné==`, encadrés `> [!IMPORTANT]`, ` ```mermaid `.
- **Mermaid** : chargé à la demande, thème construit depuis `contraste/preset.js` et les
  variables `--hl*` ; `:::important` = couleur de mise en évidence.
- `audit.mjs` du design signale `highlight.css` (généré) et le `style` de `Progress`
  (largeur dynamique) : attendus.

## Vérifier une modification

```bash
S=<dossier temporaire>
node scripts/creer-plateforme.mjs $S/essai --titre "Essai" --sujet "Un sujet." --couleur wakaba --design <agent-design>
# ajouter 1 ou 2 étapes, un cours avec un schéma, quelques mots
cd $S/essai && git init -q -b main && cd app && npm install
npm run valider && npm run lint && npm run format:check && npm run build
node <agent-design>/scripts/audit.mjs .
npm i --no-save playwright && npx vite --port 5199 --strictPort &
PLAYWRIGHT_CHROMIUM_PATH=<chromium> node <agent-design>/scripts/screenshots.mjs --url http://localhost:5199 --out captures --routes / "/#/parcours/1" "/#/dictionnaire"
```

Puis :
1. Regarder les captures (les schémas se chargent en différé).
2. Cocher une case en mode dev : `donnees/parcours.json` et le `README.md` de l'étape changent.
3. Commit au message invalide depuis la racine : il doit être refusé.
4. Reporter dans `modele/` toute correction (formatage Prettier compris).
5. Tester `mettre-a-niveau.mjs` sur une copie de `parcours-ia`.
6. `claude plugin validate .`

## Publier

1. Augmenter `version` dans `.claude-plugin/plugin.json`.
2. Pousser sur `main` : le hub pointe sur `main` (source `url` en HTTPS).
3. Côté utilisateur : `/plugin marketplace update atelier`.

## Idées en attente

- Routine hebdomadaire de veille créée par `/apprentissage:mettre-a-jour`.
- Mode quiz dans l'application (questions tirées des notions).
- Export d'une fiche de révision PDF par étape.
