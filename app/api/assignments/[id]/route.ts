// app/api/assignments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Mettre à jour le statut d'une assignation (accepter/refuser)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, reason } = body;
    
    const assignment = await prisma.shiftAssignment.update({
      where: { id: params.id },
      data: {
        status,
        reason,
        respondedAt: new Date()
      },
      include: {
        shift: true,
        user: true
      }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: status === 'ACCEPTED' ? 'ACCEPT' : 'REFUSE',
        entity: 'ASSIGNMENT',
        entityId: assignment.id,
        userId: assignment.userId,
        data: { status, reason }
      }
    });
    
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une assignation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.shiftAssignment.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED'
      }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'ASSIGNMENT',
        entityId: params.id,
        data: null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling assignment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel assignment' },
      { status: 500 }
    );
  }
}