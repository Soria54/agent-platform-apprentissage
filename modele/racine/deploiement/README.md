# Héberger l'application

Objectif : ouvrir la plateforme depuis le téléphone, avec les mêmes données que sur le
PC, et garder `donnees/` versionné dans GitHub.

## Deux façons de faire tourner l'application

| | Serveur Node (Docker) | Site statique |
|---|---|---|
| Ce qui tourne | `app/server.js` : l'interface + l'API d'écriture | uniquement les fichiers de `app/dist/` |
| Modifications | écrites dans `donnees/` sur le serveur, **partagées** entre PC et téléphone | gardées dans le navigateur de **chaque** appareil, à exporter à la main |
| Synchronisation GitHub | automatique avec le profil `synchro` | aucune |

Pour apprendre sur téléphone **et** retrouver ses modifications partout, il faut le
serveur Node. Le site statique ne convient que pour consulter.

## Comparatif des hébergements

| Solution | Coût | Accès depuis le téléphone | Sécurité | Mise en place |
|---|---|---|---|---|
| **1. Machine à la maison + Docker + Tailscale** *(recommandé)* | gratuit | partout, via l'application Tailscale | rien n'est exposé sur Internet | ~15 min |
| 2. VPS (Hetzner, OVH, Scaleway…) + Docker + Caddy | quelques € par mois | URL publique en HTTPS | mot de passe obligatoire | ~45 min |
| 3. Azure (Container Apps ou App Service) | paiement à l'usage | URL publique en HTTPS | Entra ID possible | ~1 h, stockage Azure Files à prévoir |
| 4. Statique gratuit (Cloudflare Pages, Azure Static Web Apps, GitHub Pages) | gratuit | URL publique | dépend de l'hébergeur ; GitHub Pages gratuit = public | ~10 min, mais consultation seulement |

- **Option 1** : n'importe quelle machine qui reste allumée (PC fixe, NAS,
  Raspberry Pi 4/5). [Tailscale](https://tailscale.com/) crée un réseau privé entre
  tes appareils : le téléphone joint le serveur comme s'il était sur le même Wi-Fi,
  sans ouvrir de port sur la box. Gratuit pour un usage personnel.
- **Option 2** : utile si aucune machine ne reste allumée chez toi. Le site est
  public : ne jamais le lancer sans `MOT_DE_PASSE`.
- **Option 3** : attention à ne pas utiliser l'abonnement de l'entreprise pour un
  projet personnel.
- **Option 4** : `npm run build` dans `app/`, puis publier `app/dist/`.

## Démarrage avec Docker (options 1 et 2)

Prérequis : Docker et Docker Compose, et Git.

```bash
git clone https://github.com/<compte>/{{name}}.git
cd {{name}}
cp .env.example .env        # puis compléter .env
id -u; id -g                # reporter ces valeurs dans UID et GID (Linux)
docker compose up -d --build
```

L'application répond sur `http://<machine>:8080`. Le conteneur monte le clone
lui-même : chaque modification arrive dans `donnees/` (et dans les Markdown
générés), comme avec `npm run dev`.

Commandes utiles :

```bash
docker compose logs -f plateforme   # journaux
docker compose pull && docker compose up -d --build   # mise à jour après un git pull
docker compose down               # arrêt
```

### Option 1 : accès depuis le téléphone avec Tailscale

1. Installer Tailscale sur la machine qui fait tourner Docker et sur le téléphone,
   et se connecter avec le même compte.
2. Sur le téléphone, ouvrir `http://<nom-de-la-machine>:8080` (le nom apparaît dans
   l'application Tailscale).
3. Facultatif : `tailscale serve --bg 8080` sur la machine donne une adresse en HTTPS
   (`https://<machine>.<tailnet>.ts.net`), nécessaire pour installer l'application
   sur l'écran d'accueil sous iOS.

Un `MOT_DE_PASSE` reste conseillé si d'autres personnes partagent ton réseau Tailscale.

### Option 2 : VPS avec HTTPS

1. Faire pointer un nom de domaine (enregistrement A) vers l'adresse du VPS.
2. Dans `.env` : `DOMAINE=apprendre.mon-domaine.fr` et un `MOT_DE_PASSE` long.
3. Lancer avec le complément Caddy, qui obtient le certificat HTTPS tout seul :

   ```bash
   docker compose -f docker-compose.yml -f deploiement/docker-compose.vps.yml up -d --build
   ```

Le navigateur demande l'identifiant (`IDENTIFIANT`, « moi » par défaut) et le mot de
passe une fois, puis s'en souvient.

## Synchronisation avec GitHub (facultatif, recommandé)

Le service `synchro` lance `deploiement/synchro-git.sh` toutes les 10 minutes :

1. il committe les modifications faites dans l'application (`donnees/`, `metier/`,
   `NN-etape/README.md`) — rien d'autre, le code des exercices et les `cours.md`
   ne sont pas touchés ;
2. il récupère GitHub (par exemple une veille fusionnée) ;
3. il pousse sur la branche `BRANCHE` (`main` par défaut).

Mise en place :

1. Créer un jeton GitHub à granularité fine : *Settings → Developer settings →
   Personal access tokens → Fine-grained tokens*, limité au dépôt
   `{{name}}`, permission **Contents : Read and write**, avec une date
   d'expiration.
2. Le mettre dans `.env` (`GIT_TOKEN=…`). Le fichier `.env` n'est jamais committé, et
   le jeton n'est écrit ni dans `.git/config` ni dans les journaux.
3. Lancer avec le profil :

   ```bash
   docker compose --profile synchro up -d --build
   docker compose logs -f synchro
   ```

En cas de conflit (la même donnée modifiée dans l'application et sur GitHub), rien
n'est perdu : la synchronisation s'arrête avec un message dans les journaux. Il suffit
alors de faire `git pull --rebase` dans le clone, de résoudre, puis de pousser.

Pour limiter les conflits, l'application relit les données du serveur chaque fois
qu'on revient dessus (téléphone déverrouillé, onglet réaffiché). Éviter de modifier
la même entrée depuis deux appareils en même temps.

## Installer l'application sur le téléphone

L'application fournit un manifeste et des icônes : elle s'installe comme une
application, sans barre d'adresse.

- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil* ou *Installer l'application*.
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

L'installation demande une adresse en HTTPS (Tailscale `serve`, Caddy, ou un
hébergeur cloud). En HTTP simple, le site reste utilisable dans le navigateur.

## Sans Docker

```bash
cd app
npm ci
npm run build
MOT_DE_PASSE=… npm start      # écoute sur le port 8080 (variable PORT)
```

Variables reconnues par `app/server.js` : `PORT`, `MOT_DE_PASSE`, `IDENTIFIANT`, et
`RACINE_DEPOT` (dossier qui contient `donnees/`, par défaut le parent de `app/`).
