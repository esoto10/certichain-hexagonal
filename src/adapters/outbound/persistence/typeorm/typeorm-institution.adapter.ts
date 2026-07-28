import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../../../../core/domain/entities/institution.entity';
import { InstitutionRepository } from '../../../../ports/outbound/institution-repository.port';
import { InstitutionOrmEntity } from './entities/institution.orm-entity';

/**
 * Adaptador outbound: implementación TypeORM/PostgreSQL del puerto InstitutionRepository.
 * Puede coexistir con SqliteInstitutionAdapter; solo una se activa en el composition root.
 */
@Injectable()
export class TypeOrmInstitutionAdapter implements InstitutionRepository {
  constructor(
    @InjectRepository(InstitutionOrmEntity)
    private readonly repo: Repository<InstitutionOrmEntity>,
  ) {}

  async save(institution: Institution): Promise<void> {
    await this.repo.save({
      id: institution.id,
      name: institution.name,
      country: institution.country,
      active: institution.active,
    });
  }

  async findById(id: string): Promise<Institution | null> {
    const row = await this.repo.findOneBy({ id });
    if (!row) return null;
    return new Institution(row.id, row.name, row.country, row.active);
  }

  async findAll(): Promise<Institution[]> {
    const rows = await this.repo.find();
    return rows.map((r) => new Institution(r.id, r.name, r.country, r.active));
  }
}
