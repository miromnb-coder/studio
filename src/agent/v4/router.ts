export function routeIntent(input: string) {
  if (input.includes("money")) return "money";
  if (input.includes("time")) return "time";
  if (input.includes("email")) return "email";
  return "general";
}
