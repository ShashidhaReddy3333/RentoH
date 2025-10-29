export const logInfo = (m: string, o: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ level: "info", message: m, ...o }));

export const logWarn = (m: string, o: Record<string, unknown> = {}) =>
  console.warn(JSON.stringify({ level: "warn", message: m, ...o }));

export const logError = (m: string, o: Record<string, unknown> = {}) =>
  console.error(JSON.stringify({ level: "error", message: m, ...o }));
