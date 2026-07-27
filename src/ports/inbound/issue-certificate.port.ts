import type { IssueCertificateInput, IssueCertificateOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de emisión de certificado. */
export interface IIssueCertificatePort {
  execute(input: IssueCertificateInput): Promise<IssueCertificateOutput>;
}

export const ISSUE_CERTIFICATE_PORT = Symbol('IIssueCertificatePort');
