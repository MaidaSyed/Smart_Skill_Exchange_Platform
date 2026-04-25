function normalizeProficiency(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return 1;
  if (v < 1) return 1;
  if (v > 5) return 5;
  return Math.round(v);
}

module.exports = {
  normalizeProficiency,
};
