// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Mettre Ã  jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // PrÃ©parer les donnÃ©es de mise Ã  jour
    const updateData: any = {};
    
    // Champs simples
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.role !== undefined) updateData.role = body.role || null;
    if (body.workPercent !== undefined) updateData.workPercent = body.workPercent;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    
    // GÃ©rer teamId avec la syntaxe Prisma correcte
    if (body.teamId !== undefined) {
      if (body.teamId === 'none' || body.teamId === '' || !body.teamId) {
        updateData.team = {
          disconnect: true
        };
      } else {
        updateData.team = {
          connect: { id: body.teamId }
        };
      }
    }
    
    // Stocker rotationConfig et availability comme JSON dans des champs sÃ©parÃ©s
    // OU dans un champ JSON si votre schÃ©ma Prisma le supporte
    // Option 1: Si vous avez des champs JSON dans votre schÃ©ma
    if (body.rotationConfig !== undefined) {
      updateData.rotationConfig = body.rotationConfig;
    }
    
    if (body.availability !== undefined) {
      updateData.availability = body.availability;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        team: true,
        leadingTeam: true
      }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        data: { before: body, after: user }
      }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}