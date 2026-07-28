import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { InstitutionOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/institution.orm-entity';
import { CertificateOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/certificate.orm-entity';
import { BlockOrmEntity } from '../../adapters/outbound/persistence/typeorm/entities/block.orm-entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL_PG,
  entities: [InstitutionOrmEntity, CertificateOrmEntity, BlockOrmEntity],
  synchronize: true, // solo para desarrollo; en producción usar migraciones
  logging: process.env.NODE_ENV === 'development',
};
