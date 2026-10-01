# Editable game configuration

## Files

| File | Purpose |
| --- | --- |
| `src/data/game-data.json` | Canonical JSON config for development and new builds |
| `dist/config.js` | Editable config used directly by the built game |
| `dist/index.html` | Game code and styles; loads its neighboring `config.js` and local sprite atlases |
| `dist/assets/` | Optimized local WebP atlases for car bodies, paint masks, and wheels |

The release config contains a plain data object wrapped in one JavaScript assignment:

```js
globalThis.REDLINE_CONFIG = {
  // The complete game configuration appears here in the generated file.
};
```

Edit the existing values inside that object, save the file, and reload the game. Keep `config.js` and the `assets/` directory next to `index.html`. The wrapper lets browsers read local data through a classic script without fetching JSON or loading ES modules across `file://` origins. No server is required.

Development continues to use ordinary JSON. Building generates the release wrapper from `src/data/game-data.json`; preserve lasting changes there, because a new build replaces `dist/config.js`.

## Common edits

- Change a car's `price` to adjust its dealership cost.
- Change `power` to adjust its displayed base horsepower. Change `acceleration` and `maxSpeed` to adjust its base race performance; these are independent arcade balance values. `maxSpeed` is measured in meters per second, with the UI converting to km/h.
- Change `color` to a six-digit hex color such as `#bd233b`. This sets dealership and newly purchased car paint. Existing owned cars retain their saved paint.
- Change `startCash` to set the initial balance for new profiles. Existing saves retain their earned balance.
- Change event `reward`, job `participation`/`bonus`, or part `price`/`effect` to tune progression.

For example, to display 275 HP for the Mazda, find the car whose ID is `mazda3-turbo-sedan-2021` and change its `"power": 250` to `"power": 275`. Saving the release config and reloading the page updates the dealership without rebuilding the HTML.

## Structure and constraints

The top-level object contains `cars`, `parts`, `classes`, `events`, `rivals`, `difficulties`, `jobs`, `idle`, and `tuning`, plus the race distance, starting funds, and starter/loaner IDs. Keep IDs unique and references valid. Preserve existing IDs so saved ownership continues to resolve.

V1's career assumes four divisions with five ordered events each. The active roster uses 30 sprite-backed cars. Each car must define a unique integer `spriteIndex` from 1 through 30, matching its cell in the local body, paint-mask, and wheel atlases. Changing or adding sprite artwork requires updating those local atlases and rebuilding the release.

Startup validation reports invalid configuration on the page. A missing or unreadable config also displays an error instead of silently falling back to embedded defaults. Idle capacities must remain no larger than the lowest job participation reward. Existing saves continue to be validated against the active configuration.
