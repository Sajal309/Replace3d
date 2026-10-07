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

Shower replacement diffuse shading blends source-colour irradiance (70%) with runtime diffuse illumination (30%) before the baked light mask. This avoids double-darkening matte Leaf Raw. PBR specular remains active; vanity and floor calibration is independent.

Reflections: a 256px cube capture of the room is PMREM-filtered at load and refreshed when visible finishes or Original comparison change. Tile and prop materials share the current probe. Walking does not trigger new cube captures. Probe reflections approximate the interior; planar surfaces additionally use live reflections. Both mirror faces use a shared 768px planar reflection overlay that renders during interaction. Imported mirror geometry remains untouched on the picking layer. Baked illumination affects diffuse only; specular highlights remain view dependent. Raw and matt finishes retain broader, softer reflections than smooth marble.

Smooth replacement flooring additionally uses a 768x512 live planar reflection overlay, blended by viewing angle. Original comparison and raw flooring disable this overlay. Its geometry is a clone, imported floor geometry/UVs stay unchanged. During capture, the original floor is hidden to avoid a coplanar self-reflection. The other reflector uses its cached texture during each pass to prevent recursive floor/mirror rendering. Idle rendering still stops.

Smooth shower replacements also use three 512px planar captures, grouped from the existing triangles by plane. Cutouts remain intact; only overlay geometry is created. Soft filtering and a weaker angle-dependent blend keep the matt wall sheen below the smooth flooring. Leaf Raw and Original mode disable these overlays. All reflection captures suppress recursive passes and temporarily hide their source mesh to prevent self-reflection.

Final material audit: all 46 visible source meshes and all six Simpolo finishes were checked for decoded textures, colour space, UV validity, reflection settings, shader errors and unchanged geometry. Fixed baked assets retain their emissive texture maps. Glazed basins/toilet, the wood-and-stone vanity, coated fittings, mirror frames, pendant and bottles use individual conservative roughness/reflection profiles. Cloth, paper, plants and broad painted surfaces stay matte. Some baked meshes combine different materials in one atlas, so these profiles approximate their surface response rather than claim separately authored physical roughness/normal maps.

The smooth vanity wall uses a single 512px reflection plane built from the original triangles; Hazel Raw disables it. Shower glass keeps its source geometry and uses dielectric Fresnel transparency (clear face-on, more reflective at grazing angles) with specular-only shading to avoid a diffuse grey veil. Geometry, original UVs and baked colour images are unchanged.
