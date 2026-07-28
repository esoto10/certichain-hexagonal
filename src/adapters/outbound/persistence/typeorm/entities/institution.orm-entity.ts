import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('institution')
export class InstitutionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
