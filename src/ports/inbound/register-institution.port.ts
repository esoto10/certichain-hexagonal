import type { RegisterInstitutionInput, InstitutionOutput } from '../../core/application/dto/certichain.dto';

/** Puerto inbound: contrato que expone el caso de uso de registro de institución. */
export interface IRegisterInstitutionPort {
  execute(input: RegisterInstitutionInput): Promise<InstitutionOutput>;
}

export const REGISTER_INSTITUTION_PORT = Symbol('IRegisterInstitutionPort');
