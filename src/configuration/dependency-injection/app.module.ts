import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

// Outbound ports (tokens + interfaces)
import { INSTITUTION_REPOSITORY, InstitutionRepository } from '../../ports/outbound/institution-repository.port';
import { CERTIFICATE_REPOSITORY, CertificateRepository } from '../../ports/outbound/certificate-repository.port';
import { CLOCK, Clock } from '../../ports/outbound/clock.port';
import { CERTIFICATE_LEDGER, CertificateLedger } from '../../ports/outbound/certificate-ledger.port';

// Inbound ports (tokens)
import { REGISTER_INSTITUTION_PORT } from '../../ports/inbound/register-institution.port';
import { ISSUE_CERTIFICATE_PORT } from '../../ports/inbound/issue-certificate.port';
import { VERIFY_CERTIFICATE_PORT } from '../../ports/inbound/verify-certificate.port';
import { REVOKE_CERTIFICATE_PORT } from '../../ports/inbound/revoke-certificate.port';
import { VERIFY_CHAIN_PORT } from '../../ports/inbound/verify-chain.port';
import { LIST_HOLDER_CERTIFICATES_PORT } from '../../ports/inbound/list-holder-certificates.port';

// Core: casos de uso
import { RegisterInstitutionUseCase } from '../../core/application/use-cases/register-institution.use-case';
import { IssueCertificateUseCase } from '../../core/application/use-cases/issue-certificate.use-case';
import { VerifyCertificateUseCase } from '../../core/application/use-cases/verify-certificate.use-case';
import { RevokeCertificateUseCase } from '../../core/application/use-cases/revoke-certificate.use-case';
import { VerifyChainUseCase } from '../../core/application/use-cases/verify-chain.use-case';
import { ListHolderCertificatesUseCase } from '../../core/application/use-cases/list-holder-certificates.use-case';

// Adapters outbound: implementaciones concretas
import { PrismaService } from '../database/prisma.service';
import { SqliteBlockchainAdapter } from '../../adapters/outbound/blockchain/sqlite-blockchain.adapter';
import { SqliteInstitutionAdapter } from '../../adapters/outbound/persistence/sqlite-institution.adapter';
import { SqliteCertificateAdapter } from '../../adapters/outbound/persistence/sqlite-certificate.adapter';
import { SystemClockAdapter } from '../../adapters/outbound/clock/system-clock.adapter';

// Adapters inbound: controllers REST y filtro de errores
import { InstitutionsController } from '../../adapters/inbound/rest/institutions.controller';
import { CertificatesController } from '../../adapters/inbound/rest/certificates.controller';
import { BlockchainController } from '../../adapters/inbound/rest/blockchain.controller';
import { DomainErrorFilter } from '../../adapters/inbound/rest/filters/domain-error.filter';

/**
 * COMPOSITION ROOT — Arquitectura Hexagonal.
 *
 * Aquí (y solo aquí) se decide qué adaptador satisface cada puerto.
 * Para migrar a PostgreSQL o a una blockchain real basta con cambiar
 * los `useClass` de los outbound ports en este archivo.
 *
 * Flujo de dependencias:
 *   Adapters inbound (REST) → ports inbound → core (use-cases)
 *   Core (use-cases) → ports outbound → adapters outbound (Prisma/SQLite)
 */
@Module({
  controllers: [InstitutionsController, CertificatesController, BlockchainController],
  providers: [
    // ── Infraestructura transversal ──────────────────────────────────────
    PrismaService,

    // ── Outbound ports → adaptadores SQLite ─────────────────────────────
    { provide: INSTITUTION_REPOSITORY, useClass: SqliteInstitutionAdapter },
    { provide: CERTIFICATE_REPOSITORY, useClass: SqliteCertificateAdapter },
    { provide: CERTIFICATE_LEDGER,     useClass: SqliteBlockchainAdapter },
    { provide: CLOCK,                  useClass: SystemClockAdapter },

    // ── Error filter global ──────────────────────────────────────────────
    { provide: APP_FILTER, useClass: DomainErrorFilter },

    // ── Inbound ports → casos de uso (pure classes, sin decoradores) ─────
    {
      provide: REGISTER_INSTITUTION_PORT,
      useFactory: (institutions: InstitutionRepository) =>
        new RegisterInstitutionUseCase(institutions),
      inject: [INSTITUTION_REPOSITORY],
    },
    {
      provide: ISSUE_CERTIFICATE_PORT,
      useFactory: (
        institutions: InstitutionRepository,
        certificates: CertificateRepository,
        ledger: CertificateLedger,
        clock: Clock,
      ) => new IssueCertificateUseCase(institutions, certificates, ledger, clock),
      inject: [INSTITUTION_REPOSITORY, CERTIFICATE_REPOSITORY, CERTIFICATE_LEDGER, CLOCK],
    },
    {
      provide: VERIFY_CERTIFICATE_PORT,
      useFactory: (
        certificates: CertificateRepository,
        institutions: InstitutionRepository,
        ledger: CertificateLedger,
      ) => new VerifyCertificateUseCase(certificates, institutions, ledger),
      inject: [CERTIFICATE_REPOSITORY, INSTITUTION_REPOSITORY, CERTIFICATE_LEDGER],
    },
    {
      provide: REVOKE_CERTIFICATE_PORT,
      useFactory: (
        certificates: CertificateRepository,
        ledger: CertificateLedger,
        clock: Clock,
      ) => new RevokeCertificateUseCase(certificates, ledger, clock),
      inject: [CERTIFICATE_REPOSITORY, CERTIFICATE_LEDGER, CLOCK],
    },
    {
      provide: VERIFY_CHAIN_PORT,
      useFactory: (ledger: CertificateLedger) => new VerifyChainUseCase(ledger),
      inject: [CERTIFICATE_LEDGER],
    },
    {
      provide: LIST_HOLDER_CERTIFICATES_PORT,
      useFactory: (certificates: CertificateRepository) =>
        new ListHolderCertificatesUseCase(certificates),
      inject: [CERTIFICATE_REPOSITORY],
    },
  ],
})
export class AppModule {}
