import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { EnLigne } from '../components/cours/Markdown';
import { Button, Card, Input, Mark, PageHeader, Select, Tag, Textarea } from '../components/ui';
import { useDonnees } from '../hooks/useDonnees';
import { cx } from '../lib/cx';
import { niveauImportance, occurrences } from '../lib/importance';
import { aujourdhui, libelle, slug } from '../lib/outils';
import { deux } from '../lib/parcours';

function Fiche({ entree, dictionnaire, etapes, ouvrir, majEntree }) {
  const index = new Map(dictionnaire.entrees.map((e) => [e.id, e]));
  const citePar = dictionnaire.entrees.filter((e) => e.liens?.includes(entree.id));
  const niveau = niveauImportance(dictionnaire.importance, entree);
  const occ = occurrences(entree);
  const essentiel = niveau === dictionnaire.importance.seuils.length + 1;
  const etapesLiees = etapes.filter((e) => entree.etapes?.includes(e.id));

  return (
    <Card className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase tracking-label text-muted">
          {libelle(dictionnaire.types, entree.type)} ·{' '}
          {libelle(dictionnaire.categories, entree.categorie)}
        </p>
        <h2 className="text-[1.5rem] leading-tight">{entree.terme}</h2>
        {entree.definition && (
          <p className="max-w-prose">
            <EnLigne texte={entree.definition} />
          </p>
        )}
      </div>

      {entree.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entree.tags.map((t) => (
            <Tag key={t}>{libelle(dictionnaire.tags, t)}</Tag>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Où j'en suis"
          value={entree.statut}
          onChange={(e) => majEntree({ statut: e.target.value })}
          options={dictionnaire.statuts.map((s) => ({ value: s.id, label: s.libelle }))}
        />
        <div className="grid gap-1.5">
          <p className="text-sm font-medium">Importance</p>
          <p className="text-sm">
            {essentiel ? (
              <Mark>{dictionnaire.importance.libelles[niveau - 1]}</Mark>
            ) : (
              dictionnaire.importance.libelles[niveau - 1]
            )}{' '}
            <span className="text-muted">
              · vu {occ.vus} fois, cité {occ.veille} semaine(s) par la veille
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => majEntree({ vus: (entree.vus ?? 0) + 1 })}
        >
          +1 vu
        </Button>
      </div>

      {etapesLiees.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-label text-muted">Étapes</h3>
          <p className="text-sm">
            {etapesLiees.map((e) => `${deux(e.id)} · ${e.libelle}`).join(', ')}
          </p>
        </div>
      )}

      {(entree.liens?.length > 0 || citePar.length > 0) && (
        <div className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-label text-muted">Mots liés</h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...(entree.liens ?? []).filter((id) => index.has(id)).map((id) => index.get(id)),
              ...citePar,
            ]
              .filter((e, i, liste) => liste.indexOf(e) === i)
              .map((e) => (
                <Tag key={e.id} onClick={() => ouvrir(e.id)}>
                  {e.terme}
                </Tag>
              ))}
          </div>
        </div>
      )}

      {entree.ressources?.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-label text-muted">
            Pour aller plus loin
          </h3>
          <ul className="grid gap-1">
            {entree.ressources.map((r) => (
              <li key={r.url ?? r.titre} className="text-sm">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    {r.titre || r.url}
                  </a>
                ) : (
                  r.titre
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entree.actualites?.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-label text-muted">Actualités</h3>
          <ul className="grid">
            {[...entree.actualites]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <li
                  key={`${a.date}-${a.titre}`}
                  className="flex gap-3 border-b border-line py-2 text-sm"
                >
                  <span className="flex-none tabular-nums text-muted">{a.date}</span>
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {a.titre}
                    </a>
                  ) : (
                    a.titre
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      <Textarea
        label="Mes notes"
        rows={3}
        value={entree.commentaire ?? ''}
        placeholder="Un exemple à moi, un lien avec ce que je connais déjà…"
        onChange={(e) => majEntree({ commentaire: e.target.value })}
      />
    </Card>
  );
}

/** Dictionnaire : recherche, filtres et fiche de chaque mot. */
export default function DictionnairePage() {
  const { donnees, modifier } = useDonnees();
  const { dictionnaire, parcours } = donnees;
  const [recherche, setRecherche] = useSearchParams();
  const [texte, setTexte] = useState('');
  const [categories, setCategories] = useState([]);
  const [statut, setStatut] = useState('');
  const motOuvert = recherche.get('mot');
  const entree = dictionnaire.entrees.find((e) => e.id === motOuvert);

  const q = slug(texte);
  const liste = dictionnaire.entrees
    .filter(
      (e) =>
        (!q || slug(`${e.terme} ${e.definition} ${e.commentaire ?? ''}`).includes(q)) &&
        (!categories.length || categories.includes(e.categorie)) &&
        (!statut || e.statut === statut),
    )
    .sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));

  const ouvrir = (id) => setRecherche(id ? { mot: id } : {});
  const basculer = (id) =>
    setCategories((liste) => (liste.includes(id) ? liste.filter((c) => c !== id) : [...liste, id]));
  const majEntree = (champs) =>
    modifier('dictionnaire', (d) =>
      Object.assign(
        d.entrees.find((e) => e.id === entree.id),
        champs,
        {
          modifie_le: aujourdhui(),
        },
      ),
    );

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Vocabulaire"
        title="Dictionnaire"
        description={`${dictionnaire.entrees.length} mots, reliés aux étapes du parcours.`}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className={cx('grid content-start gap-5', entree && 'max-lg:hidden')}>
          <div className="grid gap-4">
            <Input
              label="Chercher"
              hideLabel
              type="search"
              placeholder="Chercher un mot…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5" aria-label="Catégories">
              {dictionnaire.categories.map((c) => (
                <Tag key={c.id} selected={categories.includes(c.id)} onClick={() => basculer(c.id)}>
                  {c.libelle}
                </Tag>
              ))}
            </div>
            <Select
              label="Statut"
              hideLabel
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                ...dictionnaire.statuts.map((s) => ({ value: s.id, label: s.libelle })),
              ]}
            />
          </div>

          <p className="text-[13px] text-muted">{liste.length} résultat(s)</p>
          <ul className="grid border-t border-black">
            {liste.map((e) => (
              <li key={e.id} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => ouvrir(e.id)}
                  aria-current={e.id === motOuvert ? 'true' : undefined}
                  className={cx(
                    'flex w-full items-baseline justify-between gap-3 px-2 py-3 text-left hover:bg-black hover:text-white',
                    e.id === motOuvert && 'bg-black text-white',
                  )}
                >
                  <span className="font-medium">{e.terme}</span>
                  <span className="text-[13px]">{libelle(dictionnaire.statuts, e.statut)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid content-start gap-4">
          {entree ? (
            <>
              <div className="lg:hidden">
                <Button variant="ghost" size="sm" onClick={() => ouvrir(null)}>
                  Retour à la liste
                </Button>
              </div>
              <Fiche
                entree={entree}
                dictionnaire={dictionnaire}
                etapes={parcours.etapes}
                ouvrir={ouvrir}
                majEntree={majEntree}
              />
            </>
          ) : (
            <p className="max-lg:hidden text-muted">Choisis un mot pour voir sa fiche.</p>
          )}
        </div>
      </div>
    </div>
  );
}
