---
name: class-visual-design-quality
description: PADRE di famiglia (rule #20) — skill-radice "giudicare/produrre la composizione visiva contro LEGGI di design/UX verificabili (prossimità, allineamento, gerarchia, contrasto), NON contro il gusto soggettivo". Figlie: class-frontend-ux-spacing-quality (P1) e class-svg-spatial-composition (P3).
type: training-class
tags: [visual-design, ux, spatial-reasoning, gestalt, quality-judgment, parent-class, tier-3]
last_updated: 2026-07-08
---

# Classe-PADRE (radice) — VISUAL DESIGN QUALITY (giudicare la composizione contro leggi verificabili, non contro il gusto)

> **Ruolo**: PADRE di famiglia (rule #20 — gerarchia obbligatoria). Raccoglie la **skill-radice** condivisa dalle figlie visuali; la radice si impara UNA volta, le figlie la specializzano su *cosa/come*.
> **Figlie**: [[class-frontend-ux-spacing-quality]] (P1 — spaziatura/layout frontend, gradiente a/b/c/d) · [[class-svg-spatial-composition]] (P3 — generazione/editing SVG + conformità struttura↔ground-truth; **2 facet**: UX-layout *e* OBJECT-DEPICTION — comporre le parti di un oggetto su layer perché il render lo depinga, msg 1535/1545). Se emergono altre specializzazioni visuali (tipografia, color-contrast/accessibilità, data-viz — cfr. [[../concepts/kb-topics-tier1-expansion]] Gruppo B "information design") si appendono qui.
> **Zia filosofica**: [[class-metacognitive-self-audit]] — giudicare la propria composizione contro una legge/ground-truth È un audit anti-reward-hacking (non fidarsi della superficie estetica, àncora alla legge misurabile).

## La skill-radice (condivisa, imparata una volta)

Di fronte a un artefatto visivo (layout, SVG, diagramma), NON valutarlo "a occhio/gusto" ma:
1. **Estrai la struttura semantica**: cosa appartiene allo stesso gruppo (→ vicino/allineato) vs a gruppi diversi (→ separato); qual è la gerarchia di lettura.
2. **Applica la LEGGE di design pertinente e verificabile**: prossimità (la vicinanza codifica l'appartenenza), allineamento, gerarchia/contrasto, banda di leggibilità.
3. **Verifica bilateralmente** (esiste un OPTIMUM, entrambi gli estremi rompono): sia il difetto (troppo fitto/disallineato → fusione/ambiguità) sia l'eccesso (troppo rado/disperso → disconnessione).
4. **Condiziona al CONTESTO** (denso/dati vs marketing/hero): la banda ottimale è context-dependent, non un "arioso" fisso.
5. **Àncora l'esito al MISURABILE** (raggruppamento correttamente percepibile, leggibilità/task-success, conformità struttura↔ground-truth), MAI a "è bello".

## Reward-principle della famiglia (ereditato dalle figlie)

Ancorato all'OUTCOME misurabile (metrica derivata dalla legge + task-success), **mai** al voto estetico né alla cerimonia ("per la legge di prossimità…" a parole) — [[../feedback_reward_hacking_principle]] (#10). Reward **simmetrico** (rule #21): bocciare un artefatto SANO è penalizzato quanto mancare una regressione reale.

## Perché una famiglia (rule #20)

Frontend-spacing e SVG-composition condividono la stessa radice (legge-di-design verificabile vs gusto) e lo stesso failure-mode (euristica monotòna / estetica soggettiva / reward-hack sui pixel). Il padre fa imparare la radice UNA volta (anti-ridondanza di segnale) + riflette la relazione reale + è composizionale ([[../feedback_hierarchical_training_classes]], CLAUDE.md #20).

## Facet — verify-by-render multi-viewport (mining Stage-2 #13, 2026-07-10)

Per il lavoro su UI la verifica non è "sembra giusto nel codice" ma **rendere davvero e controllare la resa** su ≥2 viewport (desktop+mobile), deterministicamente (screenshot dopo ogni azione). È l'applicazione UI del gate di validazione ([[../feedback_validate_wiring_before_handoff]] / [[../feedback_handoff_validation_gate]]): l'artefatto visivo si valida guardandolo renderizzato, non assumendolo. Reward: la resa reale soddisfa i criteri su tutti i viewport; hack-check: "ho verificato il layout" senza render → 0.

## Links
[[class-frontend-ux-spacing-quality]] · [[class-svg-spatial-composition]] · [[class-metacognitive-self-audit]] · [[../concepts/kb-topics-tier1-expansion]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]]
