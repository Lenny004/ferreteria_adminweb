# FlexoCable-adminweb

Panel web administrativo de **FlexoCable SV**. Interfaz para gerencia, contabilidad y RRHH: empleados, planilla, inventario, compras, libros de IVA, reportes y dashboard BI.

> **Documento maestro:** [`../FlexoCable/docs/FLEXOCABLE_PLAN_FINALIZACION_APP.md`](../FlexoCable/docs/FLEXOCABLE_PLAN_FINALIZACION_APP.md) (v3.0)  
> **API consumida:** [`../FlexoCable-backend/README.md`](../FlexoCable-backend/README.md)  
> **Caja WPF (referencia operativa):** [`../FlexoCable/README.md`](../FlexoCable/README.md)

---

## Índice

- [Rol en el ecosistema](#rol-en-el-ecosistema)
- [Stack tecnológico](#stack-tecnológico)
- [Estado actual del repositorio](#estado-actual-del-repositorio)
- [Módulos y rutas planificadas](#módulos-y-rutas-planificadas)
- [Autenticación y roles](#autenticación-y-roles)
- [Comunicación con el backend](#comunicación-con-el-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación (cuando exista el scaffold)](#instalación-cuando-exista-el-scaffold)
- [Principios de UI/UX administrativa](#principios-de-uiux-administrativa)
- [Roadmap por fases](#roadmap-por-fases)

---

## Rol en el ecosistema

```
┌──────────────────────────────────────────────────────────────┐
│                    FlexoCable-adminweb                        │
│  Next.js 15 · React 19 · Tailwind CSS 4 · shadcn/Radix       │
├──────────────────────────────────────────────────────────────┤
│  Dashboard BI │ Empleados │ Planilla │ Inventario │ Compras  │
│  Clientes     │ Reportes  │ Libros IVA │ Import Excel        │
└────────────────────────────┬─────────────────────────────────┘
                             │  HTTPS — solo REST
                             │  NEXT_PUBLIC_API_URL
                             ▼
                  ┌──────────────────────┐
                  │  FlexoCable-backend  │
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

**Regla crítica:** el frontend **no usa Prisma**. Toda persistencia y validación de negocio pasa por `FlexoCable-backend` vía HTTP.

---

## Stack tecnológico

| Tecnología | Versión objetivo | Propósito |
|---|---|---|
| Next.js | 15 | Framework React (App Router) |
| React | 19 | UI |
| TypeScript | 5.x | Lenguaje |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui + Radix UI | — | Componentes accesibles |
| React Hook Form + Zod | — | Formularios y validación cliente |
| recharts o Chart.js | — | Gráficas dashboard BI (Fase 11) |

---

## Estado actual del repositorio

| Componente | Estado |
|---|---|
| Repositorio Git | ✅ Creado |
| Scaffold Next.js (`src/app`, componentes) | 🔲 Pendiente — Fase 8 |
| Login y layout administrativo | 🔲 Pendiente — Fase 8 |
| Módulos de negocio (empleados, planilla, etc.) | 🔲 Pendiente — Fases 8–11 |

Este repositorio está **planificado** según el plan v3.0. La implementación comienza cuando `FlexoCable-backend` tenga auth JWT y los primeros endpoints CRUD.

---

## Módulos y rutas planificadas

### Dashboard y reportes (Fase 8 / 11)

| Ruta | Descripción | Fase |
|---|---|---|
| `/login` | Autenticación administrativa | 8 |
| `/dashboard` | KPIs: ventas, inventario, compras, RRHH | 11 |
| `/reportes` | Exportación Excel de reportes operativos | 10 |

### Recursos humanos (Fase 8 / 10)

| Ruta | Descripción | API backend |
|---|---|---|
| `/empleados` | Listado, alta y edición de empleados | `GET/POST /api/v1/employees` |
| `/empleados/[id]/ficha` | Expediente completo + descarga PDF | `employees/` + ficha PDF |
| `/empleados/[id]/bancos` | Cuentas bancarias del empleado | `employee-bank-accounts/` |
| `/empleados/[id]/documentos` | Expediente documental y vencimientos | `employee-documents/` |
| `/rrhh/bancos` | Catálogo editable de bancos SV | `banks/` |
| `/rrhh/tipos-documento` | Tipos de documento requerido | `required-document-types/` |
| `/rrhh/feriados` | Calendario de feriados nacionales | `holidays/` |

### Planilla (Fase 10)

| Ruta | Descripción |
|---|---|
| `/planilla/periodos` | CRUD periodos; cierre de periodo |
| `/planilla/corridas` | Generar, revisar, aprobar y marcar pagada |
| `/planilla/corridas/[id]/export` | Descarga Excel + PDF lote de comprobantes |
| `/planilla/aguinaldo` | Corrida anual de aguinaldo |
| `/planilla/vacaciones` | Saldos y solicitudes de permiso |
| `/planilla/liquidaciones` | Finiquitos al terminar relación laboral |

**Modelo de planilla:** Periodo + Corrida (referencia Beraka). Frecuencia principal **quincenal**; también mensual y semanal. Honorarios con retención ISR 10%.

### Operaciones e inventario (Fase 9 / 9b)

| Ruta | Descripción |
|---|---|
| `/inventario` | Stock, entradas, ajustes con motivo, alertas, Kardex valorado |
| `/compras/proveedores` | Maestro de proveedores (NIT/NRC, crédito) |
| `/compras/ordenes` | Órdenes de compra: borrador → confirmada → recibida |
| `/clientes` | Maestro fiscal: CF/CCF, DUI/NIT/NRC para DTE |
| `/importaciones` | Carga Excel de catálogo y entradas de inventario |

### Fiscal (Fase 10d)

| Ruta | Descripción |
|---|---|
| `/fiscal/libros-iva` | Generación y cierre de libros mensuales (ventas CF, CCF, compras) |
| `/fiscal/libros-iva/[year]/[month]` | Cuadre, vista previa y descarga Excel |

---

## Autenticación y roles

| Aspecto | Detalle |
|---|---|
| Tabla | `system.WebUsers` (solo backend — no existe en WPF) |
| Login | `POST /api/v1/auth/login` → JWT |
| Almacenamiento token | Cookie httpOnly o memoria según decisión Fase 8 |
| Roles | `ADMIN`, `ACCOUNTANT`, `OWNER` |

### Matriz de permisos sugerida

| Módulo | ADMIN | ACCOUNTANT | OWNER |
|---|---|---|---|
| Empleados y PINs | ✅ CRUD | Lectura | Lectura |
| Planilla (aprobar/pagar) | ✅ | ✅ | Lectura |
| Inventario y ajustes | ✅ | ✅ | Lectura |
| Compras y proveedores | ✅ | ✅ | Lectura |
| Libros de IVA | ✅ | ✅ | Lectura |
| Dashboard BI | ✅ | ✅ | ✅ |
| Usuarios web | ✅ | ❌ | ❌ |

### Separación WPF vs adminweb

| Sistema | Autenticación | Tabla |
|---|---|---|
| Caja WPF | PIN 4 dígitos del empleado | `hr.Employees.PinHash` |
| Adminweb | Email + password | `system.WebUsers` |

El administrador crea empleados y asigna PIN desde adminweb. La caja **solo valida** ese PIN; no hay pantalla de alta de empleados en WPF.

---

## Comunicación con el backend

### Cliente HTTP

Archivo planificado: `src/lib/api.ts`

```typescript
// Ejemplo de configuración
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
```

### Variables de entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Convenciones

- Prefijo API: `/api/v1/`
- Autenticación: header `Authorization: Bearer <token>`
- Validación formularios: esquemas Zod compartidos o replicados desde backend
- Errores: mostrar `message` del API; no loguear tokens ni PINs
- Paginación y filtros: query params estándar por módulo

### Importación Excel (Fase 9)

1. Admin sube archivo en `/importaciones`
2. Backend valida fila a fila y devuelve preview con errores
3. Confirmación ejecuta transacción y registra en `system.AuditLog`

Plantillas planificadas: `plantilla_catalogo.xlsx`, `plantilla_entradas.xlsx`, `plantilla_empleados.xlsx`.

---

## Estructura del proyecto

Estructura objetivo (Fase 8):

```
FlexoCable-adminweb/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json              # shadcn/ui
├── .env.example
└── src/
    ├── app/
    │   ├── login/
    │   ├── dashboard/
    │   ├── empleados/
    │   │   └── [id]/
    │   │       ├── ficha/
    │   │       ├── bancos/
    │   │       └── documentos/
    │   ├── rrhh/
    │   │   ├── bancos/
    │   │   ├── tipos-documento/
    │   │   └── feriados/
    │   ├── planilla/
    │   │   ├── periodos/
    │   │   ├── corridas/
    │   │   ├── aguinaldo/
    │   │   ├── vacaciones/
    │   │   └── liquidaciones/
    │   ├── inventario/
    │   ├── compras/
    │   │   ├── proveedores/
    │   │   └── ordenes/
    │   ├── clientes/
    │   ├── fiscal/
    │   │   └── libros-iva/
    │   ├── importaciones/
    │   └── reportes/
    ├── components/
    │   ├── ui/                  # shadcn/Radix
    │   ├── layout/              # Sidebar, header, breadcrumbs
    │   └── forms/               # Formularios reutilizables
    ├── features/                # Lógica por dominio
    └── lib/
        ├── api.ts               # Cliente REST
        ├── auth.ts              # JWT / sesión
        └── validators.ts        # Zod para formularios
```

---

## Instalación (cuando exista el scaffold)

### Requisitos

| Requisito | Versión |
|---|---|
| Node.js | 22+ |
| npm | 10+ |
| FlexoCable-backend | Corriendo en puerto 3001 (o el configurado) |

### Pasos previstos

```bash
cd FlexoCable-adminweb
cp .env.example .env.local
npm install
npm run dev
```

Abrir `http://localhost:3000`. El backend y PostgreSQL deben estar activos antes de iniciar sesión.

---

## Principios de UI/UX administrativa

A diferencia de la caja WPF ("Flexo Simple" para personal mayor), el panel admin sigue convenciones web modernas pero mantiene claridad operativa:

| Principio | Implementación |
|---|---|
| Navegación clara | Sidebar por módulo con iconos y etiquetas en español |
| Formularios validados | Zod + mensajes de error por campo |
| Acciones destructivas | Modal de confirmación |
| Tablas de datos | Paginación, búsqueda y filtros por columna |
| Estados de carga | Skeletons y spinners en llamadas API |
| Accesibilidad | Componentes Radix con roles ARIA |
| Exportaciones | Botones explícitos Excel/PDF con nombre de archivo descriptivo |
| Roles | Ocultar rutas no autorizadas; validar también en backend |

### Paleta (coherente con marca FlexoCable)

Reutilizar colores corporativos del README principal:

- Rojo `#D22533` — acciones primarias y alertas críticas
- Negro `#080808` — textos y headers
- Verde `#4CAF50` — éxito y estados aprobados
- Naranja `#FF9800` — pendientes y advertencias

---

## Roadmap por fases

| Fase | Entregable adminweb | Estado |
|---|---|---|
| **8** | Scaffold Next.js, login, layout, CRUD empleados/clientes/catálogo básico | 🔲 Pendiente |
| **9** | Pantallas inventario admin, movimientos, alertas | 🔲 Pendiente |
| **9b** | Proveedores, órdenes de compra, Kardex valorado | 🔲 Pendiente |
| **10** | Planilla: periodos, corridas, export Excel/PDF, ficha empleado | 🔲 Pendiente |
| **10b** | Aguinaldo y vacaciones | 🔲 Pendiente |
| **10c** | Liquidaciones | 🔲 Pendiente |
| **10d** | Libros de IVA — generación y descarga | 🔲 Pendiente |
| **11** | Dashboard BI con tarjetas, gráficas y export por sección | 🔲 Pendiente |

### Dependencias entre fases

```
Fase 8 (base + auth)
    ├── Fase 9 (inventario UI)
    │       └── Fase 9b (compras UI)
    ├── Fase 10 (planilla UI)
    │       ├── 10b (aguinaldo/vacaciones)
    │       └── 10c (liquidaciones)
    ├── Fase 10d (libros IVA)
    └── Fase 11 (dashboard — requiere datos de todas las áreas)
```

---

## Licencia

Copyright (c) 2026 FlexoCable El Salvador, S.A. de C.V. — Todos los derechos reservados.
