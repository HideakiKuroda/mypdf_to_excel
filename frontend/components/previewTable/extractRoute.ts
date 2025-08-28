export function extractRoute(line: string, DEFAULT_BERTHS: string[]): string {
  const routeCandidates = line.split(/ｴｽｺｰﾄ:|ES:/)[0].split(/～|-/);
  let route = "";

  for (const candidate of routeCandidates) {
    for (const berth of DEFAULT_BERTHS) {
      if (candidate.includes(berth)) {
        route = berth;
        break;
      }
    }
    if (route) break;
  }

  if (!route) {
    for (const part of routeCandidates) {
      if (part.includes("#")) {
        route = part.trim();
        break;
      }
    }
  }

  if (!route) {
    route = line.split(/ｴｽｺｰﾄ:|ES:/)[0];
  }

  // Remove leading numbers
  route = route.replace(/^\d+/, "").trim();
  // Normalize to one letter after `#`
  route = route.replace(/#(\d+)[^\d\s]*/g, "#$1");

  return route;
}
