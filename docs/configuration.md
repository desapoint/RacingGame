# Editable game configuration

## Files

| File | Purpose |
| --- | --- |
| `src/data/game-data.json` | Canonical JSON config for development and new builds |
| `dist/config.js` | Editable config used directly by the built game |
| `dist/index.html` | Game code, styles, and artwork; loads its neighboring `config.js` |

The release config contains a plain data object wrapped in one JavaScript assignment:

```js
globalThis.REDLINE_CONFIG = {
  // The complete game configuration appears here in the generated file.
};
```

Edit the existing values inside that object, save the file, and reload the game. Keep `config.js` next to `index.html`. The wrapper lets browsers read local data through a classic script without fetching JSON or loading ES modules across `file://` origins. No server is required.

Development continues to use ordinary JSON. Building generates the release wrapper from `src/data/game-data.json`; preserve lasting changes there, because a new build replaces `dist/config.js`.

## Common edits

- Change a car's `price` to adjust its dealership cost.
- Change `power` to adjust its displayed base horsepower. Change `acceleration` and `maxSpeed` to adjust its base race performance; these are independent arcade balance values. `maxSpeed` is measured in meters per second, with the UI converting to km/h.
- Change a car's `grip` (1 is standard) and `shiftTime` (seconds) to adjust traction and transmission delay. Neglected and rusty variants have their own explicit performance fields; changing their paint does not repair them.
- Change `color` to a six-digit hex color such as `#bd233b`. This sets dealership and newly purchased car paint. Existing owned cars retain their saved paint.
- Change `startCash` to set the initial balance for new profiles. Existing saves retain their earned balance.
- Change event `reward`, job `participation`/`bonus`, or part `price`/`effect` to tune progression.

For example, to display 275 HP for the Mazda, find the car whose ID is `mazda3-turbo-sedan-2021` and change its `"power": 250` to `"power": 275`. Saving the release config and reloading the page updates the dealership without rebuilding the HTML.

## Structure and constraints

The top-level object contains `cars`, `models`, `parts`, `classes`, `events`, `rivals`, `difficulties`, `jobs`, `idle`, and `tuning`, plus the race distance, starting funds, and starter/loaner IDs. Keep IDs unique and references valid. Preserve existing IDs so saved ownership continues to resolve. The optional `carAliases` object maps retired IDs to current car IDs; it preserves owned customization on load. Do not point two retired IDs at the same replacement unless you accept that duplicate ownership is retained as an unavailable record.

V1's career assumes four divisions with five ordered events each. Roster size can grow, but each car must reference an existing artwork ID in `src/assets/cars/catalog.ts`. Each bundled car uses its own ID as its `art` value. Adding new artwork requires an image, metadata, `npm run assets:prepare`, and a rebuild; changing balance or paint does not. `year` identifies the model year and `era` is `modern` or `classic`.

`models` holds shared factory specifications and source links. A car's `modelId` points to its factory record, `category` drives dealership filtering, and `condition` is `standard`, `used`, or `rusty`. A model's `powerHp` describes factory output; a car's `power` describes game output in its current condition. Unconfirmed factory numbers must be `null`. `fuel` accepts `petrol`, `diesel`, `mild hybrid`, `hybrid`, `plug-in hybrid`, or `electric`. `gears: 0` means CVT, while the game retains six-speed race controls for every powertrain. Builds validate source data with the same rules as startup before replacing the playable release.

Expansion authoring uses `original-models.json`, `expansion-models.json`, `expansion-plan.json` and `condition-profiles.json`. `npm run roster:assemble` rebuilds expansion car entries in the main config and replaces direct edits to those entries. For lasting authoring changes, edit these inputs or the assembly balance formula; for release-only tuning, edit the explicit car values in `dist/config.js`. See [roster-expansion.md](roster-expansion.md).

Startup validation reports invalid configuration on the page. A missing or unreadable config also displays an error instead of silently falling back to embedded defaults. Idle capacities must remain no larger than the lowest job participation reward. Existing saves continue to be validated against the active configuration.
