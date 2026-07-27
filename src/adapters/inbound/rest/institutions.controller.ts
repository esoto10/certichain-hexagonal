import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { REGISTER_INSTITUTION_PORT } from '../../../ports/inbound/register-institution.port';
import type { IRegisterInstitutionPort } from '../../../ports/inbound/register-institution.port';
import { INSTITUTION_REPOSITORY } from '../../../ports/outbound/institution-repository.port';
import type { InstitutionRepository } from '../../../ports/outbound/institution-repository.port';
import { RegisterInstitutionRequest } from './dtos/requests.dto';

/**
 * Adaptador inbound REST: traduce HTTP ↔ puerto inbound IRegisterInstitutionPort.
 * No contiene ni una sola regla de negocio.
 */
@ApiTags('Instituciones')
@Controller('institutions')
export class InstitutionsController {
  constructor(
    @Inject(REGISTER_INSTITUTION_PORT)
    private readonly registerInstitution: IRegisterInstitutionPort,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutions: InstitutionRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva institución emisora' })
  @ApiResponse({ status: 201, description: 'Institución registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (campos requeridos faltantes)' })
  @ApiResponse({ status: 422, description: 'Nombre demasiado corto (mínimo 3 caracteres, RN-02)' })
  register(@Body() body: RegisterInstitutionRequest) {
    return this.registerInstitution.execute(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las instituciones registradas' })
  @ApiResponse({ status: 200, description: 'Lista de instituciones' })
  list() {
    return this.institutions.findAll();
  }
}
