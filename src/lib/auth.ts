export const webUserRoles = ["ADMIN", "ACCOUNTANT", "OWNER"] as const;

export type WebUserRole = (typeof webUserRoles)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: WebUserRole;
};
