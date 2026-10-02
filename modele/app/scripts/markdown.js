// Génération des fichiers Markdown lisibles sur GitHub à partir des données JSON.
// Ces fichiers ne se modifient pas à la main : l'interface (app/) ou le JSON fait foi.
import { niveauImportance } from '../src/lib/importance.js';
import { avancementEtape, bilanEtape, pourcent } from '../src/lib/progression.js';

const lib = (liste, id) => (liste ?? []).find((x) => x.id === id)?.libelle ?? id;
const deux = (n) => String(n).padStart(2, '0');
const coche = (b) => (b ? '☑' : '☐');
const cellule = (t) =>
  String(t ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
const AVERTISSEMENT = (source) => [
  `> Fichier généré automatiquement à partir de \`donnees/${source}.json\`. Ne pas le modifier à la main :`,
  "> utiliser l'interface (`app/`, `npm run dev`) ou éditer le JSON.",
  '',
];

function tableau(colonnes, lignes) {
  return [
    `| ${colonnes.join(' | ')} |`,
    `|${colonnes.map(() => '---').join('|')}|`,
    ...lignes.map((l) => `| ${l.map(cellule).join(' | ')} |`),
    '',
  ];
}

const lienSi = (titre, url) => (url ? `[${titre}](${url})` : titre);

export function markdownDictionnaire(d) {
  const lignes = ['# Dictionnaire', '', ...AVERTISSEMENT('dictionnaire')];
  for (const type of d.types) {
    const duType = d.entrees.filter((e) => e.type === type.id);
    if (!duType.length) continue;
    lignes.push(`## ${type.libelle}s`, '');
    for (const cat of d.categories) {
      const entrees = duType.filter((e) => e.categorie === cat.id);
      if (!entrees.length) continue;
      lignes.push(`### ${cat.libelle}`, '');
      for (const e of entrees) {
        const tags = (e.tags ?? []).map((t) => lib(d.tags, t)).join(', ');
        const nom = lienSi(e.terme, e.ressources?.[0]?.url);
        const def = e.definition ? ` : ${e.definition}` : '';
        const niveau = niveauImportance(d.importance, e);
        const importance = niveau > 1 ? ` · importance : ${d.importance.libelles[niveau - 1]}` : '';
        lignes.push(`- **${nom}**${def}${tags || importance ? ` *(${tags}${importance})*` : ''}`);
      }
      lignes.push('');
    }
  }
  return lignes.join('\n');
}

export function markdownPratiques(p) {
  const lignes = ['# Bonnes pratiques', '', ...AVERTISSEMENT('pratiques')];
  const appliquees = p.pratiques.filter((x) => x.appliquee).length;
  lignes.push(`${appliquees} pratique(s) appliquée(s) sur ${p.pratiques.length}.`, '');
  for (const theme of p.themes) {
    const duTheme = p.pratiques.filter((x) => x.theme === theme.id);
    if (!duTheme.length) continue;
    lignes.push(`## ${theme.libelle}`, '');
    for (const x of duTheme) {
      const etat = x.etat === 'recommandee' ? '' : ` *(${lib(p.etats, x.etat)})*`;
      lignes.push(`### ${coche(x.appliquee)} ${x.titre}${etat}`, '');
      if (x.pourquoi) lignes.push(x.pourquoi, '');
      for (const c of x.comment ?? []) lignes.push(`- ${c}`);
      if (x.comment?.length) lignes.push('');
      if (x.sources?.length)
        lignes.push(
          `Sources : ${x.sources.map((s) => lienSi(s.titre || 'source', s.url)).join(', ')}`,
          '',
        );
      for (const h of [...(x.historique ?? [])].sort((a, b) => b.date.localeCompare(a.date))) {
        lignes.push(`- *${h.date}* : ${h.note}${h.url ? ` ([source](${h.url}))` : ''}`);
      }
      if (x.historique?.length) lignes.push('');
    }
  }
  return lignes.join('\n');
}

export function markdownEtape(e, tout) {
  const { dictionnaire, parcours } = tout;
  const terme = (id) => dictionnaire.entrees.find((x) => x.id === id)?.terme ?? id;
  const b = bilanEtape(e);
  const lignes = [`# Étape ${deux(e.id)} · ${e.libelle}`, '', ...AVERTISSEMENT('parcours')];
  if (e.optionnel) lignes.push('> Étape optionnelle.', '');
  if (e.resume) lignes.push(e.resume, '');
  // Le cours lui-même est écrit à la main dans cours.md, à côté de ce fichier.
  lignes.push("**Cours de l'étape : [cours.md](cours.md)**", '');

  lignes.push(
    '## Bilan',
    '',
    ...tableau(
      ['Notions acquises', 'Ressources lues', 'Exercices faits'],
      [
        [
          `${b.notions.faits}/${b.notions.total}`,
          `${b.ressources.faits}/${b.ressources.total}`,
          `${b.exercices.faits}/${b.exercices.total}`,
        ],
      ],
    ),
  );

  if (e.objectifs?.length) lignes.push('## Objectifs', '', ...e.objectifs.map((o) => `- ${o}`), '');

  if (e.notions?.length) {
    lignes.push('## Notions à maîtriser', '');
    for (const n of e.notions) {
      const liens = n.liens?.length ? ` *(dictionnaire : ${n.liens.map(terme).join(', ')})*` : '';
      lignes.push(`- [${n.acquise ? 'x' : ' '}] ${n.libelle}${liens}`);
    }
    lignes.push('');
  }

  if (e.ressources?.length) {
    lignes.push(
      '## Ressources',
      '',
      ...tableau(
        ['Ressource', 'Type', 'Langue', 'Lu', 'Avis'],
        e.ressources.map((r) => [
          lienSi(r.titre, r.url),
          lib(parcours.types_ressources, r.type),
          r.langue ?? '',
          coche(r.lu),
          r.avis ?? '',
        ]),
      ),
    );
    for (const r of e.ressources.filter((x) => x.notes?.trim()))
      lignes.push(`### Notes · ${r.titre}`, '', r.notes.trim(), '');
  }

  if (e.exercices?.length) {
    lignes.push(
      '## Exercices',
      '',
      "Un exercice = un sous-dossier de `exercices/` (modèle d'énoncé : [_modeles/exercice.md](../_modeles/exercice.md)).",
      '',
    );
    lignes.push(
      ...tableau(
        ['Exercice', 'Consigne', 'Notion', 'Dossier', 'Fait'],
        e.exercices.map((x) => [
          x.titre,
          x.consigne ?? '',
          x.notion ?? '',
          x.dossier ? `[${x.dossier}](exercices/${x.dossier}/)` : '',
          coche(x.fait),
        ]),
      ),
    );
  }

  if (e.questions_ia?.length) {
    lignes.push(
      "## Utiliser l'IA pendant cette étape",
      '',
      'Questions à poser à un assistant pour comprendre, sans lui déléguer le travail :',
      '',
      ...e.questions_ia.map((q) => `- ${q}`),
      '',
    );
  }
  return lignes.join('\n');
}

export function markdownMetier(tout) {
  const { metier: m, parcours } = tout;
  const etape = (n) => `${deux(n)}`;
  const lignes = [`# Fiche métier · ${m.intitule}`, '', ...AVERTISSEMENT('metier')];
  if (m.resume) lignes.push(`> **${m.sous_titre ?? m.intitule}.** ${m.resume}`, '');
  if (m.infos?.length)
    lignes.push(
      ...tableau(
        ['', ''],
        m.infos.map((i) => [i.libelle, i.valeur]),
      ),
    );
  for (const s of m.sections) {
    lignes.push(`## ${s.titre}`, '');
    if (s.intro) lignes.push(s.intro, '');
    if (s.type === 'texte') lignes.push(s.texte ?? '', '');
    if (s.type === 'liste') lignes.push(...(s.items ?? []).map((i) => `- ${i}`), '');
    if (s.type === 'numerotee') lignes.push(...(s.items ?? []).map((i, n) => `${n + 1}. ${i}`), '');
    if (s.type === 'tableau') lignes.push(...tableau(s.colonnes, s.lignes ?? []));
    if (s.type === 'competences') {
      lignes.push(
        ...tableau(
          ['Bloc', 'Compétence', 'Niveau visé', 'Étape'],
          (s.lignes ?? []).map((c) => [
            c.bloc,
            c.competence,
            c.niveau,
            c.etapes?.length ? c.etapes.map(etape).join(', ') : 'Tout le parcours',
          ]),
        ),
      );
    }
  }
  if (parcours)
    lignes.push(
      '---',
      '',
      "Le parcours et son avancement : voir [README](../README.md) et l'interface (`app/`).",
      '',
    );
  return lignes.join('\n');
}

// État de l'apprentissage, importé par CLAUDE.md : chaque session sait où j'en suis.
// Court (moins de 40 lignes) et sans date du jour, pour que la CI puisse le comparer.
export function markdownEtat(tout) {
  const { parcours, dictionnaire, pratiques } = tout;
  const coeur = parcours.etapes.filter((e) => !e.optionnel);
  const global = coeur.reduce((s, e) => s + avancementEtape(e), 0) / (coeur.length || 1);
  const courante = coeur.find((e) => avancementEtape(e) < 1) ?? parcours.etapes.at(-1);
  const lignes = [
    "# Où j'en suis",
    '',
    '> Généré par `npm run normaliser` depuis `donnees/`. Ne pas modifier à la main.',
    '',
    `- **Avancement global** : ${pourcent(global)}`,
  ];
  if (courante) {
    const b = bilanEtape(courante);
    lignes.push(
      `- **Étape en cours** : ${deux(courante.id)} · ${courante.libelle} (${pourcent(avancementEtape(courante))})`,
      `  - notions ${b.notions.faits}/${b.notions.total}, exercices ${b.exercices.faits}/${b.exercices.total}, ressources ${b.ressources.faits}/${b.ressources.total}`,
    );
    const aVoir = courante.notions.filter((n) => !n.acquise).map((n) => n.libelle);
    if (aVoir.length) lignes.push(`  - à travailler : ${aVoir.slice(0, 6).join(' ; ')}`);
  }
  lignes.push('', '## Étapes', '');
  for (const e of parcours.etapes)
    lignes.push(
      `- ${avancementEtape(e) === 1 ? '☑' : '☐'} ${deux(e.id)} · ${e.libelle} : ${pourcent(avancementEtape(e))}${e.optionnel ? ' (optionnelle)' : ''}`,
    );
  const parStatut = (id) => dictionnaire.entrees.filter((x) => x.statut === id).map((x) => x.terme);
  const enCours = parStatut('en-cours');
  lignes.push(
    '',
    '## Vocabulaire',
    '',
    `- **Mots acquis** : ${parStatut('acquis').length} sur ${dictionnaire.entrees.length}`,
  );
  if (enCours.length) lignes.push(`- **En cours** : ${enCours.slice(0, 12).join(', ')}`);
  const appliquees = pratiques.pratiques.filter((x) => x.appliquee).map((x) => x.titre);
  lignes.push(
    `- **Pratiques appliquées** : ${appliquees.length} sur ${pratiques.pratiques.length}`,
    '',
  );
  return lignes.join('\n');
}

// Liste [chemin relatif à la racine du dépôt, contenu] de tous les fichiers générés.
export function fichiersMarkdown(tout) {
  return [
    ['donnees/dictionnaire.md', markdownDictionnaire(tout.dictionnaire)],
    ['donnees/pratiques.md', markdownPratiques(tout.pratiques)],
    ...tout.parcours.etapes.map((e) => [`${e.dossier}/README.md`, markdownEtape(e, tout)]),
    ['metier/README.md', markdownMetier(tout)],
    ['memoire/etat.md', markdownEtat(tout)],
  ];
}
