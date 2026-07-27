import type { ChainVerificationOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de auditoría de la cadena. */
export interface IVerifyChainPort {
  execute(): Promise<ChainVerificationOutput>;
}

export const VERIFY_CHAIN_PORT = Symbol('IVerifyChainPort');
