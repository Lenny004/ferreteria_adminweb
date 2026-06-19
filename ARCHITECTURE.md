# Arquitectura base AdminWeb

Este scaffold deja preparado el proyecto para desarrollar las pantallas del ERP FlexoCable AdminWeb por fases, sin implementar funcionalidad de negocio todavia.

## Stack configurado

- Next.js 15 con App Router.
- React 19 y TypeScript estricto.
- Tailwind CSS 4 mediante PostCSS.
- shadcn/ui-ready con `components.json` y alias `@/*`.
- Radix UI, React Hook Form, Zod y Recharts como dependencias base.

## Estructura

- `src/app`: rutas App Router. Usa grupos `(auth)` y `(admin)` para separar login del layout administrativo.
- `src/components/layout`: shell reutilizable del ERP, sidebar, header, breadcrumbs y placeholder de modulo.
- `src/components/ui`: componentes primitivos compatibles con el estilo shadcn.
- `src/components/forms`: espacio reservado para formularios reutilizables.
- `src/config`: configuracion transversal, actualmente navegacion del sidebar.
- `src/features`: espacio para organizar logica por dominio cuando se implementen modulos.
- `src/hooks`: hooks compartidos.
- `src/lib`: cliente REST, tipos de sesion, validadores y utilidades.

## Rutas creadas

- `/login`
- `/dashboard`
- `/reportes`
- `/empleados`
- `/empleados/[id]/ficha`
- `/empleados/[id]/bancos`
- `/empleados/[id]/documentos`
- `/rrhh/bancos`
- `/rrhh/tipos-documento`
- `/rrhh/feriados`
- `/planilla/periodos`
- `/planilla/corridas`
- `/planilla/corridas/[id]/export`
- `/planilla/aguinaldo`
- `/planilla/vacaciones`
- `/planilla/liquidaciones`
- `/inventario`
- `/compras/proveedores`
- `/compras/ordenes`
- `/clientes`
- `/importaciones`
- `/fiscal/libros-iva`
- `/fiscal/libros-iva/[year]/[month]`

## Variables de entorno

Copiar `.env.example` a `.env.local` cuando se conecte el backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

El frontend debe consumir solo la API REST. No se debe agregar Prisma ni acceso directo a PostgreSQL en este proyecto.
