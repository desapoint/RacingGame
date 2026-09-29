# Project guidance

This repository is a web racing game. Keep it easy to run on low-end hardware.

- Favor simple rendering and game logic, a small download, and stable frame times. Consider performance cost before adding effects, assets, or dependencies.
- Prefer established libraries for frameworks, icons, and other common needs when they are a good fit. Avoid rebuilding common tools without a reason.
- Organize implementation across focused files and classes with clear responsibilities. Keep game logic separate from rendering and browser input.
- Keep game documentation in `docs/`.
- Record durable technical and product decisions in `docs/decisions.md` when they are made. Include the reason and any constraints future work must preserve. Consult that file before revisiting a decision.

