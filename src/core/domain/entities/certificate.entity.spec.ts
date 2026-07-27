import { Certificate, CertificateStatus } from './certificate.entity';
import {
  CertificateAlreadyRevokedError,
  InvalidCertificateDataError,
} from '../exceptions/domain.errors';

describe('Certificate (entidad de dominio)', () => {
  const build = () =>
    new Certificate(
      'code-1',
      'inst-1',
      'María Fernanda Quispe',
      '74125836',
      'Ingeniera de Software',
      new Date('2026-07-17T15:30:00Z'),
    );

  it('se crea VIGENTE y con hash SHA-256 derivado del contenido (CP-01)', () => {
    const cert = build();
    expect(cert.status).toBe(CertificateStatus.VIGENTE);
    expect(cert.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cert.isIntact()).toBe(true);
  });

  it('dos certificados con distinto contenido tienen distinto hash', () => {
    const otro = new Certificate(
      'code-2',
      'inst-1',
      'Luis Alberto Rojas',
      '71234567',
      'Ingeniero Civil',
      new Date('2026-07-17T15:30:00Z'),
    );
    expect(otro.contentHash).not.toBe(build().contentHash);
  });

  it('detecta la alteración del contenido tras la emisión (RN-09)', () => {
    const cert = build();
    // simulamos un atacante que edita el título otorgado
    (cert as { degreeTitle: string }).degreeTitle = 'Doctora en Medicina';
    expect(cert.isIntact()).toBe(false);
  });

  it('se revoca correctamente (CP-02)', () => {
    const cert = build();
    cert.revoke('Error en el nombre del titular', new Date('2026-08-01T10:00:00Z'));
    expect(cert.status).toBe(CertificateStatus.REVOCADO);
    expect(cert.revocationReason).toBe('Error en el nombre del titular');
    expect(cert.revokedAt).toEqual(new Date('2026-08-01T10:00:00Z'));
  });

  it('no permite revocar dos veces (RN-05, CP-03)', () => {
    const cert = build();
    cert.revoke('motivo', new Date());
    expect(() => cert.revoke('otro motivo', new Date())).toThrow(
      CertificateAlreadyRevokedError,
    );
  });

  it('rechaza datos inválidos del titular', () => {
    expect(
      () =>
        new Certificate('c', 'i', 'XY', '74125836', 'Título válido', new Date()),
    ).toThrow(InvalidCertificateDataError);
    expect(
      () =>
        new Certificate('c', 'i', 'Nombre Válido', '123', 'Título válido', new Date()),
    ).toThrow(InvalidCertificateDataError);
  });
});
