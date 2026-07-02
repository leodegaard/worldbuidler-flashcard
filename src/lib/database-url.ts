const LEGACY_STRICT_SSL_MODE = /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/;

export function normalizeDatabaseUrl(connectionString: string | undefined) {
  if (!connectionString || connectionString.includes("uselibpqcompat=true")) {
    return connectionString;
  }
  return connectionString.replace(LEGACY_STRICT_SSL_MODE, "$1sslmode=verify-full");
}
