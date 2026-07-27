import { CertificateRepository } from '../../../ports/outbound/certificate-repository.port';
import { HolderCertificateOutput } from '../dto/certichain.dto';

/** CU-06: el titular consulta los certificados emitidos a su nombre. */
export class ListHolderCertificatesUseCase {
  constructor(private readonly certificates: CertificateRepository) {}

  async execute(holderDocument: string): Promise<HolderCertificateOutput[]> {
    const certs = await this.certificates.findByHolderDocument(holderDocument);
    return certs.map((c) => ({
      verificationCode: c.verificationCode,
      degreeTitle: c.degreeTitle,
      institutionId: c.institutionId,
      issuedAt: c.issuedAt.toISOString(),
      status: c.status,
    }));
  }
}
