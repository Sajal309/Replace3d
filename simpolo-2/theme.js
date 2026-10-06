(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('simpolo-theme'); } catch {}
  function apply(theme) {
    root.dataset.theme = theme;
    const button = document.querySelector('#themeToggle');
    if (button) {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.querySelector('span').textContent = dark ? 'Light mode' : 'Dark mode';
    }
  }
  apply(saved === 'dark' || saved === 'light' ? saved : preference.matches ? 'dark' : 'light');
  preference.addEventListener('change', event => { if (!saved) apply(event.matches ? 'dark' : 'light'); });
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelector('#themeToggle').addEventListener('click', () => {
      saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(saved);
      try { localStorage.setItem('simpolo-theme', saved); } catch {}
    });
  });
})();
