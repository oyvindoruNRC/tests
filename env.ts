export function loginUrl(name: string): string {
  const value = process.env.HCM_BASE_URL;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
export const TIMEOUTS = {
  SHORT: 2_000,
  MED: 8_000,
  LONG: 20_000,
};

