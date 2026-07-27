import type { RevokeCertificateInput, RevokeCertificateOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de revocación de certificado. */
export interface IRevokeCertificatePort {
  execute(input: RevokeCertificateInput): Promise<RevokeCertificateOutput>;
}

export const REVOKE_CERTIFICATE_PORT = Symbol('IRevokeCertificatePort');
