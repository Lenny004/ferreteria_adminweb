/**
 * Settings públicos — cliente HTTP hacia `/public/settings` (términos, privacidad, datos de negocio).
 */

import { apiRequest } from "@/lib/api";

export type PublicSetting = {
  key: string;
  value: string;
  description?: string | null;
  updatedAt?: string;
};

/** Claves conocidas de configuración pública. */
export const PUBLIC_SETTING_KEYS = {
  TermsOfService: "TermsOfService",
  PrivacyPolicy: "PrivacyPolicy",
  BusinessName: "BusinessName",
  ContactEmail: "ContactEmail",
} as const;

function publicGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token: null });
}

/** Lectura de configuración pública sin autenticación. */
export const publicSettingsApi = {
  /** Lista todos los settings públicos. */
  list: () => publicGet<PublicSetting[]>("/public/settings"),
  /** Obtiene un setting por clave. */
  getByKey: (key: string) =>
    publicGet<PublicSetting>(`/public/settings/${encodeURIComponent(key)}`),
};
