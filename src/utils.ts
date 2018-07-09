export function translateSeverityLevel(level: number) {
  switch (level) {
    case 1:
      return "info";
    case 2:
      return "warning";
    case 3:
      return "error";
    default:
      return "debug";
  }
}