export const E2E_AUTH_BYPASS_ENV = "E2E_AUTH_BYPASS";
export const E2E_AUTH_BYPASS_VALUE = "1";
export const E2E_BYPASS_USER_EMAIL = "mapa-e2e@localhost";

export const E2E_PUBLIC_PATHS = ["/mapa", "/api/graphql"] as const;

export const isE2eAuthBypassEnabled = (
  nodeEnv: string | undefined = process.env.NODE_ENV,
  flag: string | undefined = process.env[E2E_AUTH_BYPASS_ENV],
): boolean => nodeEnv !== "production" && flag === E2E_AUTH_BYPASS_VALUE;

export const isE2ePublicPath = (
  pathname: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
  flag: string | undefined = process.env[E2E_AUTH_BYPASS_ENV],
): boolean => {
  if (!isE2eAuthBypassEnabled(nodeEnv, flag)) {
    return false;
  }
  return E2E_PUBLIC_PATHS.some(
    (path) =>
      pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(`${path}?`),
  );
};
