import { Injectable } from '@nestjs/common';
import { Institution } from '../../../core/domain/entities/institution.entity';
import { InstitutionRepository } from '../../../ports/outbound/institution-repository.port';

/**
 * Adaptador outbound en memoria del puerto InstitutionRepository.
 * Útil para tests y entornos de desarrollo sin base de datos.
 */
@Injectable()
export class InMemoryInstitutionAdapter implements InstitutionRepository {
  private readonly institutions = new Map<string, Institution>();

  async save(institution: Institution): Promise<void> {
    this.institutions.set(institution.id, institution);
  }

  async findById(id: string): Promise<Institution | null> {
    return this.institutions.get(id) ?? null;
  }

  async findAll(): Promise<Institution[]> {
    return [...this.institutions.values()];
  }
}
