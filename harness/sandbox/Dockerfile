# Sandbox riproducibile per l'esecuzione dei verifier dei gold-example.
# git + python + node: gli oracoli dei gold usano git ls-files/status/show + import-resolution,
# eseguiti tramite run-spec.mjs (Node). pytest/pylint sono presenti per gold FUTURI che li
# richiedono come oracolo (i 6 spec attuali sono dependency-free: usano `python -c import`).
FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# pytest/pylint per oracoli dei gold futuri (i 6 spec attuali non li usano).
RUN pip install --no-cache-dir pytest pylint

# autocrlf=false globale: nessun round-trip git deve mutare i byte (portabilita' oracoli).
RUN git config --global core.autocrlf false \
    && git config --global user.email "sandbox@slm.local" \
    && git config --global user.name "slm-sandbox"

WORKDIR /work

# Esecuzione:
#   docker build -t slm-sandbox -f sandbox/Dockerfile .
#   docker run --rm -v "$PWD:/work" slm-sandbox node sandbox/run-all.mjs
# (monta il repo; run-all.mjs gira tutti i verifiers/*.json dentro il container)
CMD ["node", "sandbox/run-all.mjs"]
