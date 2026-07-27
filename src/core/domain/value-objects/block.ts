import { createHash } from 'node:crypto';

/**
 * Value object: un bloque de la cadena.
 * Es inmutable y su hash se deriva de su contenido, así que
 * cualquier alteración del contenido invalida el hash y rompe
 * el encadenamiento con el bloque siguiente.
 */
export class Block {
  public readonly hash: string;

  constructor(
    public readonly index: number,
    public readonly timestamp: number,
    public readonly data: string,
    public readonly previousHash: string,
  ) {
    this.hash = this.computeHash();
  }

  computeHash(): string {
    return createHash('sha256')
      .update(`${this.index}|${this.timestamp}|${this.data}|${this.previousHash}`)
      .digest('hex');
  }

  /** El hash almacenado coincide con el que se deriva del contenido actual. */
  isIntact(): boolean {
    return this.hash === this.computeHash();
  }

  /** Este bloque encadena correctamente con el anterior. */
  isValidSuccessorOf(previous: Block): boolean {
    return (
      this.index === previous.index + 1 &&
      this.previousHash === previous.hash &&
      this.isIntact()
    );
  }

  /** Primer bloque de toda cadena, idéntico para todas. */
  static genesis(): Block {
    return new Block(0, 0, 'GENESIS', '0'.repeat(64));
  }
}
