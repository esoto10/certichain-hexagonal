# Migración de Onion → Hexagonal (versión compacta)

## Objetivo
Migrar la aplicación de Arquitectura Onion a Arquitectura Hexagonal sin cambiar el comportamiento funcional.

## Stack tecnológico

- Lenguaje: TypeScript 5.7
- Framework: NestJS 11
- Runtime: Node.js
- Arquitectura actual: Onion Architecture
- Arquitectura objetivo: Hexagonal Architecture
- Testing: Jest 30 + ts-jest (unitarias con `jest`) · Supertest (E2E con `jest --config test/jest-e2e.json`)
- ORM / persistencia: Prisma 6.8 con SQLite (además de repositorios en memoria para testing)
- Package manager: pnpm 11
- Validación HTTP: class-validator + class-transformer
- Documentación API: Swagger (`@nestjs/swagger`)
- Linting / formato: ESLint + Prettier

## Principios

- Cambios incrementales; compilar y pasar tests tras cada etapa.
- No refactors fuera del alcance.
- Mantener la lógica de negocio sin dependencias a infraestructura.

## Arquitectura objetivo (resumen)

- Domain: entidades, value objects, eventos, excepciones, servicios del dominio.
- Application: casos de uso, DTOs, comandos/queries, validaciones, puertos.
- Ports: inbound (interfaces de entrada) y outbound (interfaces hacia infraestructura).
- Adapters: inbound (REST, web, CLI), outbound (persistence, notifications, storage, external-api).
- Infrastructure: DI, Prisma/ORM, logging, cache, configuración.

## Estructura de carpetas propuesta

src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   └── services/
│   └── application/
│       ├── use-cases/
│       ├── dto/
│       ├── commands/
│       ├── queries/
│       └── validators/
├── ports/
│   ├── inbound/
│   └── outbound/
├── adapters/
│   ├── inbound/
│   │   ├── rest/
│   │   ├── web/
│   │   └── messaging/
│   └── outbound/
│       ├── persistence/
│       ├── notifications/
│       ├── storage/
│       └── external-api/
└── configuration/
    ├── dependency-injection/
    ├── database/
    └── security/

Breve propósito top-level:

- core/: lógica del dominio y casos de uso (sin infraestructura).
- ports/: interfaces (puertos) definidos por la aplicación.
- adapters/: implementaciones concretas de puertos.
- configuration/: wiring, DI y configuración transversal.

## Consideraciones específicas de NestJS

- Mantener la estructura de módulos de NestJS (`*.module.ts`).
- No eliminar módulos NestJS existentes; reorganizar responsabilidades según la Arquitectura Hexagonal.
- Los Controllers deben actuar como adaptadores inbound.
- Los casos de uso deben estar desacoplados de Prisma y otros detalles de infraestructura.
- Los repositorios Prisma deben implementarse como adaptadores outbound.
- Prisma Client no debe ser utilizado directamente desde casos de uso ni dominio.
- La inyección de dependencias debe respetar la separación entre puertos e implementaciones.
- Mantener funcionando Swagger, validaciones y configuración existente.

## Plan de migración (compacto) + criterios de aceptación

1. Etapa 1 — Análisis
   - Mapear módulos y dependencias.
   - Criterio: listado de módulos y diagrama actualizado.

2. Etapa 2 — Estructura
   - Crear estructura de carpetas, módulos y READMEs necesarios.
   - Criterio: proyecto compila con la nueva estructura sin cambios funcionales.

3. Etapa 3 — Puertos
   - Definir interfaces (inbound/outbound) en `ports/`.
   - Criterio: tests de dominio y casos de uso pasan utilizando mocks/stubs de puertos.

4. Etapa 4 — Casos de uso
   - Extraer/ajustar use-cases a `core/application`.
   - Criterio: cobertura de unit tests del dominio y aplicación sin depender de infraestructura.

5. Etapa 5 — Adaptadores inbound
   - Implementar controllers/adapters que usen puertos.
   - Criterio: endpoints funcionan igual mediante pruebas de integración/smoke tests.

6. Etapa 6 — Adaptadores outbound
   - Mover persistencia, clientes externos y mensajería a adapters/outbound.
   - Criterio: contract tests e integration tests aprobados.

7. Etapa 7 — DI y wiring
   - Configurar inyección para montar adapters con ports.
   - Criterio: inyección de dependencias funcionando correctamente.

8. Etapa 8 — Cleanup y documentación
   - Marcar como deprecated el código Onion residual y eliminarlo únicamente después de validar la migración.
   - Criterio: no quedan dependencias inversas y los tests pasan.

Validaciones:
- Tests verdes antes de avanzar entre etapas.
- Validación completa antes de eliminar código antiguo.

## Reglas resumidas para PRs / Copilot

Antes de cambiar:

- Objetivo del cambio (1 línea).
- Archivos afectados (lista).
- Impacto esperado (tests / compatibilidad).

Al generar código:

- Limitarse a la etapa solicitada.
- No tocar lógica de negocio.
- Añadir tests y actualizar README de carpeta si crea/mueve archivos.
- Actualizar la sección Estado de este documento después de completar cada etapa de migración.
- No avanzar a la siguiente etapa si la etapa actual no compila o tiene pruebas fallidas.

Plantilla mínima para PR:

- Título:
- Objetivo:
- Archivos modificados:
- Tests añadidos:
- Criterios de aceptación (checkboxes):
- Riesgos conocidos:

## Documentación

- Actualizar README principal y `Analisis-y-Diseno-CertiChain.md` al finalizar cada bloque funcional.
- Mantener diagramas y ejemplos sincronizados con código.
- No eliminar código Onion hasta tener snapshot/branch y validación completa; marcar como deprecated primero.

## Validación final

La migración se considera completada cuando:

- El proyecto compila correctamente.
- Los tests unitarios y E2E pasan.
- La dependencia apunta hacia el dominio y no existen dependencias de infraestructura hacia capas internas.
- No existen dependencias de dominio hacia infraestructura.
- Prisma queda encapsulado dentro de adaptadores outbound.
- La inyección de dependencias de NestJS funciona correctamente.
- README.md y `Analisis-y-Diseno-CertiChain.md` reflejan la nueva arquitectura.
- La sección Estado está completamente actualizada.

## Estado (checklist)

- [x] Análisis de la arquitectura actual
- [x] Estructura Hexagonal creada (carpetas + READMEs)
- [x] Dominio migrado → `src/core/domain/` (entities, value-objects, exceptions)
- [x] Puertos creados → `src/ports/inbound/` (6 puertos) + `src/ports/outbound/` (4 puertos)
- [x] Adaptadores de entrada migrados → `src/adapters/inbound/rest/` (controllers, filter, dtos)
- [x] Adaptadores de salida migrados → `src/adapters/outbound/` (persistence, blockchain, clock)
- [x] Inyección de dependencias actualizada → `src/configuration/dependency-injection/app.module.ts`
- [x] Pruebas ejecutadas y validadas — 25 unit tests + 13 e2e tests en verde
- [x] README.md actualizado
- [x] Documentación revisada
- [x] Código Onion marcado como deprecated/eliminado (carpetas domain/, application/, infrastructure/, presentation/ y src/app.module.ts eliminadas)
- [x] Migración finalizada — 2026-07-26