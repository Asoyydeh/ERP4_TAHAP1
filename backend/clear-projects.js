const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up project tables...');

  // Delete in order of child to parent constraints
  await prisma.boqItem.deleteMany({});
  await prisma.boqHeader.deleteMany({});
  await prisma.penawaranItem.deleteMany({});
  await prisma.penawaranHeader.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfqHeader.deleteMany({});
  await prisma.projectSubkon.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.projectJob.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('All project tables emptied successfully!');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
