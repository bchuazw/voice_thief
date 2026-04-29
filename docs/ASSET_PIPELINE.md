# Asset Pipeline

Voice Thief now has a GLB-first asset path for the main noir set pieces.
The current kit is generated locally so the game is not blocked on Blender
being installed in every environment, but the runtime path is the same one
we should use for Blender-authored assets.

## Commands

```bash
npm run generate-assets
```

This writes the current modular kit into:

```text
public/models/noir-kit/
```

The React side loads those files through:

```text
src/components/assets/NoirAsset.tsx
```

## Current Kit

- `bank-facade.glb`
- `cafe-facade.glb`
- `apartment-block.glb`
- `payphone.glb`
- `train-station.glb`
- `teller-counter.glb`

These replace the most visible primitive-heavy props while preserving the
existing gameplay interaction points and collision logic.

## Blender Handoff

When Blender is available, export replacement assets as GLB files with the
same filenames and approximate origins/scales. That lets the game upgrade
from generated low-poly kit pieces to hand-authored art without changing the
scene code.

Recommended conventions:

- Put the asset origin at the gameplay anchor used by the current component.
- Keep scale in meters-ish scene units.
- Use glTF-compatible PBR materials, preferably Principled BSDF plus PNG/JPEG
  textures.
- Keep collision separate from render meshes. The game should continue using
  simple interaction and blocking volumes for puzzle reliability.
- Avoid baking gameplay state into the model. Active states, prompts, and
  lights should stay controlled by React/store code.

## Rapier

Rapier is intentionally not part of this pass. Add it after the art pass if
first-person movement, collision, or physical props need more fidelity.
