/**
 * Auth admin — cliente HTTP hacia `/auth` (WebUsers + JWT).
 */

import { api, setAccessToken } from "@/lib/api";
import { isWebUserRole, type SessionUser, type WebUserRole } from "@/lib/auth";

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
  accessToken: string;
  user: AuthUserDto;
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
 * Inicia sesión admin y persiste el token de acceso.
 *
 * @param loginId - Usuario o correo administrativo.
 * @param password - Contraseña recibida del formulario.
 * @returns Usuario de sesión normalizado.
 * @throws {ApiError} Si el backend rechaza las credenciales.
 * @throws {Error} Si el rol recibido no es un rol válido del panel (no se guarda el token).
 */
export async function login(loginId: string, password: string): Promise<SessionUser> {
  const result = await api.post<LoginResult>("/auth/login", {
    login: loginId,
    password,
  });
  // Fail-closed: validar el rol antes de persistir el token para no dejar sesiones con roles desconocidos.
  const sessionUser = toSessionUser(result.user);
  setAccessToken(result.accessToken);
  return sessionUser;
}

/**
 * Obtiene el usuario de sesión actual (`/auth/me`).
 *
 * @returns Usuario normalizado.
 * @throws {ApiError} Si la sesión no es válida.
 * @throws {Error} Si el rol no es válido; en ese caso se limpia el token local.
 */
export async function getMe(): Promise<SessionUser> {
  const user = await api.get<AuthUserDto>("/auth/me");
  try {
    return toSessionUser(user);
  } catch (error) {
    // Rol no reconocido: se cierra la sesión local (fail-closed).
    setAccessToken(null);
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

/** Borra el token local del panel administrativo. @returns Promesa completada. */
export async function logout(): Promise<void> {
  setAccessToken(null);
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
