// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - RÃ©cupÃ©rer tous les utilisateurs
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: true,
        leadingTeam: true,
        // Pas besoin d'include pour rotationConfig car c'est un champ JSON direct
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });
    
    // Log pour debug
    console.log('Users from DB with rotation:', users.map(u => ({
      name: `${u.firstName} ${u.lastName}`,
      rotationConfig: u.rotationConfig
    })));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - CrÃ©er un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // PrÃ©parer les donnÃ©es
    const userData: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      phone: body.phone || null,
      role: body.role || null,
      workPercent: body.workPercent || 100,
      status: body.status || 'ACTIVE',
      notes: body.notes || null
    };
    
    // Ajouter teamId seulement s'il existe
    if (body.teamId && body.teamId !== 'none') {
      userData.teamId = body.teamId;
    }
    
    const user = await prisma.user.create({
      data: userData,
      include: {
        team: true
      }
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        data: user
      }
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}