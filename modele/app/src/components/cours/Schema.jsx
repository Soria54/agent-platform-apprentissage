import { useEffect, useId, useState } from 'react';

import contraste from '../../../contraste/preset.js';

const { black, white, muted, line } = contraste.theme.colors;

// Mermaid est lourd : il n'est chargé qu'à l'affichage du premier schéma.
let chargement;
function chargerMermaid() {
  chargement ??= import('mermaid').then(({ default: mermaid }) => {
    const variable = (nom) =>
      getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || white;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        background: white,
        primaryColor: white,
        primaryTextColor: black,
        primaryBorderColor: black,
        secondaryColor: variable('--hl-soft'),
        tertiaryColor: white,
        lineColor: black,
        textColor: black,
        mainBkg: white,
        nodeBorder: black,
        clusterBkg: white,
        clusterBorder: line,
        edgeLabelBackground: white,
        noteBkgColor: variable('--hl-soft'),
        noteBorderColor: black,
        actorBkg: white,
        actorBorder: black,
        signalColor: black,
        labelBoxBkgColor: white,
        labelBoxBorderColor: black,
        fontSize: '15px',
      },
      // Un nœud marqué « :::important » prend la couleur de mise en évidence.
      themeCSS: `
        .important rect, .important polygon, .important circle, .important path { fill: var(--hl) !important; stroke: ${black} !important; }
        .important .nodeLabel, .important text { color: var(--hl-on) !important; fill: var(--hl-on) !important; font-weight: 600; }
        .edgeLabel, .edgeLabel p { color: ${muted}; }
      `,
      flowchart: { curve: 'linear', padding: 12, htmlLabels: true },
    });
    return mermaid;
  });
  return chargement;
}

/**
 * Schéma Mermaid (```mermaid dans un cours), dessiné en noir et blanc, traits de 1 px.
 * En cas d'erreur de syntaxe, le code est affiché avec le message.
 */
export default function Schema({ code, titre }) {
  const id = `schema-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [rendu, setRendu] = useState({ svg: '', erreur: '' });

  useEffect(() => {
    let actif = true;
    chargerMermaid()
      .then((mermaid) => mermaid.render(id, code))
      .then(({ svg }) => actif && setRendu({ svg, erreur: '' }))
      .catch((e) => actif && setRendu({ svg: '', erreur: e.message ?? String(e) }));
    return () => {
      actif = false;
    };
  }, [code, id]);

  if (rendu.erreur)
    return (
      <div className="grid gap-2 border border-danger p-4">
        <p className="text-sm font-medium text-danger">Schéma illisible : {rendu.erreur}</p>
        <pre className="overflow-x-auto text-[13px]">
          <code>{code}</code>
        </pre>
      </div>
    );

  return (
    <figure className="grid gap-2">
      <div
        role="img"
        aria-label={titre ?? 'Schéma'}
        className="schema overflow-x-auto border border-line bg-white p-4"
        // Le SVG vient de Mermaid en mode « strict » (contenu assaini).
        dangerouslySetInnerHTML={{ __html: rendu.svg }}
      />
      {titre && <figcaption className="text-[13px] text-muted">{titre}</figcaption>}
    </figure>
  );
}
