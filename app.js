const targets = {
  floor: {
    title: "Floor",
    text: "Natural stone flooring.",
    hint: "Floor selected",
    defaultClass: "material-floor",
    options: [
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
  vanity: {
    title: "Washbasin",
    text: "Vessel basins with squared profiles.",
    hint: "Washbasin selected",
    defaultClass: "material-vanity",
    options: [
      {
        id: "vanity-classic",
        name: "Square Porcelain",
        meta: "White ceramic vessel basin",
        texture: "texture-calacatta",
      },
      {
        id: "vanity-modern",
        name: "Stone Rectangle",
        meta: "Honed stone vessel basin",
        texture: "texture-terrazzo",
      },
    ],
  },
  bathWall: {
    title: "Feature wall",
    text: "Patterned tiles for the bath surround.",
    hint: "Bath wall selected",
    defaultClass: "material-bath-wall",
    options: [
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
};

targets.door = {
  title: 'Door', text: 'Traditional and contemporary door styles.', hint: 'Door selected',
  options: [
    {id:'door-classic',name:'Heritage Walnut',meta:'Raised wood panels & brass',texture:'texture-door-ink'},
    {id:'door-modern',name:'Modern Oak',meta:'Linear oak & minimal hardware',texture:'texture-door-olive'},
  ],
};
targets.towel = {
  title: 'Towel', text: 'Textile finish with natural folds.', hint: 'Towel selected',
  options: [
    {id:'towel-classic',name:'Waffle Cotton',meta:'Textured cotton & woven stripes',texture:'texture-towel-coral'},
    {id:'towel-modern',name:'Bordered Linen',meta:'Fine linen & indigo border',texture:'texture-towel-teal'},
  ],
};
targets.chair = {
  title:'Chair', text:'Upholstered lounge seating.', hint:'Chair selected',
  options:[{id:'chair-classic',name:'Ivory Boucle',meta:'Soft upholstery & black frame'}, {id:'chair-modern',name:'Cognac Leather',meta:'Leather sling & black frame'}],
};
targets.ceiling = {
  title:'Ceiling', text:'Paint finishes for the false ceiling.', hint:'Ceiling selected',
  options:[{id:'ceiling-classic',name:'Soft Sage',meta:'Muted green ceiling finish'}, {id:'ceiling-modern',name:'Blue Gray',meta:'Cool blue-gray ceiling finish'}],
};
targets.mirror = {
  title:'Mirror', text:'New shapes and frames.', hint:'Mirror selected',
  options:[{id:'mirror-classic',name:'Brass Rectangle',meta:'Squared profile & thin brass frame'}, {id:'mirror-modern',name:'Black Arch',meta:'Arched top & flat base'}],
};

for (const key of ['door', 'towel', 'chair', 'ceiling', 'mirror']) {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = `surface-pin pin-${key}`;
  pin.dataset.surface = key;
  pin.textContent = '+';
  pin.setAttribute('aria-label', `Select ${targets[key].title}`);
  document.querySelector('#stage').append(pin);
}

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
  const target = targets[targetKey];

  if (panelTitle) panelTitle.textContent = target.title;
  panelText.textContent = target.text;
  document.querySelector("#optionCount").textContent = `${target.options.length} finishes`;
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

  targets[state.activeTarget].options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch-button";
    button.classList.toggle("is-selected", selectedId === option.id);
    button.dataset.materialId = option.id;
    button.setAttribute("aria-pressed", selectedId === option.id);
    button.innerHTML = `
      <img class="swatch-preview" src="assets/variants/${option.id}-thumb.jpg" alt="" />
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
  panelText.textContent = "Click the floor, wash basin area, or bathtub wall to preview replacement materials.";
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

function setComparison(original) {
  document.querySelector("#stage").classList.toggle("show-original", original);
  document.querySelector("#originalButton").setAttribute("aria-pressed", original);
  document.querySelector("#designButton").setAttribute("aria-pressed", !original);
  window.updatePanorama?.();
}

function syncControls() {
  window.updatePanorama?.();
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
  document.querySelectorAll('[data-look]').forEach(button=>{
    const applied = state.complete === button.dataset.look;
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
  const operation=++operationId;
  pendingSelections.clear();
  hintPill.textContent='Loading complete room...';
  document.querySelector('#tryLook span').textContent = 'Creating your room…';
  const panel=document.querySelector('#looksPanel');
  panel.setAttribute('aria-busy','true');
  try {
    const keys=Object.keys(targets);
    const images=await Promise.all([...keys.map(key=>SurfaceMasks.loadAsset(`${key}-${style}`)),SurfaceMasks.loadAsset(`room-${style}`)]);
    if(operation!==operationId)return;
    keys.forEach((key,index)=>{
      state.selections[key]=`${key}-${style}`;
      layers[key].setAttribute('href',images[index].src);
      layers[key].classList.add('is-applied');
    });
    state.complete=style;
    completeImage.src=images[images.length-1].src;
    completeImage.hidden=false;
    document.querySelector('#stage').classList.add('complete-view');
    setComparison(false);
    syncControls();
    renderSwatches();
    hintPill.textContent=`${style==='classic'?'Warm Classic':'Modern Contrast'} applied`;
    if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('.visualizer-card').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  } catch(error) {
    if(operation===operationId)hintPill.textContent='Could not load this room. Please try again.';
    console.error(error);
  } finally { if(operation===operationId){ panel.removeAttribute('aria-busy'); syncControls(); } }
}
document.querySelectorAll('[data-look]').forEach(button=>button.addEventListener('click',()=>applyLook(button.dataset.look)));
setActiveTarget("floor");
hintPill.textContent = "Original finishes";

const lookStories = {
  classic: {title:'Warm Classic', tag:'THE SOFTER SIDE', description:'Quiet stone. Warm walnut. A little everyday escape.', materials:[['floor','Travertine'],['door','Walnut'],['ceiling','Sage']]},
  modern: {title:'Modern Contrast', tag:'A BOLDER POINT OF VIEW', description:'Deep emerald. Sculptural shapes. A room with presence.', materials:[['floor','Slate'],['bathWall','Emerald'],['door','Oak']]}
};
function previewLook(style) {
  const look = lookStories[style];
  document.querySelector('#lookImage').src = `assets/variants/room-${style}-thumb.jpg`;
  document.querySelector('#lookImage').alt = `${look.title} bathroom preview`;
  document.querySelector('#lookTitle').textContent = look.title;
  document.querySelector('#lookTag').textContent = look.tag;
  document.querySelector('#lookDescription').textContent = look.description;
  document.querySelector('#lookNumber').textContent = style === 'classic' ? '01 / 02' : '02 / 02';
  document.querySelector('#tryLook').dataset.look = style;
  document.querySelectorAll('[data-preview]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.preview === style));
  document.querySelector('#lookMaterials').innerHTML = look.materials.map(([key,label])=>`<span><img src="assets/variants/${key}-${style}-thumb.jpg" alt="" /><small>${label}</small></span>`).join('');
  syncControls();
}
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>previewLook(button.dataset.preview)));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setEditMode(button.dataset.mode)));
document.querySelector('#remixButton').addEventListener('click',()=>setEditMode('individual'));
previewLook('classic');
setEditMode('individual');
