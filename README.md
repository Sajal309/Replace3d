# FORMA deployment

Static bathroom configurator. No package installation or application server is required.

## Build and deploy

1. Install Node.js 22 or newer.
2. Run `node prepare-site.cjs` from the project directory.
3. Publish the contents of `dist/` to a static web host.

Build command: `node prepare-site.cjs`  
Publish directory: `dist`

## GitHub Pages

In the GitHub repository, set **Settings → Pages → Source** to **GitHub Actions**. Push `codex/deployment` to run `.github/workflows/deploy-pages.yml`. The workflow builds and publishes only `dist/`; subsequent pushes to this branch update the website. If the `github-pages` environment restricts deployment branches, allow `codex/deployment`.

The build validates that all required files exist, clears old output, and copies only runtime files. The existing Sites project configuration is retained in `.openai/hosting.json`.

For a local preview, run `python3 -m http.server 5173 --directory dist` and open http://localhost:5173. Serve over HTTP rather than opening `index.html` directly so image masks and WebGL work correctly.

Runtime files are the HTML, CSS, JavaScript, bundled Three.js, panorama, masks, replacement images, and thumbnails. Image authoring sources, Photoshop snapshots, generation scripts, and previous exports are excluded from this deployment branch. `dist/` is generated and ignored by Git.
