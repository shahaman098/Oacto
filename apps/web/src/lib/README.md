# Web Lib

Frontend-only helpers belong here when they are not specific to a single feature.

Current rule: shared domain logic should stay outside React components. If the API also needs it, move it to `packages/shared`, `packages/types`, or `packages/validation`.
