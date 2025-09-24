// app/api/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Créer des assignations de shifts (bulk)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, assignments } = body;
    
    // Vérifier que le shift existe
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });
    
    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }
    
    // Créer les assignations en bulk
    const createdAssignments = await Promise.all(
      assignments.map(async (assignment: any) => {
        try {
          // Vérifier si l'assignation existe déjà
          const existing = await prisma.shiftAssignment.findUnique({
            where: {
              date_shiftId_userId: {
                date: new Date(assignment.date),
                shiftId: shiftId,
                userId: assignment.userId
              }
            }
          });
          
          if (existing) {
            // Mettre à jour si elle existe
            return await prisma.shiftAssignment.update({
              where: { id: existing.id },
              data: {
                status: assignment.status || 'PENDING',
                reason: assignment.reason
              }
            });
          }
          
          // Créer une nouvelle assignation
          return await prisma.shiftAssignment.create({
            data: {
              date: new Date(assignment.date),
              shiftId: shiftId,
              userId: assignment.userId,
              status: assignment.status || 'PENDING',
              reason: assignment.reason
            }
          });
        } catch (error) {
          console.error('Error creating assignment:', error);
          return null;
        }
      })
    );
    
    // Filtrer les assignations nulles (erreurs)
    const successfulAssignments = createdAssignments.filter(a => a !== null);
    
    // Mettre à jour le compteur d'utilisation du shift
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        usageCount: { increment: successfulAssignments.length },
        lastUsedAt: new Date()
      }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'ASSIGNMENT',
        entityId: shiftId,
        data: { count: successfulAssignments.length }
      }
    });
    
    return NextResponse.json({
      success: true,
      created: successfulAssignments.length,
      assignments: successfulAssignments
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating assignments:', error);
    return NextResponse.json(
      { error: 'Failed to create assignments' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les assignations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const shiftId = searchParams.get('shiftId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (shiftId) where.shiftId = shiftId;
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const assignments = await prisma.shiftAssignment.findMany({
      where,
      include: {
        shift: {
          include: {
            team: true
          }
        },
        user: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}