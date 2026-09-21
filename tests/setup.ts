import "../scripts/load-env";

// Tests run against a real PostgreSQL database (TEST_DATABASE_URL, or
// DATABASE_URL when that is unset). Using the real engine is the point: the
// guarantees under test — transactions, unique constraints, the case-number
// sequence, cascade deletes — do not exist in a mock.

const env = process.env as Record<string, string | undefined>;

env.NODE_ENV ||= "test";
if (env.TEST_DATABASE_URL) {
  env.DATABASE_URL = env.TEST_DATABASE_URL;
}
process.env.SESSION_SECRET ||= "test-session-secret-at-least-32-characters-long";
process.env.CIVORA_DEMO_MODE ||= "true";
process.env.OBJECT_STORAGE_DRIVER ||= "local";
process.env.OBJECT_STORAGE_LOCAL_DIR ||= ".data/test-evidence";
process.env.LOG_LEVEL ||= "error";
