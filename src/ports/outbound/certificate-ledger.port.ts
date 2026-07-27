import { Block } from '../../core/domain/value-objects/block';

/**
 * Puerto outbound hacia el "libro mayor": la blockchain donde se anclan
 * las emisiones y revocaciones. La capa de aplicación solo conoce
 * este contrato; la implementación (cadena simulada hoy, una
 * testnet real mañana) vive en los adaptadores outbound.
 */
export interface CertificateLedger {
  /** Ancla un dato como nuevo bloque y devuelve el bloque creado. */
  append(data: string): Promise<Block>;
  /** Devuelve la cadena completa, empezando por el bloque génesis. */
  getChain(): Promise<Block[]>;
}

/** Token para la inyección de dependencias de NestJS. */
export const CERTIFICATE_LEDGER = Symbol('CertificateLedger');
