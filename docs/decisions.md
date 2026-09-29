# Technical decisions

## Sprite-backed car rendering

The car roster uses optimized sprite atlases derived from the supplied car, paint-mask, and wheel art.

- Runtime car bodies and paint masks are stored as 6 × 5 atlases.
- Wheels remain a separate 6 × 5 atlas so garage wheel choices and race rotation still work.
- Car definitions identify art with a stable `spriteIndex` from 1 through 30.
- Rendering keeps the existing 800 × 300 logical car space so garage liveries and race layout remain compatible with existing saves.
- Offline builds copy the atlases into `dist/assets`; no runtime network access is required.

This approach replaces per-car procedural drawing while preserving low rendering cost, editable paint/livery state, and the existing race simulation.
