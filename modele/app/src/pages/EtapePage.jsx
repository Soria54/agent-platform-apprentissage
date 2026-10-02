import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';

import Cours from '../components/cours/Cours';
import Markdown, { EnLigne } from '../components/cours/Markdown';
import {
  Button,
  Card,
  Checkbox,
  Input,
  PageHeader,
  Progress,
  Select,
  Stat,
  Tabs,
  Tag,
  Textarea,
} from '../components/ui';
import { useDonnees } from '../hooks/useDonnees';
import { enonce } from '../lib/cours';
import { cx } from '../lib/cx';
import { libelle } from '../lib/outils';
import { deux } from '../lib/parcours';
import { avancementEtape, bilanEtape, pourcent } from '../lib/progression';

function Sommaire({ etapes, courante }) {
  return (
    <nav aria-label="Étapes du parcours" className="hidden lg:block">
      <ol className="sticky top-6 grid gap-1 border-r border-black pr-4">
        {etapes.map((e) => {
          const actif = e.id === courante.id;
          return (
            <li key={e.id}>
              <Link
                to={`/parcours/${e.id}`}
                aria-current={actif ? 'page' : undefined}
                className={cx(
                  'grid gap-1.5 px-2 py-2 text-sm',
                  actif
                    ? 'font-semibold text-black shadow-[inset_0_calc(var(--hl-underline)*-1)_0_var(--hl)]'
                    : 'text-muted hover:text-black',
                )}
              >
                <span>
                  <span className="tabular-nums">{deux(e.id)}</span> · {e.libelle}
                </span>
                <Progress
                  value={avancementEtape(e)}
                  label={`Avancement de l'étape ${deux(e.id)}`}
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Notions({ etape, index, maj }) {
  const navigate = useNavigate();
  if (!etape.notions.length) return <p className="text-muted">Pas de notion pour cette étape.</p>;
  return (
    <ul className="grid">
      {etape.notions.map((n) => (
        <li
          key={n.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3"
        >
          <Checkbox
            label={n.libelle}
            checked={n.acquise}
            onChange={(e) =>
              maj((et) => (et.notions.find((x) => x.id === n.id).acquise = e.target.checked))
            }
          />
          <span className="flex flex-wrap gap-1.5 sm:ml-auto">
            {(n.liens ?? [])
              .filter((id) => index.has(id))
              .map((id) => (
                <Tag key={id} onClick={() => navigate(`/dictionnaire?mot=${id}`)}>
                  {index.get(id).terme}
                </Tag>
              ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Exercices({ etape, maj }) {
  if (!etape.exercices.length)
    return <p className="text-muted">Pas d&apos;exercice pour cette étape.</p>;
  return (
    <ul className="grid gap-3">
      {etape.exercices.map((x) => {
        const texte = x.dossier ? enonce(etape.dossier, x.dossier) : null;
        return (
          <li key={x.id}>
            <Card className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="text-base">{x.titre}</h3>
                  {x.notion && <p className="text-[13px] text-muted">{x.notion}</p>}
                </div>
                <Checkbox
                  label="Fait"
                  checked={x.fait}
                  onChange={(e) =>
                    maj((et) => (et.exercices.find((y) => y.id === x.id).fait = e.target.checked))
                  }
                />
              </div>
              {x.consigne && <p className="max-w-prose text-sm">{x.consigne}</p>}
              {texte ? (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium underline underline-offset-4">
                    Voir l&apos;énoncé
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <Markdown texte={texte} sansTitre decalage={2} />
                  </div>
                </details>
              ) : (
                x.dossier && (
                  <p className="text-[13px] text-muted">
                    Énoncé attendu dans{' '}
                    <code>
                      {etape.dossier}/exercices/{x.dossier}/enonce.md
                    </code>
                  </p>
                )
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function Ressources({ etape, types, maj }) {
  const majRessource = (id, champs) =>
    maj((et) =>
      Object.assign(
        et.ressources.find((x) => x.id === id),
        champs,
      ),
    );
  if (!etape.ressources.length)
    return <p className="text-muted">Pas de ressource pour cette étape.</p>;
  return (
    <ul className="grid gap-3">
      {etape.ressources.map((r) => (
        <li key={r.id}>
          <Card className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    {r.titre}
                  </a>
                ) : (
                  <p className="font-semibold">{r.titre}</p>
                )}
                <p className="text-[13px] text-muted">
                  {libelle(types, r.type)} · {r.langue}
                </p>
              </div>
              <Checkbox
                label="Lu"
                checked={r.lu}
                onChange={(e) => majRessource(r.id, { lu: e.target.checked })}
              />
            </div>
            <Input
              label="Mon avis en une ligne"
              value={r.avis ?? ''}
              onChange={(e) => majRessource(r.id, { avis: e.target.value })}
            />
            <details open={Boolean(r.notes)}>
              <summary className="cursor-pointer text-sm font-medium underline underline-offset-4">
                Notes de lecture
              </summary>
              <Textarea
                className="mt-3"
                label={`Notes sur ${r.titre}`}
                hideLabel
                placeholder="Ce que j'en retiens, mes questions…"
                value={r.notes ?? ''}
                onChange={(e) => majRessource(r.id, { notes: e.target.value })}
              />
            </details>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Questions({ etape }) {
  if (!etape.questions_ia?.length)
    return <p className="text-muted">Pas de question pour cette étape.</p>;
  return (
    <div className="grid gap-4">
      <p className="max-w-prose text-sm text-muted">
        Pour comprendre, pas pour faire à ma place. À poser dans une session lancée avec{' '}
        <code>/apprentissage:professeur</code>.
      </p>
      <ul className="grid">
        {etape.questions_ia.map((q) => (
          <li key={q} className="border-b border-line py-3 text-sm">
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Page d'une étape : objectifs, cours, notions, exercices, ressources et questions. */
export default function EtapePage() {
  const { donnees, modifier } = useDonnees();
  const { id } = useParams();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useSearchParams();
  const { parcours, dictionnaire } = donnees;
  const etapes = parcours.etapes;
  const etape = etapes.find((e) => String(e.id) === id) ?? etapes[0];

  if (!etape)
    return (
      <PageHeader
        eyebrow="Parcours"
        title="Aucune étape"
        description="Le parcours est vide. Ajoute des étapes avec /apprentissage:mettre-a-jour."
      />
    );

  const index = new Map(dictionnaire.entrees.map((e) => [e.id, e]));
  const position = etapes.indexOf(etape);
  const precedente = etapes[position - 1];
  const suivante = etapes[position + 1];
  const b = bilanEtape(etape);
  const onglet = recherche.get('onglet') ?? 'cours';
  const maj = (fn) => modifier('parcours', (p) => fn(p.etapes.find((e) => e.id === etape.id)));

  const onglets = [
    { value: 'cours', label: 'Cours' },
    { value: 'notions', label: `Notions ${b.notions.faits}/${b.notions.total}` },
    { value: 'exercices', label: `Exercices ${b.exercices.faits}/${b.exercices.total}` },
    { value: 'ressources', label: `Ressources ${b.ressources.faits}/${b.ressources.total}` },
    { value: 'questions', label: 'Questions' },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Sommaire etapes={etapes} courante={etape} />

      <article className="grid min-w-0 content-start gap-8">
        <Select
          className="lg:hidden"
          label="Étape"
          value={etape.id}
          onChange={(e) => navigate(`/parcours/${e.target.value}`)}
          options={etapes.map((e) => ({ value: e.id, label: `${deux(e.id)} · ${e.libelle}` }))}
        />

        <PageHeader
          eyebrow={`Étape ${deux(etape.id)}${etape.optionnel ? ' · optionnelle' : ''}`}
          title={etape.libelle}
          description={etape.resume}
        />

        {etape.objectifs?.length > 0 && (
          <Card className="grid gap-3">
            <h2 className="text-xs font-medium uppercase tracking-label text-muted">
              À la fin de l&apos;étape
            </h2>
            <ul className="grid max-w-prose list-[square] gap-1.5 pl-5">
              {etape.objectifs.map((o) => (
                <li key={o} className="pl-1">
                  <EnLigne texte={o} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Avancement" value={pourcent(avancementEtape(etape))} />
          <Stat label="Notions" value={`${b.notions.faits}/${b.notions.total}`} />
          <Stat label="Exercices" value={`${b.exercices.faits}/${b.exercices.total}`} />
          <Stat label="Ressources" value={`${b.ressources.faits}/${b.ressources.total}`} />
        </div>

        <Tabs
          label="Contenu de l'étape"
          items={onglets}
          value={onglet}
          onChange={(valeur) => setRecherche({ onglet: valeur }, { replace: true })}
          className="flex max-w-full flex-wrap"
        />

        <section aria-label={onglets.find((o) => o.value === onglet)?.label} className="min-w-0">
          {onglet === 'cours' && <Cours dossier={etape.dossier} />}
          {onglet === 'notions' && <Notions etape={etape} index={index} maj={maj} />}
          {onglet === 'exercices' && <Exercices etape={etape} maj={maj} />}
          {onglet === 'ressources' && (
            <Ressources etape={etape} types={parcours.types_ressources} maj={maj} />
          )}
          {onglet === 'questions' && <Questions etape={etape} />}
        </section>

        <nav
          aria-label="Étape précédente et suivante"
          className="flex flex-wrap justify-between gap-3 border-t border-line pt-6"
        >
          {precedente ? (
            <Button as={Link} to={`/parcours/${precedente.id}`} variant="secondary">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              {deux(precedente.id)} · {precedente.libelle}
            </Button>
          ) : (
            <span />
          )}
          {suivante && (
            <Button as={Link} to={`/parcours/${suivante.id}`}>
              {deux(suivante.id)} · {suivante.libelle}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Button>
          )}
        </nav>
      </article>
    </div>
  );
}
