import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env.e2e`);
  }
  return value;
}

export const config = {
  baseUrl: requireEnv('E2E_BASE_URL'),
  apiUrl: requireEnv('E2E_API_URL'),
  carOwnerEmail: requireEnv('E2E_CAR_OWNER_EMAIL'),
  carOwnerPassword: requireEnv('E2E_CAR_OWNER_PASSWORD'),
  workshopEmail: requireEnv('E2E_WORKSHOP_EMAIL'),
  workshopPassword: requireEnv('E2E_WORKSHOP_PASSWORD'),
  headless: process.env.E2E_HEADLESS !== 'false',
  slowMo: process.env.E2E_SLOWMO ? Number(process.env.E2E_SLOWMO) : 0,
  recordVideo: process.env.E2E_VIDEO === 'true',
  videoDir: process.env.E2E_VIDEO_DIR || 'e2e/artifacts/videos',
};
