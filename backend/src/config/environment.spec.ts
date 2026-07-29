import { validateEnvironment } from './environment';

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgresql://placeholder:placeholder@database.example.test/accessimate',
  JWT_SECRET: 'a'.repeat(48),
  FRONTEND_ORIGINS: 'https://accessimate.example.test',
  PUBLIC_API_URL: 'https://api.accessimate.example.test/',
};

describe('validateEnvironment', () => {
  it('normalizes complete production configuration', () => {
    expect(validateEnvironment(productionEnvironment)).toEqual(
      expect.objectContaining({
        PUBLIC_API_URL: 'https://api.accessimate.example.test',
        FRONTEND_ORIGINS: 'https://accessimate.example.test',
      }),
    );
  });

  it('fails production startup when required configuration is missing', () => {
    expect(() =>
      validateEnvironment({ ...productionEnvironment, JWT_SECRET: '' }),
    ).toThrow('Missing required production environment variables: JWT_SECRET');
  });

  it('rejects weak secrets and non-HTTPS production origins', () => {
    expect(() =>
      validateEnvironment({ ...productionEnvironment, JWT_SECRET: 'too-short' }),
    ).toThrow('at least 32 characters');
    expect(() =>
      validateEnvironment({
        ...productionEnvironment,
        FRONTEND_ORIGINS: 'http://accessimate.example.test',
      }),
    ).toThrow('HTTPS origins');
  });
});
