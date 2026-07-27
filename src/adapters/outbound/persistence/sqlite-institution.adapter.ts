import { Injectable } from '@nestjs/common';
import { Institution } from '../../../core/domain/entities/institution.entity';
import { InstitutionRepository } from '../../../ports/outbound/institution-repository.port';
import { PrismaService } from '../../../configuration/database/prisma.service';

/**
 * Adaptador outbound: implementación SQLite del puerto InstitutionRepository.
 * El mapeo entidad ↔ fila ocurre aquí; el dominio no sabe nada de Prisma.
 */
@Injectable()
export class SqliteInstitutionAdapter implements InstitutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(institution: Institution): Promise<void> {
    await this.prisma.institution.upsert({
      where: { id: institution.id },
      update: {
        name: institution.name,
        country: institution.country,
        active: institution.active,
      },
      create: {
        id: institution.id,
        name: institution.name,
        country: institution.country,
        active: institution.active,
      },
    });
  }

  async findById(id: string): Promise<Institution | null> {
    const row = await this.prisma.institution.findUnique({ where: { id } });
    if (!row) return null;
    return new Institution(row.id, row.name, row.country, row.active);
  }

  async findAll(): Promise<Institution[]> {
    const rows = await this.prisma.institution.findMany();
    return rows.map((row) => new Institution(row.id, row.name, row.country, row.active));
  }
}
