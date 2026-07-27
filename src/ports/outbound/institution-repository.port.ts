import { Institution } from '../../core/domain/entities/institution.entity';

/**
 * Puerto outbound: contrato de persistencia definido por la aplicación.
 * La infraestructura (adaptadores outbound) lo implementará; el dominio
 * y la aplicación nunca saben si detrás hay memoria, SQLite o PostgreSQL.
 */
export interface InstitutionRepository {
  save(institution: Institution): Promise<void>;
  findById(id: string): Promise<Institution | null>;
  findAll(): Promise<Institution[]>;
}

/** Token para la inyección de dependencias de NestJS. */
export const INSTITUTION_REPOSITORY = Symbol('InstitutionRepository');
