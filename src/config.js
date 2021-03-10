module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL:
    // process.env.DATABASE_URL + "?ssl=true" ||
    process.env.DATABASE_URL || "postgresql://dunder_mifflin@localhost/pupdate",
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    "postgresql://dunder_mifflin@localhost/pupdate-test",
  API_BASE_URL:
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  JWT_EXPIRY: process.env.JWT_EXPIRY || "7200s",
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_KEY_ID: process.env.S3_KEY_ID,
  S3_REGION: process.env.S3_REGION,
};
