# Cómo parchear el core de la flota

Los sistemas hijos divergen libremente en `src/modules/` y `src/app/`, pero el
núcleo (`src/core/`, y poco más) se corrige desde el template y se propaga.

## Publicar un parche (en el template)

1. Hacé el fix tocando SOLO la zona core (idealmente un commit atómico).
2. Subí `TEMPLATE_VERSION` (+1) en el mismo commit y anotá el cambio en
   `CHANGELOG-CORE.md`.
3. Tagueá: `git tag patch/AAAA-MM-<tema> && git push --tags`.

## Aplicar en cada hijo

```bash
git fetch template --tags
git cherry-pick <hash-del-tag>     # o el rango si son varios commits
npm run verify                     # el CI del PR repite esto
```

- Si el cherry-pick aplica limpio (lo normal si nadie tocó el core): PR,
  CI verde, merge.
- Si conflictúa: ese hijo editó el core — resolvé a mano y evaluá subir la
  divergencia al template para que no vuelva a pasar.

## Parches de dependencias

No van por cherry-pick: **Renovate** abre el PR en cada hijo (auto-merge con
CI verde para actualizaciones de seguridad y patches). Los majors de
Next/React/Prisma/NextAuth quedan siempre para revisión manual.

## Auditar la flota

`TEMPLATE_VERSION` de cada repo dice quién está atrasado. (El CLI de flota —
`flota status` / `flota patch` — se construye cuando existan varios hijos;
este archivo define el contrato que va a automatizar.)
