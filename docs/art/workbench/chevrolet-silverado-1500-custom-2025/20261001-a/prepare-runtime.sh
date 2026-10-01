set -euo pipefail
repo=/home/desapoint/Projets/RacingGame
run_dir="$repo/docs/art/workbench/chevrolet-silverado-1500-custom-2025/20261001-a"
runtime_work_dir=$(mktemp -d /tmp/silverado-runtime.XXXXXX)
mkdir -p "$runtime_work_dir/scripts" "$runtime_work_dir/src/data" "$runtime_work_dir/src/assets/cars"
cp "$repo/scripts/prepare-car-assets.mjs" "$runtime_work_dir/scripts/prepare-car-assets.mjs"
cp "$repo/src/assets/cars/expansion-clean-metadata.json" "$runtime_work_dir/src/assets/cars/expansion-clean-metadata.json"
cp "$repo/src/assets/cars/chevrolet-silverado-1500-custom-2025-2d.png" "$runtime_work_dir/src/assets/cars/chevrolet-silverado-1500-custom-2025-2d.png"
printf '{}\n' > "$runtime_work_dir/src/assets/cars/geometry-overrides.json"
python3 - "$runtime_work_dir/src/data/game-data.json" <<'PY'
import json,sys
json.dump({"cars":[{"id":"chevrolet-silverado-1500-custom-2025","art":"chevrolet-silverado-1500-custom-2025"}]},open(sys.argv[1],"w"))
PY
cd "$runtime_work_dir"
/home/desapoint/.nvm/versions/node/v22.23.1/bin/node scripts/prepare-car-assets.mjs
mkdir -p "$run_dir/runtime"
cp src/assets/cars/optimized/chevrolet-silverado-1500-custom-2025.webp "$run_dir/runtime/chevrolet-silverado-1500-custom-2025.webp"
cp src/assets/cars/catalog.ts "$run_dir/runtime/single-car-catalog.ts"
cp src/assets/cars/payloads/chunk-0.ts "$run_dir/runtime/single-car-payload.ts"
printf '%s\n' "$runtime_work_dir" > "$run_dir/runtime/scratch-location.txt"
stat -c "%n %s bytes" "$run_dir/runtime/chevrolet-silverado-1500-custom-2025.webp"
