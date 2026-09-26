---
name: documentacion-codigo
description: Estándar de documentación de código con JSDoc/TSDoc para funciones, hooks, componentes, tipos e interfaces. Aplicar al escribir o modificar cualquier código TypeScript/JavaScript del proyecto.
---

# Skill: Documentación de Código del Proyecto

## Contexto del proyecto

- **Frontend:** Next.js 15, React 19, TypeScript.
- **Estado actual:** El proyecto requiere documentación consistente en todo el código siguiendo los estándares oficiales.

## Objetivo

Agregar y mantener documentación clara y consistente en todos los archivos del proyecto (TypeScript, JavaScript, TSX) siguiendo el estándar **oficial** de JSDoc/TSDoc, sin alterar la lógica, firmas de función ni comportamiento existente.

---

## Reglas generales (aplican a todo el proyecto)

1. **No modificar lógica de negocio**, nombres de variables, firmas de métodos ni imports.
2. Si un bloque ya tiene documentación correcta, verificarla y solo actualizar lo que esté desactualizado o incompleto — **no borrar lo válido**.
3. **No agregar comentarios redundantes** ("// suma dos números" sobre una función `sumar()`). Solo documentar lo que no es evidente por el nombre o la firma.
4. **Idioma de los comentarios:** español.
5. Mantener el mismo estilo de documentación en todos los archivos de un mismo tipo (consistencia de formato, orden de etiquetas, puntuación).
6. Al terminar cada archivo, indicar en una línea qué se documentó (no reescribir el archivo completo en la respuesta si no es necesario).

---

## Estándar JS/TS/TSX — JSDoc oficial (jsdoc.app) + convenciones TSDoc

### Encabezado de archivo

**Opcional**, solo si el archivo agrupa lógica no evidente por su nombre.

- Breve descripción de su propósito.

**Ejemplo:**

```typescript
/**
 * Utilidades para manipulación de fechas y formateo según la configuración regional del usuario.
 */
```

---

### Funciones y hooks

Bloque JSDoc con descripción, `@param`, `@returns`, y `@throws` si corresponde.

En TypeScript, **no repetir el tipo si ya está en la firma** (JSDoc puede omitir el tipo entre llaves cuando TS ya lo infiere); enfocarse en describir el **propósito** de cada parámetro.

**Ejemplo de función:**

```typescript
/**
 * Calcula el precio total de un pedido aplicando descuentos y impuestos.
 * 
 * @param items - Lista de productos en el pedido
 * @param discountCode - Código de descuento opcional para aplicar
 * @returns Precio total calculado en la moneda del usuario
 * @throws {ValidationError} Si algún item tiene precio negativo
 */
export function calculateOrderTotal(
  items: OrderItem[],
  discountCode?: string
): number {
  // ...
}
```

**Ejemplo de hook personalizado:**

```typescript
/**
 * Hook para gestionar el estado de autenticación del usuario actual.
 * Obtiene el token de sesión y valida su expiración.
 * 
 * @returns Estado de autenticación y funciones de login/logout
 */
export function useAuth() {
  // ...
}
```

---

### Componentes React (`.tsx`)

Bloque JSDoc arriba del componente describiendo su propósito y responsabilidad visual/funcional.

Documentar **props relevantes** (las que no sean obvias por su nombre), no repetir la interfaz de tipos completa.

**Ejemplo:**

```typescript
/**
 * Tarjeta de producto que muestra imagen, nombre, precio y botón de compra.
 * Soporta modo compacto para vistas de lista densa.
 * 
 * @param product - Datos del producto a mostrar
 * @param compact - Si es true, usa diseño reducido sin descripción
 * @param onAddToCart - Callback ejecutado al agregar al carrito
 */
export function ProductCard({ product, compact = false, onAddToCart }: ProductCardProps) {
  // ...
}
```

---

### Tipos e interfaces

Comentario breve arriba de cada `interface`/`type` no trivial explicando en qué contexto se usa.

**Ejemplo:**

```typescript
/**
 * Representa un usuario autenticado en el sistema con sus permisos.
 */
export interface User {
  id: string;
  email: string;
  roles: Role[];
  createdAt: Date;
}

/**
 * Configuración de paginación para consultas de lista.
 */
export type PaginationConfig = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
```

---

### Server Actions (Next.js 15)

Documentar igual que funciones, pero indicar si muta estado o requiere autenticación.

**Ejemplo:**

```typescript
/**
 * Crea un nuevo pedido para el usuario autenticado.
 * Valida stock disponible y reserva productos.
 * 
 * @param items - Lista de productos y cantidades
 * @returns ID del pedido creado
 * @throws {UnauthorizedError} Si el usuario no está autenticado
 * @throws {StockError} Si algún producto no tiene stock suficiente
 */
export async function createOrder(items: OrderItem[]): Promise<string> {
  'use server';
  // ...
}
```

---

### Server Components vs Client Components

Indicar en el JSDoc si un componente tiene lógica específica de servidor o cliente que no sea obvia.

**Server Component con lógica de datos:**

```typescript
/**
 * Página de listado de productos.
 * Obtiene productos directamente desde la base de datos (Server Component).
 * 
 * @param searchParams - Parámetros de búsqueda y filtrado de la URL
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // ...
}
```

**Client Component con estado:**

```typescript
'use client';

/**
 * Formulario interactivo de búsqueda de productos con autocompletado.
 * Gestiona estado local y debounce de consultas (Client Component).
 * 
 * @param onSearch - Callback ejecutado al enviar búsqueda
 */
export function SearchForm({ onSearch }: SearchFormProps) {
  // ...
}
```

---

## Comentarios inline (dentro del cuerpo del código, no JSDoc)

- Solo donde el código no se explica por sí mismo (reglas de negocio no obvias, decisiones no evidentes, workarounds).
- Máximo una línea por bloque de control (`if`, `for`, `while`, `switch`, `try/catch`).
- Explicar el **por qué**, no el **qué** (el código ya dice qué hace).
- Variables: comentar solo si el nombre no es descriptivo, o si el valor tiene un formato/unidad no evidente (ej. montos en centavos, timestamps en UTC, códigos de estado numéricos).
- No comentar líneas triviales (`i++`, `count += 1`, etc.).

**Ejemplo de comentarios inline apropiados:**

```typescript
export function processPayment(amount: number, currency: string) {
  // Convertir a centavos para evitar errores de redondeo en cálculos monetarios
  const amountInCents = Math.round(amount * 100);
  
  // Stripe requiere que el monto sea >= 50 centavos (mínimo transaccional)
  if (amountInCents < 50) {
    throw new ValidationError('Monto mínimo no alcanzado');
  }
  
  // Reintentar hasta 3 veces en caso de error de red temporal
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await stripe.charges.create({
        amount: amountInCents,
        currency,
      });
    } catch (error) {
      if (attempt === 3) throw error;
      // Esperar exponencialmente entre reintentos
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
}
```

**Ejemplos de comentarios redundantes a evitar:**

```typescript
// ❌ MAL: comentario redundante
// Incrementar el contador
count++;

// ❌ MAL: comentario redundante
// Obtener el usuario por ID
const user = await getUserById(id);

// ❌ MAL: comentario que repite la firma
/**
 * Suma dos números.
 * @param a - primer número
 * @param b - segundo número
 * @returns la suma
 */
function sum(a: number, b: number): number {
  return a + b;
}
```

---

## Casos especiales

### Middleware de Next.js

```typescript
/**
 * Middleware de autenticación global.
 * Redirige a /login si el usuario no está autenticado en rutas protegidas.
 * 
 * @param request - Request entrante de Next.js
 */
export function middleware(request: NextRequest) {
  // ...
}
```

### Archivos de configuración (next.config.js, etc.)

```typescript
/**
 * Configuración de Next.js con soporte para imágenes externas
 * y variables de entorno validadas.
 */
const nextConfig = {
  // ...
};
```

### Contextos de React

```typescript
/**
 * Contexto global de tema (claro/oscuro).
 * Persiste la preferencia del usuario en localStorage.
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook para acceder al contexto de tema.
 * Debe usarse dentro de un ThemeProvider.
 * 
 * @throws {Error} Si se usa fuera de ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}
```

---

## Formato de entrega esperado por archivo

Cuando documentes código existente:

1. **Ruta del archivo.**
2. **Resumen de una línea** de qué se agregó o corrigió.
3. **Diff o código final** con la documentación aplicada (solo los bloques modificados, salvo que se pida el archivo completo).

**Ejemplo:**

```
src/lib/utils/formatters.ts
- Agregado JSDoc a funciones formatDate, formatCurrency y formatNumber.

src/components/ProductCard.tsx
- Agregado JSDoc al componente ProductCard describiendo props y comportamiento.
- Agregado comentario inline explicando por qué usamos memo para optimización.
```

---

## Verificación de calidad

Antes de considerar completa la documentación de un archivo:

1. ✅ Toda función/hook exportado tiene JSDoc con descripción y parámetros.
2. ✅ Todo componente React tiene JSDoc describiendo su propósito.
3. ✅ Tipos e interfaces no triviales tienen comentario explicativo.
4. ✅ No hay comentarios redundantes que repitan lo obvio.
5. ✅ Comentarios inline explican el **por qué**, no el **qué**.
6. ✅ Idioma: español en todos los comentarios.
7. ✅ Formato consistente con el resto del proyecto.

---

## Prioridades de documentación

Cuando documentes código existente, prioriza en este orden:

1. **Funciones y hooks públicos** (exportados) sin documentación.
2. **Componentes React** sin documentación.
3. **Tipos e interfaces** complejos sin comentario.
4. **Server Actions** y funciones de API.
5. **Funciones internas** con lógica no evidente.
6. **Comentarios inline** en secciones de código complejo.

---

## Ejemplo completo de archivo bien documentado

```typescript
/**
 * Utilidades para gestión de sesiones de usuario con JWT.
 */

import { SignJWT, jwtVerify } from 'jose';

/**
 * Datos codificados en el token de sesión.
 */
export interface SessionPayload {
  userId: string;
  email: string;
  roles: string[];
  expiresAt: number;
}

/**
 * Crea un token JWT de sesión para el usuario autenticado.
 * El token expira en 7 días por defecto.
 * 
 * @param payload - Datos del usuario a incluir en el token
 * @param expiresInDays - Días hasta la expiración (default: 7)
 * @returns Token JWT firmado
 * @throws {Error} Si la clave secreta no está configurada
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'expiresAt'>,
  expiresInDays = 7
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado');
  }

  // Calcular timestamp de expiración en segundos (JWT usa segundos, no ms)
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;

  return await new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret));
}

/**
 * Verifica y decodifica un token de sesión.
 * 
 * @param token - Token JWT a verificar
 * @returns Payload del token si es válido
 * @throws {Error} Si el token es inválido o ha expirado
 */
export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado');
  }

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload as SessionPayload;
}
```

---

## Resumen

- **JSDoc en español** para todas las funciones, hooks, componentes, tipos e interfaces públicos.
- **No redundancia**: documentar solo lo no evidente.
- **Consistencia**: mismo formato en todo el proyecto.
- **Contexto útil**: explicar el por qué, no el qué.
- **TypeScript-first**: aprovechar los tipos, no repetirlos en JSDoc.
