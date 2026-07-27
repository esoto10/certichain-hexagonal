/**
 * Puerto outbound para obtener la hora actual. Abstraerlo permite
 * probar reglas dependientes del tiempo con fechas controladas.
 */
export interface Clock {
  now(): Date;
}

/** Token para la inyección de dependencias de NestJS. */
export const CLOCK = Symbol('Clock');
