# Arquitectura AdminWeb

Panel administrativo y tienda pública de Ferreteria. Consume **solo** la API REST de `ferreteria_backend`; no hay Prisma ni acceso directo a PostgreSQL.

## Stack configurado

- Next.js 15 con App Router y grupos de rutas `(auth)`, `(admin)` y `(store)`.
- React 19 y TypeScript estricto.
- Tailwind CSS 4 mediante PostCSS (`postcss.config.mjs`; sin `tailwind.config.ts`).
- shadcn/ui-ready con `components.json` y alias `@/*`.
- Radix UI, React Hook Form, Zod, Recharts, TanStack Query y Sonner.

## Capas

```
┌─────────────────────────────────────────────────────────┐
│  src/app          Rutas y contenido por página          │
│  src/components   UI, layout admin y componentes store  │
│  src/hooks        TanStack Query (fetch + caché)        │
│  src/lib/api/*    Clientes HTTP por dominio             │
│  src/lib/api.ts   Cliente base, token, apiRequest       │
│  src/contexts     Sesión WebUser (session-context)      │
│  src/config       Navegación del sidebar                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS  NEXT_PUBLIC_API_URL
                            ▼
                 ferreteria_backend  /api/v1
```

## Grupos de rutas

| Grupo | Layout | Protección | Propósito |
|---|---|---|---|
| `(auth)` | Mínimo, centrado | Público | Login y recuperación de contraseña admin |
| `(admin)` | Sidebar + header + breadcrumbs | `AuthGuard` | ERP administrativo |
| `(store)` | Header tienda | Público (auth shop opcional) | Catálogo y cuenta de cliente |

La raíz `/` redirige a `/dashboard` si hay token admin, o a `/tienda` si no.

## Autenticación

- **Admin:** JWT en `sessionStorage` (`ferreteria_access_token`), gestionado en `src/lib/api.ts`.
- **Shop:** token separado en `sessionStorage` (`ferreteria_shop_token`), en `src/lib/api/shop-auth.ts`.
- **Sesión UI:** `SessionProvider` expone el `WebUser` tras `GET /auth/me`.
- **Roles:** `ADMIN`, `ACCOUNTANT`, `OWNER` — tipos en `src/lib/auth.ts`. Restricciones por rol en UI son parciales (p. ej. gestión de mensajes de contacto).

## Estructura de carpetas

- `src/app`: páginas App Router. Contenido pesado en archivos `*-content.tsx` junto a `page.tsx`.
- `src/components/layout`: shell del ERP — `app-sidebar`, `app-header`, `breadcrumbs`, `module-subnav`.
- `src/components/ui`: primitivos compatibles con shadcn (button, card, dialog, input, badge, pagination).
- `src/components/store`: header de tienda y render de markdown legal.
- `src/config/navigation.ts`: árbol del menú lateral (General, RRHH, Operaciones, Fiscal).
- `src/contexts/session-context.tsx`: contexto de sesión del WebUser autenticado.
- `src/hooks`: hooks de datos con TanStack Query, uno por dominio principal.
- `src/lib/api.ts`: cliente REST compartido (`api.get/post/patch/delete`, `ApiError`).
- `src/lib/api/*.ts`: funciones y tipos por módulo de negocio.
- `src/lib/auth.ts`: roles y tipos de sesión admin.
- `src/lib/utils.ts`: utilidades de formato (moneda, fechas).

## Rutas implementadas

### Panel admin `(admin)`

| Ruta | Contenido |
|---|---|
| `/dashboard` | KPIs y gráficas (Recharts) vía `dashboardApi` |
| `/reportes` | Hub de enlaces a reportes en otros módulos |
| `/mensajes-contacto` | Inbox de contacto con filtros y estados |
| `/perfil` | Datos de sesión y cambio de contraseña |
| `/empleados` | CRUD empleados, departamentos, cargos, PIN |
| `/empleados/[id]/ficha` | Vista de expediente laboral |
| `/empleados/[id]/bancos` | Cuentas bancarias del empleado |
| `/empleados/[id]/documentos` | Documentos y vencimientos |
| `/rrhh/bancos` | Catálogo de bancos |
| `/rrhh/tipos-documento` | Tipos de documento requerido |
| `/rrhh/feriados` | Feriados nacionales |
| `/planilla/periodos` | Periodos de planilla |
| `/planilla/corridas` | Corridas: generar, revisar, aprobar, pagar |
| `/planilla/corridas/[id]/export` | Export Excel, boletas PDF, Planilla Única |
| `/planilla/aguinaldo` | Corrida anual de aguinaldo |
| `/planilla/vacaciones` | Saldos y solicitudes de permiso |
| `/planilla/liquidaciones` | Finiquitos / terminaciones |
| `/inventario` | Stock, movimientos, alertas, valuación |
| `/compras/proveedores` | Maestro de proveedores |
| `/compras/ordenes` | Órdenes de compra |
| `/clientes` | Maestro de clientes fiscales |
| `/fiscal/libros-iva` | Libros IVA mensuales |
| `/fiscal/libros-iva/[year]/[month]` | Detalle y export por mes |
| `/importaciones` | Stub informativo — Excel nativo pendiente |

### Auth `(auth)`

- `/login`
- `/olvidar-contrasena`, `/restablecer-contrasena`

### Tienda `(store)`

- `/tienda` — catálogo público
- `/tienda/producto/[id]` — detalle y favoritos
- `/tienda/favoritos`, `/tienda/perfil`
- `/tienda/login`, `/tienda/registro`
- `/tienda/olvidar-contrasena`, `/tienda/restablecer-contrasena`
- `/tienda/contacto`
- `/tienda/terminos`, `/tienda/privacidad`

## Clientes API (`src/lib/api`)

| Módulo | Archivo | Hook asociado |
|---|---|---|
| Auth admin | `auth.ts` | — (login directo) |
| Empleados | `employees.ts`, `employee-detail.ts` | `use-employees.ts` |
| Catálogos RRHH | `hr-catalog.ts` | (dentro de páginas RRHH) |
| Planilla | `payroll.ts` | `use-payroll.ts` |
| Aguinaldo | `aguinaldo.ts` | `use-aguinaldo.ts` |
| Vacaciones | `vacation.ts` | `use-vacation.ts` |
| Liquidaciones | `terminations.ts` | `use-terminations.ts` |
| Inventario | `inventory.ts`, `products.ts` | `use-inventory.ts` |
| Compras | `suppliers.ts`, `purchase-orders.ts` | `use-suppliers.ts`, `use-purchase-orders.ts` |
| Clientes | `customers.ts` | (query en página) |
| Fiscal | `fiscal.ts` | `use-fiscal.ts` |
| Dashboard | `dashboard.ts` | `use-dashboard.ts` |
| Contacto | `contact.ts` | (query en página) |
| Tienda | `public-catalog.ts`, `shop-auth.ts`, `favorites.ts`, `public-settings.ts` | — |

## Patrón de datos

1. `src/lib/api/*.ts` define tipos y funciones que llaman a `api` de `src/lib/api.ts`.
2. `src/hooks/use-*.ts` envuelve esas funciones con `useQuery` / `useMutation` de TanStack Query.
3. Los componentes `*-content.tsx` consumen hooks y renderizan tablas, formularios y modales.
4. Errores de API se capturan como `ApiError` y se muestran con Sonner toast.

## Variables de entorno

Copiar `.env.example` a `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Pendientes conocidos

- **Importaciones Excel:** UI de carga `.xlsx` no implementada; el inventario admite import JSON vía API.
- **Permisos por rol:** el sidebar muestra todos los módulos; algunas acciones se restringen en componente (no hay guard por ruta según rol).
- **`src/features`:** carpeta reservada, sin uso actual — la lógica vive en `hooks` + `lib/api` + `*-content.tsx`.

## Cómo correr en local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Requiere `ferreteria_backend` activo en el puerto configurado (por defecto `3001`). App en `http://localhost:3000`.
