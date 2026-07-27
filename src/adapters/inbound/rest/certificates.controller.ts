import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ISSUE_CERTIFICATE_PORT } from '../../../ports/inbound/issue-certificate.port';
import type { IIssueCertificatePort } from '../../../ports/inbound/issue-certificate.port';
import { VERIFY_CERTIFICATE_PORT } from '../../../ports/inbound/verify-certificate.port';
import type { IVerifyCertificatePort } from '../../../ports/inbound/verify-certificate.port';
import { REVOKE_CERTIFICATE_PORT } from '../../../ports/inbound/revoke-certificate.port';
import type { IRevokeCertificatePort } from '../../../ports/inbound/revoke-certificate.port';
import { LIST_HOLDER_CERTIFICATES_PORT } from '../../../ports/inbound/list-holder-certificates.port';
import type { IListHolderCertificatesPort } from '../../../ports/inbound/list-holder-certificates.port';
import {
  IssueCertificateRequest,
  RevokeCertificateRequest,
} from './dtos/requests.dto';

/**
 * Adaptador inbound REST: traduce HTTP ↔ puertos inbound de certificados.
 */
@ApiTags('Certificados')
@Controller()
export class CertificatesController {
  constructor(
    @Inject(ISSUE_CERTIFICATE_PORT) private readonly issueCertificate: IIssueCertificatePort,
    @Inject(VERIFY_CERTIFICATE_PORT) private readonly verifyCertificate: IVerifyCertificatePort,
    @Inject(REVOKE_CERTIFICATE_PORT) private readonly revokeCertificate: IRevokeCertificatePort,
    @Inject(LIST_HOLDER_CERTIFICATES_PORT) private readonly listHolderCertificates: IListHolderCertificatesPort,
  ) {}

  @Post('certificates')
  @ApiOperation({ summary: 'Emitir un nuevo certificado académico' })
  @ApiResponse({ status: 201, description: 'Certificado emitido y anclado en la blockchain' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (campos requeridos faltantes)' })
  @ApiResponse({ status: 404, description: 'Institución no encontrada (RN-01)' })
  @ApiResponse({ status: 409, description: 'Institución inactiva (RN-03)' })
  issue(@Body() body: IssueCertificateRequest) {
    return this.issueCertificate.execute(body);
  }

  /** Verificación pública (RN-07): no requiere autenticación. */
  @Get('certificates/:code/verify')
  @ApiOperation({ summary: 'Verificar un certificado por su código de verificación' })
  @ApiParam({ name: 'code', description: 'Código de verificación único del certificado' })
  @ApiResponse({ status: 200, description: 'Resultado de la verificación (VALIDO o REVOCADO)' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  verify(@Param('code') code: string) {
    return this.verifyCertificate.execute(code);
  }

  @Post('certificates/:code/revoke')
  @ApiOperation({ summary: 'Revocar un certificado emitido' })
  @ApiParam({ name: 'code', description: 'Código de verificación del certificado a revocar' })
  @ApiResponse({ status: 201, description: 'Certificado revocado y bloque añadido a la blockchain' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (campos requeridos faltantes)' })
  @ApiResponse({ status: 403, description: 'Solo la institución emisora puede revocar (RN-04)' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 409, description: 'Certificado ya revocado (RN-05)' })
  revoke(@Param('code') code: string, @Body() body: RevokeCertificateRequest) {
    return this.revokeCertificate.execute({
      verificationCode: code,
      institutionId: body.institutionId,
      reason: body.reason,
    });
  }

  @Get('holders/:document/certificates')
  @ApiOperation({ summary: 'Listar los certificados de un titular por número de documento' })
  @ApiParam({ name: 'document', description: 'Número de documento del titular' })
  @ApiResponse({ status: 200, description: 'Lista de certificados del titular' })
  byHolder(@Param('document') document: string) {
    return this.listHolderCertificates.execute(document);
  }
}
