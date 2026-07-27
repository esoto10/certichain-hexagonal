/**
 * Errores de negocio del dominio.
 * No dependen de NestJS ni de HTTP: la capa de presentación
 * decidirá cómo traducirlos (404, 403, 409, 422, 500).
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InstitutionNotFoundError extends DomainError {
  constructor(institutionId: string) {
    super(`No existe la institución con id ${institutionId}`);
  }
}

export class InactiveInstitutionError extends DomainError {
  constructor(institutionId: string) {
    super(`La institución ${institutionId} está inactiva y no puede emitir certificados`);
  }
}

export class InvalidInstitutionDataError extends DomainError {
  constructor(detail: string) {
    super(`Datos de institución inválidos: ${detail}`);
  }
}

export class CertificateNotFoundError extends DomainError {
  constructor(verificationCode: string) {
    super(`No existe un certificado con código de verificación ${verificationCode}`);
  }
}

export class CertificateAlreadyRevokedError extends DomainError {
  constructor(verificationCode: string) {
    super(`El certificado ${verificationCode} ya fue revocado`);
  }
}

export class NotIssuingInstitutionError extends DomainError {
  constructor(verificationCode: string) {
    super(`Solo la institución emisora puede revocar el certificado ${verificationCode}`);
  }
}

export class InvalidCertificateDataError extends DomainError {
  constructor(detail: string) {
    super(`Datos de certificado inválidos: ${detail}`);
  }
}

export class CorruptedChainError extends DomainError {
  constructor(blockIndex: number) {
    super(`La cadena de bloques está corrupta a partir del bloque ${blockIndex}`);
  }
}
