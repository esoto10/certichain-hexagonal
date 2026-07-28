import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../../../../core/domain/value-objects/block';
import { CertificateLedger } from '../../../../ports/outbound/certificate-ledger.port';
import { BlockOrmEntity } from '../../persistence/typeorm/entities/block.orm-entity';

/**
 * Adaptador outbound: implementación TypeORM/PostgreSQL del puerto CertificateLedger.
 */
@Injectable()
export class TypeOrmBlockchainAdapter implements CertificateLedger {
  constructor(
    @InjectRepository(BlockOrmEntity)
    private readonly repo: Repository<BlockOrmEntity>,
  ) {}

  async append(data: string): Promise<Block> {
    await this.ensureGenesis();
    const lastRow = await this.repo.findOne({
      where: {},
      order: { index: 'DESC' },
    });
    const previous = new Block(
      lastRow!.index,
      Number(lastRow!.timestamp),
      lastRow!.data,
      lastRow!.previousHash,
    );
    const block = new Block(previous.index + 1, Date.now(), data, previous.hash);
    await this.repo.save({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      hash: block.hash,
    });
    return block;
  }

  async getChain(): Promise<Block[]> {
    await this.ensureGenesis();
    const rows = await this.repo.find({ order: { index: 'ASC' } });
    return rows.map(
      (r) => new Block(r.index, Number(r.timestamp), r.data, r.previousHash),
    );
  }

  private async ensureGenesis(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      const genesis = Block.genesis();
      await this.repo.save({
        index: genesis.index,
        timestamp: genesis.timestamp,
        data: genesis.data,
        previousHash: genesis.previousHash,
        hash: genesis.hash,
      });
    }
  }
}
