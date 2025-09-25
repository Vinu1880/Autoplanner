// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: true,
        leadingTeam: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });
    
    // Log détaillé pour debug
    console.log('=== USERS FROM DATABASE ===');
    users.forEach(user => {
      console.log(`${user.firstName} ${user.lastName}:`, {
        rotationConfig: user.rotationConfig,
        rotationConfigType: typeof user.rotationConfig,
        hasPatternId: !!(user.rotationConfig && (user.rotationConfig as any).patternId),
        rawJSON: JSON.stringify(user.rotationConfig)
      });
    });
    console.log('==============================');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== CREATING USER ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Préparer les données de base
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
    
    // STOCKAGE DIRECT du rotationConfig comme JSON
    if (body.rotationConfig && body.rotationConfig.patternId) {
      userData.rotationConfig = {
        patternId: body.rotationConfig.patternId,
        priority: body.rotationConfig.priority || 'medium',
        allowedShiftTypes: body.rotationConfig.allowedShiftTypes || []
      };
      console.log('Storing rotationConfig as JSON:', userData.rotationConfig);
    } else {
      userData.rotationConfig = null;
      console.log('No rotation config to store');
    }
    
    // Ajouter availability si présent
    if (body.availability) {
      userData.availability = body.availability;
    }
    
    console.log('Final userData to create:', JSON.stringify(userData, null, 2));
    
    const user = await prisma.user.create({
      data: userData,
      include: {
        team: true,
        leadingTeam: true
      }
    });
    
    console.log('User created successfully:', {
      name: `${user.firstName} ${user.lastName}`,
      rotationConfig: user.rotationConfig,
      id: user.id
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
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to create user', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
      },
      { status: 500 }
    );
  }
}