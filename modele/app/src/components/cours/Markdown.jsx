import { Fragment } from 'react';
import { Link } from 'react-router';

import { blocs } from '../../lib/markdown';
import { Callout, Mark } from '../ui';

import Schema from './Schema';

// Lien : vers une autre étape de l'application, vers le web, ou rien (fichier du dépôt).
function Lien({ url, children }) {
  if (/^https?:\/\//.test(url))
    return (
      <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
        {children}
      </a>
    );
  const etape = url.match(/^\.\.\/(\d{2})-[a-z0-9-]+\/?(cours\.md)?$/);
  if (etape)
    return (
      <Link to={`/parcours/${Number(etape[1])}`} className="underline underline-offset-4">
        {children}
      </Link>
    );
  return children;
}

/** Mise en forme dans une ligne : `code`, **gras**, *italique*, ==surligné==, [lien](url). */
export function EnLigne({ texte }) {
  const motif =
    /``\s?(.+?)\s?``|`([^`]+)`|==([^=]+)==|\*\*(.+?)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const morceaux = [];
  let fin = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index > fin) morceaux.push(texte.slice(fin, m.index));
    const k = m.index;
    if (m[1] || m[2])
      morceaux.push(
        <code key={k} className="border border-line px-1 font-mono text-[0.9em]">
          {m[1] ?? m[2]}
        </code>,
      );
    else if (m[3])
      morceaux.push(
        <Mark key={k}>
          <EnLigne texte={m[3]} />
        </Mark>,
      );
    else if (m[4])
      morceaux.push(
        <strong key={k} className="font-semibold">
          <EnLigne texte={m[4]} />
        </strong>,
      );
    else if (m[5])
      morceaux.push(
        <em key={k}>
          <EnLigne texte={m[5]} />
        </em>,
      );
    else
      morceaux.push(
        <Lien key={k} url={m[7]}>
          <EnLigne texte={m[6]} />
        </Lien>,
      );
    fin = k + m[0].length;
  }
  morceaux.push(texte.slice(fin));
  return morceaux.map((m, i) => <Fragment key={i}>{m}</Fragment>);
}

const TITRES = {
  1: 'mt-4 text-[1.5rem] leading-tight',
  2: 'mt-6 text-[1.3rem] leading-tight',
  3: 'mt-4 text-[1.1rem] leading-snug',
  4: 'mt-2 text-xs font-semibold uppercase tracking-label text-muted',
};

function Liste({ numerotee, items }) {
  const Balise = numerotee ? 'ol' : 'ul';
  return (
    <Balise
      className={`grid max-w-prose gap-1.5 pl-5 ${numerotee ? 'list-decimal' : 'list-[square]'}`}
    >
      {items.map((item, j) => (
        <li key={j} className="pl-1 marker:text-black">
          <EnLigne texte={item.texte} />
          {item.sous.length > 0 && (
            <ul className="mt-1.5 grid gap-1 pl-5 list-[circle]">
              {item.sous.map((s, k) => (
                <li key={k} className="pl-1">
                  <EnLigne texte={s} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </Balise>
  );
}

/** Affiche une liste de blocs Markdown. `decalage` décale le niveau des titres (h2 → h3…). */
export function Blocs({ liste, decalage = 1 }) {
  return liste.map((b, i) => {
    switch (b.type) {
      case 'titre': {
        const niveau = Math.min(6, b.niveau + decalage);
        const Balise = `h${niveau}`;
        return (
          <Balise key={i} className={TITRES[Math.min(4, b.niveau)]}>
            <EnLigne texte={b.texte} />
          </Balise>
        );
      }
      case 'code':
        return (
          <pre key={i} className="overflow-x-auto border border-black p-4 text-[13px] leading-6">
            <code className="font-mono">{b.texte}</code>
          </pre>
        );
      case 'schema':
        return <Schema key={i} code={b.texte} />;
      case 'trait':
        return <hr key={i} className="border-line" />;
      case 'encadre':
        return (
          <Callout key={i} label={b.label} highlighted={b.highlighted} className="max-w-prose">
            <Blocs liste={b.blocs} decalage={decalage} />
          </Callout>
        );
      case 'citation':
        return (
          <blockquote key={i} className="grid max-w-prose gap-2 border-l border-black pl-4">
            <Blocs liste={b.blocs} decalage={decalage} />
          </blockquote>
        );
      case 'liste':
        return <Liste key={i} numerotee={b.numerotee} items={b.items} />;
      case 'tableau':
        return (
          <div key={i} className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black">
                  {b.entetes.map((c, j) => (
                    <th
                      key={j}
                      className="px-2 py-2 text-xs font-medium uppercase tracking-label text-muted"
                    >
                      <EnLigne texte={c} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.lignes.map((l, j) => (
                  <tr key={j} className="border-b border-line align-top">
                    {l.map((c, k) => (
                      <td key={k} className="px-2 py-2">
                        <EnLigne texte={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <p key={i} className="max-w-prose">
            <EnLigne texte={b.texte} />
          </p>
        );
    }
  });
}

/** Texte Markdown complet. Le titre de premier niveau est retiré s'il est déjà affiché. */
export default function Markdown({ texte, sansTitre = false, decalage = 1 }) {
  const contenu = sansTitre ? texte.replace(/^# .*\n/, '') : texte;
  return (
    <div className="grid gap-4">
      <Blocs liste={blocs(contenu)} decalage={decalage} />
    </div>
  );
}
