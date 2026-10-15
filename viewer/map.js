// 3D pixel-art diorama. Zones come from scene entities with props.rect (tiles);
// animal groups (props.zone + props.count) wander inside their zone.
// The farm is drawn with soft toon bands and an outline post pass, at the screen's own resolution.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const ELEV = Math.PI / 6; // 30° camera elevation, the classic 2:1 isometric angle
const ANIMALS = {
  hen: { file: 'hen', len: 0.5, speed: 0.9, walk: /Run$/, idle: /Idle_Peck$/ },
  cow: { file: 'cow', len: 1.5, speed: 0.45, walk: /\|Walk$/, idle: /\|Idle$/ },
  goat: { file: 'goat', len: 0.85, speed: 0.6, walk: /Walk$/, idle: /Idle_Eating$/, tint: '#c79a6b' },
  sheep: { file: 'goat', len: 0.85, speed: 0.6, walk: /Walk$/, idle: /Idle_Eating$/ },
};
const PROPS = ['barn', 'coop', 'silo', 'well', 'barrel'];
const COL = {
  bg: '#e8e0cb', path: '#d6c393', soil: '#6a4a30', soilD: '#4a3322', rock: '#3a2c22',
  grass: '#7da35a', grassL: '#9cbf6b', grassD: '#5d8243', dirt: '#8d6844', dirtD: '#6b4c31',
  leaf: '#3f7d3a', leafL: '#6fae4a', tomato: '#e2463c', corn: '#f2c94c', stalk: '#7fa443',
  lettuce: '#93d26a', lettuceD: '#5fa448', wood: '#8a6a45', woodD: '#5e4630', steel: '#a9bcc6', steelD: '#6f8794',
  compost: '#5b3a1e', compostL: '#7a5232', trunk: '#6b4a2e', tree: '#4f8a3c', treeD: '#3c6e30', water: '#3b8fd6',
  warn: '#e53935', sel: '#fff3b0',
};

// Four-band toon ramp shared by every material: shade to full sun.
const GRAD = new THREE.DataTexture(new Uint8Array([90, 150, 205, 255]), 4, 1, THREE.RedFormat);
GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
GRAD.needsUpdate = true;
const mats = new Map();
const toon = (color) => mats.get(color) || mats.set(color, new THREE.MeshToonMaterial({ color, gradientMap: GRAD })).get(color);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

const POST = {
  uniforms: { tColor: { value: null }, tDepth: { value: null }, tNormal: { value: null }, res: { value: new THREE.Vector2() }, thick: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tColor, tDepth, tNormal; uniform vec2 res; uniform float thick; varying vec2 vUv;
    float D(vec2 o){ return texture2D(tDepth, vUv + o * thick / res).r; }
    vec3 N(vec2 o){ return texture2D(tNormal, vUv + o * thick / res).rgb * 2. - 1.; }
    void main(){
      vec3 c = texture2D(tColor, vUv).rgb;
      float d = D(vec2(0.));
      // Silhouette: a neighbour much farther away means this pixel is an outer edge.
      float de = max(0., D(vec2(1.,0.)) - d) + max(0., D(vec2(-1.,0.)) - d) + max(0., D(vec2(0.,1.)) - d) + max(0., D(vec2(0.,-1.)) - d);
      // Crease: normal turns sharply between this pixel and the one above/right -> thin highlight.
      vec3 n = N(vec2(0.));
      float ne = (1. - dot(n, N(vec2(0.,1.)))) + (1. - dot(n, N(vec2(1.,0.))));
      if (d < 1. && de > 0.004) c *= 0.42;
      else if (d < 1. && ne > 0.5) c = min(c * 1.12 + 0.02, vec3(1.));
      gl_FragColor = vec4(c, 1.);
      #include <colorspace_fragment>
    }`,
};

export function createMap(canvas, { onView } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); // AA comes from the multisampled target
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene3 = new THREE.Scene();
  scene3.background = new THREE.Color(COL.bg);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  scene3.add(new THREE.HemisphereLight('#fff7e6', '#6b7a55', 1.1));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  scene3.add(sun, sun.target);

  const normalMat = new THREE.MeshNormalMaterial();
  const post = new THREE.ShaderMaterial(POST);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  const postScene = new THREE.Scene(); postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let rtColor = null, rtNormal = null, lowW = 0, lowH = 0, cssW = 0, cssH = 0;

  const world = new THREE.Group(), linkGroup = new THREE.Group(), marks = new THREE.Group();
  scene3.add(world, linkGroup, marks);

  let zones = [], herds = [], selected = null, links = [], linkKey = '', status = {}, showLinks = true;
  let lastScene = null, bounds = new THREE.Box3(), center = new THREE.Vector3();
  let yaw = Math.PI / 4, yawTo = yaw, lastT = performance.now();
  const assets = {};
  const ray = new THREE.Raycaster();

  // ---------- assets (CC0, see DATA-LICENSE.md) ----------
  const loader = new GLTFLoader();
  const files = [...new Set([...PROPS, ...Object.values(ANIMALS).map((a) => a.file)])];
  Promise.all(files.map((f) => loader.loadAsync(new URL(`./models/${f}.glb`, import.meta.url).href)
    .then((g) => { assets[f] = g; }).catch(() => {})))
    .then(() => { if (lastScene) build(lastScene, true); });

  function toonify(root, tint) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      const conv = (m) => {
        const t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: GRAD, side: m.side });
        if (tint) t.color.multiply(new THREE.Color(tint));
        return t;
      };
      o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      o.castShadow = o.receiveShadow = true;
    });
    return root;
  }

  // Fit a model so its longest side is `len` tiles, standing on y=0, centred.
  // Skinned meshes only give a true box once their bones are posed, hence precise + updateMatrixWorld.
  const fits = {};
  function fitted(name, len, skinned) {
    const g = assets[name];
    if (!g) return null;
    const inner = skinned ? cloneSkinned(g.scene) : g.scene.clone(true);
    if (!fits[name]) {
      inner.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(inner, true);
      fits[name] = { b, s: b.getSize(new THREE.Vector3()) };
    }
    const { b, s } = fits[name], k = len / Math.max(s.x, s.z);
    inner.scale.multiplyScalar(k);
    inner.position.set(-(b.min.x + s.x / 2) * k, -b.min.y * k, -(b.min.z + s.z / 2) * k);
    const outer = new THREE.Group(); outer.add(inner);
    return outer;
  }

  // ---------- instanced helpers ----------
  const tmp = new THREE.Object3D();
  function inst(parent, geo, color, items) {
    if (!items.length) return;
    const m = new THREE.InstancedMesh(geo, toon(color), items.length);
    items.forEach(([x, y, z, ry = 0, sx = 1, sy = 1, sz = 1], i) => {
      tmp.position.set(x, y, z); tmp.rotation.set(0, ry, 0); tmp.scale.set(sx, sy, sz); tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const rnd = (i, j = 0) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

  function slab(parent, x, z, w, d, h, color, y = 0) {
    const m = new THREE.Mesh(box(w, h, d), toon(color));
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    m.castShadow = false; m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function fence(g, z) {
    const posts = [], rails = [];
    const x0 = 0.35, z0 = 0.35, x1 = z.w - 0.35, z1 = z.h - 0.35;
    for (let x = x0; x <= x1 + 0.01; x += 1) posts.push([x, 0.35, z0], [x, 0.35, z1]);
    for (let y = z0 + 1; y < z1; y += 1) posts.push([x0, 0.35, y], [x1, 0.35, y]);
    inst(g, box(0.12, 0.5, 0.12), COL.woodD, posts);
    for (const yy of [0.28, 0.48]) {
      rails.push([(x0 + x1) / 2, yy, z0, 0, x1 - x0, 1, 1], [(x0 + x1) / 2, yy, z1, 0, x1 - x0, 1, 1]);
      rails.push([x0, yy, (z0 + z1) / 2, 0, 1, 1, z1 - z0], [x1, yy, (z0 + z1) / 2, 0, 1, 1, z1 - z0]);
    }
    const rg = box(1, 0.06, 0.06), rgz = box(0.06, 0.06, 1);
    inst(g, rg, COL.wood, rails.slice(0, 2).concat(rails.slice(4, 6)));
    inst(g, rgz, COL.wood, rails.slice(2, 4).concat(rails.slice(6, 8)));
  }

  function trees(g, spots) {
    inst(g, box(0.18, 0.6, 0.18), COL.trunk, spots.map(([x, z]) => [x, 0.5, z]));
    inst(g, new THREE.IcosahedronGeometry(0.55, 0), COL.tree, spots.map(([x, z], i) => [x, 1.05, z, rnd(i) * 3]));
    inst(g, new THREE.IcosahedronGeometry(0.38, 0), COL.treeD, spots.map(([x, z], i) => [x + 0.1, 1.45, z - 0.05, rnd(i, 1) * 3]));
  }

  function tufts(g, z, n, skip = () => false) {
    const items = [];
    for (let i = 0; i < n; i++) {
      const x = 0.4 + rnd(i, z.w) * (z.w - 0.8), y = 0.4 + rnd(z.h, i) * (z.h - 0.8);
      if (!skip(x, y)) items.push([x, 0.25, y, rnd(i) * 3, 1, 0.6 + rnd(i, 7), 1]);
    }
    inst(g, box(0.1, 0.14, 0.1), COL.grassL, items.filter((_, i) => i % 2));
    inst(g, box(0.1, 0.14, 0.1), COL.grassD, items.filter((_, i) => !(i % 2)));
  }

  // Farmhouse, modelled here: plastered walls, gabled roof, chimney, door and windows.
  function house(g, x, z) {
    const h = new THREE.Group(), add = (geo, color, px, py, pz, ry = 0) => {
      const m = new THREE.Mesh(geo, toon(color)); m.position.set(px, py, pz); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; h.add(m); return m;
    };
    add(box(3.4, 1.7, 2.4), '#efe2c4', 0, 1.05, 0);
    add(box(3.6, 0.2, 2.6), '#b9ab8e', 0, 0.3, 0);
    const gable = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.5, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(0, 1.15)]), { depth: 3.8, bevelEnabled: false });
    gable.translate(0, 0, -1.9);
    add(gable, '#a5443a', 0, 1.9, 0, Math.PI / 2);
    add(box(0.4, 0.9, 0.4), '#7a5a48', 0.9, 2.75, -0.45);
    add(box(0.6, 1.05, 0.1), COL.woodD, 0, 0.75, 1.22);
    for (const wx of [-1.05, 1.05]) add(box(0.6, 0.5, 0.08), '#8fb6c9', wx, 1.25, 1.23);
    for (const wz of [-0.5, 0.5]) add(box(0.08, 0.5, 0.55), '#8fb6c9', 1.72, 1.25, wz);
    add(box(1, 0.12, 0.5), '#b9ab8e', 0, 0.26, 1.5);
    h.position.set(x, 0, z);
    g.add(h);
  }

  function place(g, name, len, x, z, ry = 0) {
    const m = fitted(name, len);
    if (!m) return null;
    toonify(m);
    m.position.set(x, 0.2, z); m.rotation.y = ry;
    g.add(m);
    return m;
  }

  // Each builder works in zone-local tiles: (0,0) is the zone's top-left corner.
  // It returns blocked rectangles [x, z, w, d] that animals keep out of.
  const build3 = {
    house(g, z) {
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grassL);
      fence(g, z);
      house(g, z.w / 2 + 0.4, z.h / 2 - 0.2);
      trees(g, [[1.2, 1.2], [1.3, z.h - 1.4], [z.w - 1.3, z.h - 1.3], [1.2, z.h / 2]]);
      inst(g, box(0.18, 0.18, 0.18), COL.tomato, Array.from({ length: 6 }, (_, i) => [z.w - 2.4 + (i % 3) * 0.4, 0.3, 1.2 + Math.floor(i / 3) * 0.4]));
      inst(g, box(0.18, 0.18, 0.18), COL.corn, Array.from({ length: 4 }, (_, i) => [z.w - 2.2 + (i % 2) * 0.4, 0.3, 1.4 + Math.floor(i / 2) * 0.4]));
      tufts(g, z, 40);
      return [];
    },
    plot(g, z) {
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grass);
      slab(g, 0.6, 0.6, z.w - 1.2, z.h - 1.2, 0.06, COL.dirt, 0.2);
      const rows = [];
      for (let y = 1.3; y < z.h - 0.8; y += 1) rows.push(y);
      inst(g, box(z.w - 1.6, 0.1, 0.42), COL.dirtD, rows.map((y) => [z.w / 2, 0.3, y]));
      const crop = z.e.props.crop, plants = [], first = g.children.length;
      const step = crop === 'corn' ? 0.5 : crop === 'tomato' ? 0.75 : 0.6;
      rows.forEach((y, r) => { for (let x = 1.2 + (r % 2) * step / 2; x < z.w - 1; x += step) plants.push([x, y]); });
      if (crop === 'tomato') {
        inst(g, box(0.05, 0.9, 0.05), COL.woodD, plants.map(([x, y]) => [x + 0.12, 0.75, y]));
        inst(g, new THREE.IcosahedronGeometry(0.27, 0), COL.leaf, plants.map(([x, y], i) => [x, 0.62, y, rnd(i) * 3, 1, 1.5, 1]));
        const fruit = [];
        plants.forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { const a = rnd(i, k) * 6.28, h = 0.42 + rnd(k, i) * 0.4; fruit.push([x + Math.cos(a) * 0.25, h, y + Math.sin(a) * 0.25]); } });
        inst(g, box(0.13, 0.13, 0.13), COL.tomato, fruit);
      } else if (crop === 'corn') {
        inst(g, box(0.07, 1.3, 0.07), COL.stalk, plants.map(([x, y]) => [x, 0.95, y]));
        inst(g, box(0.5, 0.04, 0.1), COL.leafL, plants.map(([x, y], i) => [x, 0.75 + rnd(i) * 0.3, y, rnd(i, 2) * 3]));
        inst(g, box(0.4, 0.04, 0.09), COL.leaf, plants.map(([x, y], i) => [x, 1.1 + rnd(i, 3) * 0.2, y, rnd(i, 4) * 3]));
        inst(g, box(0.11, 0.28, 0.11), COL.corn, plants.map(([x, y], i) => [x + 0.08, 0.85 + rnd(i, 5) * 0.15, y + 0.04]));
        inst(g, box(0.05, 0.16, 0.05), '#d9b25a', plants.map(([x, y]) => [x, 1.66, y]));
      } else {
        inst(g, new THREE.DodecahedronGeometry(0.24, 0), COL.lettuce, plants.map(([x, y], i) => [x, 0.42, y, rnd(i) * 3, 1, 0.65, 1]));
        inst(g, new THREE.DodecahedronGeometry(0.13, 0), COL.lettuceD, plants.map(([x, y], i) => [x, 0.55, y, rnd(i, 1) * 3]));
      }
      z.crops = g.children.slice(first); // tinted brown when the plot dies
      return [];
    },
    pen(g, z) {
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grass);
      fence(g, z);
      place(g, 'barn', 4.2, 3, 2.8, Math.PI / 2);
      place(g, 'coop', 1.8, 1.8, z.h - 2.2, Math.PI / 2);
      slab(g, z.w - 3.4, z.h - 1.6, 2.4, 0.7, 0.35, COL.woodD, 0.2); // trough
      slab(g, z.w - 3.3, z.h - 1.5, 2.2, 0.5, 0.06, COL.water, 0.5);
      inst(g, box(0.9, 0.5, 0.6), '#e2c36a', [[6, 0.45, 1.4], [6.9, 0.45, 1.5], [6.4, 0.95, 1.45]]); // hay
      tufts(g, z, 70);
      return [[0.5, 0.5, 6.5, 5.2], [0.5, z.h - 3.6, 3, 3], [z.w - 3.6, z.h - 2, 2.8, 1.3]];
    },
    pond(g, z) { // the water point: well, pipe and tank
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grassL);
      place(g, 'well', 1.8, 1.4, z.h / 2);
      const tx = z.w - 1.9, tz = z.h / 2;
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.9, 12), toon(COL.steel));
      tank.position.set(tx, 1.15, tz); tank.castShadow = tank.receiveShadow = true; g.add(tank);
      const lid = new THREE.Mesh(new THREE.ConeGeometry(1.32, 0.45, 12), toon(COL.steelD));
      lid.position.set(tx, 2.32, tz); lid.castShadow = true; g.add(lid);
      inst(g, new THREE.CylinderGeometry(1.29, 1.29, 0.08, 12), COL.steelD, [[tx, 0.6, tz], [tx, 1.15, tz], [tx, 1.7, tz]]);
      inst(g, box(1, 0.12, 0.12), '#5d6b72', [[(2.2 + tx - 1.25) / 2, 0.36, tz, 0, tx - 1.25 - 2.2, 1, 1]]);
      tufts(g, z, 16);
      return [];
    },
    storage(g, z) { // feed store: silo, barrels, sacks
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grassL);
      place(g, 'silo', 1.9, 1.6, z.h / 2);
      place(g, 'barrel', 0.6, 3.6, 1.1);
      place(g, 'barrel', 0.6, 4.3, 1.2);
      inst(g, box(0.7, 0.35, 0.45), '#d8c49a', [[5.6, 0.38, 2.2], [6.4, 0.38, 2.2], [6, 0.73, 2.2], [5.6, 0.38, 2.75], [6.4, 0.38, 2.75]]);
      slab(g, z.w - 2.6, 0.6, 2.1, 1.2, 0.12, COL.woodD, 0.2); // pallet
      tufts(g, z, 16);
      return [];
    },
    compost(g, z) { // heaps in open wooden bins
      slab(g, 0, 0, z.w, z.h, 0.2, COL.grassL);
      const heaps = [1.6, 3.9, 6.2].filter((x) => x < z.w - 1);
      inst(g, new THREE.IcosahedronGeometry(0.95, 1), COL.compost, heaps.map((x, i) => [x, 0.25, z.h / 2, i, 1, 0.62, 1]));
      inst(g, new THREE.IcosahedronGeometry(0.5, 0), COL.compostL, heaps.map((x, i) => [x + 0.15, 0.62, z.h / 2 - 0.1, i * 2, 1, 0.6, 1]));
      const slats = [];
      for (const x of heaps) {
        slats.push([x, 0.45, z.h / 2 - 1.15, 0, 2, 1, 1]);
        slats.push([x - 1.1, 0.45, z.h / 2, Math.PI / 2, 2.2, 1, 1], [x + 1.1, 0.45, z.h / 2, Math.PI / 2, 2.2, 1, 1]);
      }
      inst(g, box(1, 0.5, 0.08), COL.wood, slats);
      tufts(g, z, 16);
      return [];
    },
  };

  // ---------- scene ----------
  function build(scene, force) {
    const ents = scene.entities || [];
    const key = JSON.stringify(ents.filter((e) => e.props?.rect).map((e) => [e.id, e.kind, e.props]));
    if (force || key !== world.userData.key) {
      world.userData.key = key;
      world.clear();
      const rects = ents.filter((e) => e.props?.rect);
      const minX = Math.min(0, ...rects.map((e) => e.props.rect[0])), minZ = Math.min(0, ...rects.map((e) => e.props.rect[1]));
      const maxX = Math.max(8, ...rects.map((e) => e.props.rect[0] + e.props.rect[2])) + 1;
      const maxZ = Math.max(8, ...rects.map((e) => e.props.rect[1] + e.props.rect[3])) + 1;
      center.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      // Diorama block: sandy paths on top, soil and rock in the cut sides.
      const W = maxX - minX, D = maxZ - minZ;
      slab(world, minX - center.x, minZ - center.z, W, D, 0.25, COL.path, -0.25);
      slab(world, minX - center.x, minZ - center.z, W, D, 1.1, COL.soil, -1.35);
      slab(world, minX - center.x, minZ - center.z, W, D, 0.45, COL.rock, -1.8);
      bounds.set(new THREE.Vector3(minX - center.x, -1.8, minZ - center.z), new THREE.Vector3(maxX - center.x, 2.6, maxZ - center.z));
      zones = rects.map((e) => {
        const [x, y, w, h] = e.props.rect;
        const z = { e, x: x - center.x, z: y - center.z, w, h, g: new THREE.Group() };
        z.g.position.set(z.x, 0, z.z);
        z.blocked = (build3[e.kind] || ((g) => { slab(g, 0, 0, w, h, 0.2, COL.grass); return []; }))(z.g, z);
        z.hit = z.g.children[0];
        z.hit.userData.zone = e.id;
        world.add(z.g);
        return z;
      });
      // A few trees outside the fence make it read as a place, not a chart.
      const g = new THREE.Group();
      trees(g, [[minX - center.x + 0.5, maxZ - center.z - 0.6], [maxX - center.x - 0.5, minZ - center.z + 0.5]]);
      world.add(g);
      buildMarks();
      fitSun();
      fit();
      buildLinks();
    }
    // Keep existing animals where possible so a scene update doesn't teleport them.
    const old = new Map(herds.map((h) => [h.id, h]));
    for (const h of herds) for (const a of h.list) world.remove(a.obj);
    herds = ents.filter((e) => ANIMALS[e.kind] && e.props?.zone).map((e) => {
      const z = zones.find((z) => z.e.id === e.props.zone), spec = ANIMALS[e.kind];
      if (!z || !assets[spec.file]) return null;
      const n = Math.min(e.props.count || 1, 40); // ponytail: draw cap 40 per group, counts still exact in UI
      const prev = old.get(e.id)?.list || [];
      const list = Array.from({ length: n }, (_, i) => prev[i] && prev[i].z === z ? prev[i] : spawn(z, spec));
      for (const a of list) world.add(a.obj);
      return { id: e.id, list };
    }).filter(Boolean);
  }

  function freeSpot(z) {
    for (let i = 0; i < 60; i++) {
      const x = 0.9 + Math.random() * (z.w - 1.8), y = 0.9 + Math.random() * (z.h - 1.8);
      if (!z.blocked.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh)) return [x, y];
    }
    return [z.w / 2, z.h / 2];
  }

  function spawn(z, spec) {
    const obj = toonify(fitted(spec.file, spec.len, true), spec.tint);
    const inner = obj.children[0], clips = assets[spec.file].animations;
    const mixer = new THREE.AnimationMixer(inner);
    const walk = mixer.clipAction(clips.find((c) => spec.walk.test(c.name)) || clips[0]);
    const idle = mixer.clipAction(clips.find((c) => spec.idle.test(c.name)) || clips[0]);
    idle.play(); idle.time = Math.random() * 2;
    const [x, y] = freeSpot(z);
    obj.position.set(z.x + x, 0.2, z.z + y);
    obj.rotation.y = Math.random() * 6.28;
    return { obj, mixer, walk, idle, z, spec, tx: x, ty: y, wait: Math.random() * 4, moving: false };
  }

  function stepAnimal(a, dt) {
    a.mixer.update(dt);
    const p = a.obj.position, lx = p.x - a.z.x, ly = p.z - a.z.z;
    if (a.wait > 0) { a.wait -= dt; return; }
    const dx = a.tx - lx, dy = a.ty - ly, dist = Math.hypot(dx, dy);
    if (dist < 0.05) {
      [a.tx, a.ty] = freeSpot(a.z);
      a.wait = 1 + Math.random() * 5;
      if (a.moving) { a.moving = false; a.walk.fadeOut(0.25); a.idle.reset().fadeIn(0.25).play(); }
      return;
    }
    if (!a.moving) { a.moving = true; a.idle.fadeOut(0.25); a.walk.reset().fadeIn(0.25).play(); }
    const s = Math.min(dist, a.spec.speed * dt);
    p.x += dx / dist * s; p.z += dy / dist * s;
    const want = Math.atan2(dx, dy);
    let d = want - a.obj.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.obj.rotation.y += d * Math.min(1, dt * 6);
  }

  // ---------- links: resource-coloured beads travelling along arcs between zones ----------
  // No lines by default (they clutter the farm). Selecting a zone draws its own links as tubes
  // and hides every other flow, so a beginner sees one area's inputs and outputs at a time.
  const PER = 3, TRAIL = [[0, 1], [0.035, 0.7], [0.07, 0.45]], MAXD = 400;
  const dots = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.24, 1), new THREE.MeshBasicMaterial(), MAXD);
  dots.layers.set(1); dots.frustumCulled = false;
  scene3.add(dots);

  function zonePoint(id) {
    const z = zones.find((z) => z.e.id === id);
    return z && new THREE.Vector3(z.x + z.w / 2, 0.4, z.z + z.h / 2);
  }
  const touches = (l) => !selected || l.from === selected || l.to === selected;

  function buildLinks() {
    linkGroup.clear();
    const edge = bounds.max.x + 2.5, pairs = {};
    for (const l of links) {
      let a = l.from === 'outside' ? null : zonePoint(l.from), b = zonePoint(l.to);
      if (!a && b) a = new THREE.Vector3(edge, 0.4, b.z);
      if (a && !b && l.to === 'market') b = new THREE.Vector3(edge, 0.4, a.z);
      if (!a || !b) { l.curve = null; continue; }
      // Spread links that share the same two zones so each stays visible.
      const pk = [l.from, l.to].sort().join('|'), k = (pairs[pk] = (pairs[pk] ?? -1) + 1);
      const side = new THREE.Vector3(b.z - a.z, 0, a.x - b.x).normalize().multiplyScalar((k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.7);
      const len = a.distanceTo(b), mid = a.clone().lerp(b, 0.5).add(side);
      mid.y += 1.6 + len * 0.15;
      l.curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      l.len = len;
      if (!selected || !touches(l)) continue;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(l.curve, 40, 0.07, 6),
        new THREE.MeshBasicMaterial({ color: l.on ? l.color : '#8b8676', transparent: true, opacity: l.on ? 0.55 : 0.35, depthWrite: false }));
      tube.layers.set(1);
      linkGroup.add(tube);
    }
  }

  const dotCol = new THREE.Color();
  function drawDots(t) {
    let n = 0;
    if (showLinks) links.forEach((l, i) => {
      if (!l.curve || !l.on || !touches(l)) return;
      for (let k = 0; k < PER; k++) for (const [back, sc] of TRAIL) {
        if (n >= MAXD) return;
        const p = ((t * 0.9 / Math.max(4, l.len) + k / PER + i * 0.13 - back) % 1 + 1) % 1;
        tmp.position.copy(l.curve.getPoint(p)); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(sc); tmp.updateMatrix();
        dots.setMatrixAt(n, tmp.matrix);
        dots.setColorAt(n++, dotCol.set(l.color));
      }
    });
    dots.count = n;
    dots.instanceMatrix.needsUpdate = true;
    if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
    linkGroup.visible = showLinks;
  }

  // ---------- zone marks: red for a shortage, dark when it died, pale gold for the selected zone ----------
  function frameMesh(z, color, y, t) {
    const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    for (const [x, zz, w, d] of [[z.w / 2, t / 2, z.w, t], [z.w / 2, z.h - t / 2, z.w, t], [t / 2, z.h / 2, t, z.h], [z.w - t / 2, z.h / 2, t, z.h]]) {
      const b = new THREE.Mesh(box(w, 0.06, d), m); b.position.set(x, y, zz); g.add(b);
    }
    g.position.set(z.x, 0, z.z);
    g.traverse((o) => o.layers.set(1));
    return g;
  }

  function buildMarks() {
    marks.clear();
    for (const z of zones) {
      const warn = new THREE.Group();
      const fill = new THREE.Mesh(box(z.w, 0.05, z.h), new THREE.MeshBasicMaterial({ color: COL.warn, transparent: true, opacity: 0.35, depthWrite: false }));
      fill.position.set(z.x + z.w / 2, 0.27, z.z + z.h / 2); fill.layers.set(1);
      const edge = frameMesh(z, COL.warn, 0.3, 0.32);
      warn.add(fill, edge);
      z.warn = warn; z.fill = fill; z.edge = edge.children[0].material;
      z.sel = frameMesh(z, COL.sel, 0.34, 0.22);
      marks.add(warn, z.sel);
    }
  }

  // ---------- camera, sun, sizing ----------
  function fitSun() {
    const r = bounds.getSize(new THREE.Vector3()).length() / 2;
    sun.position.set(-r * 0.6, r * 1.4, r * 0.8);
    sun.target.position.set(0, 0, 0);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: r * 4 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function fit() {
    camera.position.set(Math.sin(yaw) * Math.cos(ELEV), Math.sin(ELEV), Math.cos(yaw) * Math.cos(ELEV)).multiplyScalar(150);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    corners.forEach((c, i) => {
      c.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).applyMatrix4(camera.matrixWorldInverse);
      x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y);
    });
    const pad = 0.6, aspect = (lowW || 4) / (lowH || 3);
    let hw = (x1 - x0) / 2 + pad, hh = (y1 - y0) / 2 + pad;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (hw / hh > aspect) hh = hw / aspect; else hw = hh * aspect;
    Object.assign(camera, { left: cx - hw, right: cx + hw, top: cy + hh, bottom: cy - hh });
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === cssW && h === cssH)) return false;
    cssW = w; cssH = h;
    const dpr = Math.min(devicePixelRatio || 1, 2); // ponytail: capped at 2x, phones stay fast
    lowW = Math.max(1, Math.round(w * dpr)); lowH = Math.max(1, Math.round(h * dpr));
    renderer.setSize(lowW, lowH, false);
    rtColor?.dispose(); rtNormal?.dispose();
    const opt = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType };
    rtColor = new THREE.WebGLRenderTarget(lowW, lowH, { ...opt, samples: 4, depthTexture: new THREE.DepthTexture(lowW, lowH) });
    rtNormal = new THREE.WebGLRenderTarget(lowW, lowH, opt);
    Object.assign(post.uniforms, { tColor: { value: rtColor.texture }, tDepth: { value: rtColor.depthTexture }, tNormal: { value: rtNormal.texture } });
    post.uniforms.res.value.set(lowW, lowH);
    post.uniforms.thick.value = dpr;
    fit();
    return true;
  }

  // Rotate buttons, 90° per press.
  const tools = document.createElement('div');
  tools.className = 'rot';
  tools.innerHTML = '<button data-rot="1">⟲</button><button data-rot="-1">⟳</button>';
  canvas.parentElement.appendChild(tools);
  tools.onclick = (e) => { const b = e.target.closest('[data-rot]'); if (b) yawTo += +b.dataset.rot * Math.PI / 2; };
  let lang = '';

  function frame() {
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000), t = now / 1000;
    lastT = now;
    if (document.documentElement.lang !== lang) {
      lang = document.documentElement.lang;
      const [l, r] = lang === 'ar' ? ['تدوير لليسار', 'تدوير لليمين'] : ['Rotate left', 'Rotate right'];
      tools.children[0].title = tools.children[0].ariaLabel = l;
      tools.children[1].title = tools.children[1].ariaLabel = r;
    }
    let moved = resize();
    if (Math.abs(yawTo - yaw) > 1e-4) {
      yaw += (yawTo - yaw) * Math.min(1, dt * 9);
      if (Math.abs(yawTo - yaw) < 0.002) yaw = yawTo;
      fit(); moved = true;
    }
    if (!rtColor) return;
    for (const h of herds) for (const a of h.list) stepAnimal(a, dt);
    drawDots(t);
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    for (const z of zones) {
      const f = status[z.e.id] ?? 1, bad = f < 0.999; // app sends -1 when everything in the zone has died
      z.warn.visible = bad;
      if (bad) {
        z.fill.material.color.set(f < 0 ? '#1d1d1d' : COL.warn);
        z.edge.color.set(f < 0 ? '#1d1d1d' : COL.warn);
        z.fill.material.opacity = f < 0 ? 0.35 : 0.22 + 0.25 * pulse; // dead: steady dark, short: red pulse
      }
      const dead = f < 0;
      if (z.crops && z.dead !== dead) { // dead plots wither: every plant turns dry brown
        z.dead = dead;
        for (const m of z.crops) { m.userData.live ??= m.material; m.material = dead ? toon('#8a6f45') : m.userData.live; }
      }
      z.sel.visible = z.e.id === selected;
    }

    camera.layers.set(0);
    scene3.overrideMaterial = normalMat;
    renderer.setRenderTarget(rtNormal); renderer.render(scene3, camera);
    scene3.overrideMaterial = null;
    camera.layers.enableAll();
    renderer.setRenderTarget(rtColor); renderer.render(scene3, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    if (moved) onView?.();
  }

  const ndc = new THREE.Vector3();
  return {
    setScene(scene) { lastScene = scene; build(scene); },
    frame,
    select(id) { if (id !== selected) { selected = id; buildLinks(); } },
    setLinks(l) {
      const k = JSON.stringify(l);
      if (k === linkKey) return;
      links = l.map((x) => ({ ...x }));
      linkKey = k;
      if (zones.length) buildLinks();
    },
    setStatus(st) { status = st; },
    showLinks(on) { showLinks = on; },
    hit(x, y) {
      ray.setFromCamera(new THREE.Vector2(x / cssW * 2 - 1, 1 - y / cssH * 2), camera);
      return ray.intersectObjects(zones.map((z) => z.hit))[0]?.object.userData.zone || null;
    },
    // Labels sit on zone centres; small zones packed together get nudged apart (bigger zones keep their spot).
    labels() {
      const lw = cssW < 560 ? 46 : 92, lh = cssW < 560 ? 26 : 28, placed = [];
      const out = zones.map((z) => {
        ndc.set(z.x + z.w / 2, 0.3, z.z + z.h / 2).project(camera);
        return { id: z.e.id, name: z.e.name, x: (ndc.x + 1) / 2 * cssW, y: (1 - ndc.y) / 2 * cssH - lh / 2, area: z.w * z.h };
      });
      for (const l of [...out].sort((a, b) => b.area - a.area)) {
        const y0 = l.y;
        for (let k = 1; k < 24 && placed.some((p) => Math.abs(p.x - l.x) < lw && Math.abs(p.y - l.y) < lh); k++)
          l.y = y0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 6;
        l.y = Math.max(2, Math.min(cssH - lh - 2, l.y));
        placed.push(l);
      }
      return out.map((l) => ({ id: l.id, name: l.name, left: l.x / (cssW || 1) * 100, top: l.y / (cssH || 1) * 100 }));
    },
    size() { return [cssW || 1, cssH || 1]; },
  };
}
