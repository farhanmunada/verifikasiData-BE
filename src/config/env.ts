export const env = {
  DB_DRIVER: process.env.DB_DRIVER || 'sqlserver',
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite.db',
  DB_SERVER: process.env.DB_SERVER || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 1433,
  DB_USER: process.env.DB_USER || 'sa',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || '',
  DB_ENCRYPT: process.env.DB_ENCRYPT === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'verifikasi_identitas_secret_key_2026_super_secure!',
  JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN) || 86400,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  PORT: Number(process.env.PORT) || 3100,
};
