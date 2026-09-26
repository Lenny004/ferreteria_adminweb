# Guía para Agentes de IA en este Proyecto

Este documento describe las skills y reglas que todos los agentes de IA deben seguir al trabajar en este repositorio.

## Skills del Proyecto

### 1. Principios de Calidad

**Ubicación:** `.cursor/skills/principios-calidad/SKILL.md`

**Descripción:** Estándar de calidad con 100 criterios organizados en 7 familias:

- **Familia 1:** Arquitectura y Diseño (SRP, OCP, LSP, ISP, DIP, cohesión, acoplamiento, capas, Clean Architecture, Hexagonal)
- **Familia 2:** Entrada y Validación (Zero Trust, validación de tipo/longitud/formato/rango, sanitización, normalización, idempotencia)
- **Familia 3:** Seguridad y Zero Trust (autenticación, autorización, RBAC, hashing, CSRF, XSS, SQL injection, sesiones, cookies, cifrado, rate limiting)
- **Familia 4:** Procesamiento y Gestión del Estado (determinismo, atomicidad, consistencia transaccional, aislamiento, durabilidad, idempotencia operacional, concurrencia)
- **Familia 5:** Decisión y Recuperación (decisiones deterministas, fail secure, rollback, excepciones, circuit breaker, timeout, degradación elegante)
- **Familia 6:** Verificación, Calidad y Rendimiento (integridad, pre/postcondiciones, tiempo de respuesta, eficiencia, escalabilidad, disponibilidad, tolerancia a fallos)
- **Familia 7:** Telemetría, Observabilidad y Auditoría (logs estructurados, correlation ID, métricas, monitoreo, health checks, alertas, trazabilidad end-to-end)

**Cuándo usar:** Al diseñar, escribir, revisar o auditar cualquier código del proyecto.

**Adaptación a Next.js 15 + React 19 + TypeScript:** La skill incluye una sección específica de cómo aplicar cada familia de criterios en el contexto de un frontend moderno con Next.js.

---

### 2. Documentación de Código

**Ubicación:** `.cursor/skills/documentacion-codigo/SKILL.md`

**Descripción:** Estándar de documentación JSDoc/TSDoc en español para:

- Funciones y hooks (con `@param`, `@returns`, `@throws`)
- Componentes React (propósito, responsabilidad visual/funcional)
- Tipos e interfaces (contexto de uso)
- Server Actions y API routes
- Comentarios inline (explicar el porqué, no el qué)

**Reglas clave:**
- Idioma: español
- No redundancia (solo documentar lo no evidente)
- No modificar lógica ni firmas al documentar
- Consistencia de formato en todo el proyecto

**Cuándo usar:** Al escribir o modificar cualquier código TypeScript/JavaScript/TSX del proyecto.

---

## Reglas Siempre Activas

**Ubicación:** `.cursor/rules/reglas-proyecto.mdc`

Esta regla obliga a:

1. **Seguir ambas skills** en todo cambio de código
2. **Reportar cumplimiento en PRs** con una sección que liste:
   - Criterios de calidad aplicados (por familia)
   - Confirmación de documentación completa
   - Excepciones justificadas si las hay

---

## Cómo Usar las Skills

### Para agentes de IA

1. **Lee las skills relevantes** al inicio de cada tarea:
   - Si vas a diseñar/implementar funcionalidad → lee `.cursor/skills/principios-calidad/SKILL.md`
   - Si vas a escribir/modificar código → lee `.cursor/skills/documentacion-codigo/SKILL.md`

2. **Aplica los criterios** durante la implementación:
   - Valida entradas según Familia 2
   - Implementa seguridad según Familia 3
   - Gestiona errores según Familia 5
   - Añade telemetría según Familia 7
   - Documenta con JSDoc según el estándar

3. **Reporta cumplimiento** en la descripción del PR:
   - Lista los criterios aplicados con números específicos
   - Confirma documentación completa
   - Justifica excepciones si las hay

### Para desarrolladores humanos

Las mismas skills son útiles como guía de calidad y referencia rápida durante code reviews y desarrollo.

---

## Stack del Proyecto

- **Frontend:** Next.js 16, React 19, TypeScript
- **Arquitectura:** App Router, Server Components, Server Actions
- **Validación:** Zod (recomendado)
- **Estilos:** Tailwind CSS v4
- **Estado:** Context API, hooks personalizados

### Verificación local

- `npm run lint`
- `npm run typecheck`
- `npm test -- --ci --coverage`
- `npm run build`

---

## Actualizaciones

**Última actualización:** 2026-09-26

Si se añaden o modifican skills, actualizar este documento con:
- Nombre y ubicación de la nueva skill
- Descripción breve de su propósito
- Cuándo y cómo usarla
