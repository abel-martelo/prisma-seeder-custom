# Prisma Seeder Custom

Una herramienta de línea de comandos para generar y gestionar archivos de semillas (`seeds`) en proyectos con Prisma. Facilita la creación y administración de datos iniciales o de ejemplo en tu base de datos, asegurando un manejo eficiente y evitando duplicaciones.

---

## Características

- **Generación automática de archivos de semillas:**
  - Automatiza la creación de scripts de semillas para tus modelos en Prisma.
  - Los archivos se generan con nombres únicos y ordenados, utilizando un prefijo numérico incremental.

- **Prevención de duplicados:**
  - Evita la re-ejecución de semillas previamente aplicadas, registrando cada ejecución en la tabla `SeedExecution`.

- **Compatibilidad con migraciones:**
  - Integra la creación y ejecución de semillas dentro del flujo de migraciones de Prisma.

---

## Instalación

Instala esta herramienta con npm:

```bash
npm install prisma-seeder-custom

```

## Configuración inicial
Antes de comenzar, asegúrate de seguir estos pasos para configurar tu proyecto:

1. Define el modelo SeedExecution en tu archivo schema.prisma
Añade el siguiente modelo en tu archivo schema.prisma para registrar las semillas ejecutadas:

```prisma
model SeedExecution {
  id         Int      @id @default(autoincrement())
  seedName   String   @unique
  executedAt DateTime @default(now())
}
```
2. Aplica los cambios al esquema de la base de datos
```bash
npx prisma migrate dev --name add-seed-execution-model
```

---

## Uso

1. Generar un archivo de semilla
Ejecuta el siguiente comando para generar un archivo de semilla:
```bash
npx prisma-seeder-custom generate <nombre_del_modelo>
```
-<nombre_del_modelo>: Nombre del modelo en tu archivo schema.prisma (por ejemplo: User, Post, etc.).

-La herramienta generará un archivo en el directorio prisma/seeders con un nombre como 01_NombreDelModelo.js.

Ejemplo:

```bash
npx prisma-seeder-custom generate user
```

Esto generará un archivo prisma/seeders/01_User.js con la siguiente estructura básica:

```javascript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.upsert({
    where: { id: 1 }, // Cambiar según el modelo
    update: {},
    create: {
      name: 'Example Name',
      email: 'example@example.com',
      posts: {
        create: [
          {
            title: 'First Post',
            content: 'Content of the first post',
            published: true,
          },
        ],
      },
    },
  });
  console.log('user: ',user)
  console.log('✅ Datos insertados correctamente en user');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

2. Ejecutar todas las semillas

Para ejecutar todas las semillas en el directorio prisma/seeders, usa:
```bash
npx prisma-seeder-custom run
```
Esto hará lo siguiente:

1. Verificará si la tabla SeedExecution existe. Si no, ofrecerá crearla automáticamente.
2. Omitirá las semillas que ya han sido registradas en la tabla SeedExecution.
3. Ejecutará los scripts de semillas en orden ascendente según su nombre de archivo.
4. Registrará cada semilla ejecutada exitosamente en la tabla SeedExecution.

Ejemplo de salida:
```bash
📁 Carpeta de semillas: /proyecto/prisma/seeders
🗂️ Archivos de semillas ordenados: [ '01_User.js', '02_Post.js' ]
⚙️ Cargando y ejecutando módulo desde: /proyecto/prisma/seeders/01_User.js
✅ Semilla "01_User.js" ejecutada correctamente.
⚙️ Cargando y ejecutando módulo desde: /proyecto/prisma/seeders/02_Post.js
✅ Semilla "02_Post.js" ejecutada correctamente.
✅ Semillas ejecutadas correctamente.
```

## Contribuciones
Si tienes ideas para mejorar esta herramienta, ¡contribuye al repositorio en GitHub! Apreciaría su colaboración.
