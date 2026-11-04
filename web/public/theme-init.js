// Applies the saved theme before first paint so there is no flash of the wrong theme.
try {
  const saved = localStorage.getItem('bill-splitter-theme')
  document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}
