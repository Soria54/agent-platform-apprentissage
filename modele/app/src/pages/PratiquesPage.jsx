import { EnLigne } from '../components/cours/Markdown';
import { Card, Checkbox, Mark, PageHeader, Tag } from '../components/ui';
import { useDonnees } from '../hooks/useDonnees';
import { aujourdhui, libelle } from '../lib/outils';
import { revueRecemment } from '../lib/parcours';

/** Bonnes pratiques, classées par thème, avec la case « je l'applique ». */
export default function PratiquesPage() {
  const { donnees, modifier } = useDonnees();
  const { pratiques } = donnees;
  const appliquees = pratiques.pratiques.filter((p) => p.appliquee).length;

  const basculer = (id, appliquee) =>
    modifier('pratiques', (p) =>
      Object.assign(
        p.pratiques.find((x) => x.id === id),
        { appliquee, modifie_le: aujourdhui() },
      ),
    );

  return (
    <div className="grid gap-10">
      <PageHeader
        eyebrow="Au quotidien"
        title="Bonnes pratiques"
        description={`${appliquees} appliquée(s) sur ${pratiques.pratiques.length}. La veille les révise chaque semaine.`}
      />

      {pratiques.pratiques.length === 0 && (
        <p className="text-muted">Pas encore de bonnes pratiques.</p>
      )}

      {pratiques.themes.map((theme) => {
        const liste = pratiques.pratiques.filter((p) => p.theme === theme.id);
        if (!liste.length) return null;
        return (
          <section key={theme.id} className="grid gap-4">
            <h2 className="text-xs font-medium uppercase tracking-label text-muted">
              {theme.libelle}
            </h2>
            <ul className="grid gap-3 lg:grid-cols-2">
              {liste.map((p) => (
                <li key={p.id}>
                  <Card className="grid h-full content-start gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.etat !== 'recommandee' && <Tag>{libelle(pratiques.etats, p.etat)}</Tag>}
                      {revueRecemment(p) && <Mark>Mise à jour</Mark>}
                    </div>
                    <h3 className="text-base leading-snug">{p.titre}</h3>
                    {p.pourquoi && (
                      <p className="text-sm text-muted">
                        <EnLigne texte={p.pourquoi} />
                      </p>
                    )}
                    {p.comment?.length > 0 && (
                      <ul className="grid list-[square] gap-1 pl-5 text-sm">
                        {p.comment.map((c) => (
                          <li key={c} className="pl-1">
                            <EnLigne texte={c} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.sources?.length > 0 && (
                      <p className="text-[13px] text-muted">
                        Sources :{' '}
                        {p.sources.map((s, i) => (
                          <span key={s.url}>
                            {i > 0 && ', '}
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              {s.titre || 'source'}
                            </a>
                          </span>
                        ))}
                      </p>
                    )}
                    <Checkbox
                      label="Je l'applique"
                      checked={Boolean(p.appliquee)}
                      onChange={(e) => basculer(p.id, e.target.checked)}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
