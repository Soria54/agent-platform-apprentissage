// Découpage d'un texte Markdown en blocs, affichés par components/cours/Markdown.jsx.

// Encadrés au format GitHub : > [!IMPORTANT], > [!WARNING], > [!TIP], > [!NOTE].
const ENCADRES = {
  IMPORTANT: { label: 'À retenir', highlighted: true },
  WARNING: { label: 'Attention', highlighted: true },
  CAUTION: { label: 'Attention', highlighted: true },
  TIP: { label: 'Astuce', highlighted: false },
  NOTE: { label: 'Note', highlighted: false },
};

const cellules = (ligne) =>
  ligne
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

const DEBUT_BLOC = /^(#{1,4} |```|\||>|\s*([-*]|\d+\.) )/;
const PUCE = /^(\s*)([-*]|\d+\.) /;

// Découpe le Markdown en blocs : titres, paragraphes, listes, encadrés, code, schémas, tableaux.
export function blocs(texte) {
  const lignes = texte.replace(/\r/g, '').split('\n');
  const res = [];
  let i = 0;
  while (i < lignes.length) {
    const l = lignes[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    if (l.startsWith('```')) {
      const langue = l.slice(3).trim();
      const code = [];
      for (i++; i < lignes.length && !lignes[i].startsWith('```'); i++) code.push(lignes[i]);
      res.push({ type: langue === 'mermaid' ? 'schema' : 'code', texte: code.join('\n') });
      i++;
    } else if (/^#{1,4} /.test(l)) {
      res.push({ type: 'titre', niveau: l.match(/^#+/)[0].length, texte: l.replace(/^#+ /, '') });
      i++;
    } else if (/^---+$/.test(l.trim())) {
      res.push({ type: 'trait' });
      i++;
    } else if (l.startsWith('|')) {
      const t = [];
      for (; i < lignes.length && lignes[i].startsWith('|'); i++) t.push(lignes[i]);
      res.push({ type: 'tableau', entetes: cellules(t[0]), lignes: t.slice(2).map(cellules) });
    } else if (l.startsWith('>')) {
      const c = [];
      for (; i < lignes.length && lignes[i].startsWith('>'); i++)
        c.push(lignes[i].replace(/^> ?/, ''));
      const genre = c[0]?.match(/^\[!([A-Z]+)\]\s*$/)?.[1];
      if (genre && ENCADRES[genre])
        res.push({ type: 'encadre', ...ENCADRES[genre], blocs: blocs(c.slice(1).join('\n')) });
      else res.push({ type: 'citation', blocs: blocs(c.join('\n')) });
    } else if (PUCE.test(l)) {
      const numerotee = /^\s*\d+\. /.test(l);
      const base = l.match(PUCE)[1].length;
      const items = [];
      for (; i < lignes.length; i++) {
        const x = lignes[i];
        const puce = x.match(PUCE);
        if (puce && puce[1].length <= base + 1)
          items.push({ texte: x.replace(PUCE, ''), sous: [] });
        else if (puce && items.length) items.at(-1).sous.push(x.replace(PUCE, ''));
        else if (x.trim() && /^\s+/.test(x) && items.length) {
          const dernier = items.at(-1);
          if (dernier.sous.length) dernier.sous[dernier.sous.length - 1] += ` ${x.trim()}`;
          else dernier.texte += ` ${x.trim()}`;
        } else break;
      }
      res.push({ type: 'liste', numerotee, items });
    } else {
      const p = [];
      for (; i < lignes.length && lignes[i].trim() && !DEBUT_BLOC.test(lignes[i]); i++)
        p.push(lignes[i].trim());
      res.push({ type: 'paragraphe', texte: p.join(' ') });
    }
  }
  return res;
}
