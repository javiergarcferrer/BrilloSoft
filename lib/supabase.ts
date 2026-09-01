"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-config";

/**
 * Cliente de Supabase para el navegador — SOLO lo usa la vertical
 * `/democracia` (la excepción documentada en CLAUDE.md). Maneja la sesión OTP
 * en localStorage; las operaciones de datos van al schema `democracia`, cuya
 * seguridad vive en la base (RLS + funciones SECURITY DEFINER), nunca aquí.
 */

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // El pool de Auth se comparte con otra app del mismo proyecto:
        // una clave de storage propia evita pisar su sesión en localStorage.
        storageKey: "gobiername-democracia-auth",
      },
    });
  }
  return cliente;
}

/** Acceso al schema de la iniciativa (tablas y RPC viven en `democracia`). */
export function db() {
  return supabase().schema("democracia");
}
