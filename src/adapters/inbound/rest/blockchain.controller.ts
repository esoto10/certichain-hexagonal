import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VERIFY_CHAIN_PORT } from '../../../ports/inbound/verify-chain.port';
import type { IVerifyChainPort } from '../../../ports/inbound/verify-chain.port';
import { CERTIFICATE_LEDGER } from '../../../ports/outbound/certificate-ledger.port';
import type { CertificateLedger } from '../../../ports/outbound/certificate-ledger.port';

/**
 * Adaptador inbound REST: expone la cadena de bloques para transparencia y auditoría.
 */
@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    @Inject(VERIFY_CHAIN_PORT) private readonly verifyChain: IVerifyChainPort,
    @Inject(CERTIFICATE_LEDGER) private readonly ledger: CertificateLedger,
  ) {}

  /** Transparencia: cualquiera puede inspeccionar la cadena (RF-08). */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los bloques de la cadena' })
  @ApiResponse({ status: 200, description: 'Lista de bloques de la blockchain (sin datos personales del titular)' })
  chain() {
    return this.ledger.getChain();
  }

  /** Auditoría pública de integridad (RF-07). */
  @Get('verify')
  @ApiOperation({ summary: 'Verificar la integridad de toda la blockchain' })
  @ApiResponse({ status: 200, description: 'Resultado de la auditoría: { valid: boolean, totalBlocks: number }' })
  @ApiResponse({ status: 500, description: 'La cadena está corrompida' })
  verify() {
    return this.verifyChain.execute();
  }
}
