import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('certificate')
export class CertificateOrmEntity {
  @PrimaryColumn({ name: 'verification_code', type: 'varchar', length: 36 })
  verificationCode: string;

  @Column({ name: 'institution_id', type: 'varchar', length: 36 })
  institutionId: string;

  @Column({ name: 'holder_name', type: 'varchar', length: 120 })
  holderName: string;

  @Column({ name: 'holder_document', type: 'varchar', length: 20 })
  holderDocument: string;

  @Column({ name: 'degree_title', type: 'varchar', length: 200 })
  degreeTitle: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'VIGENTE' })
  status: string;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true, default: null })
  revokedAt: Date | null;

  @Column({ name: 'revocation_reason', type: 'varchar', length: 500, nullable: true, default: null })
  revocationReason: string | null;
}
