export function pickDefaultRoute(options = [], saved = '') {
  const ids = options.map((item) => item.id);
  if (saved && ids.includes(saved)) return saved;
  return ids[0] || '';
}
