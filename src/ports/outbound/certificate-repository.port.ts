import { Certificate } from '../../core/domain/entities/certificate.entity';

/**
 * Puerto outbound: contrato de persistencia de certificados.
 */
export interface CertificateRepository {
  save(certificate: Certificate): Promise<void>;
  findByVerificationCode(code: string): Promise<Certificate | null>;
  findByHolderDocument(document: string): Promise<Certificate[]>;
}

/** Token para la inyección de dependencias de NestJS. */
export const CERTIFICATE_REPOSITORY = Symbol('CertificateRepository');
