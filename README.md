<!-- readme-standard:v1 -->
<!-- Esta línea permite que los agentes de IA reconozcan y actualicen este README. No la borres. -->

<!-- section:header -->
# ferreteria_adminweb

> Panel web de gerencia, contabilidad, RRHH y tienda pública de Ferretería.

[![CI](https://github.com/Lenny004/ferreteria_adminweb/actions/workflows/ci.yml/badge.svg)](https://github.com/Lenny004/ferreteria_adminweb/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-yellow.svg)](LICENSE)

<!-- section:toc -->
## 📑 Contenido

- [Aspectos destacados](#-aspectos-destacados)
- [Descripción](#-descripción)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Configuración](#-configuración)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Pruebas](#-pruebas)
- [Hoja de ruta y estado](#-hoja-de-ruta-y-estado)
- [Soporte y contribuciones](#-soporte-y-contribuciones)
- [Autores y agradecimientos](#-autores-y-agradecimientos)
- [Licencia](#-licencia)

<!-- section:highlights -->
## 🌟 Aspectos destacados

- **Panel administrativo:** dashboard, empleados, planilla, inventario, compras, clientes y libros de IVA, conectados al API.
- **Tienda pública:** catálogo, favoritos, perfil y contacto, con sesión distinta a la del panel.
- **Sin base de datos en el navegador:** toda la persistencia pasa por `ferreteria_backend` (`NEXT_PUBLIC_API_URL`).
- **Roles ADMIN, ACCOUNTANT y OWNER:** el API autoriza; la interfaz oculta acciones solo en algunos módulos.
- **Pruebas de sesión, permisos e inventario** en `src/__tests__`, las mismas que corre CI.

<!-- section:overview -->
## ℹ️ Descripción

Gerencia, contabilidad y RRHH necesitan empleados, planilla, inventario, compras y libros de IVA sin entrar a la caja. Este panel es esa interfaz. Quien opera el mostrador sigue en [`erp_ferreteria`](../erp_ferreteria/README.md); este sitio no emite DTE ni abre turno.

El navegador solo habla HTTP con [`ferreteria_backend`](../ferreteria_backend/README.md). No usa Prisma. La sesión admin viaja en la cookie httpOnly `fer_access`; la tienda usa `fer_shop_access` y no pisa la cookie del panel.

La raíz `/` manda al dashboard si hay sesión admin y a `/tienda` si no la hay.

**Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/Radix, TanStack Query 5, Zod y Recharts 3.

<!-- keep -->
### Qué hace y qué no hace

| Sí | No |
|---|---|
| Login admin (email/contraseña y cookie httpOnly) | Operar caja ni emitir DTE |
| CRUD de empleados y asignación de PIN | Validar el PIN de caja (eso es WPF) |
| Planilla, aguinaldo, vacaciones y liquidaciones | Conectar directo a PostgreSQL |
| Inventario, compras, proveedores, reportes y libros de IVA | Duplicar reglas de negocio (viven en el API) |
| Tienda pública (catálogo, favoritos, contacto) | Gestionar certificados DTE |

### Rutas

Leyenda de estado tomada del panel actual: pantalla conectada al API, salvo donde se indica lo contrario.

| Ruta | Descripción |
|---|---|
| `/login` | Autenticación administrativa |
| `/olvidar-contrasena`, `/restablecer-contrasena` | Recuperación del usuario web admin |
| `/dashboard` | KPIs de ventas, inventario, compras y RRHH |
| `/reportes` | Accesos a reportes de otros módulos |
| `/perfil` | Perfil y cambio de contraseña |
| `/mensajes-contacto` | Bandeja del formulario Contáctanos |
| `/empleados` | Alta y edición de empleados |
| `/empleados/[id]/ficha` | Expediente laboral |
| `/empleados/[id]/bancos` | Cuentas bancarias |
| `/empleados/[id]/documentos` | Documentos y vencimientos |
| `/rrhh/bancos` | Catálogo de bancos |
| `/rrhh/tipos-documento` | Tipos de documento requerido |
| `/rrhh/feriados` | Feriados nacionales |
| `/planilla/periodos` | Periodos y cierre |
| `/planilla/corridas` | Generar, aprobar y marcar pagada |
| `/planilla/corridas/[id]/export` | Excel, PDF y Planilla Única |
| `/planilla/aguinaldo` | Corrida anual |
| `/planilla/vacaciones` | Saldos y permisos |
| `/planilla/liquidaciones` | Finiquitos |
| `/inventario` | Stock, movimientos, alertas y valuación |
| `/inventario/conteos` | Conteos físicos por familia o subfamilia |
| `/compras/proveedores` | Maestro de proveedores |
| `/compras/ordenes` | Borrador, confirmada y recibida |
| `/clientes` | Maestro fiscal para DTE |
| `/fiscal/libros-iva` | Libros mensuales |
| `/importaciones` | Informativa; el flujo activo es JSON en inventario |

La planilla usa Periodo + Corrida. La frecuencia principal es quincenal; también hay mensual y semanal. Los honorarios llevan retención ISR del 10%.

### Tienda pública `(store)`

No usa el `AuthGuard` del panel. Cookies `fer_shop_access` y `fer_shop_csrf`. El perfil y el CSRF se guardan en memoria (`src/lib/shop-session-state.ts`).

| Ruta | API |
|---|---|
| `/tienda` | `GET /public/catalog/products` |
| `/tienda/producto/[id]` | `GET /public/catalog/products/:id`, favoritos |
| `/tienda/favoritos` | `GET /shop/favorites` |
| `/tienda/perfil` | `GET/PATCH /shop/auth/me` |
| `/tienda/login`, `/tienda/registro` | `POST /shop/auth/login` y `register` |
| `/tienda/olvidar-contrasena`, `/tienda/restablecer-contrasena` | recuperación shop |
| `/tienda/contacto` | `POST /contact-messages` |
| `/tienda/terminos`, `/tienda/privacidad` | `GET /public/settings/:key` |

### Roles

| Módulo | ADMIN | ACCOUNTANT | OWNER |
|---|---|---|---|
| Empleados y PIN | CRUD | Lectura | Lectura |
| Planilla (aprobar/pagar) | Sí | Sí | Lectura |
| Inventario y ajustes | Sí | Sí | Lectura |
| Compras y proveedores | Sí | Sí | Lectura |
| Libros de IVA | Sí | Sí | Lectura |
| Dashboard | Sí | Sí | Sí |
| Mensajes de contacto | Sí | No | Sí |
| Usuarios web | Sí | No | No |

La interfaz aplica el rol de forma puntual (por ejemplo, mensajes de contacto). El API sigue siendo quien autoriza. En conteos físicos, ADMIN y OWNER operan el flujo; ACCOUNTANT lee y exporta.

### Cliente HTTP

`src/lib/api.ts` y un cliente por dominio en `src/lib/api/`. Prefijo `/api/v1/`. Respuesta canónica `{ success: true, data: T }`. Estado remoto con TanStack Query en `src/hooks/`. Las mutaciones envían `X-CSRF-Token`. No se registran tokens ni PIN en la consola.

`src/proxy.ts` genera un nonce CSP por petición. `style-src` permite estilos en línea; `script-src` no.

### UI

Sidebar en español, formularios con validación por campo, confirmación en acciones destructivas, tablas con paginación y filtros, y exportes Excel/PDF con nombre de archivo descriptivo. Los colores salen de Tailwind en los componentes; no hay una paleta hex declarada en este repositorio.
<!-- /keep -->

<!-- section:requirements -->
## 📋 Requisitos

- Node.js ≥ 22 (`.nvmrc` y `engines` de `package.json`; CI usa 22.x)
- npm (el repositorio incluye `package-lock.json`)
- [`ferreteria_backend`](../ferreteria_backend/README.md) en marcha, por defecto en el puerto 3001

<!-- section:installation -->
## ⬇️ Instalación

```bash
cp .env.example .env.local
npm install
```

<!-- section:usage -->
## 🚀 Uso

```bash
npm run dev
```

Resultado esperado: el sitio queda en `http://localhost:3000`. Sin sesión, `/` abre la tienda. Con un usuario web válido, `/login` entra al dashboard. Si el API no está levantado, el login no completa.

Para servir la compilación de producción, después de `npm run build`:

```bash
npm start
```

<!-- section:configuration -->
## ⚙️ Configuración

Copia [`.env.example`](.env.example) a `.env.local`. El código usa `http://localhost:3001/api/v1` si la variable no está definida (`src/lib/api.ts`).

| Variable | Descripción | Ejemplo | Requerida |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Origen del API, con el prefijo `/api/v1`. El backend debe permitir CORS con credenciales desde el origen del panel | `http://localhost:3001/api/v1` | No |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Orígenes HTTPS fijos y separados por comas para imágenes demo externas; vacío por defecto y se ignora cualquier URL con rutas, credenciales o comodines | `https://picsum.photos` | No |

En el API, `CORS_ORIGIN` tiene que ser el origen exacto de este panel (en local, `http://localhost:3000`). Cookies y `SameSite` se configuran allí, no en este repositorio.

<!-- section:structure -->
## 🗂️ Estructura del proyecto

```text
.
├── src/app/                 # (auth), (admin) y (store)
├── src/components/          # ui, layout y tienda
├── src/config/              # navigation.ts, menú lateral
├── src/contexts/            # sesión del usuario web
├── src/features/            # piezas de dominio de la UI
├── src/hooks/               # TanStack Query por módulo
├── src/lib/                 # api.ts y clientes por dominio
├── src/__tests__/           # Jest: sesión, permisos, inventario
├── public/                  # estáticos
├── .env.example             # NEXT_PUBLIC_API_URL
└── .github/workflows/       # lint, tipos, pruebas, auditoría y build
```

<!-- section:development -->
## 🛠️ Desarrollo

```bash
npm run lint
npm run typecheck
npm run build
```

CI instala con `npm ci` y construye con `NEXT_PUBLIC_API_URL` (secreto del workflow o `http://localhost:3001/api/v1`).

<!-- section:testing -->
## ✅ Pruebas

```bash
npm test
```

Con cobertura, igual que CI:

```bash
npm test -- --ci --coverage
```

Cubren el cliente HTTP, la sesión admin y de tienda, permisos, navegación, dashboard, inventario y conteos.

<!-- section:roadmap -->
## 🗺️ Hoja de ruta y estado

El plan maestro está en [`../erp_ferreteria/docs/FERRETERIA_PLAN_FINALIZACION_APP.md`](../erp_ferreteria/docs/FERRETERIA_PLAN_FINALIZACION_APP.md). Las fases 8 a 11 y la tienda pública ya tienen pantallas en `src/app`.

- [ ] Importación Excel nativa en `/importaciones` (hoy redirige al flujo JSON de inventario)
- [ ] Ocultar en todo el sidebar las rutas que el rol no puede usar

<!-- section:contributing -->
## 💭 Soporte y contribuciones

Issues: <https://github.com/Lenny004/ferreteria_adminweb/issues>. No hay `CONTRIBUTING.md`.

<!-- section:authors -->
## ✍️ Autores y agradecimientos

- Lenny Sánchez — titular del copyright en [LICENSE](LICENSE)

<!-- section:license -->
## 📄 Licencia

MIT. Ver [LICENSE](LICENSE).
