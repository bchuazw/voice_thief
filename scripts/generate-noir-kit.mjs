import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  constructor() {
    this.onloadend = null;
    this.result = null;
  }

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const ab = await blob.arrayBuffer();
    this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(ab).toString("base64")}`;
    this.onloadend?.();
  }
};

const OUT_DIR = path.join(process.cwd(), "public", "models", "noir-kit");
fs.mkdirSync(OUT_DIR, { recursive: true });

const materials = {
  asphaltBlue: mat("#202638", 0.9),
  bankStone: mat("#292b3a", 0.82),
  bankTrim: mat("#47495c", 0.62),
  cafeBrick: mat("#241718", 0.86),
  cafeTrim: mat("#5a2c20", 0.74),
  apartmentBrick: mat("#2d2430", 0.88),
  deepBlack: mat("#07070b", 0.8),
  warmGlass: mat("#0b0705", 0.45, 0, "#f5a623", 1.25),
  dimGlass: mat("#0a0a10", 0.72, 0, "#5f4320", 0.35),
  redNeon: mat("#150506", 0.4, 0, "#ff3c3c", 1.7),
  amberNeon: mat("#120906", 0.42, 0, "#f5a623", 1.5),
  tealNeon: mat("#061312", 0.45, 0, "#3affa6", 1.4),
  brass: mat("#a07020", 0.35, 0.8),
  darkMetal: mat("#111216", 0.48, 0.55),
  wood: mat("#382115", 0.68, 0.05),
  redPaint: mat("#8e211b", 0.48, 0.18),
  cream: mat("#efe2c5", 0.72),
};

function mat(color, roughness = 0.8, metalness = 0, emissive = "#000000", emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
}

function group(name) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

function box(parent, name, size, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cyl(parent, name, radiusTop, radiusBottom, height, position, material, rotation = [0, 0, 0], segments = 12) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material,
  );
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(parent, name, radius, position, material, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function torus(parent, name, radius, tube, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 24), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function bankFacade() {
  const g = group("bank-facade");
  box(g, "deco stone mass", [8.4, 6.7, 6], [0, 3.05, -3], materials.bankStone);
  box(g, "granite plinth", [8.8, 0.95, 0.75], [0, 0.48, 0.18], materials.bankTrim);
  box(g, "front step lower", [4.2, 0.16, 0.6], [0, 0.08, 0.98], materials.bankTrim);
  box(g, "front step upper", [3.4, 0.16, 0.48], [0, 0.25, 0.68], materials.bankStone);

  [-3.25, -1.15, 1.15, 3.25].forEach((x, i) => {
    box(g, `fluted column ${i}`, [0.68, 5.1, 0.4], [x, 3.32, 0.32], materials.bankTrim);
    box(g, `column black groove ${i}a`, [0.035, 4.65, 0.04], [x - 0.18, 3.32, 0.56], materials.deepBlack);
    box(g, `column black groove ${i}b`, [0.035, 4.65, 0.04], [x + 0.18, 3.32, 0.56], materials.deepBlack);
  });

  box(g, "heavy cornice", [8.9, 0.52, 0.6], [0, 6.25, 0.35], materials.bankTrim);
  box(g, "thin red bank neon", [6.6, 0.12, 0.08], [0, 6.62, 0.7], materials.redNeon);
  box(g, "recessed black vestibule", [2.6, 2.85, 0.08], [0, 1.72, 0.22], materials.deepBlack);
  box(g, "left brass door", [1.04, 2.35, 0.08], [-0.53, 1.6, 0.3], materials.wood);
  box(g, "right brass door", [1.04, 2.35, 0.08], [0.53, 1.6, 0.3], materials.wood);
  box(g, "door transom glow", [2.42, 0.44, 0.06], [0, 3.05, 0.36], materials.warmGlass);
  sphere(g, "left door sconce", 0.12, [-1.47, 2.62, 0.48], materials.amberNeon);
  sphere(g, "right door sconce", 0.12, [1.47, 2.62, 0.48], materials.amberNeon);
  sphere(g, "left handle", 0.055, [-0.16, 1.55, 0.4], materials.brass);
  sphere(g, "right handle", 0.055, [0.16, 1.55, 0.4], materials.brass);

  [-2.38, 2.38].forEach((x, ix) => {
    const wg = group(`barred window ${ix}`);
    wg.position.set(x, 2.78, 0.36);
    g.add(wg);
    box(wg, "lit glass", [1.45, 1.82, 0.04], [0, 0, 0], materials.warmGlass);
    [-0.5, -0.16, 0.16, 0.5].forEach((bx, j) => {
      cyl(wg, `vertical security bar ${j}`, 0.025, 0.025, 1.82, [bx, 0, 0.08], materials.darkMetal, [0, 0, 0], 6);
    });
    [-0.48, 0, 0.48].forEach((by, j) => {
      box(wg, `brass horizontal rail ${j}`, [1.48, 0.055, 0.06], [0, by, 0.09], materials.brass);
    });
  });

  box(g, "address plaque", [0.82, 0.28, 0.04], [3.43, 0.76, 0.57], materials.amberNeon);
  return g;
}

function cafeFacade() {
  const g = group("cafe-facade");
  box(g, "deep brick cafe block", [6.6, 5.25, 6], [0, 2.62, -3], materials.cafeBrick);
  box(g, "tile base", [6.8, 0.78, 0.7], [0, 0.38, 0.18], materials.cafeTrim);
  box(g, "all night sign box", [4.3, 0.42, 0.16], [-0.6, 4.82, 0.38], materials.amberNeon);

  const window = group("wide diner window");
  window.position.set(-1.05, 2.3, 0.22);
  g.add(window);
  for (let cx = 0; cx < 5; cx++) {
    for (let cy = 0; cy < 3; cy++) {
      const lit = (cx * 31 + cy * 17) % 5 !== 0;
      box(
        window,
        `pane ${cx}-${cy}`,
        [0.58, 0.62, 0.04],
        [cx * 0.66 - 1.3, cy * 0.7 - 0.7, 0],
        lit ? materials.warmGlass : materials.dimGlass,
      );
    }
  }
  [-1.63, -0.98, -0.32, 0.34, 1.0, 1.65].forEach((x, i) => {
    box(window, `vertical mullion ${i}`, [0.045, 2.22, 0.06], [x, 0, 0.06], materials.deepBlack);
  });
  [-1.05, -0.35, 0.35, 1.05].forEach((y, i) => {
    box(window, `horizontal mullion ${i}`, [3.34, 0.045, 0.06], [0, y, 0.06], materials.deepBlack);
  });

  [-1.85, -1.25, -0.65, -0.05, 0.55, 1.15].forEach((x, i) => {
    box(
      g,
      `striped sloped awning ${i}`,
      [0.52, 0.08, 1.05],
      [x, 4.15, 0.58],
      i % 2 === 0 ? materials.redPaint : materials.cream,
      [0.28, 0, 0],
    );
  });

  box(g, "wood diner door", [1.05, 2.2, 0.08], [2.05, 1.38, 0.24], materials.wood);
  box(g, "door glass pane", [0.62, 0.95, 0.04], [2.05, 1.72, 0.32], materials.warmGlass);
  box(g, "brass kick plate", [0.86, 0.16, 0.04], [2.05, 0.45, 0.34], materials.brass);
  sphere(g, "door knob", 0.045, [2.42, 1.4, 0.36], materials.brass);
  sphere(g, "visible hanging bulb", 0.08, [1.42, 3.38, 0.38], materials.amberNeon);
  return g;
}

function apartmentBlock() {
  const g = group("apartment-block");
  box(g, "tall apartment mass", [6.1, 8, 6], [0, 4, -3], materials.apartmentBrick);
  box(g, "red lobby awning", [6.25, 1.15, 0.45], [0, 6.9, 0.28], materials.redPaint);
  box(g, "roof neon trim", [6.15, 0.16, 0.08], [0, 7.95, 0.5], materials.amberNeon);
  box(g, "left corner pipe", [0.08, 7.4, 0.08], [-3.0, 3.95, 0.42], materials.darkMetal);
  box(g, "right corner pipe", [0.08, 7.4, 0.08], [3.0, 3.95, 0.42], materials.darkMetal);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -1.9 + col * 1.9;
      const y = 1.9 + row * 1.25;
      const lit = (row + col) % 3 !== 1;
      box(g, `apartment window ${row}-${col}`, [0.94, 0.9, 0.04], [x, y, 0.36], lit ? materials.warmGlass : materials.dimGlass);
      box(g, `window sill ${row}-${col}`, [1.08, 0.06, 0.16], [x, y - 0.48, 0.48], materials.bankTrim);
      box(g, `window cross ${row}-${col}h`, [0.94, 0.04, 0.05], [x, y, 0.43], materials.deepBlack);
      box(g, `window cross ${row}-${col}v`, [0.04, 0.9, 0.05], [x, y, 0.43], materials.deepBlack);
    }
  }

  [-0.9, 0.9].forEach((x, i) => {
    box(g, `fire escape platform ${i}`, [1.8, 0.06, 0.55], [x, 4.2 + i * 1.45, 0.7], materials.darkMetal);
    [-0.75, 0, 0.75].forEach((r, j) => {
      box(g, `fire escape rail ${i}-${j}`, [0.04, 0.42, 0.04], [x + r, 4.45 + i * 1.45, 0.92], materials.darkMetal);
    });
  });

  box(g, "front apartment door", [1.16, 2.25, 0.08], [0, 1.24, 0.32], materials.wood);
  box(g, "door frosted pane", [0.66, 0.86, 0.04], [0, 1.62, 0.4], materials.tealNeon);
  sphere(g, "entry bulb", 0.09, [0, 2.62, 0.5], materials.amberNeon);
  return g;
}

function payphone() {
  const g = group("payphone");
  box(g, "booth back panel", [1.05, 2.45, 0.1], [0, 1.42, -0.22], materials.redPaint);
  box(g, "booth roof lip", [1.15, 0.18, 0.56], [0, 2.68, -0.02], materials.redPaint);
  box(g, "phone cabinet", [0.72, 0.88, 0.36], [0, 1.32, 0.02], materials.redPaint);
  box(g, "black face plate", [0.66, 0.8, 0.04], [0, 1.32, 0.22], materials.deepBlack);
  box(g, "coin slot", [0.2, 0.045, 0.035], [0, 1.58, 0.27], materials.brass);
  cyl(g, "rotary dial black", 0.16, 0.16, 0.035, [0, 1.31, 0.27], materials.deepBlack, [Math.PI / 2, 0, 0], 18);
  torus(g, "rotary dial brass ring", 0.105, 0.014, [0, 1.31, 0.3], materials.brass);
  box(g, "coin return", [0.16, 0.06, 0.035], [0, 1.06, 0.27], materials.darkMetal);
  cyl(g, "handset body", 0.055, 0.055, 0.46, [0.44, 1.3, 0.08], materials.darkMetal, [0, 0, 1.45], 10);
  sphere(g, "handset earpiece", 0.075, [0.43, 1.51, 0.08], materials.darkMetal);
  sphere(g, "handset mouthpiece", 0.075, [0.43, 1.1, 0.08], materials.darkMetal);
  torus(g, "coiled cord", 0.07, 0.01, [0.31, 1.25, 0.1], materials.deepBlack);
  box(g, "telephone sign", [0.76, 0.22, 0.055], [0, 2.48, 0.12], materials.redNeon);
  return g;
}

function trainStation() {
  const g = group("train-station");
  box(g, "platform slab", [3.4, 0.22, 1.1], [0, 0.12, 0], materials.bankTrim);
  box(g, "left arch leg", [0.18, 1.65, 0.28], [-1.22, 0.94, 0], materials.darkMetal);
  box(g, "right arch leg", [0.18, 1.65, 0.28], [1.22, 0.94, 0], materials.darkMetal);
  box(g, "station lintel", [2.62, 0.18, 0.32], [0, 1.82, 0], materials.darkMetal);
  box(g, "last train sign", [1.88, 0.42, 0.06], [0, 1.32, 0.18], materials.amberNeon);
  box(g, "left rail", [3.2, 0.045, 0.045], [0, 0.3, -0.44], materials.brass);
  box(g, "right rail", [3.2, 0.045, 0.045], [0, 0.3, 0.44], materials.brass);
  [-1.0, -0.5, 0, 0.5, 1.0].forEach((x, i) => {
    box(g, `rail tie ${i}`, [0.08, 0.04, 1.0], [x, 0.26, 0], materials.wood);
  });
  sphere(g, "left signal", 0.15, [-0.65, 1.35, 0.24], materials.amberNeon);
  sphere(g, "right signal", 0.15, [0.65, 1.35, 0.24], materials.amberNeon);
  return g;
}

function tellerCounter() {
  const g = group("teller-counter");
  box(g, "counter carved body", [10, 1.1, 0.92], [0, 0.55, 0], materials.wood);
  box(g, "marble counter top", [10.25, 0.09, 1.02], [0, 1.13, 0], materials.bankTrim);
  box(g, "brass front line", [10.3, 0.04, 0.04], [0, 1.02, 0.5], materials.brass);
  [-3.3, 0, 3.3].forEach((x, i) => {
    box(g, `teller cage window ${i}`, [2.35, 1.0, 0.08], [x, 1.68, -0.4], materials.dimGlass);
    box(g, `warm cage glow ${i}`, [1.9, 0.66, 0.035], [x, 1.68, -0.34], materials.warmGlass);
    [-0.74, -0.37, 0, 0.37, 0.74].forEach((bx, j) => {
      cyl(g, `cage bar ${i}-${j}`, 0.022, 0.022, 0.76, [x + bx, 1.68, -0.28], materials.darkMetal, [0, 0, 0], 6);
    });
  });
  [-4.6, -1.65, 1.65, 4.6].forEach((x, i) => {
    box(g, `counter pilaster ${i}`, [0.18, 1.1, 0.54], [x, 0.55, 0.25], materials.wood);
  });
  box(g, "ledger book", [0.62, 0.06, 0.42], [-3.0, 1.22, 0.1], materials.cream);
  cyl(g, "banker lamp stem", 0.025, 0.025, 0.38, [3.5, 1.38, 0.12], materials.brass, [0, 0, 0], 8);
  sphere(g, "banker lamp glow", 0.14, [3.5, 1.63, 0.12], materials.amberNeon);
  box(g, "ink stamp", [0.22, 0.12, 0.18], [2.65, 1.23, 0.08], materials.darkMetal);
  return g;
}

async function exportGlb(name, asset) {
  const exporter = new GLTFExporter();
  const arrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(asset, resolve, reject, {
      binary: true,
      trs: false,
      onlyVisible: true,
    });
  });
  const outPath = path.join(OUT_DIR, `${name}.glb`);
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
  console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
}

const kit = {
  "bank-facade": bankFacade,
  "cafe-facade": cafeFacade,
  "apartment-block": apartmentBlock,
  payphone,
  "train-station": trainStation,
  "teller-counter": tellerCounter,
};

for (const [name, factory] of Object.entries(kit)) {
  await exportGlb(name, factory());
}
