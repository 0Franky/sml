# Config pi del progetto (`harness/.pi/`)

Configurazione del nostro harness sopra **pi** (`@earendil-works/pi-coding-agent`).

## `settings.json`

Project-scope settings (path: `<cwd>/.pi/settings.json`, verificato in `settings-manager.js`).

- **`compaction.enabled = false`** — la **compaction nativa di pi è SPENTA** di proposito. Decisione **Strada 2** (ADR [`../../wiki/decisions/2026-06-29-context-as-first-person-mind.md`](../../wiki/decisions/2026-06-29-context-as-first-person-mind.md) §principio-4): il context è la **mente in prima persona** del modello, gestita da NOI tramite la **curazione continua del workspace** + la **compaction a matrioska** (nested-vision), nel NOSTRO formato. Niente "chat lunga riassunta col metodo generico di pi" → niente mismatch train-serve né doppia-memoria scoordinata ([`../../wiki/decisions/2026-06-29-compaction-coherence.md`](../../wiki/decisions/2026-06-29-compaction-coherence.md)).
- `compaction.reserveTokens` / `keepRecentTokens` — lasciati al default: **moot finché `enabled=false`**; la calibrazione sul window reale dell'SLM (Qwen3-4B) si fa quando il window è fissato. Schema: `CompactionSettings { enabled?, reserveTokens?, keepRecentTokens? }`.

## `extensions/`

Le nostre estensioni TS (un concept = un'estensione). La logica deterministica vive in `../src/*.mjs` (testabile con node puro); l'estensione è un thin-wrapper sugli hook pi. Vedi [`../../wiki/architecture/harness-feature-catalog.md`](../../wiki/architecture/harness-feature-catalog.md).

## `state/` (gitignored)

Stato runtime: `vars.db` (datastore SQLite vars-queue) — creato a runtime, **non** sorgente (`.gitignore`: `.pi/state/`). Sopravvive al compact (cross-session).
