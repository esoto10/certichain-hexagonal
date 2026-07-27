import type { VerifyCertificateOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de verificación de certificado. */
export interface IVerifyCertificatePort {
  execute(verificationCode: string): Promise<VerifyCertificateOutput>;
}

export const VERIFY_CERTIFICATE_PORT = Symbol('IVerifyCertificatePort');
