// Type-only shim for TypeScript tooling.
//
// Supabase Edge Functions run in Deno, where `npm:` specifiers are supported.
// Cursor/TS diagnostics may not understand those specifiers and will raise a
// "Cannot find module" error, even though the function runtime can load it.
//
// This file provides an ambient declaration so the editor/linter can proceed.
declare module "npm:@supabase/supabase-js@2" {
  export type SupabaseClient = any;
  export function createClient(...args: any[]): any;
}

export {};

