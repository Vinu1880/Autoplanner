// scripts/restore.ts
import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restore(fileName?: string) {
  try {
    // Déterminer le fichier à restaurer
    let filePath: string;
    
    if (fileName) {
      // Si un nom de fichier est fourni
      if (fs.existsSync(fileName)) {
        filePath = fileName;
      } else if (fs.existsSync(path.join('backups', fileName))) {
        filePath = path.join('backups', fileName);
      } else {
        throw new Error(`Fichier non trouvé : ${fileName}`);
      }
    } else {
      // Par défaut, utiliser le dernier backup
      filePath = path.join('backups', 'backup_latest.json');
      if (!fs.existsSync(filePath)) {
        throw new Error('Aucun backup trouvé. Utilisez d\'abord npm run backup');
      }
    }
    
    console.log(`📥 Restauration depuis ${filePath}...`);
    
    // Lire les données
    const backup = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const data = backup.data || backup; // Support ancien et nouveau format
    
    console.log(`📊 Backup du ${backup.backupDate || 'date inconnue'}`);
    if (backup.counts) {
      console.log(`   Contient :`, backup.counts);
    }
    
    // Désactiver les contraintes de clés étrangères temporairement
    await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
    
    console.log('🗑️  Nettoyage de la base de données...');
    
    // Nettoyer la base dans le bon ordre (inverse des dépendances)
    await prisma.auditLog.deleteMany();
    await prisma.shiftAssignment.deleteMany();
    await prisma.pikett.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();
    await prisma.rotationPattern.deleteMany();
    await prisma.outOfOfficeEvent.deleteMany();
    
    console.log('✅ Base de données nettoyée');
    console.log('📝 Restauration des données...');
    
    // Restaurer les données dans le bon ordre (respect des dépendances)
    
    // 1. Teams (pas de dépendances)
    if (data.teams && data.teams.length > 0) {
      console.log(`   - Restauration de ${data.teams.length} équipes...`);
      for (const team of data.teams) {
        const { lead, members, shifts, piketts, ...teamData } = team;
        await prisma.team.create({ data: teamData });
      }
    }
    
    // 2. Rotation Patterns (pas de dépendances)
    if (data.rotationPatterns && data.rotationPatterns.length > 0) {
      console.log(`   - Restauration de ${data.rotationPatterns.length} patterns de rotation...`);
      for (const pattern of data.rotationPatterns) {
        await prisma.rotationPattern.create({ data: pattern });
      }
    }
    
    // 3. Users (dépend de Teams)
    if (data.users && data.users.length > 0) {
      console.log(`   - Restauration de ${data.users.length} utilisateurs...`);
      for (const user of data.users) {
        const { team, leadingTeam, assignments, piketts, azureId, ...userData } = user;
        // Supprimer azureId qui n'existe plus dans le schéma
        await prisma.user.create({ data: userData });
      }
    }
    
    // 4. Shifts (dépend de Teams)
    if (data.shifts && data.shifts.length > 0) {
      console.log(`   - Restauration de ${data.shifts.length} shifts...`);
      for (const shift of data.shifts) {
        const { team, assignments, ...shiftData } = shift;
        await prisma.shift.create({ data: shiftData });
      }
    }
    
    // 5. Piketts (dépend de Teams et Users)
    if (data.piketts && data.piketts.length > 0) {
      console.log(`   - Restauration de ${data.piketts.length} piketts...`);
      for (const pikett of data.piketts) {
        const { team, user, ...pikettData } = pikett;
        await prisma.pikett.create({ data: pikettData });
      }
    }
    
    // 6. Shift Assignments (dépend de Shifts et Users)
    if (data.shiftAssignments && data.shiftAssignments.length > 0) {
      console.log(`   - Restauration de ${data.shiftAssignments.length} assignations...`);
      for (const assignment of data.shiftAssignments) {
        const { shift, user, ...assignmentData } = assignment;
        // Convertir la date string en Date si nécessaire
        const dataToInsert = {
          ...assignmentData,
          date: new Date(assignmentData.date),
          respondedAt: assignmentData.respondedAt ? new Date(assignmentData.respondedAt) : null
        };
        await prisma.shiftAssignment.create({ data: dataToInsert });
      }
    }
    
    // 7. Audit Logs (optionnel, pas de dépendances critiques)
    if (data.auditLogs && data.auditLogs.length > 0) {
      console.log(`   - Restauration de ${data.auditLogs.length} logs d'audit...`);
      for (const log of data.auditLogs) {
        await prisma.auditLog.create({ 
          data: {
            ...log,
            createdAt: new Date(log.createdAt)
          }
        });
      }
    }
    
    console.log('✅ Restauration terminée avec succès !');
    
    // Afficher les statistiques finales
    const counts = await prisma.$transaction([
      prisma.team.count(),
      prisma.user.count(),
      prisma.shift.count(),
      prisma.pikett.count(),
      prisma.rotationPattern.count(),
      prisma.shiftAssignment.count(),
    ]);
    
    console.log('\n📊 État de la base de données :');
    console.log(`   - ${counts[0]} équipes`);
    console.log(`   - ${counts[1]} utilisateurs`);
    console.log(`   - ${counts[2]} shifts`);
    console.log(`   - ${counts[3]} piketts`);
    console.log(`   - ${counts[4]} patterns de rotation`);
    console.log(`   - ${counts[5]} assignations`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'argument de ligne de commande
const fileName = process.argv[2];

// Exécuter la restauration
restore(fileName)
  .then(() => {
    console.log('\n✅ Base de données restaurée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });