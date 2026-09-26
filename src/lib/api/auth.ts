/**
 * Auth admin — cliente HTTP hacia `/auth` con cookies httpOnly y CSRF en memoria.
 */

import { api, setCsrfToken } from "@/lib/api";
import { isWebUserRole, type SessionUser, type WebUserRole } from "@/lib/auth";
import { clearCsrfToken, clearSessionState, setSessionUser } from "@/lib/session-state";

/** DTO devuelto por los endpoints de autenticación administrativa. */
export type AuthUserDto = {
  id: string;
  username: string;
  email: string;
  role: string;
  employeeId?: string | null;
  lastLoginAt?: string | null;
};

/** Resultado de login administrativo. */
export type LoginResult = {
  accessToken?: string;
  user: AuthUserDto;
  csrfToken?: string;
};

function toSessionUser(user: AuthUserDto): SessionUser {
  if (!isWebUserRole(user.role)) {
    throw new Error("El rol recibido no está autorizado para el panel administrativo.");
  }
  const role: WebUserRole = user.role;
  return {
    id: user.id,
    email: user.email,
    name: user.username,
    role,
  };
}

/**
 * Inicia sesión admin y conserva solo usuario y CSRF en memoria; el JWT llega en cookie httpOnly.
 *
 * @param loginId - Usuario o correo administrativo.
 * @param password - Contraseña recibida del formulario.
 * @returns Usuario de sesión normalizado.
 * @throws {ApiError} Si el backend rechaza las credenciales.
 * @throws {Error} Si el rol recibido no es un rol válido del panel.
 */
export async function login(loginId: string, password: string): Promise<SessionUser> {
  const result = await api.post<LoginResult>("/auth/login", {
    login: loginId,
    password,
  });
  const sessionUser = toSessionUser(result.user);
  setCsrfToken(result.csrfToken ?? null);
  setSessionUser(sessionUser);
  return sessionUser;
}

/**
 * Obtiene el usuario de sesión actual (`/auth/me`).
 *
 * @returns Usuario normalizado.
 * @throws {ApiError} Si la sesión no es válida.
 * @throws {Error} Si el rol no es válido; en ese caso se limpia el estado local.
 */
export async function getMe(): Promise<SessionUser> {
  const user = await api.get<AuthUserDto>("/auth/me");
  try {
    const sessionUser = toSessionUser(user);
    setSessionUser(sessionUser);
    return sessionUser;
  } catch (error) {
    // Un rol desconocido no debe alcanzar componentes que asumen permisos válidos.
    clearSessionState();
    clearCsrfToken();
    throw error;
  }
}

/**
 * Cambia la contraseña del usuario autenticado.
 *
 * @param currentPassword - Contraseña vigente.
 * @param newPassword - Nueva contraseña.
 * @returns Promesa completada cuando la API confirma el cambio.
 * @throws {ApiError} Si la API rechaza la operación.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/auth/change-password", { currentPassword, newPassword });
}

/**
 * Invalida la cookie admin y limpia siempre el estado local, incluso ante fallo de red o 401.
 * @returns Promesa completada después de intentar el logout.
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearSessionState();
    clearCsrfToken();
  }
}

/**
 * Solicita restablecimiento de contraseña.
 * @param email - Correo del WebUser.
 * @returns Mensaje y token de demostración si el backend lo entrega.
 * @throws {ApiError} Si la API rechaza la solicitud.
 */
export async function forgotPassword(email: string): Promise<{ message?: string; resetToken?: string }> {
  return api.post("/auth/forgot-password", { email });
}

/**
 * Restablece contraseña con token recibido por correo o demo.
 * @param token - Token de recuperación.
 * @param newPassword - Nueva contraseña.
 * @returns Promesa completada cuando la API confirma el cambio.
 * @throws {ApiError} Si la API rechaza el token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}
