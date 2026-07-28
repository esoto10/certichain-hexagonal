import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('block')
export class BlockOrmEntity {
  @PrimaryColumn({ type: 'int' })
  index: number;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ type: 'text' })
  data: string;

  @Column({ name: 'previous_hash', type: 'varchar', length: 64 })
  previousHash: string;

  @Column({ type: 'varchar', length: 64 })
  hash: string;
}
