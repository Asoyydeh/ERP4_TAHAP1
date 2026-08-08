const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.document.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('Projects and documents deleted');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
