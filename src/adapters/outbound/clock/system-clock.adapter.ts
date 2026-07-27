import { Injectable } from '@nestjs/common';
import { Clock } from '../../../ports/outbound/clock.port';

/** Adaptador outbound: implementación real del puerto Clock usando el reloj del sistema. */
@Injectable()
export class SystemClockAdapter implements Clock {
  now(): Date {
    return new Date();
  }
}
