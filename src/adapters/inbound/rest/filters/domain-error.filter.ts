import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  CertificateAlreadyRevokedError,
  CertificateNotFoundError,
  CorruptedChainError,
  DomainError,
  InactiveInstitutionError,
  InstitutionNotFoundError,
  NotIssuingInstitutionError,
} from '../../../../core/domain/exceptions/domain.errors';

/**
 * Adaptador inbound: traduce errores de NEGOCIO a códigos HTTP.
 * El dominio no sabe qué es un 404 o un 409; esa es responsabilidad
 * exclusiva de este adaptador.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private statusFor(error: DomainError): number {
    if (
      error instanceof InstitutionNotFoundError ||
      error instanceof CertificateNotFoundError
    ) {
      return 404;
    }
    if (error instanceof NotIssuingInstitutionError) {
      return 403;
    }
    if (
      error instanceof InactiveInstitutionError ||
      error instanceof CertificateAlreadyRevokedError
    ) {
      return 409;
    }
    if (error instanceof CorruptedChainError) {
      return 500;
    }
    return 422; // datos que violan invariantes del dominio
  }

  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(this.statusFor(error)).json({
      error: error.name,
      message: error.message,
    });
  }
}
