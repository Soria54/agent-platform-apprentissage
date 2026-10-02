import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DonneesContext } from '../../lib/donneesContext';
import { charger, enregistrer, lireImport, oublierLocal } from '../../lib/stockage';

const CLE = ['donnees'];

/**
 * Charge les données (serveur ou navigateur), garde les modifications en cours et les
 * enregistre automatiquement, regroupées, 600 ms après la dernière.
 */
export default function DonneesProvider({ children }) {
  const queryClient = useQueryClient();
  const [brouillon, setBrouillon] = useState(null);
  const [enAttente, setEnAttente] = useState([]);
  const [etat, setEtat] = useState({ type: 'ok', message: '' });

  const { data, error } = useQuery({
    queryKey: CLE,
    queryFn: charger,
    staleTime: Infinity,
    // En revenant sur l'application (téléphone déverrouillé, onglet réaffiché), on relit
    // les données du serveur, sauf si une modification n'est pas encore enregistrée.
    refetchOnWindowFocus: (requete) =>
      requete.state.data?.mode === 'fichier' && !brouillon && !enAttente.length,
  });
  const mode = data?.mode;
  const donnees = brouillon ?? data?.donnees;

  useEffect(() => {
    if (!enAttente.length || !brouillon) return;
    const minuterie = setTimeout(async () => {
      const noms = [...enAttente];
      try {
        for (const nom of noms) await enregistrer(nom, brouillon[nom], mode);
        queryClient.setQueryData(CLE, (ancien) => ({ ...ancien, donnees: brouillon }));
        setEnAttente((liste) => liste.filter((n) => !noms.includes(n)));
        setBrouillon((actuel) => (actuel === brouillon ? null : actuel));
        setEtat({
          type: 'ok',
          message:
            mode === 'fichier'
              ? `Enregistré dans donnees/${noms.map((n) => `${n}.json`).join(', ')}`
              : 'Enregistré dans ce navigateur',
        });
      } catch (e) {
        setEtat({ type: 'erreur', message: `Non enregistré : ${e.message}` });
      }
    }, 600);
    return () => clearTimeout(minuterie);
  }, [brouillon, enAttente, mode, queryClient]);

  const modifier = useCallback(
    (nom, maj) => {
      setBrouillon((actuel) => {
        const base = actuel ?? queryClient.getQueryData(CLE).donnees;
        const copie = structuredClone(base[nom]);
        maj(copie);
        return { ...base, [nom]: copie };
      });
      setEnAttente((liste) => (liste.includes(nom) ? liste : [...liste, nom]));
      setEtat({ type: 'attente', message: 'Modifications en attente…' });
    },
    [queryClient],
  );

  const importer = useCallback(
    async (fichier) => {
      try {
        const jeux = lireImport(JSON.parse(await fichier.text()));
        setBrouillon((actuel) => ({
          ...(actuel ?? queryClient.getQueryData(CLE).donnees),
          ...jeux,
        }));
        setEnAttente((liste) => [...new Set([...liste, ...Object.keys(jeux)])]);
      } catch (e) {
        setEtat({ type: 'erreur', message: `Import impossible : ${e.message}` });
      }
    },
    [queryClient],
  );

  const reinitialiser = useCallback(() => {
    oublierLocal();
    location.reload();
  }, []);

  const valeur = useMemo(
    () => ({ donnees, mode, etat, modifier, importer, reinitialiser }),
    [donnees, mode, etat, modifier, importer, reinitialiser],
  );

  if (error) return <p className="p-8 text-danger">Chargement impossible : {error.message}</p>;
  if (!donnees) return <p className="p-8 text-muted">Chargement…</p>;
  return <DonneesContext.Provider value={valeur}>{children}</DonneesContext.Provider>;
}
