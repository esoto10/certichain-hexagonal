import {
  InactiveInstitutionError,
  InvalidInstitutionDataError,
} from '../exceptions/domain.errors';

/**
 * Institución educativa emisora de certificados.
 * RN-01: solo una institución registrada y activa puede emitir.
 */
export class Institution {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly country: string,
    public readonly active: boolean = true,
  ) {
    if (name.trim().length < 3 || name.trim().length > 120) {
      throw new InvalidInstitutionDataError(
        'el nombre debe tener entre 3 y 120 caracteres',
      );
    }
    if (country.trim().length === 0) {
      throw new InvalidInstitutionDataError('el país es obligatorio');
    }
  }

  ensureCanIssue(): void {
    if (!this.active) {
      throw new InactiveInstitutionError(this.id);
    }
  }
}
