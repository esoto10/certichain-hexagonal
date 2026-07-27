# 🎓 CertiChain — Certificados Académicos verificables en Blockchain

[![CI](https://github.com/badkitten-bug/certichain/actions/workflows/ci.yml/badge.svg)](https://github.com/badkitten-bug/certichain/actions/workflows/ci.yml)

Aplicación desarrollada con **Arquitectura Hexagonal** usando **TypeScript + NestJS**.

> 📘 Documento completo de análisis y diseño: [docs/Analisis-y-Diseno-CertiChain.md](docs/Analisis-y-Diseno-CertiChain.md)

## 📌 El caso

Las instituciones educativas emiten certificados que hoy son fáciles de falsificar y lentos de verificar. CertiChain resuelve el problema:

- Una **institución** registrada emite **certificados académicos** (diplomas, constancias).
- Al emitir, se calcula el **hash SHA-256** del certificado y se **ancla como bloque** de una blockchain: cada bloque guarda el hash del anterior, por lo que **nada puede alterarse** sin romper la cadena.
- **Cualquier empresa** verifica un certificado en segundos con su código de verificación, **sin depender de la institución emisora**: el sistema responde `VALIDO`, `REVOCADO` o `ALTERADO`.
- La institución puede **revocar** un certificado, y la revocación también queda anclada como bloque (nunca se borra nada).
- Cualquiera puede **auditar la integridad** de la cadena completa.

## 🧅 ¿Por qué Arquitectura Hexagonal?

La arquitectura Hexagonal (Ports & Adapters) organiza el código alrededor de un **núcleo de dominio y aplicación** completamente aislado de la infraestructura y la presentación. Las dependencias apuntan siempre hacia el centro: los adaptadores conocen los puertos, pero el núcleo no conoce a los adaptadores.

Este caso la amerita porque:

1. **El dominio es valioso e independiente de la tecnología**: las reglas "solo una institución activa emite", "solo el emisor revoca", "un certificado es válido si su hash coincide con el anclado y la cadena está íntegra" existen sin importar si se usa NestJS, SQLite o Ethereum.
2. **Los adaptadores son intercambiables**: hoy la blockchain es SQLite; mañana podría anclarse a una testnet real. Los puertos outbound definen el contrato; los casos de uso no cambian ni una línea.
3. **Testeable**: los casos de uso se prueban con fakes de los puertos outbound, sin levantar base de datos ni servidor HTTP.

### Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────┐
│  ADAPTERS INBOUND     (controllers REST, filtros HTTP)          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PORTS INBOUND    (interfaces de entrada)               │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │  CORE / APPLICATION   (casos de uso, DTOs)        │  │    │
│  │  │  ┌─────────────────────────────────────────────┐  │  │    │
│  │  │  │  CORE / DOMAIN                              │  │  │    │
│  │  │  │  (Institution, Certificate, Block,          │  │  │    │
│  │  │  │   reglas de negocio, excepciones)           │  │  │    │
│  │  │  └─────────────────────────────────────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  │  PORTS OUTBOUND   (interfaces de salida)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ADAPTERS OUTBOUND    (SQLite/Prisma, blockchain, reloj)        │
│  CONFIGURATION        (DI, database, security)                  │
└─────────────────────────────────────────────────────────────────┘
              Las dependencias apuntan hacia ADENTRO →
```

### Estructura de carpetas

```
src/
├── core/                        ← Núcleo: NO depende de nada externo
│   ├── domain/
│   │   ├── entities/            ← Institution, Certificate
│   │   ├── value-objects/       ← Block (hash SHA-256 encadenado)
│   │   └── exceptions/          ← Errores de negocio
│   └── application/
│       ├── use-cases/           ← RegisterInstitution, IssueCertificate,
│       │                          VerifyCertificate, RevokeCertificate,
│       │                          VerifyChain, ListHolderCertificates
│       └── dto/                 ← Entradas/salidas de los casos de uso
├── ports/                       ← Contratos definidos por la aplicación
│   ├── inbound/                 ← Interfaces expuestas hacia adaptadores primarios
│   └── outbound/                ← Interfaces hacia infraestructura (repos, ledger, clock)
├── adapters/
│   ├── inbound/
│   │   └── rest/                ← Controllers REST, filtros, DTOs HTTP
│   └── outbound/
│       ├── persistence/         ← SQLite (Prisma) + en memoria
│       ├── blockchain/          ← Ledger SQLite + en memoria
│       └── clock/               ← Reloj del sistema
└── configuration/
    ├── dependency-injection/    ← Composition root (AppModule)
    └── database/                ← PrismaService
```

### Regla de oro

| Capa | Puede importar de | NUNCA importa de |
|------|-------------------|------------------|
| core/domain | (nada) | application, ports, adapters, configuration |
| core/application | core/domain, ports/outbound | adapters, configuration |
| ports/inbound | core/application/dto | adapters, configuration |
| ports/outbound | core/domain | adapters, configuration |
| adapters/inbound | ports/inbound, ports/outbound | core directamente |
| adapters/outbound | ports/outbound, core/domain | adapters/inbound |
| configuration | todos | (es el composition root) |

## 🚀 API

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/institutions` | Registra una institución emisora |
| GET | `/institutions` | Lista instituciones |
| POST | `/certificates` | Emite un certificado → hash anclado como bloque |
| GET | `/certificates/:code/verify` | **Verificación pública**: VALIDO / REVOCADO / ALTERADO |
| POST | `/certificates/:code/revoke` | Revoca (solo la institución emisora) |
| GET | `/holders/:document/certificates` | Certificados de un titular |
| GET | `/blockchain` | La cadena completa (transparencia) |
| GET | `/blockchain/verify` | Audita la integridad de la cadena |

## 🛠️ Ejecución

```bash
pnpm install
pnpm run start:dev     # servidor en http://localhost:3000
pnpm run test          # 25 pruebas unitarias (dominio + casos de uso)
pnpm run test:e2e      # 12 pruebas del flujo completo por HTTP
```

## 👥 Equipo

Steve Gómez · Erickson Soto · Jose Pacco — Curso de Arquitectura de Software, 2026.

Tareas del equipo: [docs/tareas/](docs/tareas/)
