import { Injectable } from '@nestjs/common';
import { Block } from '../../../core/domain/value-objects/block';
import { CertificateLedger } from '../../../ports/outbound/certificate-ledger.port';

/**
 * Adaptador outbound en memoria del puerto CertificateLedger.
 * Útil para tests sin base de datos. Podría reemplazarse por un adaptador
 * a Ethereum/Polygon testnet sin tocar dominio ni casos de uso.
 */
@Injectable()
export class InMemoryBlockchainAdapter implements CertificateLedger {
  private readonly chain: Block[] = [Block.genesis()];

  async append(data: string): Promise<Block> {
    const previous = this.chain[this.chain.length - 1];
    const block = new Block(previous.index + 1, Date.now(), data, previous.hash);
    this.chain.push(block);
    return block;
  }

  async getChain(): Promise<Block[]> {
    return [...this.chain];
  }
}
