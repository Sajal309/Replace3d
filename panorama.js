(() => {
  const stage = document.querySelector('#stage');
  const host = document.querySelector('#panorama');
  const source = document.querySelector('.base-image');
  let renderer, scene, camera, texture, sphere;
  const defaultView = { yaw: -.12, pitch: -.12, fov: 110 };
  let { yaw, pitch, fov } = defaultView;
  let active = false;
  const width = 1779, height = 884;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const pinAnchors = { floor: [.49,.87], vanity: [.47,.66], bathWall: [.29,.42], door: [.89,.52], towel: [.70,.48], chair:[.70,.72], ceiling:[.45,.15], mirror:[.465,.40] };
  const pins = Object.entries(pinAnchors).map(([key, [u,v]]) => {
    const button=document.createElement('button');
    button.type='button'; button.className='panorama-pin'; button.textContent='+';
    button.setAttribute('aria-label', `Select ${targets[key].title}`); button.title=targets[key].title;
    button.dataset.surface=key;
    button.addEventListener('click',()=>setActiveTarget(key));
    stage.append(button);
    const phi=u*Math.PI*2, theta=v*Math.PI;
    return {key,button,point:new THREE.Vector3(-Math.sin(phi)*Math.sin(theta),Math.cos(theta),Math.cos(phi)*Math.sin(theta))};
  });
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

  function render() {
    if (!active || !renderer) return;
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    renderer.render(scene, camera);
    const direction=new THREE.Vector3(); camera.getWorldDirection(direction);
    for(const {key,button,point} of pins) {
      const projected=point.clone().project(camera);
      const visible=point.dot(direction)>0 && Math.abs(projected.x)<.96 && Math.abs(projected.y)<.92 && !stage.classList.contains('show-original');
      button.hidden=!visible;
      button.style.left=`${(projected.x+1)*50}%`;
      button.style.top=`${(1-projected.y)*50}%`;
      button.setAttribute('aria-pressed',state.activeTarget===key);
    }
  }
  function resize() {
    if (!renderer || !active) return;
    renderer.setSize(host.clientWidth, host.clientHeight);
    render();
  }
  function init() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(defaultView.fov, 1, .1, 100);
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.SphereGeometry(10, 64, 40);
    geometry.scale(-1, 1, 1);
    sphere = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map:texture}));
    sphere.rotation.y = -Math.PI / 2;
    scene.add(sphere);
    updateTexture();
  }
  function setView(value) {
    active = value;
    stage.classList.toggle('is-360', active);
    document.querySelector('#flatView').setAttribute('aria-pressed', !active);
    document.querySelector('#panoramaView').setAttribute('aria-pressed', active);
    if (active) {
      try { init(); resize(); host.focus({preventScroll:true}); }
      catch (error) { active = false; stage.classList.remove('is-360'); document.querySelector('#flatView').setAttribute('aria-pressed', true); document.querySelector('#panoramaView').setAttribute('aria-pressed', false); hintPill.textContent = '360 view unavailable. Open the localhost preview with WebGL enabled.'; console.error(error); }
    }
  }
  document.querySelector('#flatView').onclick = () => setView(false);
  document.querySelector('#panoramaView').onclick = () => setView(true);
  new ResizeObserver(resize).observe(host);
  source.addEventListener('load', updateTexture);
  let pointer = null;
  host.addEventListener('pointerdown', event => { pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY}; host.setPointerCapture(event.pointerId); });
  host.addEventListener('pointermove', event => {
    if (!pointer) { setHover(pickSurface(event)); return; }
    if (pointer.id !== event.pointerId) return;
    setHover(null);
    yaw -= (event.clientX-pointer.x) * .004;
    pitch = Math.max(-1.3, Math.min(1.3, pitch + (event.clientY-pointer.y)*.004));
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
  function zoom(amount) { fov = Math.max(40,Math.min(125,fov+amount)); render(); }
  host.addEventListener('wheel', event => { event.preventDefault(); zoom(event.deltaY*.035); },{passive:false});
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(event.key)) return;
    event.preventDefault();
    if(event.key==='ArrowLeft') yaw-=.1;
    if(event.key==='ArrowRight') yaw+=.1;
    if(event.key==='ArrowUp') pitch=Math.min(1.3,pitch+.1);
    if(event.key==='ArrowDown') pitch=Math.max(-1.3,pitch-.1);
    if(event.key==='+') zoom(-5);
    if(event.key==='-') zoom(5);
    render();
  });
  document.querySelector('#zoomIn').onclick = () => zoom(-10);
  document.querySelector('#zoomOut').onclick = () => zoom(10);
  document.querySelector('#centerView').onclick = () => { ({yaw, pitch, fov} = defaultView); render(); };
})();
