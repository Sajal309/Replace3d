const TILE_PREVIEW_REVISION = 'natural-pale-tiles-20260925-8';
// The supplied image variant and the approved rendering are separate facts.
// Keep the approved reflective presentation for the three existing finishes;
// do not infer a product's reflection response from words in its ID.
const tileFinishes = Object.freeze(Object.fromEntries(Object.entries({
  'floor-belvedere-forest': {
    name: 'Belvedere Forest', texture: 'floor-belvedere-forest.jpg',
    collection: 'Marmorica', look: 'forest marble', finish: 'Sabbia matt',
    roughness: .24, envMapIntensity: 1, planarReflection: true,
    approvedReflectiveAppearance: true,
  },
  'floor-alchimia-graphite-raw': {
    name: 'Alchimia Graphite Raw Texture', texture: 'floor-alchimia-graphite-raw.jpg',
    collection: 'Alchimia', look: 'graphite concrete', finish: 'Matt punch · raw texture',
    roughness: .78, envMapIntensity: .7, planarReflection: false,
  },
  'bathWall-alps-dream': {
    name: 'Alps Dream', texture: 'bathWall-alps-dream.jpg',
    collection: 'Marmorica', look: 'white marble', finish: 'Sabbia matt',
    roughness: .48, envMapIntensity: 1, planarReflection: true,
    approvedReflectiveAppearance: true,
  },
  'bathWall-alchimia-leaf-raw': {
    name: 'Alchimia Leaf Raw Texture', texture: 'bathWall-alchimia-leaf-raw.jpg',
    collection: 'Alchimia', look: 'muted green concrete', finish: 'Matt punch · raw texture',
    roughness: .78, envMapIntensity: .7, planarReflection: false,
  },
  'mirrorWall-alchimia-pearl': {
    name: 'Alchimia Pearl', texture: 'mirrorWall-alchimia-pearl.jpg',
    collection: 'Alchimia', look: 'pearl white concrete', finish: 'Matt',
    roughness: .4, envMapIntensity: 1, planarReflection: true,
    approvedReflectiveAppearance: true,
  },
  'mirrorWall-alchimia-hazel-raw': {
    name: 'Alchimia Hazel Raw Texture', texture: 'mirrorWall-alchimia-hazel-raw.jpg',
    collection: 'Alchimia', look: 'warm hazel concrete', finish: 'Matt punch · raw texture',
    roughness: .78, envMapIntensity: .7, planarReflection: false,
  },
}).map(([id, profile]) => [id, Object.freeze(profile)])));
function tileOption(id) {
  const profile = tileFinishes[id];
  return { id, name: profile.name, meta: `${profile.collection} · ${profile.look} · ${profile.finish}` };
}
const tileLooks = {
  classic: {
    title: 'Soft Marble', tag: 'CALM IN EVERY DETAIL',
    description: 'Belvedere Forest flooring, Alps Dream shower walls and Alchimia Pearl around the mirror.',
    selections: {floor: 'floor-belvedere-forest', bathWall: 'bathWall-alps-dream', mirrorWall: 'mirrorWall-alchimia-pearl'}
  },
  modern: {
    title: 'Earth & Graphite', tag: 'WARMTH WITH DEPTH',
    description: 'Alchimia Graphite flooring meets Leaf shower walls and a warm Hazel mirror wall.',
    selections: {floor: 'floor-alchimia-graphite-raw', bathWall: 'bathWall-alchimia-leaf-raw', mirrorWall: 'mirrorWall-alchimia-hazel-raw'}
  }
};
const targets = {
  floor: {
    title: "Floor",
    text: "Natural stone flooring.",
    hint: "Floor selected",
    defaultClass: "material-floor",
    options: [
      tileOption('floor-belvedere-forest'),
      tileOption('floor-alchimia-graphite-raw'),
      {
        id: "floor-classic",
        name: "Ivory Travertine",
        meta: "Large-format stone tiles",
        texture: "texture-travertine",
      },
      {
        id: "floor-modern",
        name: "Charcoal Slate",
        meta: "Textured slate tiles",
        texture: "texture-charcoal",
      },
    ],
  },
  bathWall: {
    title: "Shower wall",
    text: "Preview marble and textured concrete tiles on the shower wall.",
    hint: "Shower wall selected",
    defaultClass: "material-bath-wall",
    options: [
      tileOption('bathWall-alps-dream'),
      tileOption('bathWall-alchimia-leaf-raw'),
      {
        id: "bathWall-classic",
        name: "Subway Brickwork",
        meta: "Staggered white ceramic tile",
        texture: "texture-walnut",
      },
      {
        id: "bathWall-modern",
        name: "Linear Emerald",
        meta: "Vertical kitkat ceramic tile",
        texture: "texture-sage",
      },
    ],
  },
  mirrorWall: {
    title: "Wall behind mirror",
    text: "Preview tile finishes on the vanity wall around the mirror.",
    hint: "Mirror wall selected",
    defaultClass: "material-mirror-wall",
    options: [
      tileOption('mirrorWall-alchimia-pearl'),
      tileOption('mirrorWall-alchimia-hazel-raw'),
    ],
  },
};

const state = {
  activeTarget: null,
  selections: {},
  complete: null,
};

let operationId = 0;
const completeImage = document.createElement('img');
completeImage.className = 'complete-image';
completeImage.alt = 'Complete bathroom design';
completeImage.hidden = true;
document.querySelector('#stage').append(completeImage);

const panelTitle = document.querySelector("#panelTitle");
const pendingSelections = new Map();
document.querySelectorAll('.surface-pin').forEach(pin => { pin.textContent = '+'; pin.title = pin.getAttribute('aria-label'); });
const panelText = document.querySelector("#panelText");
const swatchGrid = document.querySelector("#swatchGrid");
const hintPill = document.querySelector("#hintPill");
const resetButton = document.querySelector("#resetButton");
const hotspotButtons = Array.from(document.querySelectorAll(".hotspot-button"));
const layers = Object.fromEntries(
  Array.from(document.querySelectorAll(".material-layer")).map((layer) => [layer.dataset.layer, layer]),
);

function setActiveTarget(targetKey) {
  setEditMode("individual");
  state.activeTarget = targetKey;
  window.focusPanoramaTarget?.(targetKey);
  window.walkthrough?.selectSurface(targetKey);
  const target = targets[targetKey];

  if (panelTitle) panelTitle.textContent = target.title;
  panelText.textContent = target.text;
  document.querySelector("#optionCount").textContent = `${target.options.length} ${target.options.length === 1 ? "finish" : "finishes"}`;
  hintPill.textContent = target.hint;

  hotspotButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === targetKey);
  });

  renderSwatches();
  syncControls();
}

function renderSwatches() {
  swatchGrid.replaceChildren();

  if (!state.activeTarget) {
    return;
  }

  const selectedId = state.selections[state.activeTarget];

  const options = targets[state.activeTarget].options.filter(option => window.roomMode !== "3d" || window.walkthrough?.hasMaterial(option.id));
  document.querySelector("#optionCount").textContent = `${options.length} finishes`;
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch-button";
    button.classList.toggle("is-selected", selectedId === option.id);
    button.dataset.materialId = option.id;
    button.setAttribute("aria-pressed", selectedId === option.id);
    button.innerHTML = `
      <img class="swatch-preview" src="assets/variants/${option.id}-thumb.jpg?v=${TILE_PREVIEW_REVISION}" alt="" />
      <span>
        <span class="swatch-name">${option.name}</span>
        <span class="swatch-meta">${option.meta}</span>
      </span>
    `;
    button.addEventListener("click", () => applyMaterial(state.activeTarget, option));
    swatchGrid.append(button);
  });
}

async function applyMaterial(targetKey, option) {
  if (window.roomMode === "3d") return window.walkthrough?.applyMaterial(targetKey, option);
  if (state.selections[targetKey] === option.id) {
    operationId++;
    clearComplete();
    pendingSelections.delete(targetKey);
    layers[targetKey].classList.remove("is-applied");
    delete state.selections[targetKey];
    renderSwatches();
    syncControls();
    if (hintPill) hintPill.textContent = `${targets[targetKey].title} restored`;
    return;
  }
  operationId++;
  document.querySelector('#looksPanel').removeAttribute('aria-busy');
  const request = Symbol();
  pendingSelections.set(targetKey, request);
  if (hintPill) hintPill.textContent = `Loading ${option.name}...`;
  try {
  const image = await SurfaceMasks.loadAsset(option.id);
  if (pendingSelections.get(targetKey) !== request) return;
  clearComplete();
  const layer = layers[targetKey];
  layer.setAttribute('href', image.src);
  layer.classList.add("is-applied");
  state.selections[targetKey] = option.id;
  hintPill.textContent = `${option.name} applied`;
  renderSwatches();
  setComparison(false);
  syncControls();
  } catch (error) {
    if (pendingSelections.get(targetKey) === request) hintPill.textContent = 'Could not load this option. Please try again.';
    console.error(error);
  }
}

function resetDemo() {
  if (window.roomMode === "3d") return window.walkthrough?.reset();
  operationId++;
  clearComplete();
  pendingSelections.clear();
  state.activeTarget = null;
  state.selections = {};

  Object.entries(layers).forEach(([targetKey, layer]) => {
    layer.classList.remove("is-applied");
    layer.removeAttribute("filter");
  });

  hotspotButtons.forEach((button) => button.classList.remove("is-active"));
  panelTitle.textContent = "Choose a surface";
  panelText.textContent = "Click a surface in the room or choose a tab to preview replacement materials.";
  hintPill.textContent = "Click a masked surface";
  swatchGrid.replaceChildren();
  setComparison(false);
  setActiveTarget("floor");
  hintPill.textContent = "Original finishes";
}

hotspotButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTarget(button.dataset.target));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveTarget(button.dataset.target);
    }
  });
});

resetButton.addEventListener("click", resetDemo);

async function exportDesign() {
  if (window.roomMode === "3d") return window.walkthrough?.exportView();
  const button = document.querySelector('#exportDesign');
  const label = button.querySelector('span');
  button.disabled = true;
  label.textContent = 'Preparing…';
  hintPill.textContent = 'Preparing panorama export…';
  try {
    const room = document.querySelector('.base-image');
    await room.decode();
    const canvas = document.createElement('canvas');
    canvas.width = room.naturalWidth;
    canvas.height = room.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(room, 0, 0, canvas.width, canvas.height);

    if (state.complete) {
      const image = await SurfaceMasks.loadAsset(`room-${state.complete}`);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      const selections = Object.values(state.selections);
      const images = await Promise.all(selections.map(id => SurfaceMasks.loadAsset(id)));
      images.forEach(image => context.drawImage(image, 0, 0, canvas.width, canvas.height));
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The browser could not create the PNG file.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'simpolo-bathroom-design-360.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    hintPill.textContent = 'Panorama design downloaded';
  } catch (error) {
    hintPill.textContent = 'Could not export the design. Please try again.';
    console.error('Design export failed', error);
  } finally {
    button.disabled = false;
    label.textContent = 'Export design';
  }
}
document.querySelector('#exportDesign').addEventListener('click', exportDesign);

function setComparison(original) {
  document.querySelector("#stage").classList.toggle("show-original", original);
  document.querySelector("#originalButton").setAttribute("aria-pressed", original);
  document.querySelector("#designButton").setAttribute("aria-pressed", !original);
  if (window.roomMode !== "3d") window.updatePanorama?.();
  window.walkthrough?.update();
}

function syncControls() {
  if (window.roomMode !== "3d") window.updatePanorama?.();
  window.walkthrough?.update();
  document.querySelectorAll(".surface-tabs button").forEach(button => {
    const isSelected = button.dataset.surface === state.activeTarget;
    button.setAttribute("aria-pressed", isSelected);
  });
  document.querySelectorAll(".surface-pin, .panorama-pin").forEach(pin => {
    pin.setAttribute("aria-pressed", pin.dataset.surface === state.activeTarget);
  });
  const restoreBtn = document.querySelector("#restoreButton");
  if (restoreBtn) restoreBtn.disabled = !state.selections[state.activeTarget];
  const count = Object.keys(state.selections).length;
  document.querySelector("#changeCount").textContent = count ? `${count} of ${Object.keys(targets).length} surfaces customized` : "Original finishes";
  const palette = document.querySelector("#palette");
  if (palette) {
    palette.replaceChildren();
    Object.entries(targets).forEach(([key, target]) => {
      const option = target.options.find(item => item.id === state.selections[key]);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-item";
      button.innerHTML = `<img class="selection-preview" src="assets/variants/${option?.id || `${key}-original`}-thumb.jpg" alt="${option?.name || 'Original'} ${target.title.toLowerCase()}" /><span><small>${target.title}</small><strong>${option?.name || "Original"}</strong></span>`;
      button.addEventListener("click", () => setActiveTarget(key));
      palette.append(button);
    });
  }
  document.querySelectorAll('[data-look]').forEach(button=>{
    const applied = Object.entries(tileLooks[button.dataset.look].selections).every(([key,id]) => state.selections[key] === id);
    button.setAttribute('aria-pressed', applied);
    button.querySelector('span').textContent = applied ? 'Look applied ✓' : 'Try this look';
  });
}

document.querySelectorAll("[data-surface]").forEach(button => button.addEventListener("click", () => setActiveTarget(button.dataset.surface)));
document.querySelector("#originalButton").addEventListener("click", () => setComparison(true));
document.querySelector("#designButton").addEventListener("click", () => setComparison(false));
document.querySelector("#restoreButton")?.addEventListener("click", () => {
  operationId++;
  clearComplete();
  pendingSelections.delete(state.activeTarget);
  layers[state.activeTarget].classList.remove("is-applied");
  delete state.selections[state.activeTarget];
  renderSwatches();
  syncControls();
  if (hintPill) hintPill.textContent = `${targets[state.activeTarget].title} restored`;
});

function setEditMode(mode) {
  document.querySelector('#individualPanel').hidden = mode !== 'individual';
  document.querySelector('#looksPanel').hidden = mode !== 'looks';
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === mode));
}
function clearComplete() {
  document.querySelector('#looksPanel').removeAttribute('aria-busy');
  state.complete=null;
  completeImage.hidden=true;
  document.querySelector('#stage').classList.remove('complete-view');
}
async function applyLook(style) {
  if (window.roomMode === "3d") return window.walkthrough?.applyLook(style);
  const operation=++operationId;
  pendingSelections.clear();
  hintPill.textContent='Loading complete room...';
  document.querySelector('#tryLook span').textContent = 'Creating your room…';
  const panel=document.querySelector('#looksPanel');
  panel.setAttribute('aria-busy','true');
  try {
    const selections=tileLooks[style].selections;
    const keys=Object.keys(selections);
    const images=await Promise.all(keys.map(key=>SurfaceMasks.loadAsset(selections[key])));
    if(operation!==operationId)return;
    keys.forEach((key,index)=>{
      state.selections[key]=selections[key];
      layers[key].setAttribute('href',images[index].src);
      layers[key].classList.add('is-applied');
    });
    clearComplete();
    setComparison(false);
    syncControls();
    renderSwatches();
    hintPill.textContent=`${tileLooks[style].title} applied`;
    if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('.visualizer-card').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  } catch(error) {
    if(operation===operationId)hintPill.textContent='Could not load this room. Please try again.';
    console.error(error);
  } finally { if(operation===operationId){ panel.removeAttribute('aria-busy'); syncControls(); } }
}
document.querySelectorAll('[data-look]').forEach(button=>button.addEventListener('click',()=>applyLook(button.dataset.look)));
setActiveTarget("floor");
hintPill.textContent = "Original finishes";

const lookStories = tileLooks;
let previewRequest = 0;
const lookPreviews = new Map();
async function buildLookPreview(style) {
  if (!lookPreviews.has(style)) {
    const pending = (async () => {
      const room = document.querySelector('.base-image');
      await room.decode();
      const images = await Promise.all(Object.values(tileLooks[style].selections).map(id => SurfaceMasks.loadAsset(id)));
      const canvas = document.createElement('canvas');
      canvas.width = room.naturalWidth; canvas.height = room.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(room, 0, 0);
      images.forEach(image => ctx.drawImage(image, 0, 0));
      return canvas.toDataURL('image/jpeg', .92);
    })();
    lookPreviews.set(style, pending);
    pending.catch(() => lookPreviews.delete(style));
  }
  return lookPreviews.get(style);
}
async function previewLook(style) {
  const request = ++previewRequest;
  const look = lookStories[style];
  const preview = document.querySelector('#lookImage');
  preview.style.visibility = 'hidden';
  document.querySelector('#lookImage').alt = `${look.title} bathroom preview`;
  document.querySelector('#lookTitle').textContent = look.title;
  document.querySelector('#lookTag').textContent = look.tag;
  document.querySelector('#lookDescription').textContent = look.description;
  document.querySelector('#lookNumber').textContent = style === 'classic' ? '01 / 02' : '02 / 02';
  document.querySelector('#tryLook').dataset.look = style;
  document.querySelectorAll('[data-preview]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.preview === style));
  document.querySelector('#lookMaterials').innerHTML = Object.entries(look.selections).map(([key,id]) => {
    const option = targets[key].options.find(option => option.id === id);
    return `<span><img src="assets/variants/${id}-thumb.jpg?v=${TILE_PREVIEW_REVISION}" alt="" /><small>${option.name}</small></span>`;
  }).join('');
  syncControls();
  try {
    const src = await buildLookPreview(style);
    if (request !== previewRequest) return;
    preview.src = src;
    preview.style.visibility = '';
  } catch (error) {
    if (request === previewRequest) preview.alt = 'Preview unavailable. Try this look to apply the tiles.';
    console.error('Look preview unavailable', error);
  }
}
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>previewLook(button.dataset.preview)));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setEditMode(button.dataset.mode)));
document.querySelector('#remixButton').addEventListener('click',()=>setEditMode('individual'));
previewLook('classic');
setEditMode('individual');

// Shared design-studio controls are reused by the lazy-loaded 3D mode.
window.SimpoloStudio = { state, targets, tileLooks, tileFinishes, setActiveTarget, setComparison,
  renderSwatches, syncControls, hint: hintPill };
