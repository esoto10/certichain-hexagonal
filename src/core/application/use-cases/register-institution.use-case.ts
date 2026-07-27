import { randomUUID } from 'node:crypto';
import { Institution } from '../../domain/entities/institution.entity';
import { InstitutionRepository } from '../../../ports/outbound/institution-repository.port';
import {
  InstitutionOutput,
  RegisterInstitutionInput,
} from '../dto/certichain.dto';

export class RegisterInstitutionUseCase {
  constructor(private readonly institutions: InstitutionRepository) {}

  async execute(input: RegisterInstitutionInput): Promise<InstitutionOutput> {
    // Las invariantes (nombre, país) las hace cumplir la entidad al construirse.
    const institution = new Institution(randomUUID(), input.name, input.country);
    await this.institutions.save(institution);
    return {
      id: institution.id,
      name: institution.name,
      country: institution.country,
      active: institution.active,
    };
  }
}
