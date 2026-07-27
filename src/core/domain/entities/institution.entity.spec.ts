import { Institution } from './institution.entity';
import {
  InactiveInstitutionError,
  InvalidInstitutionDataError,
} from '../exceptions/domain.errors';

describe('Institution (entidad de dominio)', () => {
  it('se crea activa por defecto', () => {
    const inst = new Institution('i1', 'Universidad Nacional de Ingeniería', 'Perú');
    expect(inst.active).toBe(true);
    expect(() => inst.ensureCanIssue()).not.toThrow();
  });

  it('una institución inactiva no puede emitir (RN-01)', () => {
    const inst = new Institution('i1', 'Instituto Clausurado', 'Perú', false);
    expect(() => inst.ensureCanIssue()).toThrow(InactiveInstitutionError);
  });

  it('rechaza nombres inválidos', () => {
    expect(() => new Institution('i1', 'UN', 'Perú')).toThrow(
      InvalidInstitutionDataError,
    );
  });
});
