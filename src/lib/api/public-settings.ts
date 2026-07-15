/**
 * Settings públicos (términos, privacidad, datos de negocio).
 */

import { apiRequest } from "@/lib/api";

export type PublicSetting = {
  key: string;
  value: string;
  description?: string | null;
  updatedAt?: string;
};

export const PUBLIC_SETTING_KEYS = {
  TermsOfService: "TermsOfService",
  PrivacyPolicy: "PrivacyPolicy",
  BusinessName: "BusinessName",
  ContactEmail: "ContactEmail",
} as const;

function publicGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token: null });
}

export const publicSettingsApi = {
  list: () => publicGet<PublicSetting[]>("/public/settings"),
  getByKey: (key: string) =>
    publicGet<PublicSetting>(`/public/settings/${encodeURIComponent(key)}`),
};
