import { Injectable } from '@nestjs/common';
import {
  Certificate,
  CertificateStatus,
} from '../../../core/domain/entities/certificate.entity';
import { CertificateRepository } from '../../../ports/outbound/certificate-repository.port';
import { PrismaService } from '../../../configuration/database/prisma.service';

/** Forma de la fila tal como la devuelve Prisma para el modelo Certificate. */
type CertificateRow = {
  verificationCode: string;
  institutionId: string;
  holderName: string;
  holderDocument: string;
  degreeTitle: string;
  issuedAt: Date;
  status: string;
  revokedAt: Date | null;
  revocationReason: string | null;
};

/**
 * Adaptador outbound: implementación SQLite del puerto CertificateRepository.
 * Persiste estado REVOCADO, revokedAt y revocationReason.
 */
@Injectable()
export class SqliteCertificateAdapter implements CertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(certificate: Certificate): Promise<void> {
    await this.prisma.certificate.upsert({
      where: { verificationCode: certificate.verificationCode },
      update: {
        status: certificate.status,
        revokedAt: certificate.revokedAt ?? null,
        revocationReason: certificate.revocationReason ?? null,
      },
      create: {
        verificationCode: certificate.verificationCode,
        institutionId: certificate.institutionId,
        holderName: certificate.holderName,
        holderDocument: certificate.holderDocument,
        degreeTitle: certificate.degreeTitle,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        revokedAt: certificate.revokedAt ?? null,
        revocationReason: certificate.revocationReason ?? null,
      },
    });
  }

  async findByVerificationCode(code: string): Promise<Certificate | null> {
    const row = await this.prisma.certificate.findUnique({
      where: { verificationCode: code },
    });
    if (!row) return null;
    return this.rowToEntity(row);
  }

  async findByHolderDocument(document: string): Promise<Certificate[]> {
    const rows = await this.prisma.certificate.findMany({
      where: { holderDocument: document },
    });
    return rows.map((row) => this.rowToEntity(row));
  }

  private rowToEntity(row: CertificateRow): Certificate {
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
