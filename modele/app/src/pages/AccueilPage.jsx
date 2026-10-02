import { Link } from 'react-router';

import { Button, Card, Mark, PageHeader, Progress, Stat } from '../components/ui';
import { useDonnees } from '../hooks/useDonnees';
import {
  JOURS_RECENTS,
  avancementGlobal,
  deux,
  etapeCourante,
  nouveautes,
  prochainesActions,
  total,
} from '../lib/parcours';
import plateforme from '../lib/plateforme';
import { avancementEtape, pourcent } from '../lib/progression';

function Libelle({ children }) {
  return <h2 className="text-xs font-medium uppercase tracking-label text-muted">{children}</h2>;
}

/** Accueil : avancement, étape à reprendre, toutes les étapes, nouveautés de la veille. */
export default function AccueilPage() {
  const { donnees } = useDonnees();
  const { parcours, dictionnaire, pratiques, metier } = donnees;
  const global = avancementGlobal(parcours);
  const courante = etapeCourante(parcours);
  const veille = nouveautes(donnees);
  const aAppliquer = pratiques.pratiques.find((p) => !p.appliquee && p.etat === 'recommandee');
  const ressources = total(parcours, 'ressources');
  const notions = total(parcours, 'notions');
  const exercices = total(parcours, 'exercices');
  const motsAcquis = dictionnaire.entrees.filter((e) => e.statut === 'acquis').length;

  return (
    <div className="grid gap-12">
      <PageHeader
        eyebrow={metier.intitule ? `Objectif : ${metier.intitule}` : 'Plateforme d’apprentissage'}
        title={plateforme.titre}
        description={plateforme.sujet}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card className="grid content-start gap-4">
          <Libelle>Avancement</Libelle>
          <p className="text-[3rem] font-semibold leading-none tabular-nums tracking-title">
            {pourcent(global)}
          </p>
          <Progress value={global} label="Avancement global" />
          <p className="text-[13px] text-muted">
            Moyenne des étapes. Les étapes optionnelles ne comptent pas.
          </p>
        </Card>

        {courante && (
          <Card highlighted className="grid content-start gap-4">
            <Libelle>À reprendre</Libelle>
            <h3 className="text-[1.3rem] leading-tight">
              Étape {deux(courante.id)} · {courante.libelle}
            </h3>
            <ul className="grid gap-1.5">
              {prochainesActions(courante).map((a) => (
                <li key={a.quoi} className="flex gap-2 text-sm">
                  <span className="w-20 flex-none text-muted">{a.quoi}</span>
                  <span>{a.texte}</span>
                </li>
              ))}
            </ul>
            <div>
              <Button as={Link} to={`/parcours/${courante.id}`}>
                Ouvrir l&apos;étape
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Notions" value={`${notions.faits}/${notions.total}`} detail="acquises" />
        <Stat label="Exercices" value={`${exercices.faits}/${exercices.total}`} detail="faits" />
        <Stat label="Ressources" value={`${ressources.faits}/${ressources.total}`} detail="lues" />
        <Stat label="Mots" value={`${motsAcquis}/${dictionnaire.entrees.length}`} detail="acquis" />
      </section>

      <section className="grid gap-4">
        <Libelle>Les étapes</Libelle>
        {parcours.etapes.length === 0 && (
          <p className="text-muted">
            Aucune étape pour l&apos;instant. Ajoute-les avec{' '}
            <code>/apprentissage:mettre-a-jour</code>.
          </p>
        )}
        <ol className="grid gap-3 sm:grid-cols-2">
          {parcours.etapes.map((e) => {
            const a = avancementEtape(e);
            return (
              <li key={e.id}>
                <Card
                  as={Link}
                  to={`/parcours/${e.id}`}
                  className="grid h-full gap-3 hover:bg-black hover:text-white"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">
                      <span className="tabular-nums">{deux(e.id)}</span> · {e.libelle}
                    </span>
                    <span className="text-sm tabular-nums">{pourcent(a)}</span>
                  </span>
                  <Progress value={a} label={`Avancement de l'étape ${deux(e.id)}`} />
                  {e.optionnel && <span className="text-[13px]">Optionnelle</span>}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <Libelle>Nouveautés de la veille · {JOURS_RECENTS} derniers jours</Libelle>
          {veille.length ? (
            <ul className="grid">
              {veille.slice(0, 10).map((n, i) => (
                <li
                  key={i}
                  className="grid gap-1 border-b border-line py-3 sm:grid-cols-[6.5rem_1fr]"
                >
                  <span className="text-[13px] tabular-nums text-muted">{n.date}</span>
                  <span className="text-sm">
                    <span className="font-semibold">{n.quoi}</span> ·{' '}
                    {n.mot ? (
                      <Link
                        to={`/dictionnaire?mot=${n.mot}`}
                        className="underline underline-offset-4"
                      >
                        {n.titre}
                      </Link>
                    ) : (
                      <Link to="/pratiques" className="underline underline-offset-4">
                        {n.titre}
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="max-w-prose text-sm text-muted">
              Rien de nouveau. La veille ajoute ici les nouveaux mots, les actualités et les
              pratiques révisées.
            </p>
          )}
        </div>
        <div className="grid content-start gap-4">
          <Libelle>Pratique à appliquer</Libelle>
          {aAppliquer ? (
            <Card className="grid gap-2">
              <p className="font-semibold">{aAppliquer.titre}</p>
              {aAppliquer.pourquoi && <p className="text-sm text-muted">{aAppliquer.pourquoi}</p>}
              <div>
                <Button as={Link} to="/pratiques" variant="ghost" size="sm">
                  Voir les pratiques
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-muted">
              {pratiques.pratiques.length ? (
                <>
                  <Mark>Toutes</Mark> les pratiques recommandées sont appliquées.
                </>
              ) : (
                'Pas encore de bonnes pratiques.'
              )}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
