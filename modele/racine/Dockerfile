# Plateforme d'apprentissage : serveur Node sans dépendance + interface construite.
# Les données (donnees/ et les Markdown générés) vivent dans /depot, à monter en volume.

FROM node:22-alpine AS construction
WORKDIR /depot/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund --ignore-scripts
# Tout le dépôt : les cours (NN-etape/cours.md) et les énoncés sont intégrés au build.
COPY . /depot/
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    RACINE_DEPOT=/depot
WORKDIR /app
COPY app/package.json app/server.js ./
COPY app/scripts ./scripts
COPY app/src/lib ./src/lib
COPY --from=construction /depot/app/dist ./dist
# Données de départ : utilisées si aucun dossier n'est monté sur /depot.
COPY --chown=node:node donnees/ /depot/donnees/
COPY --chown=node:node plateforme.json /depot/
RUN chown node:node /depot
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/sante > /dev/null || exit 1
CMD ["node", "server.js"]
