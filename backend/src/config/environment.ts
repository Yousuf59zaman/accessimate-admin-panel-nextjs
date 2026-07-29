const requiredProductionVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGINS',
  'PUBLIC_API_URL',
] as const;

const textValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateEnvironment = (
  environment: Record<string, unknown>,
): Record<string, unknown> => {
  if (textValue(environment.NODE_ENV) !== 'production') return environment;

  const missing = requiredProductionVariables.filter(
    (name) => !textValue(environment[name]),
  );
  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}.`,
    );
  }

  const databaseUrl = textValue(environment.DATABASE_URL);
  if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
  }

  if (textValue(environment.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  const publicApiUrl = textValue(environment.PUBLIC_API_URL).replace(/\/+$/, '');
  if (!isHttpsUrl(publicApiUrl)) {
    throw new Error('PUBLIC_API_URL must be an HTTPS URL in production.');
  }

  const origins = textValue(environment.FRONTEND_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins.length || origins.some((origin) => !isHttpsUrl(origin))) {
    throw new Error(
      'FRONTEND_ORIGINS must contain comma-separated HTTPS origins in production.',
    );
  }

  return {
    ...environment,
    PUBLIC_API_URL: publicApiUrl,
    FRONTEND_ORIGINS: origins.join(','),
  };
};
