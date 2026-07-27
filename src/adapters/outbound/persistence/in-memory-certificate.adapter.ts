import { Injectable } from '@nestjs/common';
import { Certificate } from '../../../core/domain/entities/certificate.entity';
import { CertificateRepository } from '../../../ports/outbound/certificate-repository.port';

/**
 * Adaptador outbound en memoria del puerto CertificateRepository.
 * Útil para tests y entornos de desarrollo sin base de datos.
 */
@Injectable()
export class InMemoryCertificateAdapter implements CertificateRepository {
  private readonly certificates = new Map<string, Certificate>();

  async save(certificate: Certificate): Promise<void> {
    this.certificates.set(certificate.verificationCode, certificate);
  }

  async findByVerificationCode(code: string): Promise<Certificate | null> {
    return this.certificates.get(code) ?? null;
  }

  async findByHolderDocument(document: string): Promise<Certificate[]> {
    return [...this.certificates.values()].filter(
      (c) => c.holderDocument === document,
    );
  }
}
