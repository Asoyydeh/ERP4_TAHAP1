import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clients = [{ code: 'AFI', name: 'AFI' }, { code: 'MPI', name: 'MPI' }, { code: 'SSI', name: 'SSI' }, { code: 'UNI', name: 'UNI' }, { code: 'SFI', name: 'SFI' }, { code: 'JYM', name: 'JYM' }, { code: 'SHT', name: 'SHT' }, { code: 'TSH', name: 'TSH' }, { code: 'STJ', name: 'STJ' }, { code: 'XH', name: 'XH' }, { code: 'SQS', name: 'SQS' }, { code: 'SFM', name: 'SFM' }, { code: 'SVS', name: 'SVS' }, { code: 'YYF', name: 'YYF' }];
  for (const c of clients) {
    await prisma.masterClient.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  const companies = [{ code: 'MJK', name: 'MJK' }, { code: 'DJI', name: 'DJI' }, { code: 'IRI', name: 'IRI' }];
  for (const c of companies) {
    await prisma.masterCompany.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  console.log('Seed completed');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());