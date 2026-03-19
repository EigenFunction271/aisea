// Re-export from the canonical shared CORS module so this function uses the same
// origin-aware implementation. Previously this file contained a duplicate wildcard
// definition; having two files made it easy for them to drift out of sync.
export { getCorsHeaders } from "../../_shared/cors.ts";
