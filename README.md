# Prisma Seeder Custom

A command line tool to generate and manage seed files in Prisma projects. It facilitates the creation and management of initial or example data in your database, ensuring efficient management and avoiding duplication.

---

## Characteristics

- **Automatic generation of seed files:**
  - Automate the creation of seed scripts for your models in Prisma.
  - The files are generated with unique and ordered names, using the current date as a prefix.

- **Prevention of duplicates:**
  - Avoid re-executing previously applied seeds by logging each execution in the `SeedExecution` table.

- **Seed reversal:**
Removes the data inserted by the seeds in the reverse order of their execution.  

- **Migration support:**
  - Integrates the creation and execution of seeds within the Prisma migration flow.

---

## Installation

Install this tool with npm:

```bash
npm install prisma-seeder-custom
```

## Initial setup
Before you begin, be sure to follow these steps to set up your project:

1. Define the SeedExecution model in your schema.prisma file
Add the following model to your schema.prisma file to record the executed seeds:

```prisma
model SeedExecution {
  id         Int      @id @default(autoincrement())
  seedName   String   @unique
  executedAt DateTime @default(now())
}
```
2. Apply changes to the database schema
```bash
npx prisma migrate dev --name add-seed-execution-model
```

---

## Uso

## 1. ## Generate a seed file
Run the following command to generate a seed file:
```bash
npx prisma-seeder-custom generate <model_name>
```
-<model_name>: Name of the model in your schema.prisma file (for example: User, Post, etc.).

-The tool will generate a file in the prisma/seeders directory with a name like 01_ModelName.js.

Example:

```bash
npx prisma-seeder-custom generate user
```

This will generate a prisma/seeders/01_User.js file with the following basic structure:

```javascript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function main() {
  const user = await prisma.user.upsert({
    where: { id: 1 }, // Change depending on the model
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
  console.log('✅ Data successfully inserted into user');
}

export async function down() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        email: 'example@example.com', // Condition that identifies the data created by the seed
      },
    });
    console.log(`↩️ Rollback completed: ${deleted.count} records deleted.`);
  } catch (e) {
    console.error('❌ Error while performing rollback:', e.message);
    throw e;
  }
}
;
```

## 2. ## Run seeds

To run all the seeds in the prisma/seeders directory, use:
```bash
npx prisma-seeder-custom run
```
This will do the following:

1. It will check if the 'SeedExecution' table exists. If not, it will offer to create it automatically.
2. Will skip seeds that have already been registered in the 'SeedExecution' table.
3. It will run the seed scripts in ascending order based on their file name.
4. It will record each successfully executed seed in the 'SeedExecution' table.

Output example:
```bash
📁 Seeds folder: /project/prisma/seeders
🗂️ Sorted seed files: [ '20241027163726_User.js', '20241027163729_Post.js' ]
⚙️ Loading and running module from: /project/prisma/seeders/01_User.js
✅ Seed "01_User.js" executed successfully.
⚙️ Loading and running module from: /project/prisma/seeders/02_Post.js
✅ Seed "02_Post.js" executed successfully.
✅ Seeds executed correctly.
```

## 3. ## Reverse seeds

To revert all executed seeds, use:
```bash
npx prisma-seeder-custom rollback
```
Details about the rollback:

The seeds are reverted in the reverse order of their execution.

If a seed has dependencies, these must be handled manually in the seed file's down function, or you can configure onDelete: Cascade in your Prisma schema.

Example of a 'down' function in a seed file:
```javascript
export async function down() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        email: 'example@example.com', // Condition that identifies the data created by the seed
      },
    });
    console.log(`↩️ Rollback completado: ${deleted.count} registros eliminados.`);
  } catch (e) {
    console.error('❌ Error al realizar el rollback:', e.message);
    throw e;
  }
}
```

## Contributions
If you have ideas to improve this tool, contribute to the repository on GitHub! I would appreciate your collaboration.

## License
This project is licensed under the MIT License.
