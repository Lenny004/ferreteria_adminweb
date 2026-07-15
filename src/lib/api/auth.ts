/**
 * Auth admin contra ferreteria_backend (`WebUsers` + JWT).
 */

import { api, setAccessToken } from "@/lib/api";
import { isWebUserRole, type SessionUser, type WebUserRole } from "@/lib/auth";

export type AuthUserDto = {
  id: string;
  username: string;
  email: string;
  role: string;
  employeeId?: string | null;
  lastLoginAt?: string | null;
};

export type LoginResult = {
  accessToken: string;
  user: AuthUserDto;
};

function toSessionUser(user: AuthUserDto): SessionUser {
  const role: WebUserRole = isWebUserRole(user.role) ? user.role : "ADMIN";
  return {
    id: user.id,
    email: user.email,
    name: user.username,
    role,
  };
}

export async function login(loginId: string, password: string): Promise<SessionUser> {
  const result = await api.post<LoginResult>("/auth/login", {
    login: loginId,
    password,
  });
  setAccessToken(result.accessToken);
  return toSessionUser(result.user);
}

export async function getMe(): Promise<SessionUser> {
  const user = await api.get<AuthUserDto>("/auth/me");
  return toSessionUser(user);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/auth/change-password", { currentPassword, newPassword });
}

export async function logout(): Promise<void> {
  setAccessToken(null);
}
