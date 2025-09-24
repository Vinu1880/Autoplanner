// scripts/restore.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function restore(fileName: string) {
  console.log(`📥 Restauration depuis ${fileName}...`);
  
  const data = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
  
  // Nettoyer la base
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.rotationPattern.deleteMany();
  
  // Restaurer les données
  for (const team of data.teams) {
    await prisma.team.create({ data: team });
  }
  
  for (const user of data.users) {
    await prisma.user.create({ data: user });
  }
  
  for (const shift of data.shifts) {
    await prisma.shift.create({ data: shift });
  }
  
  for (const pattern of data.rotationPatterns || []) {
    await prisma.rotationPattern.create({ data: pattern });
  }
  
  for (const assignment of data.shiftAssignments || []) {
    await prisma.shiftAssignment.create({ data: assignment });
  }
  
  console.log('✅ Restauration terminée !');
}

const fileName = process.argv[2] || 'backup.json';
restore(fileName)
  .catch(console.error)
  .finally(() => prisma.$disconnect());