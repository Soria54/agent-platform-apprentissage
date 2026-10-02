import { EnLigne } from '../components/cours/Markdown';
import { Card, PageHeader, Progress } from '../components/ui';
import { useDonnees } from '../hooks/useDonnees';
import { deux } from '../lib/parcours';
import { avancementEtape, pourcent } from '../lib/progression';

function Section({ section, etapes }) {
  const avancement = (ids) => {
    const liste = etapes.filter((e) => ids?.includes(e.id));
    return liste.length ? liste.reduce((s, e) => s + avancementEtape(e), 0) / liste.length : null;
  };

  return (
    <section className="grid gap-4">
      <h2 className="text-[1.3rem] leading-tight">{section.titre}</h2>
      {section.intro && (
        <p className="max-w-prose text-muted">
          <EnLigne texte={section.intro} />
        </p>
      )}
      {section.type === 'texte' && (
        <p className="max-w-prose">
          <EnLigne texte={section.texte ?? ''} />
        </p>
      )}
      {(section.type === 'liste' || section.type === 'numerotee') && (
        <ul
          className={`grid max-w-prose gap-1.5 pl-5 ${section.type === 'numerotee' ? 'list-decimal' : 'list-[square]'}`}
        >
          {(section.items ?? []).map((item) => (
            <li key={item} className="pl-1">
              <EnLigne texte={item} />
            </li>
          ))}
        </ul>
      )}
      {section.type === 'tableau' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black">
                {section.colonnes.map((c) => (
                  <th
                    key={c}
                    className="px-2 py-2 text-xs font-medium uppercase tracking-label text-muted"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(section.lignes ?? []).map((ligne, i) => (
                <tr key={i} className="border-b border-line align-top">
                  {ligne.map((cellule, j) => (
                    <td key={j} className="px-2 py-2">
                      <EnLigne texte={String(cellule)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.type === 'competences' && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {(section.lignes ?? []).map((c) => {
            const a = avancement(c.etapes);
            return (
              <li key={`${c.bloc}-${c.competence}`}>
                <Card className="grid h-full content-start gap-2">
                  <p className="text-xs font-medium uppercase tracking-label text-muted">
                    {c.bloc}
                  </p>
                  <p className="font-semibold">{c.competence}</p>
                  <p className="text-[13px] text-muted">
                    Niveau visé : {c.niveau}
                    {c.etapes?.length > 0 && ` · étapes ${c.etapes.map(deux).join(', ')}`}
                  </p>
                  {a !== null && (
                    <div className="flex items-center gap-3">
                      <Progress value={a} label={`Avancement de ${c.competence}`} />
                      <span className="whitespace-nowrap text-sm tabular-nums">{pourcent(a)}</span>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Objectif du parcours : la fiche métier ou le niveau visé, avec l'avancement des compétences. */
export default function MetierPage() {
  const { donnees } = useDonnees();
  const { metier, parcours } = donnees;

  return (
    <div className="grid gap-10">
      <PageHeader eyebrow="Objectif" title={metier.intitule} description={metier.sous_titre} />
      {metier.resume && (
        <p className="max-w-prose text-[1.05rem]">
          <EnLigne texte={metier.resume} />
        </p>
      )}
      {metier.infos?.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
          {metier.infos.map((info) => (
            <div key={info.libelle} className="contents">
              <dt className="text-xs font-medium uppercase tracking-label text-muted">
                {info.libelle}
              </dt>
              <dd className="text-sm">
                <EnLigne texte={info.valeur} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {metier.sections.map((s) => (
        <Section key={s.id} section={s} etapes={parcours.etapes} />
      ))}
    </div>
  );
}
