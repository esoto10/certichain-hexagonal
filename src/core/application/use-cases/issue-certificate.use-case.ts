import { randomUUID } from 'node:crypto';
import { Certificate } from '../../domain/entities/certificate.entity';
import { InstitutionNotFoundError } from '../../domain/exceptions/domain.errors';
import { CertificateRepository } from '../../../ports/outbound/certificate-repository.port';
import { InstitutionRepository } from '../../../ports/outbound/institution-repository.port';
import { Clock } from '../../../ports/outbound/clock.port';
import { CertificateLedger } from '../../../ports/outbound/certificate-ledger.port';
import {
  IssueCertificateInput,
  IssueCertificateOutput,
  LedgerEvent,
} from '../dto/certichain.dto';

/**
 * CU-02: Emitir certificado.
 * 1. La institución existe y está activa (RN-01).
 * 2. Se construye el certificado y su hash SHA-256 (RN-03).
 * 3. El hash se ancla como bloque de EMISION en la cadena.
 * 4. Se persiste el certificado con su código de verificación único (RF-04).
 */
export class IssueCertificateUseCase {
  constructor(
    private readonly institutions: InstitutionRepository,
    private readonly certificates: CertificateRepository,
    private readonly ledger: CertificateLedger,
    private readonly clock: Clock,
  ) {}

  async execute(input: IssueCertificateInput): Promise<IssueCertificateOutput> {
    const institution = await this.institutions.findById(input.institutionId);
    if (!institution) {
      throw new InstitutionNotFoundError(input.institutionId);
    }
    institution.ensureCanIssue();

    const certificate = new Certificate(
      randomUUID(),
      institution.id,
      input.holderName,
      input.holderDocument,
      input.degreeTitle,
      this.clock.now(),
    );

    const event: LedgerEvent = {
      type: 'EMISION',
      verificationCode: certificate.verificationCode,
      contentHash: certificate.contentHash,
      institutionId: institution.id,
      at: certificate.issuedAt.toISOString(),
    };
    const block = await this.ledger.append(JSON.stringify(event));

    await this.certificates.save(certificate);

    return {
      verificationCode: certificate.verificationCode,
      contentHash: certificate.contentHash,
      blockIndex: block.index,
      blockHash: block.hash,
      issuedAt: certificate.issuedAt.toISOString(),
    };
  }
}
