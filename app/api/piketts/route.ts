// app/api/piketts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const piketts = await prisma.pikett.findMany({
      include: {
        team: true,
        user: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(piketts);
  } catch (error) {
    console.error('Error fetching piketts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch piketts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const pikett = await prisma.pikett.create({
      data: {
        name: body.name,
        description: body.description || null,
        startWeek: body.startWeek || '',
        endWeek: body.endWeek || null,
        teamId: body.teamId,
        color: body.color || '#dc2626',
        status: body.status || 'ACTIVE',
        is24_7: body.is24_7 !== undefined ? body.is24_7 : true,
        includedUserIds: body.includedUserIds || [],
        excludedUserIds: body.excludedUserIds || [],
        daysOfWeek: body.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
      },
      include: {
        team: true
      }
    });
    
    return NextResponse.json(pikett, { status: 201 });
  } catch (error) {
    console.error('Error creating pikett:', error);
    return NextResponse.json(
      { error: 'Failed to create pikett' },
      { status: 500 }
    );
  }
}