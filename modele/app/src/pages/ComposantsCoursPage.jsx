import { useState } from 'react';

import Markdown from '../components/cours/Markdown';
import { Callout, PageHeader, Progress, Select, Stat, Textarea } from '../components/ui';

const EXEMPLE = `## Un cours d'exemple

Une idée par ligne. Le point clé est ==surligné==, une seule fois par section.

- **Mot important** en gras
- Liste courte, phrases courtes
  - un sous-point si besoin

> [!IMPORTANT]
> Ce qu'il faut retenir, en une ou deux lignes.

> [!TIP]
> Une astuce ou un exemple concret.

\`\`\`mermaid
flowchart LR
  A[Question] --> B[Explication courte]
  B --> C[Schéma]:::important
  C --> D[Exercice]
\`\`\`

| Terme | En une phrase |
|---|---|
| Notion | Ce qu'il faut comprendre |
| Exercice | Ce qu'il faut faire |
`;

function Section({ title, children }) {
  return (
    <section className="grid gap-4 border-t border-line pt-6">
      <h2 className="text-xs font-medium uppercase tracking-label text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** Catalogue des composants propres à la plateforme et rendu d'un cours d'exemple. */
export default function ComposantsCoursPage() {
  const [niveau, setNiveau] = useState('base');
  return (
    <div className="grid gap-10">
      <PageHeader eyebrow="Référence" title="Composants des cours" />

      <Section title="Progression et compteurs">
        <Progress value={0.4} label="Exemple d'avancement" className="max-w-sm" />
        <div className="grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-3">
          <Stat label="Notions" value="4/9" detail="acquises" />
          <Stat label="Exercices" value="1/3" detail="faits" />
          <Stat label="Avancement" value="42 %" />
        </div>
      </Section>

      <Section title="Champs">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <Select
            label="Niveau"
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            options={[
              { value: 'base', label: 'Base' },
              { value: 'avance', label: 'Avancé' },
            ]}
          />
          <Textarea label="Notes" placeholder="Ce que j'en retiens…" rows={3} />
        </div>
      </Section>

      <Section title="Encadrés">
        <div className="grid max-w-prose gap-3">
          <Callout label="À retenir" highlighted>
            <p>Un seul encadré en évidence par écran.</p>
          </Callout>
          <Callout label="Astuce">
            <p>Les autres restent en noir et blanc.</p>
          </Callout>
        </div>
      </Section>

      <Section title="Cours en Markdown">
        <Markdown texte={EXEMPLE} />
      </Section>
    </div>
  );
}
