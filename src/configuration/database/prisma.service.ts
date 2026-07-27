import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga el archivo .env si DATABASE_URL no está en el entorno.
 * En CI la variable llega como env del workflow, por lo que
 * este bloque no hace nada allí. En local, permite correr
 * los tests sin exportar la variable manualmente.
 */
if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    // Node 22+ tiene process.loadEnvFile() nativo (sin dotenv).
    (process as NodeJS.Process & { loadEnvFile?: (path: string) => void }).loadEnvFile?.(envPath);
  }
}

/**
 * Wrapper NestJS sobre PrismaClient.
 * Gestiona el ciclo de vida de la conexión y, en entorno de test,
 * limpia todas las tablas antes de cada suite para garantizar
 * aislamiento sin modificar ningún fichero de test.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (process.env.NODE_ENV === 'test') {
      // Jest establece NODE_ENV='test' automáticamente.
      // Limpiar en orden FK-safe: blocks → certificates → institutions
      await this.block.deleteMany();
      await this.certificate.deleteMany();
      await this.institution.deleteMany();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
