import type { HolderCertificateOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de listado de certificados del titular. */
export interface IListHolderCertificatesPort {
  execute(holderDocument: string): Promise<HolderCertificateOutput[]>;
}

export const LIST_HOLDER_CERTIFICATES_PORT = Symbol('IListHolderCertificatesPort');
