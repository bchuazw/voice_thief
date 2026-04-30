# Asset Pipeline

Voice Thief now has a Blender-backed GLB asset path for the main noir set
pieces. The runtime loads static GLBs, while the source generator is a
Blender Python script that can rebuild the kit whenever the art direction
changes.

## Commands

```bash
npm run verify-blender
npm run generate-assets
```

`npm run generate-assets` runs Blender 4.5 LTS in background mode and writes
the modular kit into:

```text
public/models/noir-kit/
```

The React side loads those files through:

```text
src/components/assets/NoirAsset.tsx
```

If Blender is installed somewhere unusual, set `BLENDER_EXE`:

```bash
BLENDER_EXE="C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" npm run generate-assets
```

The legacy Three.js generator is still available as a fallback:

```bash
npm run generate-assets:legacy
```

## Current Kit

- `bank-facade.glb`
- `cafe-facade.glb`
- `cafe-interior.glb`
- `apartment-block.glb`
- `guard-logbook.glb`
- `living-room.glb`
- `payphone.glb`
- `records-cabinet.glb`
- `records-plaque.glb`
- `briefcase.glb`
- `neon-bank-sign.glb`
- `street-mailbox.glb`
- `train-station.glb`
- `teller-counter.glb`
- `vault-audit-panel.glb`

These replace the most visible primitive-heavy props while preserving the
existing gameplay interaction points and collision logic. The guard logbook,
records plaque, records cabinet, and vault audit panel are puzzle-facing props:
they visually reinforce that Cole controls the alley gate, Lillian controls
hallway records access, and the vault needs either a cleared ledger or a forged
records clearance before it will accept Harold's voice.

## Art Direction

The kit targets semi-realistic noir rather than literal photorealism:
recognizable bank, diner, apartments, apartment interior, payphone, station,
and teller counter forms; bevels and weighted normals; smoky glass;
brass/wood/stone materials; and a small amount of grime and rain streaking.
The goal is to remove the "random shapes" feeling while staying lightweight
enough for browser play.

## Authoring Conventions

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
