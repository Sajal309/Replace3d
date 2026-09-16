// Selection and replacement alpha use the exact imported Photoshop masks.
const SurfaceMasks = (() => {
  const width = 1779, height = 884;
  const maskRevision = 'photoshop-20260916-3';
  const keys = ['ceiling', 'floor', 'bathWall', 'mirror', 'door', 'towel', 'chair', 'vanity'];
  const masks = new Map(), assets = new Map(), loading = new Map();
  const ns = 'http://www.w3.org/2000/svg';
  const replacementMap = document.querySelector('#replacementMap');
  const hitMap = document.querySelector('.hotspot-map');
  replacementMap.replaceChildren();
  hitMap.replaceChildren();
  for (const key of keys) {
    const picture = document.createElementNS(ns, 'image');
    picture.setAttribute('width', width); picture.setAttribute('height', height);
    picture.setAttribute('preserveAspectRatio', 'none');
    picture.dataset.layer = key;
    picture.classList.add('material-layer');
    replacementMap.append(picture);
  }
  const hitRect = document.createElementNS(ns, 'rect');
  hitRect.setAttribute('width', width); hitRect.setAttribute('height', height);
  hitRect.setAttribute('fill', 'transparent');
  hitMap.append(hitRect);

  function pick(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return keys.find(key => masks.get(key)?.[(y*width+x)*4+3] >= 128) || null;
  }
  function hit(event) {
    if (document.querySelector('#stage').classList.contains('show-original')) return null;
    const box = hitMap.getBoundingClientRect();
    return pick((event.clientX-box.left)/box.width*width, (event.clientY-box.top)/box.height*height);
  }
  async function loadAsset(id) {
    if (!loading.has(id)) {
      const promise = (async () => {
        const image = new Image();
        image.src = `assets/variants/${id}.png?v=${maskRevision}`;
        await image.decode();
        if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('Replacement dimensions do not match the room.');
        assets.set(id, image);
        return image;
      })();
      loading.set(id, promise);
      promise.catch(() => loading.delete(id));
    }
    return loading.get(id);
  }
  const ready = Promise.all(keys.map(async key => {
    const image = new Image(); image.src = `assets/masks/${key}.png?v=${maskRevision}`; await image.decode();
    if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('Mask dimensions do not match the room.');
    const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(image,0,0);
    masks.set(key,ctx.getImageData(0,0,width,height).data);
  }));
  ready.catch(error => console.error('Selection masks unavailable', error));
  hitMap.addEventListener('pointermove', event => { hitMap.style.cursor = hit(event) ? 'pointer' : 'default'; });
  hitMap.addEventListener('click', event => { const key=hit(event); if(key) setActiveTarget(key); });
  return {ready,pick,loadAsset,assets,keys};
})();
