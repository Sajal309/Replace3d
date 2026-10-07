(() => {
  const stage = document.querySelector('#stage');
  let panoramaSelections = state.selections;
  let modelSelections = {};
  let loading;
  let request = 0;
  const panoramaLabels = Object.fromEntries(Object.entries(targets).map(([key,target]) => [key,{title:target.title,text:target.text,hint:target.hint}]));
  const panoramaLookDescriptions=Object.fromEntries(Object.entries(tileLooks).map(([key,look])=>[key,look.description]));
  window.roomMode = 'flat';
  async function switchMode(mode) {
    const token = ++request;
    if (mode === '3d' && !window.walkthrough) {
      hintPill.textContent = 'Loading 3D studio…';
      document.querySelector('#modelView').disabled = true;
      try {
        loading ||= import('./assets/walkthrough.bundle.js?v=20261007-material-audit-1');
        const module = await loading;
        if (!window.walkthrough) window.walkthrough = module.createWalkthrough();
      } catch (error) {
        loading = null;
        hintPill.textContent = '3D could not start. Please enable WebGL and try again.';
        console.error(error);
        return;
      } finally { document.querySelector('#modelView').disabled = false; }
      if (request !== token) return;
    }
    // In-flight panorama edits must not finish into the other mode's selections.
    operationId++;
    pendingSelections.clear();
    clearComplete();
    if (window.roomMode === '3d') modelSelections = state.selections;
    else panoramaSelections = state.selections;
    state.selections = mode === '3d' ? modelSelections : panoramaSelections;
    window.roomMode = mode;
    for(const [key,target] of Object.entries(targets))Object.assign(target,panoramaLabels[key]);
    if(mode === '3d'){
      Object.assign(targets.mirrorWall,{title:'Vanity wall',text:'Tiles behind the mirrors and washbasins.',hint:'Vanity wall selected'});
      Object.assign(targets.bathWall,{title:'Shower walls',text:'Tiles around the shower enclosure.',hint:'Shower walls selected'});
    }
    document.querySelector('.surface-tabs [data-surface="mirrorWall"] .tab-label').textContent = mode === '3d' ? 'Vanity wall' : 'Mirror wall';
    document.querySelector('.surface-tabs [data-surface="bathWall"] .tab-label').textContent = mode === '3d' ? 'Shower walls' : 'Shower wall';
    for(const [key,look] of Object.entries(tileLooks))look.description=mode==='3d' ? panoramaLookDescriptions[key].replace(/around the mirror/g,'on the vanity wall').replace(/mirror wall/g,'vanity wall') : panoramaLookDescriptions[key];
    const selectedLook=document.querySelector('#tryLook')?.dataset.look;
    if(selectedLook && tileLooks[selectedLook])document.querySelector('#lookDescription').textContent=tileLooks[selectedLook].description;
    const roleSelector=document.querySelector('#meshRole');
    if(roleSelector){roleSelector.querySelector('[value="mirrorWall"]').textContent='Vanity wall';roleSelector.querySelector('[value="bathWall"]').textContent='Shower walls';}
    if(state.activeTarget){panelTitle.textContent=targets[state.activeTarget].title;panelText.textContent=targets[state.activeTarget].text;}

    window.setPanoramaView(mode === '360');
    stage.classList.toggle('is-3d', mode === '3d');
    window.walkthrough?.setActive(mode === '3d');
    for (const [id, value] of [['flatView','flat'], ['panoramaView','360'], ['modelView','3d']]) {
      document.getElementById(id).setAttribute('aria-pressed', mode === value);
    }
    document.querySelector('#exportDesign').title = mode === '3d' ? 'Download the current 3D view' : 'Download the 360° panorama';
    setComparison(false);
    renderSwatches();
    syncControls();
  }
  document.querySelector('#flatView').onclick = () => switchMode('flat');
  document.querySelector('#panoramaView').onclick = () => switchMode('360');
  document.querySelector('#modelView').onclick = () => switchMode('3d');
  window.switchRoomMode = switchMode;
  if(location.hash === "#3d") switchMode("3d");
})();
