import { createHash } from 'node:crypto';
import {
  CertificateAlreadyRevokedError,
  InvalidCertificateDataError,
} from '../exceptions/domain.errors';

export enum CertificateStatus {
  VIGENTE = 'VIGENTE',
  REVOCADO = 'REVOCADO',
}

/**
 * Raíz de agregado: el certificado académico.
 * Su hash SHA-256 se deriva del contenido canónico (RN-03), por lo que
 * cualquier alteración posterior es detectable (isIntact).
 * RN-05: un certificado revocado no puede revocarse de nuevo.
 */
export class Certificate {
  public readonly contentHash: string;
  private _status: CertificateStatus = CertificateStatus.VIGENTE;
  private _revokedAt?: Date;
  private _revocationReason?: string;

  constructor(
    public readonly verificationCode: string,
    public readonly institutionId: string,
    public readonly holderName: string,
    public readonly holderDocument: string,
    public readonly degreeTitle: string,
    public readonly issuedAt: Date,
  ) {
    if (holderName.trim().length < 3 || holderName.trim().length > 120) {
      throw new InvalidCertificateDataError(
        'el nombre del titular debe tener entre 3 y 120 caracteres',
      );
    }
    if (holderDocument.trim().length < 8 || holderDocument.trim().length > 20) {
      throw new InvalidCertificateDataError(
        'el documento del titular debe tener entre 8 y 20 caracteres',
      );
    }
    if (degreeTitle.trim().length < 3 || degreeTitle.trim().length > 200) {
      throw new InvalidCertificateDataError(
        'el título otorgado debe tener entre 3 y 200 caracteres',
      );
    }
    this.contentHash = this.computeHash();
  }

  /** Representación canónica: la que se hashea y se ancla en la cadena. */
  canonicalContent(): string {
    return JSON.stringify({
      verificationCode: this.verificationCode,
      institutionId: this.institutionId,
      holderName: this.holderName,
      holderDocument: this.holderDocument,
      degreeTitle: this.degreeTitle,
      issuedAt: this.issuedAt.toISOString(),
    });
  }

  computeHash(): string {
    return createHash('sha256').update(this.canonicalContent()).digest('hex');
  }

  /** El contenido actual coincide con el hash calculado en la emisión. */
  isIntact(): boolean {
    return this.contentHash === this.computeHash();
  }

  get status(): CertificateStatus {
    return this._status;
  }

  get revokedAt(): Date | undefined {
    return this._revokedAt;
  }

  get revocationReason(): string | undefined {
    return this._revocationReason;
  }

  revoke(reason: string, at: Date): void {
    if (this._status === CertificateStatus.REVOCADO) {
      throw new CertificateAlreadyRevokedError(this.verificationCode);
    }
    this._status = CertificateStatus.REVOCADO;
    this._revokedAt = at;
    this._revocationReason = reason;
  }
}
