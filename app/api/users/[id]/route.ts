// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        team: true,
        leadingTeam: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`GET User ${user.firstName} ${user.lastName}:`, {
      rotationConfig: user.rotationConfig,
      type: typeof user.rotationConfig
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('=== UPDATING USER ===');
    console.log('User ID:', id);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Préparer les données de mise à jour
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
    
    // Gérer teamId directement (pas de syntaxe Prisma compliquée)
    if (body.teamId !== undefined) {
      if (body.teamId === 'none' || body.teamId === '' || !body.teamId) {
        updateData.teamId = null;
      } else {
        updateData.teamId = body.teamId;
      }
    }
    
    // STOCKAGE DIRECT du rotationConfig comme JSON
    if (body.rotationConfig !== undefined) {
      if (body.rotationConfig && body.rotationConfig.patternId) {
        updateData.rotationConfig = {
          patternId: body.rotationConfig.patternId,
          priority: body.rotationConfig.priority || 'medium',
          allowedShiftTypes: body.rotationConfig.allowedShiftTypes || []
        };
        console.log('Updating rotationConfig to:', updateData.rotationConfig);
      } else {
        updateData.rotationConfig = null;
        console.log('Removing rotation config');
      }
    }
    
    // Stocker availability comme JSON
    if (body.availability !== undefined) {
      updateData.availability = body.availability;
    }
    
    console.log('Final updateData:', JSON.stringify(updateData, null, 2));
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        team: true,
        leadingTeam: true
      }
    });
    
    console.log('User updated successfully:', {
      name: `${user.firstName} ${user.lastName}`,
      rotationConfig: user.rotationConfig,
      rotationType: typeof user.rotationConfig
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
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to update user', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier si l'utilisateur est chef d'équipe
    const teamsLed = await prisma.team.findMany({
      where: { leadId: id }
    });
    
    if (teamsLed.length > 0) {
      // Retirer le chef d'équipe des équipes
      await prisma.team.updateMany({
        where: { leadId: id },
        data: { leadId: null }
      });
    }
    
    // Supprimer l'utilisateur
    const user = await prisma.user.delete({
      where: { id }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'USER',
        entityId: id,
        data: user
      }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}