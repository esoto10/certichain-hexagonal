import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateStatus } from '../../../../core/domain/entities/certificate.entity';
import { CertificateRepository } from '../../../../ports/outbound/certificate-repository.port';
import { CertificateOrmEntity } from './entities/certificate.orm-entity';

/**
 * Adaptador outbound: implementación TypeORM/PostgreSQL del puerto CertificateRepository.
 */
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
