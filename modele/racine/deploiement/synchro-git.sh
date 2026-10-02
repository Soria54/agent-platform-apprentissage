#!/bin/sh
# Synchronise le clone monté sur /depot avec GitHub, en boucle :
#   1. committe les modifications faites dans l'application (données et Markdown générés) ;
#   2. récupère GitHub (par exemple une veille fusionnée) en rebasant ;
#   3. pousse le résultat.
# En cas de conflit, rien n'est perdu : le rebase est annulé et un message l'indique.
set -u

INTERVALLE="${INTERVALLE:-600}"
BRANCHE="${BRANCHE:-main}"

git config --global --add safe.directory /depot
git config --global user.name "${GIT_AUTEUR_NOM:-{{titre}}}"
git config --global user.email "${GIT_AUTEUR_EMAIL:-plateforme@localhost}"

# Le jeton passe par un en-tête HTTP : il n'est écrit ni dans .git/config ni dans les logs.
distant() {
  if [ -n "${GIT_TOKEN:-}" ]; then
    entete="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$GIT_TOKEN" | base64 | tr -d '\n')"
    git -c "http.https://github.com/.extraheader=$entete" "$@"
  else
    git "$@"
  fi
}

while true; do
  echo "[$(date -u +%FT%TZ)] synchronisation"
  # Uniquement ce que l'application écrit ; le reste (code des exercices…) n'est pas touché.
  for chemin in donnees metier memoire [0-9][0-9]-*/README.md; do
    [ -e "$chemin" ] && git add -- "$chemin"
  done
  if ! git diff --cached --quiet; then
    git commit -q -m "Modifications depuis l'application ($(date -u +%F' '%H:%M) UTC)"
  fi
  if distant pull -q --rebase --autostash origin "$BRANCHE"; then
    distant push -q origin "HEAD:$BRANCHE" || echo "Push refusé : vérifier GIT_TOKEN et les droits sur la branche $BRANCHE."
  else
    git rebase --abort 2>/dev/null
    echo "Conflit avec GitHub : synchronisation suspendue. Résoudre à la main dans le clone (git pull --rebase)."
  fi
  sleep "$INTERVALLE"
done
