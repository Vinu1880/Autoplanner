// scripts/backup.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function backup() {
  console.log('📦 Création de la sauvegarde...');
  
  const data = {
    teams: await prisma.team.findMany(),
    users: await prisma.user.findMany(),
    shifts: await prisma.shift.findMany(),
    rotationPatterns: await prisma.rotationPattern.findMany(),
    shiftAssignments: await prisma.shiftAssignment.findMany(),
    timestamp: new Date().toISOString()
  };
  
  const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  
  console.log(`✅ Sauvegarde créée: ${fileName}`);
  console.log(`   - ${data.teams.length} équipes`);
  console.log(`   - ${data.users.length} utilisateurs`);
  console.log(`   - ${data.shifts.length} shifts`);
  console.log(`   - ${data.rotationPatterns.length} patterns de rotation`);
  console.log(`   - ${data.shiftAssignments.length} assignations`);
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());