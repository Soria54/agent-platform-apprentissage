# {{titre}}

Plateforme d'apprentissage sur : **{{sujet}}**.

Créée avec le plugin `apprentissage` (hub `atelier`). Design : plugin `design`, style
Contraste Fin, couleur `{{couleur}}`.

## Qui j'apprends avec toi

@memoire/apprenant.md

## Où j'en suis

@memoire/etat.md

## Comment m'expliquer les choses

Je suis **dyslexique**. Pour toute réponse et tout contenu écrit ici :
- **court**, une idée par phrase ;
- **en listes** plutôt qu'en paragraphes ;
- **un schéma** dès qu'il y a une relation (Mermaid dans les fichiers, schéma en texte
  dans la conversation) ;
- le **point important mis en évidence** (`==…==` une fois par section, `**gras**` pour
  les mots clés) ;
- **ouvert** : finir par 2 ou 3 pistes pour aller plus loin.

Règles complètes : [_modeles/style.md](_modeles/style.md).

## La mémoire de la plateforme

| Fichier | Contenu | Mis à jour par |
|---|---|---|
| `memoire/apprenant.md` | Mon profil, ce que je maîtrise, mes difficultés, ce qui m'aide | `/apprentissage:professeur`, en fin de session |
| `memoire/journal.md` | Une entrée courte par session | `/apprentissage:professeur` |
| `memoire/etat.md` | Avancement, étape en cours, vocabulaire | **Généré** par `npm run normaliser` |

Dans une session sans le professeur, si j'apprends quelque chose d'important sur moi
(difficulté, préférence), propose de l'ajouter à `memoire/apprenant.md`.

## Organisation

| Chemin | Rôle |
|---|---|
| `donnees/*.json` | **Source de vérité** : dictionnaire, pratiques, parcours, objectif. Format : `donnees/README.md` |
| `donnees/*.md`, `NN-etape/README.md`, `metier/README.md`, `memoire/etat.md` | **Générés** par `npm run normaliser` : ne pas modifier à la main |
| `NN-etape/cours.md` | Cours écrit à la main, selon `_modeles/cours.md` |
| `NN-etape/exercices/<dossier>/enonce.md` | Énoncé d'exercice, selon `_modeles/exercice.md` |
| `app/` | Application React 19, Vite, Tailwind v3, composants `src/components/ui` |
| `veille/PROMPT.md` | Consigne de la veille hebdomadaire |
| `plateforme.json` | Version du modèle, couleur, sujet |

## Règles

- Après toute modification de `donnees/` : `cd app && npm run valider && npm run normaliser`.
- Ne jamais modifier mes données personnelles sans me le demander : `acquise`, `lu`,
  `fait`, `avis`, `notes`, `statut`, `commentaire`, `vus`, `appliquee`.
- Interface : seulement les classes du preset Contraste Fin (`contraste/preset.js`) et les
  composants `src/components/ui`. Pas de couleur en dur, pas de `shadow-*`, pas de
  `rounded-*` (sauf `rounded-full`), pas de `dark:`.
- Commits en anglais, conventional commits (vérifiés par commitlint).
- Vérifier les faits dans une source fiable avant de les écrire dans un cours.
