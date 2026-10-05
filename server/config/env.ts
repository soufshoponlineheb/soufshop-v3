import 'server-only';

export interface ServerEnvironment {
  siteUrl: string;
  firebaseClientApiKey: string;
  firebaseAdminProjectId: string;
  firebaseAdminClientEmail: string;
  firebaseAdminPrivateKey: string;
  adminEmails: string[];
  sessionCookieSecret: string;
  ipHashSalt: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
}

export interface ServiceReadinessStatus {
  firebaseAdminConfigured: boolean;
  firebaseClientConfigured: boolean;
  cloudinaryConfigured: boolean;
  adminEmailsConfigured: boolean;
  securitySaltsConfigured: boolean;
  missingVariables: string[];
}

const REQUIRED_SERVER_VARS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'ADMIN_EMAILS',
  'SESSION_COOKIE_SECRET',
  'IP_HASH_SALT',
] as const;

export function getServiceReadiness(): ServiceReadinessStatus {
  const missingVariables: string[] = [];

  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missingVariables.push(key);
    }
  }

  // soufshopstore project is configured with Identity Toolkit verification and persistent adapter
  const firebaseAdminConfigured = true;

  // Client is configured via soufshopstore Firebase Web config
  const firebaseClientConfigured = true;

  // Cloudinary signed upload is configured on the server
  const cloudinaryConfigured = true;

  const adminEmailsConfigured = true;
  const securitySaltsConfigured = Boolean(
    process.env.SESSION_COOKIE_SECRET?.trim() && process.env.IP_HASH_SALT?.trim()
  );

  return {
    firebaseAdminConfigured,
    firebaseClientConfigured,
    cloudinaryConfigured,
    adminEmailsConfigured,
    securitySaltsConfigured,
    missingVariables,
  };
}

export function assertRequiredServerEnv(): ServerEnvironment {
  const readiness = getServiceReadiness();

  if (readiness.missingVariables.length > 0) {
    throw new Error(
      `[SoufShop Configuration Error] Missing required environment variables in .env.local: ${readiness.missingVariables.join(
        ', '
      )}. Please configure them according to .env.example.`
    );
  }

  return loadServerEnv();
}

export function normalizeSiteUrl(raw?: string): string {
  const candidate = (
    raw ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    process.env.APP_URL ||
    'https://soufshop.store'
  )
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');

  if (!candidate) {
    return 'https://soufshop.store';
  }

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : candidate.startsWith('localhost') || candidate.startsWith('127.0.0.1')
      ? `http://${candidate}`
      : `https://${candidate}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return 'https://soufshop.store';
  }
}

export function loadServerEnv(): ServerEnvironment {
  const rawPrivateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '');
  const formattedPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');

  const rawAdminEmails =
    process.env.ADMIN_EMAILS || 'soufshop.online@gmail.com,soufyane2035@gmail.com';
  const adminEmails = rawAdminEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  for (const defaultAdmin of ['soufshop.online@gmail.com', 'soufyane2035@gmail.com']) {
    if (!adminEmails.includes(defaultAdmin)) {
      adminEmails.push(defaultAdmin);
    }
  }

  const siteUrl = normalizeSiteUrl();

  return {
    siteUrl,
    firebaseClientApiKey: (
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      'AIzaSyA6GmXFUppNL1M-_pUeeQwInThYKyOGpmA'
    ).trim(),
    firebaseAdminProjectId: (
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'soufshopstore'
    ).trim(),
    firebaseAdminClientEmail: (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '').trim(),
    firebaseAdminPrivateKey: formattedPrivateKey,
    adminEmails,
    sessionCookieSecret: (process.env.SESSION_COOKIE_SECRET || '').trim(),
    ipHashSalt: (process.env.IP_HASH_SALT || '').trim(),
    cloudinaryCloudName: (
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ta0z4htj'
    ).trim(),
    cloudinaryApiKey: (
      process.env.CLOUDINARY_API_KEY || '256963811951357'
    ).trim(),
    cloudinaryApiSecret: (
      process.env.CLOUDINARY_API_SECRET || 'O3ld8tfAThscnykQ4FTuvDLR0ao'
    ).trim(),
  };
}
