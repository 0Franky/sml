/**
 * slm — ESTENSIONE delle "pezze per il modello" (ADR wiki/decisions/2026-07-05-slm-scaffolding-extension.md, msg 1069).
 *
 * Contiene lo SCAFFOLDING-crutch (how_memory_works / reminder / resources) che aiuta un modello DEBOLE ma è RUMORE per
 * uno capace (H6) + è un crutch TEMPORANEO (il fix vero è il training che lo interiorizza). MODULARITÀ PIENA: pi carica
 * ogni file in `.pi/extensions/` → questo file È l'unità di install. Un modello CAPACE semplicemente NON installa `slm`
 * (togli/sposta questo file) → il core rende un contesto PULITO (`getRegisteredScaffolding()` → vuoto). "Scaffold che
 * recede" col training: laneMemoryHintLevel `full`→`lean`→`off`, poi rimozione del file — misurabile (regressione?).
 *
 * Meccanica: REGISTRA lo scaffolding in slm-scaffolding.mjs (al load import-time + nel setup, idempotente); il CORE
 * (context-assembly) lo LEGGE lazy per-turno. Il core NON conosce il contenuto-crutch → confine estensione/core netto.
 * Livello dalla config (SSOT): laneMemoryHint=false → "off"; altrimenti laneMemoryHintLevel ("full" default | "lean").
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerScaffolding } from "../../src/slm-scaffolding.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { CATEGORY_TOOLS } from "../../src/tool-gating.mjs"; // categorie per la riga di scoperta del tag <resources>

const CFG = loadHarnessConfig();
const LEVEL = CFG.laneMemoryHint ? CFG.laneMemoryHintLevel : "off";
const DISCOVERABLE_CATS = Object.keys(CATEGORY_TOOLS).filter((c) => c !== "core" && c !== "meta").join(", ");
const OPTS = { toolGating: CFG.toolGating, discoverableCats: DISCOVERABLE_CATS };

// Registra SUBITO (import-time): il registry è popolato prima del primo hook del core, a prescindere dall'ordine di
// import delle estensioni (il core legge lazy PER-TURNO, dopo che tutte le estensioni sono state importate al bootstrap).
registerScaffolding(LEVEL, OPTS);

export default function (_pi: ExtensionAPI) {
  // Ri-registra nel setup (idempotente): robustezza rispetto al lifecycle di pi (se un giorno resettasse i moduli).
  registerScaffolding(LEVEL, OPTS);
}
