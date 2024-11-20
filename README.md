# Prisma Seed Custom

Una herramienta de línea de comandos para generar automáticamente archivos de semillas (`seeds`) para Prisma, facilitando la creación y administración de datos de ejemplo o iniciales en tu base de datos.

## Características

- **Generación automática de semillas**: Crea archivos de semillas para tus modelos de Prisma.
- **Evita duplicación de datos**: Asegúrate de que los datos no se inserten si ya existen en la base de datos.
- **Insertar datos personalizados**: Te permite insertar datos personalizados para cada modelo según sea necesario.

## Nota
Mi primera biblioteca , puede que tenga errores que se me hayan escapado, pido su comprensión.   

## Instalación

Puedes instalar esta herramienta en tu proyecto con npm:

```bash
npm install prisma-seeder-custom
```

Antes de empezar, agrega lo siguiente a tu archivo schema.prisma y ejecuta la migración:
```prisma
model SeedExecution {
  id         Int      @id @default(autoincrement())
  seedName   String   @unique
  executedAt DateTime @default(now())
}
```
Esto definirá la tabla SeedExecution que se usará para registrar qué semillas se han ejecutado en tu base de datos y evitar la duplidad de datos.
