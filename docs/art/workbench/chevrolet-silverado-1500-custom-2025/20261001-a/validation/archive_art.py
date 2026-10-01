import shutil
from pathlib import Path
root=Path('/home/desapoint/Projets/RacingGame')
run=root/'docs/art/workbench/chevrolet-silverado-1500-custom-2025/20261001-a'
pre=run/'previews'
pre.mkdir(exist_ok=True)
for source,name in [(root/'test-results/silverado-stock-black.png','silverado-stock-black-final.png'),(root/'test-results/silverado-stock-repaint.png','silverado-repaint-final.png'),(root/'test-results/silverado-livery.png','silverado-livery-final.png')]:
 shutil.copyfile(source,pre/name)
(run/'validation/head-baseline-browser.log').write_text('Isolated baseline: git archive HEAD at test-results/head-baseline-20261001, with unchanged pre-existing tests/browser/offline.spec.ts copied in and repository node_modules linked. Command: npm run build && npm run test:browser -- --workers=1 --grep "release runs offline from file|mobile menus fit".\nResult: both failures reproduced on HEAD before Silverado changes. The release race test finished P4 and failed its expected Next event unlocked assertion. The mobile test timed out because the launch action was absent. This is baseline test behavior, not caused by the Silverado change. Full-suite browser log from the working tree is separately preserved.\n',encoding='utf-8')
