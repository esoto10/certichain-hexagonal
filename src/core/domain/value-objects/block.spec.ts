import { Block } from './block';

describe('Block (value object de la cadena)', () => {
  it('el bloque génesis es siempre idéntico', () => {
    expect(Block.genesis().hash).toBe(Block.genesis().hash);
    expect(Block.genesis().index).toBe(0);
  });

  it('el hash se deriva del contenido', () => {
    const a = new Block(1, 1000, 'voto-A', Block.genesis().hash);
    const b = new Block(1, 1000, 'voto-B', Block.genesis().hash);
    expect(a.hash).not.toBe(b.hash);
    expect(a.isIntact()).toBe(true);
  });

  it('un bloque encadena correctamente con su anterior', () => {
    const genesis = Block.genesis();
    const next = new Block(1, 1000, 'voto-A', genesis.hash);
    expect(next.isValidSuccessorOf(genesis)).toBe(true);
  });

  it('detecta un bloque que no encadena (previousHash incorrecto)', () => {
    const genesis = Block.genesis();
    const intruso = new Block(1, 1000, 'voto-A', 'hash-falso');
    expect(intruso.isValidSuccessorOf(genesis)).toBe(false);
  });

  it('detecta la manipulación del contenido de un bloque', () => {
    const genesis = Block.genesis();
    const block = new Block(1, 1000, 'voto por c1', genesis.hash);
    // simulamos un atacante que edita el dato guardado
    (block as { data: string }).data = 'voto por c2';
    expect(block.isIntact()).toBe(false);
    expect(block.isValidSuccessorOf(genesis)).toBe(false);
  });
});
