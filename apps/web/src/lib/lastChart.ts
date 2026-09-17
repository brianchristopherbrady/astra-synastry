const PATH_KEY = "astro:lastChartPath";

export function setLastChart(path: string): void {
  sessionStorage.setItem(PATH_KEY, path);
}

export function getLastChart(): { path: string } | null {
  const path = sessionStorage.getItem(PATH_KEY);
  if (!path) return null;
  return { path };
}

export function clearLastChart(): void {
  sessionStorage.removeItem(PATH_KEY);
}
