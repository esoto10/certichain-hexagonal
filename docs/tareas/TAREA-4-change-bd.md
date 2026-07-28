# 📋 Tarea 4 — [Transversal] Migración ORM + Base de datos: TypeORM + PostgreSQL

**Capa:** `src/adapters/outbound/` · `src/configuration/` · **Dificultad:** media-alta · **Estado:** pendiente

---

## Objetivo

Demostrar la **versatilidad de la Arquitectura Hexagonal** agregando un segundo juego de adaptadores outbound basado en **TypeORM + PostgreSQL**, mientras los adaptadores de **Prisma + SQLite permanecen intactos**.

El cambio de infraestructura activa (SQLite → PostgreSQL) se realiza modificando **únicamente** el composition root (`app.module.ts`). El dominio, los casos de uso y los puertos **no se tocan en absoluto**.

---

## Contexto de arquitectura

En Arquitectura Hexagonal los **puertos outbound** son las interfaces que el núcleo define:

| Puerto | Token | Interfaz |
|--------|-------|---------|
| Repositorio de instituciones | `INSTITUTION_REPOSITORY` | `InstitutionRepository` |
| Repositorio de certificados | `CERTIFICATE_REPOSITORY` | `CertificateRepository` |
| Libro mayor blockchain | `CERTIFICATE_LEDGER` | `CertificateLedger` |
| Reloj del sistema | `CLOCK` | `Clock` |

Actualmente esos tokens apuntan a los adaptadores SQLite/Prisma:
```
INSTITUTION_REPOSITORY → SqliteInstitutionAdapter   (Prisma)
CERTIFICATE_REPOSITORY → SqliteCertificateAdapter   (Prisma)
CERTIFICATE_LEDGER     → SqliteBlockchainAdapter     (Prisma)
CLOCK                  → SystemClockAdapter
```

Al finalizar esta tarea también existirán los adaptadores TypeORM, y el composition root apuntará a ellos:
```
INSTITUTION_REPOSITORY → TypeOrmInstitutionAdapter  (TypeORM + PostgreSQL)
CERTIFICATE_REPOSITORY → TypeOrmCertificateAdapter  (TypeORM + PostgreSQL)
CERTIFICATE_LEDGER     → TypeOrmBlockchainAdapter   (TypeORM + PostgreSQL)
CLOCK                  → SystemClockAdapter          (sin cambio)
```

---

## Pre-requisitos

- PostgreSQL 16.4 corriendo localmente (o Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=certichain -e POSTGRES_DB=certichain postgres:16.4-alpine`)
- Variable de entorno `DATABASE_URL_PG` disponible, por ejemplo:
  ```
  DATABASE_URL_PG=postgresql://postgres:certichain@localhost:5432/certichain
  ```

---

## Checklist

### Paso 1 — Instalar dependencias

```bash
pnpm add @nestjs/typeorm typeorm pg
pnpm add -D @types/pg
```

> Los paquetes `prisma` y `@prisma/client` se mantienen; los adaptadores SQLite siguen funcionando.

---

### Paso 2 — Crear las entidades TypeORM

Las entidades TypeORM son **clases de persistencia** que viven en los adaptadores outbound, **separadas** de las entidades de dominio. El mapeo dominio ↔ persistencia ocurre dentro del adaptador.

Crear la carpeta `src/adapters/outbound/persistence/typeorm/entities/` con los siguientes archivos:

#### `institution.orm-entity.ts`

```typescript
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('institution')
export class InstitutionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
```

#### `certificate.orm-entity.ts`

```typescript
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('certificate')
export class CertificateOrmEntity {
  @PrimaryColumn({ name: 'verification_code', type: 'varchar', length: 36 })
  verificationCode: string;

  @Column({ name: 'institution_id', type: 'varchar', length: 36 })
  institutionId: string;

  @Column({ name: 'holder_name', type: 'varchar', length: 120 })
  holderName: string;

  @Column({ name: 'holder_document', type: 'varchar', length: 20 })
  holderDocument: string;

  @Column({ name: 'degree_title', type: 'varchar', length: 200 })
  degreeTitle: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'VIGENTE' })
  status: string;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true, default: null })
  revokedAt: Date | null;

  @Column({ name: 'revocation_reason', type: 'varchar', length: 500, nullable: true, default: null })
  revocationReason: string | null;
}
```

#### `block.orm-entity.ts`

```typescript
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('block')
export class BlockOrmEntity {
  @PrimaryColumn({ type: 'int' })
  index: number;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ type: 'text' })
  data: string;

  @Column({ name: 'previous_hash', type: 'varchar', length: 64 })
  previousHash: string;

  @Column({ type: 'varchar', length: 64 })
  hash: string;
}
```

---

### Paso 3 — Crear los adaptadores TypeORM

Crear la carpeta `src/adapters/outbound/persistence/typeorm/` con los siguientes archivos:

#### `typeorm-institution.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../../../core/domain/entities/institution.entity';
import { InstitutionRepository } from '../../../../ports/outbound/institution-repository.port';
import { InstitutionOrmEntity } from './entities/institution.orm-entity';

/**
 * Adaptador outbound: implementación TypeORM/PostgreSQL del puerto InstitutionRepository.
 * Puede coexistir con SqliteInstitutionAdapter; solo una se activa en el composition root.
 */
@Injectable()
export class TypeOrmInstitutionAdapter implements InstitutionRepository {
  constructor(
    @InjectRepository(InstitutionOrmEntity)
    private readonly repo: Repository<InstitutionOrmEntity>,
  ) {}

  async save(institution: Institution): Promise<void> {
    await this.repo.save({
      id: institution.id,
      name: institution.name,
      country: institution.country,
      active: institution.active,
    });
  }

  async findById(id: string): Promise<Institution | null> {
    const row = await this.repo.findOneBy({ id });
    if (!row) return null;
    return new Institution(row.id, row.name, row.country, row.active);
  }

  async findAll(): Promise<Institution[]> {
    const rows = await this.repo.find();
    return rows.map((r) => new Institution(r.id, r.name, r.country, r.active));
  }
}
```

#### `typeorm-certificate.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateStatus } from '../../../../core/domain/entities/certificate.entity';
import { CertificateRepository } from '../../../../ports/outbound/certificate-repository.port';
import { CertificateOrmEntity } from './entities/certificate.orm-entity';

@Injectable()
export class TypeOrmCertificateAdapter implements CertificateRepository {
  constructor(
    @InjectRepository(CertificateOrmEntity)
    private readonly repo: Repository<CertificateOrmEntity>,
  ) {}

  async save(certificate: Certificate): Promise<void> {
    await this.repo.save({
      verificationCode: certificate.verificationCode,
      institutionId: certificate.institutionId,
      holderName: certificate.holderName,
      holderDocument: certificate.holderDocument,
      degreeTitle: certificate.degreeTitle,
      issuedAt: certificate.issuedAt,
      status: certificate.status,
      revokedAt: certificate.revokedAt ?? null,
      revocationReason: certificate.revocationReason ?? null,
    });
  }

  async findByVerificationCode(code: string): Promise<Certificate | null> {
    const row = await this.repo.findOneBy({ verificationCode: code });
    if (!row) return null;
    return this.rowToEntity(row);
  }

  async findByHolderDocument(document: string): Promise<Certificate[]> {
    const rows = await this.repo.findBy({ holderDocument: document });
    return rows.map((r) => this.rowToEntity(r));
  }

  private rowToEntity(row: CertificateOrmEntity): Certificate {
    const cert = new Certificate(
      row.verificationCode,
      row.institutionId,
      row.holderName,
      row.holderDocument,
      row.degreeTitle,
      row.issuedAt,
    );
    if (
      row.status === CertificateStatus.REVOCADO &&
      row.revokedAt !== null &&
      row.revocationReason !== null
    ) {
      cert.revoke(row.revocationReason, row.revokedAt);
    }
    return cert;
  }
}
```

#### `typeorm-blockchain.adapter.ts`

Crear en `src/adapters/outbound/blockchain/typeorm/typeorm-blockchain.adapter.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../../../../core/domain/value-objects/block';
import { CertificateLedger } from '../../../../ports/outbound/certificate-ledger.port';
import { BlockOrmEntity } from '../../persistence/typeorm/entities/block.orm-entity';

@Injectable()
export class TypeOrmBlockchainAdapter implements CertificateLedger {
  constructor(
    @InjectRepository(BlockOrmEntity)
    private readonly repo: Repository<BlockOrmEntity>,
  ) {}

  async append(data: string): Promise<Block> {
    await this.ensureGenesis();
    const lastRow = await this.repo.findOne({
      where: {},
      order: { index: 'DESC' },
    });
    const previous = new Block(lastRow!.index, lastRow!.timestamp, lastRow!.data, lastRow!.previousHash);
    const block = new Block(previous.index + 1, Date.now(), data, previous.hash);
    await this.repo.save({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      hash: block.hash,
    });
    return block;
  }

  async getChain(): Promise<Block[]> {
    await this.ensureGenesis();
    const rows = await this.repo.find({ order: { index: 'ASC' } });
    return rows.map((r) => new Block(r.index, r.timestamp, r.data, r.previousHash));
  }

  private async ensureGenesis(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      const genesis = Block.genesis();
      await this.repo.save({
        index: genesis.index,
        timestamp: genesis.timestamp,
        data: genesis.data,
        previousHash: genesis.previousHash,
        hash: genesis.hash,
      });
    }
  }
}
```

---

### Paso 4 — Crear la configuración TypeORM

Crear `src/configuration/database/typeorm.config.ts`:

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { InstitutionOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/institution.orm-entity';
import { CertificateOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/certificate.orm-entity';
import { BlockOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/block.orm-entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL_PG,
  entities: [InstitutionOrmEntity, CertificateOrmEntity, BlockOrmEntity],
  synchronize: true, // solo para desarrollo; en producción usar migraciones
  logging: process.env.NODE_ENV === 'development',
};
```

> **`synchronize: true`** crea/actualiza las tablas automáticamente al arrancar la app. Para producción, usar `typeorm migration:generate` y desactivar `synchronize`.

---

### Paso 5 — Actualizar el composition root

Este es el **único archivo del núcleo que cambia**. Modificar `src/configuration/dependency-injection/app.module.ts`:

**Agregar los imports de TypeORM:**

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../database/typeorm.config';
import { InstitutionOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/institution.orm-entity';
import { CertificateOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/certificate.orm-entity';
import { BlockOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/block.orm-entity';
import { TypeOrmInstitutionAdapter } from '../../adapters/outbound/persistence/typeorm/typeorm-institution.adapter';
import { TypeOrmCertificateAdapter } from '../../adapters/outbound/persistence/typeorm/typeorm-certificate.adapter';
import { TypeOrmBlockchainAdapter } from '../../adapters/outbound/blockchain/typeorm/typeorm-blockchain.adapter';
```

**Reemplazar en el decorador `@Module`:**

```typescript
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([
      InstitutionOrmEntity,
      CertificateOrmEntity,
      BlockOrmEntity,
    ]),
  ],
  controllers: [InstitutionsController, CertificatesController, BlockchainController],
  providers: [
    // ── ELIMINAR PrismaService (ya no es el adaptador activo) ──
    // PrismaService,

    // ── Outbound ports → adaptadores TypeORM/PostgreSQL ─────────
    { provide: INSTITUTION_REPOSITORY, useClass: TypeOrmInstitutionAdapter },
    { provide: CERTIFICATE_REPOSITORY, useClass: TypeOrmCertificateAdapter },
    { provide: CERTIFICATE_LEDGER,     useClass: TypeOrmBlockchainAdapter },
    { provide: CLOCK,                  useClass: SystemClockAdapter },

    // ── Error filter global ──────────────────────────────────────
    { provide: APP_FILTER, useClass: DomainErrorFilter },

    // ── Inbound ports → casos de uso (sin cambios) ───────────────
    {
      provide: REGISTER_INSTITUTION_PORT,
      useFactory: (institutions: InstitutionRepository) =>
        new RegisterInstitutionUseCase(institutions),
      inject: [INSTITUTION_REPOSITORY],
    },
    // ... (resto igual que antes)
  ],
})
export class AppModule {}
```

> Los adaptadores `SqliteInstitutionAdapter`, `SqliteCertificateAdapter` y `SqliteBlockchainAdapter` **permanecen en el repositorio** sin cambios. Solo dejan de estar registrados en el composition root. Para volver a SQLite, basta con revertir este archivo.

---

### Paso 6 — Variables de entorno

Agregar al archivo `.env` (crearlo si no existe):

```env
# SQLite (adaptadores existentes — seguirán compilando)
DATABASE_URL=file:./dev.db

# PostgreSQL (adaptadores nuevos — activos por defecto)
DATABASE_URL_PG=postgresql://postgres:certichain@localhost:5432/certichain
```

---

### Paso 7 — Arrancar y verificar

```bash
# 1. Compilar
pnpm run build

# 2. Levantar PostgreSQL si no está corriendo
docker run -d --name certichain-pg \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=certichain \
  -e POSTGRES_DB=certichain \
  postgres:16.4-alpine

# 3. Iniciar la aplicación
DATABASE_URL_PG=postgresql://postgres:certichain@localhost:5432/certichain pnpm run start:dev

# 4. Verificar que TypeORM creó las tablas (con synchronize: true lo hace automáticamente)
# Swagger UI: http://localhost:3000/api
```

---

## Criterio de aceptación

- [ ] `pnpm run build` compila sin errores.
- [ ] La app arranca conectando a PostgreSQL (se ven los logs de TypeORM al iniciar).
- [ ] Flujo completo funciona vía Swagger: registrar institución → emitir → verificar → revocar.
- [ ] Las tablas `institution`, `certificate`, `block` existen en PostgreSQL con los datos persistidos.
- [ ] Los adaptadores `SqliteInstitutionAdapter`, `SqliteCertificateAdapter`, `SqliteBlockchainAdapter` y `PrismaService` **siguen compilando** sin errores (no fueron eliminados).
- [ ] Revertir el `app.module.ts` a los adaptadores Prisma vuelve a funcionar con SQLite.
- [ ] `pnpm test` sigue pasando (los tests unitarios no usan ningún adaptador real).

---

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `package.json` | Agregar `@nestjs/typeorm`, `typeorm`, `pg`, `@types/pg` |
| `src/adapters/outbound/persistence/typeorm/entities/institution.orm-entity.ts` | **Nuevo** |
| `src/adapters/outbound/persistence/typeorm/entities/certificate.orm-entity.ts` | **Nuevo** |
| `src/adapters/outbound/persistence/typeorm/entities/block.orm-entity.ts` | **Nuevo** |
| `src/adapters/outbound/persistence/typeorm/typeorm-institution.adapter.ts` | **Nuevo** |
| `src/adapters/outbound/persistence/typeorm/typeorm-certificate.adapter.ts` | **Nuevo** |
| `src/adapters/outbound/blockchain/typeorm/typeorm-blockchain.adapter.ts` | **Nuevo** |
| `src/configuration/database/typeorm.config.ts` | **Nuevo** |
| `src/configuration/dependency-injection/app.module.ts` | **Modificar** (swap de adaptadores) |
| `.env` | Agregar `DATABASE_URL_PG` |
| `src/adapters/outbound/persistence/sqlite-*.adapter.ts` | Sin cambios (mantener) |
| `src/configuration/database/prisma.service.ts` | Sin cambios (mantener) |
| `src/core/` (dominio + casos de uso) | **Sin cambios** |
| `src/ports/` (puertos) | **Sin cambios** |

---

## Por qué esto demuestra la Arquitectura Hexagonal

La regla fundamental de la arquitectura es que **los adaptadores se adaptan a los puertos, nunca al revés**.

En esta tarea:
- Los **puertos** (`InstitutionRepository`, `CertificateRepository`, `CertificateLedger`) **no cambiaron ni una línea**.
- Los **casos de uso** (`IssueCertificateUseCase`, `VerifyCertificateUseCase`, etc.) **no cambiaron ni una línea**.
- Las **entidades de dominio** (`Institution`, `Certificate`, `Block`) **no cambiaron ni una línea**.
- Solo se agregaron nuevos adaptadores y se actualizó el composition root.

Este es el beneficio central de la Arquitectura Hexagonal: cambiar de SQLite a PostgreSQL, de Prisma a TypeORM, o de SQL a MongoDB en el futuro, **es un cambio de infraestructura, nunca un cambio de negocio**.

---

## Flujo de trabajo

```bash
git checkout -b feature/typeorm-postgresql
# ... implementar los pasos anteriores ...
pnpm run build && pnpm test
git push -u origin feature/typeorm-postgresql
# abrir Pull Request hacia main
```
