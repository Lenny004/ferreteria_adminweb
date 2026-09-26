# ferreteria_adminweb

> **Nombre:** Ferretería Admin Web — Panel administrativo  
> **Descripción:** Interfaz web (Next.js) para gerencia, contabilidad y RRHH: empleados, planilla, inventario, compras, libros de IVA, reportes y dashboard BI. Consume únicamente la API de `ferreteria_backend`.

Panel web administrativo de **Ferreteria**. Interfaz para gerencia, contabilidad y RRHH: empleados, planilla, inventario, compras, libros de IVA, reportes y dashboard BI.

> **Documento maestro:** [`../erp_ferreteria/docs/FERRETERIA_PLAN_FINALIZACION_APP.md`](../erp_ferreteria/docs/FERRETERIA_PLAN_FINALIZACION_APP.md) (v3.0)  
> **API consumida:** [`../ferreteria_backend/README.md`](../ferreteria_backend/README.md)  
> **Caja WPF (referencia operativa):** [`../erp_ferreteria/README.md`](../erp_ferreteria/README.md)

---

## Índice

- [Rol en el ecosistema](#rol-en-el-ecosistema)
- [Stack tecnológico](#stack-tecnológico)
- [Estado actual del repositorio](#estado-actual-del-repositorio)
- [Módulos y rutas](#módulos-y-rutas)
- [Tienda pública](#tienda-pública)
- [Autenticación y roles](#autenticación-y-roles)
- [Comunicación con el backend](#comunicación-con-el-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Principios de UI/UX administrativa](#principios-de-uiux-administrativa)
- [Roadmap por fases](#roadmap-por-fases)

---

## Rol en el ecosistema

```
┌──────────────────────────────────────────────────────────────┐
│                    ferreteria_adminweb                        │
│  Next.js 15 · React 19 · Tailwind CSS 4 · shadcn/Radix       │
├──────────────────────────────────────────────────────────────┤
│  Dashboard BI │ Empleados │ Planilla │ Inventario │ Compras  │
│  Clientes     │ Reportes  │ Libros IVA │ Tienda pública      │
└────────────────────────────┬─────────────────────────────────┘
                             │  HTTPS — solo REST
                             │  NEXT_PUBLIC_API_URL
                             ▼
                  ┌──────────────────────┐
                  │  ferreteria_backend  │
                  │  Express + Prisma    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  PostgreSQL/Supabase │
                  └──────────────────────┘
```

| Lo que **sí** hace adminweb | Lo que **no** hace adminweb |
|---|---|
| Login administrativo (email/password + JWT) | Operar caja ni emitir DTE |
| CRUD empleados y asignación de PIN | Validar PIN de caja (eso es WPF) |
| Planilla, aguinaldo, vacaciones, liquidaciones | Conectar directo a PostgreSQL |
| Inventario admin, compras, proveedores | Duplicar lógica de negocio (vive en API) |
| Reportes, export Excel/PDF, dashboard BI | Gestionar certificados DTE |
| Tienda pública (catálogo, favoritos, contacto) | — |

**Regla crítica:** el frontend **no usa Prisma**. Toda persistencia y validación de negocio pasa por `ferreteria_backend` vía HTTP.

---

## Stack tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 15 | Framework React (App Router) |
| React | 19 | UI |
| TypeScript | 5.x | Lenguaje |
| Tailwind CSS | 4 | Estilos (PostCSS, sin `tailwind.config`) |
| shadcn/ui + Radix UI | — | Componentes accesibles |
| React Hook Form + Zod | — | Formularios y validación cliente |
| TanStack Query | 5 | Caché y estado de datos remotos |
| Recharts | 3 | Gráficas del dashboard BI |
| Sonner | — | Notificaciones toast |

---

## Estado actual del repositorio

| Componente | Estado |
|---|---|
| Repositorio Git | ✅ Activo |
| Scaffold Next.js (`src/app`, layout, componentes UI) | ✅ Implementado |
| Login, `AuthGuard`, layout administrativo y sesión | ✅ Implementado |
| Dashboard BI con KPIs y gráficas | ✅ Implementado |
| RRHH: empleados, catálogos, expediente | ✅ Implementado |
| Planilla: periodos, corridas, aguinaldo, vacaciones, liquidaciones | ✅ Implementado |
| Operaciones: inventario, compras, clientes | ✅ Implementado |
| Fiscal: libros de IVA | ✅ Implementado |
| Tienda pública `(store)` | ✅ Implementado |
| Importaciones Excel nativo | 🔲 Parcial — página informativa; flujo JSON vía inventario |
| Ocultar rutas por rol en todo el sidebar | 🔲 Parcial — solo restricciones puntuales (ej. mensajes) |

El proyecto **consume la API REST** de `ferreteria_backend`. Requiere el backend corriendo y credenciales válidas de `WebUser` para el panel admin.

---

## Módulos y rutas

Leyenda: ✅ pantalla funcional conectada a API · 🔲 stub o acceso indirecto

### General

| Ruta | Descripción | Estado |
|---|---|---|
| `/login` | Autenticación administrativa | ✅ |
| `/olvidar-contrasena`, `/restablecer-contrasena` | Recuperación WebUser admin | ✅ |
| `/dashboard` | KPIs: ventas, inventario, compras, RRHH | ✅ |
| `/reportes` | Hub de accesos a reportes en otros módulos | ✅ |
| `/perfil` | Perfil y cambio de contraseña del WebUser | ✅ |
| `/mensajes-contacto` | Inbox de formulario Contáctanos | ✅ |

### Recursos humanos

| Ruta | Descripción | API backend |
|---|---|---|
| `/empleados` | Listado, alta y edición de empleados | `employees/` |
| `/empleados/[id]/ficha` | Expediente laboral del empleado | `employees/:id` |
| `/empleados/[id]/bancos` | Cuentas bancarias del empleado | `employee-bank-accounts/` |
| `/empleados/[id]/documentos` | Expediente documental y vencimientos | `employee-documents/` |
| `/rrhh/bancos` | Catálogo editable de bancos SV | `banks/` |
| `/rrhh/tipos-documento` | Tipos de documento requerido | `required-document-types/` |
| `/rrhh/feriados` | Calendario de feriados nacionales | `holidays/` |

### Planilla

| Ruta | Descripción | Estado |
|---|---|---|
| `/planilla/periodos` | CRUD periodos; cierre de periodo | ✅ |
| `/planilla/corridas` | Generar, revisar, aprobar y marcar pagada | ✅ |
| `/planilla/corridas/[id]/export` | Descarga Excel + PDF + Planilla Única | ✅ |
| `/planilla/aguinaldo` | Corrida anual de aguinaldo | ✅ |
| `/planilla/vacaciones` | Saldos y solicitudes de permiso | ✅ |
| `/planilla/liquidaciones` | Finiquitos al terminar relación laboral | ✅ |

**Modelo de planilla:** Periodo + Corrida (referencia Beraka). Frecuencia principal **quincenal**; también mensual y semanal. Honorarios con retención ISR 10%.

### Operaciones e inventario

| Ruta | Descripción | Estado |
|---|---|---|
| `/inventario` | Stock, movimientos, alertas, valuación | ✅ |
| `/compras/proveedores` | Maestro de proveedores (NIT/NRC, crédito) | ✅ |
| `/compras/ordenes` | Órdenes de compra: borrador → confirmada → recibida | ✅ |
| `/clientes` | Maestro fiscal: CF/CCF, DUI/NIT/NRC para DTE | ✅ |
| `/importaciones` | Redirige al flujo JSON de inventario | 🔲 Excel nativo pendiente |

### Fiscal

| Ruta | Descripción | Estado |
|---|---|---|
| `/fiscal/libros-iva` | Generación y cierre de libros mensuales | ✅ |
| `/fiscal/libros-iva/[year]/[month]` | Cuadre, vista previa y descarga Excel | ✅ |

---

## Tienda pública

Grupo de rutas `(store)` **sin** `AuthGuard` admin. Token de cliente en `sessionStorage` (`ferreteria_shop_token`), separado del JWT admin (`ferreteria_access_token`).

| Ruta | Descripción | API |
|---|---|---|
| `/tienda` | Catálogo con búsqueda, filtros y orden | `GET /public/catalog/products` (+ families/subfamilies) |
| `/tienda/producto/[id]` | Detalle + favorito | `GET /public/catalog/products/:id`, `POST/DELETE /shop/favorites` |
| `/tienda/favoritos` | Lista de favoritos (requiere login shop) | `GET /shop/favorites` |
| `/tienda/perfil` | Editar perfil y cambiar contraseña | `GET/PATCH /shop/auth/me`, `POST /shop/auth/change-password` |
| `/tienda/login`, `/tienda/registro` | Auth cliente | `POST /shop/auth/login\|register` |
| `/tienda/olvidar-contrasena`, `/tienda/restablecer-contrasena` | Recuperación shop | `POST /shop/auth/forgot-password\|reset-password` |
| `/tienda/contacto` | Formulario Contáctanos | `POST /contact-messages` |
| `/tienda/terminos`, `/tienda/privacidad` | Markdown desde settings públicos | `GET /public/settings/:key` |

| Ruta | Descripción |
|---|---|
| `/` | Con token admin → `/dashboard`; sin token → `/tienda` |

Clientes HTTP: `src/lib/api/public-catalog.ts`, `shop-auth.ts`, `favorites.ts`, `contact.ts`, `public-settings.ts`.

---

## Autenticación y roles

| Aspecto | Detalle |
|---|---|
| Tabla | `system.WebUsers` (solo backend — no existe en WPF) |
| Login | `POST /api/v1/auth/login` → JWT |
| Almacenamiento token | `sessionStorage` (`ferreteria_access_token`) + memoria en `src/lib/api.ts` |
| Roles | `ADMIN`, `ACCOUNTANT`, `OWNER` |
| Protección rutas admin | `AuthGuard` en layout `(admin)` — valida token y `GET /auth/me` |

### Matriz de permisos (objetivo / parcial en UI)

| Módulo | ADMIN | ACCOUNTANT | OWNER |
|---|---|---|---|
| Empleados y PINs | ✅ CRUD | Lectura | Lectura |
| Planilla (aprobar/pagar) | ✅ | ✅ | Lectura |
| Inventario y ajustes | ✅ | ✅ | Lectura |
| Compras y proveedores | ✅ | ✅ | Lectura |
| Libros de IVA | ✅ | ✅ | Lectura |
| Dashboard BI | ✅ | ✅ | ✅ |
| Mensajes contacto (gestión) | ✅ | ❌ | ✅ |
| Usuarios web | ✅ | ❌ | ❌ |

> La UI aplica restricciones por rol de forma **puntual** (p. ej. mensajes de contacto). El backend sigue siendo la fuente de verdad para autorización.

### Separación WPF vs adminweb

| Sistema | Autenticación | Tabla |
|---|---|---|
| Caja WPF | PIN 4 dígitos del empleado | `hr.Employees.PinHash` |
| Adminweb | Email + password | `system.WebUsers` |

El administrador crea empleados y asigna PIN desde adminweb. La caja **solo valida** ese PIN; no hay pantalla de alta de empleados en WPF.

---

## Comunicación con el backend

### Cliente HTTP

Archivo principal: `src/lib/api.ts`. Clientes por dominio en `src/lib/api/*.ts`.

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
```

### Variables de entorno

```env
# .env.local  (copiar desde .env.example)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Convenciones

- Prefijo API: `/api/v1/`
- Autenticación: header `Authorization: Bearer <token>`
- Respuestas canónicas: `{ success: true, data: T }`
- Estado remoto: TanStack Query en `src/hooks/`
- Errores: mostrar `message` del API; no loguear tokens ni PINs
- Paginación y filtros: query params estándar por módulo

### Clientes API implementados

| Archivo | Dominio |
|---|---|
| `auth.ts` | Login, sesión, recuperación contraseña admin |
| `employees.ts`, `employee-detail.ts`, `hr-catalog.ts` | RRHH y catálogos |
| `payroll.ts`, `aguinaldo.ts`, `vacation.ts`, `terminations.ts` | Planilla |
| `inventory.ts`, `products.ts` | Inventario |
| `suppliers.ts`, `purchase-orders.ts` | Compras |
| `customers.ts` | Clientes |
| `fiscal.ts` | Libros IVA |
| `dashboard.ts` | KPIs del dashboard |
| `contact.ts` | Mensajes de contacto |
| `public-catalog.ts`, `shop-auth.ts`, `favorites.ts`, `public-settings.ts` | Tienda pública |

### Importación masiva

1. **Inventario (JSON):** el módulo `/inventario` y el endpoint `POST /inventory/import` aceptan líneas por código de producto.
2. **Excel nativo:** la ruta `/importaciones` es informativa; carga de archivos `.xlsx` pendiente.

---

## Estructura del proyecto

```
ferreteria_adminweb/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs           # Tailwind CSS 4
├── components.json              # shadcn/ui
├── .env.example
└── src/
    ├── app/
    │   ├── page.tsx             # Redirige a /dashboard o /tienda
    │   ├── (auth)/              # Login y recuperación admin
    │   ├── (admin)/             # Panel ERP (AuthGuard + sidebar)
    │   │   ├── dashboard/
    │   │   ├── empleados/[id]/{ficha,bancos,documentos}/
    │   │   ├── rrhh/{bancos,tipos-documento,feriados}/
    │   │   ├── planilla/{periodos,corridas,aguinaldo,vacaciones,liquidaciones}/
    │   │   ├── inventario/
    │   │   ├── compras/{proveedores,ordenes}/
    │   │   ├── clientes/
    │   │   ├── fiscal/libros-iva/
    │   │   ├── importaciones/
    │   │   ├── reportes/
    │   │   ├── mensajes-contacto/
    │   │   └── perfil/
    │   └── (store)/tienda/      # Tienda pública
    ├── components/
    │   ├── ui/                  # Primitivos shadcn/Radix
    │   ├── layout/              # Sidebar, header, breadcrumbs, subnav
    │   └── store/               # Header y markdown de tienda
    ├── config/
    │   └── navigation.ts        # Menú lateral del admin
    ├── contexts/
    │   └── session-context.tsx  # WebUser en sesión
    ├── hooks/                   # TanStack Query por dominio
    └── lib/
        ├── api.ts               # Cliente REST base
        ├── auth.ts              # Tipos y roles WebUser
        ├── api/*.ts             # Clientes por módulo
        └── utils.ts             # Formato moneda, fechas, etc.
```

---

## Instalación

### Requisitos

| Requisito | Versión |
|---|---|
| Node.js | 22+ |
| npm | 10+ |
| ferreteria_backend | Corriendo en puerto 3001 (o el configurado) |

### Pasos

```bash
cd ferreteria_adminweb
cp .env.example .env.local
npm install
npm run dev
```

Abrir `http://localhost:3000`. El backend y PostgreSQL deben estar activos antes de iniciar sesión.

Scripts útiles: `npm run build`, `npm run lint`, `npm run typecheck`.

---

## Principios de UI/UX administrativa

A diferencia de la caja WPF ("App Simple" para personal mayor), el panel admin sigue convenciones web modernas pero mantiene claridad operativa:

| Principio | Implementación |
|---|---|
| Navegación clara | Sidebar por módulo con iconos y etiquetas en español |
| Formularios validados | Validación en cliente + mensajes de error por campo |
| Acciones destructivas | Modal de confirmación |
| Tablas de datos | Paginación, búsqueda y filtros por columna |
| Estados de carga | Skeletons y spinners en llamadas API |
| Accesibilidad | Componentes Radix con roles ARIA |
| Exportaciones | Botones explícitos Excel/PDF con nombre de archivo descriptivo |
| Roles | Ocultar acciones no autorizadas; validar también en backend |

### Paleta (coherente con marca Ferreteria)

Reutilizar colores corporativos del README principal:

- Rojo `#D22533` — acciones primarias y alertas críticas
- Negro `#080808` — textos y headers
- Verde `#4CAF50` — éxito y estados aprobados
- Naranja `#FF9800` — pendientes y advertencias

---

## Roadmap por fases

| Fase | Entregable adminweb | Estado |
|---|---|---|
| **8** | Scaffold Next.js, login, layout, CRUD empleados y clientes | ✅ Hecho |
| **9** | Pantallas inventario admin, movimientos, alertas | ✅ Hecho |
| **9b** | Proveedores, órdenes de compra, Kardex valorado | ✅ Hecho |
| **10** | Planilla: periodos, corridas, export Excel/PDF, ficha empleado | ✅ Hecho |
| **10b** | Aguinaldo y vacaciones | ✅ Hecho |
| **10c** | Liquidaciones | ✅ Hecho |
| **10d** | Libros de IVA — generación y descarga | ✅ Hecho |
| **11** | Dashboard BI con tarjetas, gráficas y export por sección | ✅ Hecho |
| **—** | Tienda pública `(store)` | ✅ Hecho |
| **—** | Importaciones Excel nativo (catálogo, entradas, empleados) | 🔲 Pendiente |
| **—** | Matriz de permisos por rol en toda la UI | 🔲 Parcial |

### Dependencias entre fases

```
Fase 8 (base + auth) ✅
    ├── Fase 9 (inventario UI) ✅
    │       └── Fase 9b (compras UI) ✅
    ├── Fase 10 (planilla UI) ✅
    │       ├── 10b (aguinaldo/vacaciones) ✅
    │       └── 10c (liquidaciones) ✅
    ├── Fase 10d (libros IVA) ✅
    └── Fase 11 (dashboard) ✅
```

---

## Licencia

Copyright (c) 2026 Ferreteria — Todos los derechos reservados.
