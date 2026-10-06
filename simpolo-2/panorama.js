(() => {
  const stage = document.querySelector('#stage');
  const host = document.querySelector('#panorama');
  const source = document.querySelector('.base-image');
  let renderer, scene, camera, texture, sphere;
  const defaultView = { yaw: .25, pitch: -.4, fov: 80 };
  let { yaw, pitch, fov } = defaultView;
  let viewTransition = null;
  function clampPitch(value) {
    return Math.max(-Math.PI / 2 + .001, Math.min(1.3, value));
  }
  function focusOnPoint(point) {
    const targetYaw = Math.atan2(point.x, -point.z);
    const targetPitch = Math.asin(Math.max(-1, Math.min(1, point.y)));
    const tau = Math.PI * 2;
    const yawDelta = ((targetYaw - yaw + Math.PI) % tau + tau) % tau - Math.PI;
    viewTransition = {
      start: performance.now(), duration: 760,
      yaw: yaw, yawDelta,
      pitch: pitch, targetPitch
    };
    render();
  }
  let active = false;
  const width = 1779, height = 884;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  // Keep the floor hotspot on a mask-positive point, comfortably inside the
  // initial view. Its screen position is projected from this fixed panorama
  // coordinate, so it travels with the floor as the user looks around.
  const pinAnchors = { floor: [.58,.80], bathWall: [.29,.42], mirrorWall: [.39,.43] };
  // Focus the camera on the spherical center of each replacement mask rather
  // than the hotspot. Ceiling/floor use practical points within their broad,
  // pole-spanning masks so focusing them stays useful to the viewer.
  const focusAnchors = { floor: [.82,.80], bathWall: [.207,.440], mirrorWall: [.461,.371] };
  const pointFromUV = (u,v) => {
    const phi=u*Math.PI*2, theta=v*Math.PI;
    return new THREE.Vector3(-Math.sin(phi)*Math.sin(theta),Math.cos(theta),Math.cos(phi)*Math.sin(theta));
  };
  const pins = Object.entries(pinAnchors).map(([key, [u,v]]) => {
    const button=document.createElement('button');
    button.type='button'; button.className='panorama-pin'; button.textContent='+';
    button.setAttribute('aria-label', `Select ${targets[key].title}`); button.title=targets[key].title;
    button.dataset.surface=key;
    const point=pointFromUV(u,v);
    const focusPoint=pointFromUV(...(focusAnchors[key] || [u,v]));
    button.addEventListener('click',()=>{ setActiveTarget(key); });
    stage.append(button);
    return {key,button,point};
  });
  window.focusPanoramaTarget = key => {
    if (active && focusAnchors[key]) focusOnPoint(pointFromUV(...focusAnchors[key]));
  };
  let hovered = null;

  function pickSurface(event) {
    if (!active || !sphere || stage.classList.contains('show-original')) return null;
    const bounds = host.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2),camera);
    const hit = ray.intersectObject(sphere)[0];
    if (!hit) return null;
    const x = hit.uv.x*width, y = (1-hit.uv.y)*height;
    return SurfaceMasks.pick(x, y);
  }

  function setHover(key) {
    if (hovered === key) return;
    hovered = key;
    host.dataset.hoveredSurface = key || '';
    host.style.cursor = key ? 'pointer' : 'grab';
    render();
  }

  function updateTexture() {
    if (!texture || !source.complete) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    if (!stage.classList.contains('show-original')) {
      if(state.complete) {
        const room=SurfaceMasks.assets.get(`room-${state.complete}`);
        if(room)ctx.drawImage(room,0,0,width,height);
      } else for (const key of SurfaceMasks.keys) {
        const id=state.selections[key];
        const image=SurfaceMasks.assets.get(id);
        if(image) ctx.drawImage(image,0,0,width,height);
      }
    }
    texture.needsUpdate = true;
    render();
  }
  window.updatePanorama = updateTexture;

  // Continuous render loop while the 360 view is active. On-demand rendering
  // depends on the preserved drawing buffer and can drop frames / stutter;
  // a steady rAF loop keeps rotation and zoom consistently smooth.
  const _dir = new THREE.Vector3();
  const _proj = new THREE.Vector3();
  let looping = false;
  function render() {
    if (!active || !renderer || looping) return;
    looping = true;
    requestAnimationFrame(function frame() {
      if (!active || !renderer) { looping = false; return; }
      drawFrame();
      requestAnimationFrame(frame);
    });
  }
  function drawFrame() {
    if (!active || !renderer) return;
    if (viewTransition) {
      const progress = Math.min(1, (performance.now() - viewTransition.start) / viewTransition.duration);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      yaw = viewTransition.yaw + viewTransition.yawDelta * eased;
      pitch = viewTransition.pitch + (viewTransition.targetPitch - viewTransition.pitch) * eased;
      if (progress === 1) viewTransition = null;
    }
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.up.set(0, 1, 0);
    camera.lookAt(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    renderer.render(scene, camera);
    camera.getWorldDirection(_dir);
    const original = stage.classList.contains('show-original');
    // Reuse vectors and only touch the DOM when a pin actually moves, to avoid
    // forcing a style/layout recalc every frame.
    for (const pin of pins) {
      _proj.copy(pin.point).project(camera);
      const visible = pin.point.dot(_dir) > 0 && Math.abs(_proj.x) < .96 && Math.abs(_proj.y) < .92 && !original;
      if (visible !== pin._vis) { pin.button.hidden = !visible; pin._vis = visible; }
      if (visible) {
        const left = (_proj.x + 1) * 50, top = (1 - _proj.y) * 50;
        if (left !== pin._left) { pin.button.style.left = left + '%'; pin._left = left; }
        if (top !== pin._top) { pin.button.style.top = top + '%'; pin._top = top; }
      }
      const pressed = state.activeTarget === pin.key;
      if (pressed !== pin._pressed) { pin.button.setAttribute('aria-pressed', pressed); pin._pressed = pressed; }
    }
  }
  function resize() {
    if (!renderer || !active) return;
    renderer.setSize(host.clientWidth, host.clientHeight);
    render();
  }
  function init() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(defaultView.fov, 1, .1, 100);
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Mipmaps sharpen surfaces at grazing angles, but need WebGL2 for this non-power-of-two panorama.
    if (renderer.capabilities.isWebGL2) {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
    } else {
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    }
    const geometry = new THREE.SphereGeometry(10, 96, 64);
    geometry.scale(-1, 1, 1);
    sphere = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map:texture}));
    sphere.rotation.y = -Math.PI / 2;
    scene.add(sphere);
    updateTexture();
  }
  window.setPanoramaView = setView;
  function setView(value) {
    active = value;
    stage.classList.toggle('is-360', active);
    document.querySelector('#flatView').setAttribute('aria-pressed', !active);
    document.querySelector('#panoramaView').setAttribute('aria-pressed', active);
    if (active) {
      try { init(); resize(); if (state.activeTarget) window.focusPanoramaTarget(state.activeTarget); host.focus({preventScroll:true}); }
      catch (error) { active = false; stage.classList.remove('is-360'); document.querySelector('#flatView').setAttribute('aria-pressed', true); document.querySelector('#panoramaView').setAttribute('aria-pressed', false); hintPill.textContent = '360 view unavailable. Open the localhost preview with WebGL enabled.'; console.error(error); }
    }
  }
  document.querySelector('#flatView').onclick = () => setView(false);
  document.querySelector('#panoramaView').onclick = () => setView(true);
  new ResizeObserver(resize).observe(host);
  source.addEventListener('load', updateTexture);
  let pointer = null;
  host.addEventListener('pointerdown', event => { viewTransition = null; pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY}; host.setPointerCapture(event.pointerId); });
  host.addEventListener('pointermove', event => {
    if (!pointer) { setHover(pickSurface(event)); return; }
    if (pointer.id !== event.pointerId) return;
    setHover(null);
    yaw -= (event.clientX-pointer.x) * .004;
    pitch = clampPitch(pitch + (event.clientY-pointer.y)*.004);
    pointer.x = event.clientX; pointer.y = event.clientY;
    render();
  });
  host.addEventListener('pointerup', event => {
    if (!pointer) return;
    if (Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY) < 5 && !stage.classList.contains('show-original')) {
      const key = pickSurface(event);
      if (key) setActiveTarget(key);
    }
    pointer = null;
    if (event.pointerType === 'mouse') setHover(pickSurface(event));
  });
  host.addEventListener('pointerleave', () => setHover(null));
  host.addEventListener('pointercancel', () => { pointer = null; });
  function zoom(amount) {
    viewTransition = null;
    fov = Math.max(40,Math.min(125,fov+amount));
    pitch = clampPitch(pitch);
    render();
  }
  host.addEventListener('wheel', event => { event.preventDefault(); zoom(event.deltaY*.035); },{passive:false});
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(event.key)) return;
    event.preventDefault();
    viewTransition = null;
    if(event.key==='ArrowLeft') yaw-=.1;
    if(event.key==='ArrowRight') yaw+=.1;
    if(event.key==='ArrowUp') pitch=Math.min(1.3,pitch+.1);
    if(event.key==='ArrowDown') pitch=clampPitch(pitch-.1);
    if(event.key==='+') zoom(-5);
    if(event.key==='-') zoom(5);
    render();
  });
  document.querySelector('#zoomIn').onclick = () => zoom(-10);
  document.querySelector('#zoomOut').onclick = () => zoom(10);
  document.querySelector('#centerView').onclick = () => { ({yaw, pitch, fov} = defaultView); viewTransition = null; render(); };
  // Open on the flat image; users can switch to the 360 view when they want it.
  setView(false);
})();
