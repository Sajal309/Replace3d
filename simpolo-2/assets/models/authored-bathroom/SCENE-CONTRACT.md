# Authored bathroom scene

Original files copied from the workspace's `3d Scene` folder, without mesh or UV edits.

- `Collection.glb`: visible scene, including its baked emissive texture materials.
- `Interactable.glb`: hidden navigation helpers in the same coordinates and units (meters).
- `illovo_beach_balcony_4k.hdr`: PMREM-filtered environment lighting for PBR finishes and reflections.
- Names containing `collision_floor_<number>` supply walkable ground.
- Names containing `collision_<number>` supply walls and solid obstacles.
- `spawnpoint*` supplies the starting foot position; camera uses a 1.6m eye offset and grounds onto the walk collider.
- `spawnlookat*` supplies the camera's initial look target.
- `product_bathroom_floor_<number>`, `product_bathroom_mirror_back_<number>`, and `product_bathroom_wall_<number>` supply floor, feature-wall and room-wall replacement slots.

The supplied _0 and _1 product sets have identical geometry and occupy identical positions. Only _0 renders; _1 is retained but hidden to avoid z-fighting. Replacement materials are cloned per source slot; original geometry, UVs, baked materials and transforms stay intact. Replacement finishes use world-position projection in metres, preserving image aspect ratio and the source baked UVs. Subtle grout, shallow bump detail, finish-dependent roughness, HDRI, a soft ceiling fill, static room shadows and contact shadows supply replacement shading. The old baked emissive image is removed only from cloned replacement materials.

To update this authored scene, replace these three files with exports using the same naming convention and shared coordinates, then run `npm run build`. Swappable meshes require UV coordinates. Wall/furniture collision proxies should form closed volumes; ground should provide upward-facing triangles.

The vanity wall marker sits on the exposed gap between mirrors, rather than the occluded mesh bounding-box centre. The 3D categories are Floor, Vanity wall and Shower walls. Replacement shading includes a blurred, luminance-only approximation of source baked illumination, with per-category calibration. This preserves broad shadow gradients without retaining the original tile colour or fine pattern; it is not a separately authored irradiance lightmap.
