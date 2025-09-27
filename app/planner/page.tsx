'use client';
//app/planner/page.tsx

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { 
  Calendar, 
  Clock, 
  Users, 
  Eye, 
  Send, 
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Filter,
  RefreshCw,
  Save,
  Download,
  Search,
  Plus,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  Settings,
  RotateCw,
  Maximize2,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRotationPatterns } from '@/contexts/RotationPatternsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import des hooks
import { useShifts } from '@/lib/hooks/useShifts';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTeams } from '@/lib/hooks/useTeams';
import { usePiketts } from '@/lib/hooks/usePiketts';

// Types
interface OutlookEvent {
  id?: string;
  subject: string;
  start: { dateTime: string; timeZone?: string; };
  end: { dateTime: string; timeZone?: string; };
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  isAllDay: boolean;
  organizer?: { emailAddress: { name: string; address: string; }; };
  attendees?: any[];
  location?: { displayName: string; };
  body?: { content: string; contentType: string; };
  categories?: string[];
  calendarName?: string;
  calendarId?: string;
}

interface ShiftAssignment {
  date: string;
  shiftId: string;
  shift?: any;
  assignedUsers: any[];
  availableUsers: any[];
  unavailableUsers: Array<{
    user: any;
    reason: string;
    conflictEvents: OutlookEvent[];
  }>;
  isRotationAssignment?: boolean;
  rotationPriority?: 'high' | 'medium' | 'low';
  isPikett?: boolean;
}

interface RotationPattern {
  id: string;
  name: string;
  description?: string;
  weeks: any[];
  cycleLength: number;
}

const SHIFT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6',
  '#fb7185', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'
];


const PlannerPage = () => {

    const { 
      piketts, 
      loading: pikettsLoading 
  } = usePiketts();

    const getCurrentWeek = () => {
      const date = new Date();
      const year = date.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const days = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    };

  // États
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedPiketts, setSelectedPiketts] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessingShifts, setIsProcessingShifts] = useState(false);
  const [outOfOfficeEvents, setOutOfOfficeEvents] = useState<OutlookEvent[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedDayAssignments, setSelectedDayAssignments] = useState<ShiftAssignment[] | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [randomSeed, setRandomSeed] = useState(0);
  const [expandedCalendar, setExpandedCalendar] = useState(false);
  const { patterns: rotationPatterns } = useRotationPatterns();

  const ACCESS_TOKEN = 'EwB...'; // 3 premiers caractères seulement

  // Hooks
  const { shifts, loading: shiftsLoading } = useShifts();
  const { users, loading: usersLoading } = useUsers();
  const { teams, loading: teamsLoading } = useTeams();

  // Paramètres
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('shiftSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Erreur lors du chargement des settings:', e);
      }
    }
    return {
      avoidConsecutiveShifts: true,
      balanceShifts: true,
      checkCalendars: true,
      respectWorkPercentage: true,
      prioritySystem: true,
      enableRotations: true
    };
  };

  // Récupération des piketts actifs
  const [activePiketts, setActivePiketts] = useState<any[]>([]);

  useEffect(() => {
    const savedPiketts = localStorage.getItem('piketts');
    if (savedPiketts) {
      const piketts = JSON.parse(savedPiketts);
      // Filtrer les piketts actifs pour la période sélectionnée
      const filtered = piketts.filter((p: any) => {
        if (p.status !== 'ACTIVE') return false;
        // Vérifier si le pikett est dans la période
        const pikettWeek = p.startWeek;
        // Logique pour vérifier la période
        return true; // À affiner selon vos besoins
      });
      setActivePiketts(filtered);
    }
  }, [startDate, endDate]);

  const [settings, setSettings] = useState(loadSettings());

  // Fonction rotation améliorée
  const getRotationShiftForUserOnDate = (
    userId: string, 
    date: string,
    user: any
  ): { shiftType: string | null; priority: 'high' | 'medium' | 'low' } => {
    if (!settings.enableRotations || !user.rotationConfig?.patternId) {
      return { shiftType: null, priority: 'low' };
    }
    
    const pattern = rotationPatterns.find(p => p.id === user.rotationConfig.patternId);
    if (!pattern) {
      console.log(`Pattern ${user.rotationConfig.patternId} non trouvé pour ${user.firstName}`);
      return { shiftType: null, priority: user.rotationConfig.priority || 'low' };
    }
    
    const plannerStartDate = new Date(startDate);
    const currentDate = new Date(date);
    
    const daysDiff = Math.floor((currentDate.getTime() - plannerStartDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekInCycle = Math.floor(daysDiff / 7) % pattern.cycleLength;
    
    const weekPattern = pattern.weeks[weekInCycle];
    if (!weekPattern) {
      return { shiftType: null, priority: user.rotationConfig.priority || 'low' };
    }
    
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
    const daySlots = weekPattern[dayOfWeek] || [];
    
    console.log(`${user.firstName} - ${date} - Semaine ${weekInCycle + 1}/${pattern.cycleLength} - ${dayOfWeek}: ${daySlots.join(',') || 'Libre'}`);
    
    if (daySlots.includes('morning')) {
      return { shiftType: 'morning', priority: user.rotationConfig.priority || 'medium' };
    } else if (daySlots.includes('afternoon')) {
      return { shiftType: 'afternoon', priority: user.rotationConfig.priority || 'medium' };
    } else if (daySlots.includes('evening')) {
      return { shiftType: 'evening', priority: user.rotationConfig.priority || 'medium' };
    } else if (daySlots.includes('night')) {
      return { shiftType: 'night', priority: user.rotationConfig.priority || 'medium' };
    }
    
    return { shiftType: null, priority: user.rotationConfig.priority || 'low' };
  };

  // FONCTION DE MÉLANGE AMÉLIORÉE - Utilise le randomSeed global + date + shift
  const shuffleArray = <T,>(array: T[], seed: number, additionalSeed: string = ''): T[] => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    
    // Combine le seed global avec un hash de la chaîne additionnelle
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    const combinedSeed = seed + hashCode(additionalSeed);
    
    const random = (index: number) => {
      const x = Math.sin(combinedSeed + index) * 10000;
      return x - Math.floor(x);
    };
    
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(random(currentIndex) * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }
    
    return shuffled;
  };

  const fetchUsersFromCalendars = async (): Promise<any[]> => {
    console.log('Récupération des utilisateurs...');
    setIsLoadingUsers(true);
    
    try {
      const usersMap = new Map<string, any>();
      
      // Ajouter TOUS les utilisateurs de la DB avec leurs données complètes
      users.forEach(dbUser => {
        console.log(`User ${dbUser.firstName}:`, {
          hasRotationConfig: !!dbUser.rotationConfig,
          rotationConfig: dbUser.rotationConfig
        });
        
        usersMap.set(dbUser.email.toLowerCase(), {
          id: dbUser.id,
          email: dbUser.email,
          displayName: `${dbUser.firstName} ${dbUser.lastName}`,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          workPercent: dbUser.workPercent || 100,
          status: dbUser.status,
          rotationConfig: dbUser.rotationConfig || null,
          teamId: dbUser.teamId || null,
          availability: dbUser.availability || null,
          role: dbUser.role || null
        });
      });
      
      const allUsers = Array.from(usersMap.values());
      
      const usersWithRotation = allUsers.filter(u => u.rotationConfig?.patternId);
      console.log('=== UTILISATEURS AVEC ROTATION ===');
      console.log(`Total: ${usersWithRotation.length}`);
      usersWithRotation.forEach(u => {
        console.log(`- ${u.firstName} ${u.lastName}:`, u.rotationConfig);
      });
      console.log('================================');
      
      setAvailableUsers(allUsers);
      return allUsers;
      
    } catch (error) {
      console.error('Erreur:', error);
      const dbUsers = users.map(dbUser => ({
        id: dbUser.id,
        email: dbUser.email,
        displayName: `${dbUser.firstName} ${dbUser.lastName}`,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        workPercent: dbUser.workPercent || 100,
        status: dbUser.status,
        rotationConfig: dbUser.rotationConfig || null,
        teamId: dbUser.teamId || null,
        availability: dbUser.availability || null,
        role: dbUser.role || null
      }));
      setAvailableUsers(dbUsers);
      return dbUsers;
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchOutOfOfficeForPeriod = async (): Promise<OutlookEvent[]> => {
    if (!startDate || !endDate) {
      return [];
    }

    console.log('Recherche des événements Out of Office...');
    
    try {
      const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();
      
      const allOutOfOfficeEvents: OutlookEvent[] = [];
      
      const calendarsResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!calendarsResponse.ok) {
        console.error('Erreur lors de la récupération des calendriers');
        return [];
      }

      const calendarsData = await calendarsResponse.json();
      
      for (const calendar of calendarsData.value) {
        try {
          const eventsUrl = `https://graph.microsoft.com/v1.0/me/calendars/${calendar.id}/events?` +
            `$select=subject,start,end,showAs,isAllDay,organizer,attendees` +
            `&$filter=start/dateTime le '${endDateTime}' and end/dateTime ge '${startDateTime}'`;
          
          const eventsResponse = await fetch(eventsUrl, {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });

          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            
            const oofEvents = eventsData.value.filter((event: OutlookEvent) => {
              const isOof = event.showAs === 'oof';
              const hasOofKeywords = event.subject && (
                event.subject.toLowerCase().includes('out of office') ||
                event.subject.toLowerCase().includes('ooo') ||
                event.subject.toLowerCase().includes('absent') ||
                event.subject.toLowerCase().includes('congé') ||
                event.subject.toLowerCase().includes('vacances')
              );
              return isOof || hasOofKeywords;
            });
            
            oofEvents.forEach((event: OutlookEvent) => {
              allOutOfOfficeEvents.push({
                ...event,
                calendarName: calendar.name,
                calendarId: calendar.id
              });
            });
          }
        } catch (error) {
          console.log(`Erreur pour calendrier ${calendar.name}:`, error);
        }
      }
      
      console.log(`Total événements OOF trouvés: ${allOutOfOfficeEvents.length}`);
      return allOutOfOfficeEvents;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  };

  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const isUserAvailable = (user: any, date: string, oofEvents: OutlookEvent[]) => {
    const userEmail = user.email.toLowerCase();
    const dateStart = new Date(date + 'T00:00:00');
    const dateEnd = new Date(date + 'T23:59:59');
    
    const conflicts = oofEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      const organizerEmail = event.organizer?.emailAddress?.address?.toLowerCase() || '';
      
      return (organizerEmail === userEmail || 
              event.attendees?.some((attendee: any) => 
                attendee.emailAddress?.address?.toLowerCase() === userEmail)) &&
             ((eventStart <= dateEnd && eventEnd >= dateStart));
    });
    
    return {
      available: conflicts.length === 0,
      conflictEvents: conflicts
    };
  };

  const getEligibleUsersForShift = (shift: any): any[] => {
    const teamUsers = availableUsers.filter(u => 
      u.teamId === shift.teamId && 
      (u.status === 'ACTIVE' || u.status === 'active') &&
      !(shift.excludedUserIds || []).includes(u.id)
    );
    
    const includedUsers = availableUsers.filter(u => 
      (shift.includedUserIds || []).includes(u.id) &&
      (u.status === 'ACTIVE' || u.status === 'active')
    );
    
    return [...teamUsers, ...includedUsers];
  };

  const hasConsecutiveShift = (userId: string, date: string, currentAssignments: ShiftAssignment[]): boolean => {
    const currentDate = new Date(date);
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const nextDateStr = nextDate.toISOString().split('T')[0];
    
    return currentAssignments.some(a => 
      (a.date === prevDateStr || a.date === nextDateStr) &&
      a.assignedUsers.some(u => u.id === userId)
    );
  };

const processShiftAssignments = async () => {
  // Validation : au moins un shift OU un pikett doit être sélectionné
  if (selectedShifts.length === 0 && selectedPiketts.length === 0) {
    alert('Veuillez sélectionner au moins un shift ou un pikett');
    return;
  }
  
  if (!startDate || !endDate) {
    alert('Veuillez sélectionner les dates et jours de la semaine');
    return;
  }

  setIsProcessingShifts(true);
  
  try {
    console.log('=== DÉBUT DU PROCESSUS D\'ASSIGNATION ===');
    console.log(`Shifts sélectionnés: ${selectedShifts.length}`);
    console.log(`Piketts sélectionnés: ${selectedPiketts.length}`);
    console.log(`Période: ${startDate} à ${endDate}`);
    console.log(`Random Seed actuel: ${randomSeed}`);
    
    let currentUsers = availableUsers.length > 0 ? availableUsers : await fetchUsersFromCalendars();
    
    if (currentUsers.length === 0) {
      alert('Aucun utilisateur trouvé');
      setIsProcessingShifts(false);
      return;
    }
    
    const oofEvents = settings.checkCalendars ? await fetchOutOfOfficeForPeriod() : [];
    setOutOfOfficeEvents(oofEvents);
    
    const dates = generateDateRange(startDate, endDate,);
    setSelectedDates(dates);
    
    const assignments: ShiftAssignment[] = [];
    const userShiftsTracking: { [userId: string]: { [shiftId: string]: number } } = {};
    
    // PARTIE 1: Traiter les PIKETTS sélectionnés
    if (selectedPiketts.length > 0) {
      console.log('\n=== TRAITEMENT DES PIKETTS ===');
      
      for (const pikettId of selectedPiketts) {
        const pikett = piketts.find(p => p.id === pikettId);
        if (!pikett) continue;
        
        console.log(`Traitement du pikett: ${pikett.name}`);
        
        // Obtenir les utilisateurs éligibles pour ce pikett
        const eligibleUsers = [
          ...currentUsers.filter(u => 
            u.teamId === pikett.teamId && 
            u.status === 'ACTIVE' && 
            !(pikett.excludedUserIds || []).includes(u.id)
          ),
          ...currentUsers.filter(u => 
            (pikett.includedUserIds || []).includes(u.id) && 
            u.status === 'ACTIVE'
          )
        ];
        
        console.log(`  ${eligibleUsers.length} utilisateurs éligibles pour le pikett`);
        
        if (eligibleUsers.length === 0) {
          console.log('  ⚠ Aucun utilisateur éligible pour ce pikett');
          continue;
        }
        
        // Organiser les dates par semaine ISO
        const weekGroups = new Map<string, string[]>();
        
        for (const date of dates) {
          const dateObj = new Date(date);
          const tempDate = new Date(dateObj.valueOf());
          const dayNum = tempDate.getUTCDay() || 7;
          tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          const weekKey = `${tempDate.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
          
          if (!weekGroups.has(weekKey)) {
            weekGroups.set(weekKey, []);
          }
          weekGroups.get(weekKey)!.push(date);
        }
        
        console.log(`  Nombre de semaines à couvrir: ${weekGroups.size}`);
        
        const sortedWeeks = Array.from(weekGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const shuffledUsers = shuffleArray(eligibleUsers, randomSeed, `pikett-${pikettId}`);
        
        // Tracker pour éviter les assignations consécutives
        let lastAssignedUserId: string | null = null;
        let userRotationIndex = 0;
        
        // ASSIGNATION PAR SEMAINE AVEC ROTATION ET VÉRIFICATION OOF
        for (const [weekKey, weekDates] of sortedWeeks) {
          console.log(`\n  Traitement semaine ${weekKey}:`);
          
          let assignedUserForWeek = null;
          let attempts = 0;
          const maxAttempts = shuffledUsers.length;
          
          // Chercher un utilisateur disponible pour cette semaine
          while (!assignedUserForWeek && attempts < maxAttempts) {
            const candidateUser = shuffledUsers[userRotationIndex % shuffledUsers.length];
            
            // Vérifier que ce n'est pas la même personne que la semaine précédente
            if (lastAssignedUserId && candidateUser.id === lastAssignedUserId && shuffledUsers.length > 1) {
              console.log(`    ${candidateUser.firstName} a déjà fait la semaine précédente, on passe au suivant`);
              userRotationIndex++;
              attempts++;
              continue;
            }
            
            // Vérifier la disponibilité pour cette semaine
            if (settings.checkCalendars) {
              let unavailableDaysCount = 0;
              for (const date of weekDates) {
                const availability = isUserAvailable(candidateUser, date, oofEvents);
                if (!availability.available) {
                  unavailableDaysCount++;
                }
              }
              
              // Si l'utilisateur est absent plus de 2 jours dans la semaine, passer au suivant
              if (unavailableDaysCount > 2) {
                console.log(`    ${candidateUser.firstName} est OOF ${unavailableDaysCount}/${weekDates.length} jours, on passe au suivant`);
                userRotationIndex++;
                attempts++;
                continue;
              }
            }
            
            // Cet utilisateur est OK pour cette semaine
            assignedUserForWeek = candidateUser;
            lastAssignedUserId = candidateUser.id;
            console.log(`    ✓ Assigné: ${assignedUserForWeek.firstName} ${assignedUserForWeek.lastName}`);
          }
          
          // Si aucun utilisateur disponible trouvé, forcer l'assignation du prochain dans la rotation
          if (!assignedUserForWeek && shuffledUsers.length > 0) {
            assignedUserForWeek = shuffledUsers[userRotationIndex % shuffledUsers.length];
            lastAssignedUserId = assignedUserForWeek.id;
            console.log(`    ⚠ Assignation forcée: ${assignedUserForWeek.firstName} ${assignedUserForWeek.lastName}`);
          }
          
          // Créer les assignations pour chaque jour de la semaine
            for (const date of weekDates) {
              // Vérifier si ce jour est configuré pour le pikett
              const dateObj = new Date(date);
              const dayOfWeek = dateObj.getDay();
              if (pikett.daysOfWeek && !pikett.daysOfWeek.includes(dayOfWeek)) {
                continue; // Passer au jour suivant si ce jour n'est pas configuré
              }
            if (!assignedUserForWeek) {
              // Aucun utilisateur disponible
              assignments.push({
                date,
                shiftId: pikettId,
                shift: {
                  ...pikett,
                  name: `🚨 PIKETT: ${pikett.name}`,
                  startTime: '00:00',
                  endTime: '23:59'
                },
                assignedUsers: [],
                availableUsers: [],
                unavailableUsers: eligibleUsers.map(u => ({
                  user: u,
                  reason: 'Aucun utilisateur disponible',
                  conflictEvents: []
                })),
                isPikett: true,
                isRotationAssignment: false,
                rotationPriority: 'high'
              });
            } else {
              // Vérifier la disponibilité pour ce jour spécifique
              let dayAvailable = true;
              let dayConflicts: OutlookEvent[] = [];
              
              if (settings.checkCalendars) {
                const availability = isUserAvailable(assignedUserForWeek, date, oofEvents);
                dayAvailable = availability.available;
                dayConflicts = availability.conflictEvents;
              }
              
              assignments.push({
                date,
                shiftId: pikettId,
                shift: {
                  ...pikett,
                  name: `🚨 PIKETT: ${pikett.name}`,
                  startTime: '00:00',
                  endTime: '23:59'
                },
                assignedUsers: dayAvailable ? [assignedUserForWeek] : [],
                availableUsers: shuffledUsers.filter(u => u.id !== assignedUserForWeek.id),
                unavailableUsers: [
                  ...(!dayAvailable ? [{
                    user: assignedUserForWeek,
                    reason: `Out of Office`,
                    conflictEvents: dayConflicts
                  }] : []),
                  ...shuffledUsers
                    .filter(u => u.id !== assignedUserForWeek.id)
                    .map(u => ({
                      user: u,
                      reason: 'Rotation hebdomadaire',
                      conflictEvents: []
                    }))
                ],
                isPikett: true,
                isRotationAssignment: false,
                rotationPriority: 'high'
              });
            }
          }
          
          // Passer au prochain utilisateur pour la semaine suivante
          userRotationIndex++;
        }
        
        // Résumé de la rotation
        console.log('\n  === RÉSUMÉ ROTATION PIKETT ===');
        for (const [weekKey, weekDates] of sortedWeeks) {
          const weekAssignments = assignments.filter(a => 
            a.isPikett && 
            a.shiftId === pikettId && 
            weekDates.includes(a.date)
          );
          const assignedUser = weekAssignments.find(a => a.assignedUsers.length > 0)?.assignedUsers[0];
          if (assignedUser) {
            const daysPresent = weekAssignments.filter(a => a.assignedUsers.length > 0).length;
            console.log(`  ${weekKey}: ${assignedUser.firstName} ${assignedUser.lastName} (${daysPresent}/${weekDates.length} jours)`);
          }
        }
      }
    }
    
   // PARTIE 2: Traiter les SHIFTS normaux
    if (selectedShifts.length > 0) {
      console.log('\n=== TRAITEMENT DES SHIFTS ===');
      
      const rotationUsers = currentUsers.filter(u => u.rotationConfig?.patternId);
      console.log(`${rotationUsers.length} utilisateur(s) avec rotation configurée`);
      
      let shiftsToProcess = [...selectedShifts];
      if (settings.prioritySystem) {
        shiftsToProcess.sort((a, b) => {
          const shiftA = shifts.find(s => s.id === a);
          const shiftB = shifts.find(s => s.id === b);
          const membersA = getEligibleUsersForShift(shiftA).length;
          const membersB = getEligibleUsersForShift(shiftB).length;
          return membersA - membersB;
        });
      }
      
      for (const date of dates) {
        const dailyAssignments: { [userId: string]: string[] } = {};
        console.log(`\n=== Traitement du ${date} ===`);
        
        // PARTIE 2.1: Traiter les rotations si activées
        if (settings.enableRotations) {
          for (const rotationUser of rotationUsers) {
            const { shiftType, priority } = getRotationShiftForUserOnDate(
              rotationUser.id,
              date,
              rotationUser
            );
            
            if (!shiftType) {
              console.log(`  ${rotationUser.firstName}: Pas de shift en rotation ce jour`);
              continue;
            }
            
            console.log(`  ${rotationUser.firstName}: rotation ${shiftType} (priorité: ${priority})`);
            
            if (settings.checkCalendars) {
              const availability = isUserAvailable(rotationUser, date, oofEvents);
              if (!availability.available) {
                console.log(`    ❌ Non disponible (OOF)`);
                continue;
              }
            }
            
            const matchingShift = shiftsToProcess.find(shiftId => {
              const shift = shifts.find(s => s.id === shiftId);
              if (!shift) return false;
              
              const shiftNameLower = shift.name.toLowerCase();
              
              if (shiftType === 'morning' && 
                  (shiftNameLower.includes('morning') || 
                   shiftNameLower.includes('matin') ||
                   shiftNameLower.includes('am'))) {
                return true;
              }
              if (shiftType === 'afternoon' && 
                  (shiftNameLower.includes('afternoon') || 
                   shiftNameLower.includes('après') ||
                   shiftNameLower.includes('pm'))) {
                return true;
              }
              if (shiftType === 'evening' && 
                  (shiftNameLower.includes('evening') || 
                   shiftNameLower.includes('soir'))) {
                return true;
              }
              if (shiftType === 'night' && 
                  (shiftNameLower.includes('night') || 
                   shiftNameLower.includes('nuit'))) {
                return true;
              }
              
              return false;
            });
            
            if (matchingShift) {
              const selectedShift = shifts.find(s => s.id === matchingShift);
              
              if (selectedShift) {
                const eligibleUsers = getEligibleUsersForShift(selectedShift);
                const isEligible = eligibleUsers.some(u => u.id === rotationUser.id);
                
                if (isEligible) {
                  if (!userShiftsTracking[rotationUser.id]) {
                    userShiftsTracking[rotationUser.id] = {};
                  }
                  if (!userShiftsTracking[rotationUser.id][matchingShift]) {
                    userShiftsTracking[rotationUser.id][matchingShift] = 0;
                  }
                  userShiftsTracking[rotationUser.id][matchingShift]++;
                  
                  dailyAssignments[rotationUser.id] = [selectedShift.name];
                  
                  console.log(`    ✓ Assigné à ${selectedShift.name}`);
                  
                  assignments.push({
                    date,
                    shiftId: selectedShift.id,
                    shift: selectedShift,
                    assignedUsers: [{
                      ...rotationUser,
                      shiftsAssigned: { ...userShiftsTracking[rotationUser.id] }
                    }],
                    availableUsers: [],
                    unavailableUsers: eligibleUsers
                      .filter(u => u.id !== rotationUser.id)
                      .map(u => ({
                        user: u,
                        reason: 'Réservé (rotation automatique)',
                        conflictEvents: []
                      })),
                    isRotationAssignment: true,
                    rotationPriority: priority
                  });
                } else {
                  console.log(`    ❌ Non éligible pour ${selectedShift.name}`);
                }
              }
            } else {
              console.log(`    ❌ Aucun shift correspondant trouvé pour ${shiftType}`);
            }
          }
        }
        
        // PARTIE 2.2: Traiter les shifts non assignés par rotation
        for (const shiftId of shiftsToProcess) {
          const shift = shifts.find(s => s.id === shiftId);
          if (!shift) continue;
          
          // Vérifier si ce jour est configuré pour le shift
          const dateObj = new Date(date);
          const dayOfWeek = dateObj.getDay();
          if (shift.daysOfWeek && !shift.daysOfWeek.includes(dayOfWeek)) {
            continue; // Passer au jour suivant si ce jour n'est pas configuré
          }
          
          const alreadyAssigned = assignments.some(a => 
            a.date === date && a.shiftId === shiftId && a.isRotationAssignment
          );
          
          if (alreadyAssigned) {
            console.log(`  ${shift.name}: Déjà assigné par rotation`);
            continue;
          }
          
          console.log(`  ${shift.name}: Recherche d'un utilisateur disponible`);
          
          const eligibleUsers = getEligibleUsersForShift(shift);
          console.log(`    ${eligibleUsers.length} utilisateurs éligibles`);
          
          const availableForThisDate: any[] = [];
          const unavailableUsers: Array<{user: any; reason: string; conflictEvents: OutlookEvent[]}> = [];
          
          for (const user of eligibleUsers) {
            // MODIFICATION ICI : Vérifier seulement les shifts NON-PIKETT
            const hasNormalShiftToday = assignments.some(a => 
              a.date === date && 
              !a.isPikett && // Ignorer les piketts
              a.assignedUsers.some(u => u.id === user.id)
            );
            
            if (hasNormalShiftToday) {
              unavailableUsers.push({
                user,
                reason: 'Déjà assigné à un shift aujourd\'hui',
                conflictEvents: []
              });
              continue;
            }
            
            // Le reste du code reste identique...
            if (settings.checkCalendars) {
              const availability = isUserAvailable(user, date, oofEvents);
              if (!availability.available) {
                unavailableUsers.push({
                  user,
                  reason: 'Out of Office',
                  conflictEvents: availability.conflictEvents
                });
                continue;
              }
            }
            
            if (settings.avoidConsecutiveShifts) {
              // Modifier aussi ici pour ignorer les piketts dans la vérification
              const hasConsecutiveNormalShift = assignments.some(a => {
                if (a.isPikett) return false; // Ignorer les piketts
                const currentDate = new Date(date);
                const prevDate = new Date(currentDate);
                prevDate.setDate(prevDate.getDate() - 1);
                const nextDate = new Date(currentDate);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const prevDateStr = prevDate.toISOString().split('T')[0];
                const nextDateStr = nextDate.toISOString().split('T')[0];
                
                return (a.date === prevDateStr || a.date === nextDateStr) &&
                      a.assignedUsers.some(u => u.id === user.id);
              });
              
              if (hasConsecutiveNormalShift) {
                unavailableUsers.push({
                  user,
                  reason: 'Shift consécutif',
                  conflictEvents: []
                });
                continue;
              }
            }
            
            availableForThisDate.push(user);
          }
          
          console.log(`    ${availableForThisDate.length} utilisateurs disponibles`);
          
          let assignedUsers: any[] = [];
          if (availableForThisDate.length > 0) {
            const seedString = `${shiftId}-${date}`;
            let candidateUsers = shuffleArray(availableForThisDate, randomSeed, seedString);
            
            if (settings.balanceShifts) {
              candidateUsers.sort((a, b) => {
                const aCount = (userShiftsTracking[a.id]?.[shiftId] || 0);
                const bCount = (userShiftsTracking[b.id]?.[shiftId] || 0);
                if (aCount !== bCount) return aCount - bCount;
                return 0;
              });
            }
            
            const selectedUser = candidateUsers[0];
            
            if (!userShiftsTracking[selectedUser.id]) {
              userShiftsTracking[selectedUser.id] = {};
            }
            if (!userShiftsTracking[selectedUser.id][shiftId]) {
              userShiftsTracking[selectedUser.id][shiftId] = 0;
            }
            userShiftsTracking[selectedUser.id][shiftId]++;
            
            dailyAssignments[selectedUser.id] = [shift.name];
            selectedUser.shiftsAssigned = { ...userShiftsTracking[selectedUser.id] };
            assignedUsers = [selectedUser];
            
            console.log(`    → Assigné à: ${selectedUser.displayName || selectedUser.firstName}`);
          } else {
            console.log(`    ⚠ Aucune personne disponible`);
          }
          
          assignments.push({
            date,
            shiftId: shift.id,
            shift,
            assignedUsers,
            availableUsers: availableForThisDate,
            unavailableUsers,
            isRotationAssignment: false
          });
        }
      }
    }
    
    console.log('\n=== PROCESSUS TERMINÉ ===');
    console.log(`Total assignations créées: ${assignments.length}`);
    console.log(`Piketts assignés: ${assignments.filter(a => a.isPikett).length}`);
    console.log(`Shifts normaux: ${assignments.filter(a => !a.isPikett).length}`);
    console.log(`Shifts avec rotation: ${assignments.filter(a => a.isRotationAssignment && !a.isPikett).length}`);
    console.log(`Shifts non pourvus: ${assignments.filter(a => a.assignedUsers.length === 0).length}`);
    
    setRandomSeed(prev => prev + 1);
    setShiftAssignments(assignments);
    
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du traitement');
  } finally {
    setIsProcessingShifts(false);
  }
};

  const sendShiftInvitations = async () => {
    const assignmentsWithUsers = shiftAssignments.filter(a => a.assignedUsers.length > 0);
    
    if (assignmentsWithUsers.length === 0) {
      alert('Aucune assignation à envoyer');
      return;
    }
    
    console.log('Envoi des invitations...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const assignment of assignmentsWithUsers) {
      const user = assignment.assignedUsers[0];
      const shift = assignment.shift;
      
      if (!shift) continue;
      
      const eventDate = new Date(assignment.date);
      const [startHour, startMinute] = shift.startTime.split(':');
      const [endHour, endMinute] = shift.endTime.split(':');
      
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);
      
      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);
      
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      const event = {
        subject: `Shift: ${shift.name}`,
        body: {
          contentType: 'HTML',
          content: `<p>Bonjour ${user.firstName},</p>
            <p>Vous êtes assigné(e) au shift <strong>${shift.name}</strong>.</p>
            <p>Date: ${eventDate.toLocaleDateString('fr-FR')}</p>
            <p>Horaires: ${shift.startTime} - ${shift.endTime}</p>
            ${assignment.isRotationAssignment ? '<p><em>✔ Assignation automatique par rotation</em></p>' : ''}`
        },
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Europe/Paris'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Europe/Paris'
        },
        attendees: [{
          emailAddress: {
            address: user.email,
            name: `${user.firstName} ${user.lastName}`
          },
          type: 'required'
        }],
        categories: assignment.isRotationAssignment ? ['Rotation', 'Auto-Assigned'] : ['Manual']
      };
      
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }
    
    alert(`Invitations envoyées: ${successCount} succès, ${errorCount} erreurs`);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days: (number | null)[] = [];
    
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getAssignmentsForDate = (day: number): ShiftAssignment[] => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shiftAssignments.filter(a => a.date === dateStr);
  };

const CalendarDay = ({ day }: { day: number | null }) => {
  if (!day) return <div className={expandedCalendar ? "h-32" : "h-24"}></div>;
  
  const assignments = getAssignmentsForDate(day);
  const isToday = new Date().getDate() === day && 
                  new Date().getMonth() === calendarMonth && 
                  new Date().getFullYear() === calendarYear;
  
  const maxVisible = expandedCalendar ? assignments.length : 3;
  const visibleAssignments = assignments.slice(0, maxVisible);
  const hiddenCount = assignments.length - maxVisible;
  
  return (
    <div
      className={`${expandedCalendar ? 'h-32' : 'h-24'} border rounded-lg p-1.5 cursor-pointer transition-all overflow-hidden
        ${isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
        ${assignments.length > 0 ? 'hover:shadow-md' : 'hover:bg-slate-50'}`}
      onClick={() => {
        if (assignments.length > 0) {
          setSelectedDayAssignments(assignments);
          setIsDetailDialogOpen(true);
        }
      }}
    >
      <div className="text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
        <span>{day}</span>
        {assignments.length > 0 && (
          <Badge variant="outline" className="text-xs h-4 px-1">
            {assignments.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-0.5">
        {visibleAssignments.map((assignment, idx) => {
          // MODIFICATION ICI : Gestion améliorée des couleurs pour piketts
          let color = '#dc2626'; // Rouge par défaut pour les piketts
          
          if (!assignment.isPikett) {
            // Pour les shifts normaux, utiliser l'index dans selectedShifts
            const shiftIndex = selectedShifts.findIndex(id => id === assignment.shiftId);
            color = shiftIndex >= 0 ? SHIFT_COLORS[shiftIndex % SHIFT_COLORS.length] : '#6b7280';
          }
          
          return (
            <div 
              key={`${assignment.shiftId}-${idx}`} 
              className="rounded px-1 py-0.5 text-xs truncate relative"
              style={{ 
                backgroundColor: assignment.isPikett ? '#dc262615' : `${color}15`,
                borderLeft: `2px solid ${color}`
              }}
            >
              <div className="flex items-center gap-0.5">
                {assignment.isPikett && (
                  <Shield className="w-3 h-3 flex-shrink-0 text-red-600" />
                )}
                {assignment.isRotationAssignment && !assignment.isPikett && (
                  <RotateCw className="w-3 h-3 flex-shrink-0" style={{ color }} />
                )}
                <span 
                  style={{ color }} 
                  className="font-medium text-xs truncate"
                >
                  {assignment.isPikett 
                    ? 'PIKETT' 
                    : (assignment.shift?.name || 'Shift')}
                </span>
                {assignment.assignedUsers.length > 0 ? (
                  <span className="text-slate-700 truncate text-xs">
                    : {assignment.assignedUsers[0].firstName?.substring(0, expandedCalendar ? 10 : 6)}
                  </span>
                ) : (
                  <span className="text-orange-600 text-xs">: ⚠</span>
                )}
              </div>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div className="text-xs text-slate-500 text-center font-medium">
            +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

  useEffect(() => {
    console.log('Page planner chargée');
    console.log('Utilisateurs DB:', users);
    fetchUsersFromCalendars();
  }, [users]);

  useEffect(() => {
    localStorage.setItem('shiftSettings', JSON.stringify(settings));
  }, [settings]);

  if (shiftsLoading || usersLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Planificateur de Shifts</h1>
            <p className="text-slate-600 mt-1">
              Assignation automatique avec gestion des rotations (Seed: {randomSeed})
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={fetchUsersFromCalendars}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Paramètres de planification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-rotations">Activer les rotations</Label>
                    <Checkbox
                      id="enable-rotations"
                      checked={settings.enableRotations}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, enableRotations: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="avoid-consecutive">Éviter les shifts consécutifs</Label>
                    <Checkbox
                      id="avoid-consecutive"
                      checked={settings.avoidConsecutiveShifts}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, avoidConsecutiveShifts: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="balance">Répartition équitable</Label>
                    <Checkbox
                      id="balance"
                      checked={settings.balanceShifts}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, balanceShifts: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="check-cal">Vérifier les calendriers</Label>
                    <Checkbox
                      id="check-cal"
                      checked={settings.checkCalendars}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, checkCalendars: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priority">Système de priorités</Label>
                    <Checkbox
                      id="priority"
                      checked={settings.prioritySystem}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, prioritySystem: !!checked})
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Configuration et Calendrier dans la même vue */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Panneau de configuration à gauche */}
          <div className="xl:col-span-1">
            <Card className="bg-white border-0 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-800">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600 inline" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Période</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Date de début</Label>
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Date de fin</Label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                {/* Section Shifts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Shifts à planifier</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const activeShifts = shifts.filter((s: any) => s.status === 'ACTIVE');
                          setSelectedShifts(activeShifts.map((s: any) => s.id));
                        }}
                      >
                        Tout sélectionner
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedShifts([])}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48 border rounded-lg p-2">
                    <div className="space-y-2">
                      {shifts.filter((s: any) => s.status === 'ACTIVE').map((shift: any) => {
                        const isSelected = selectedShifts.includes(shift.id);
                        const color = isSelected 
                          ? SHIFT_COLORS[selectedShifts.indexOf(shift.id) % SHIFT_COLORS.length]
                          : '#6b7280';
                        
                        return (
                          <label
                            key={shift.id}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer text-xs
                              ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedShifts([...selectedShifts, shift.id]);
                                } else {
                                  setSelectedShifts(selectedShifts.filter((id: string) => id !== shift.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="font-medium">{shift.name}</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {shift.startTime} - {shift.endTime}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Section Piketts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      Piketts à planifier
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const activePiketts = piketts.filter((p: any) => p.status === 'ACTIVE');
                          setSelectedPiketts(activePiketts.map((p: any) => p.id));
                        }}
                      >
                        Tout sélectionner
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPiketts([])}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-32 border rounded-lg p-2 bg-red-50/30">
                    <div className="space-y-2">
                      {piketts.filter((p: any) => p.status === 'ACTIVE').map((pikett: any) => {
                        const isSelected = selectedPiketts.includes(pikett.id);
                        
                        return (
                          <label
                            key={pikett.id}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer text-xs
                              ${isSelected ? 'bg-red-100' : 'hover:bg-red-50'}`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPiketts([...selectedPiketts, pikett.id]);
                                } else {
                                  setSelectedPiketts(selectedPiketts.filter((id: string) => id !== pikett.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-red-600" />
                                <span className="font-medium text-red-900">{pikett.name}</span>
                              </div>
                              <span className="text-xs text-red-700">
                                {pikett.team?.name} • 24/7
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

                <div className="space-y-3 pt-4 border-t">
                  <Button 
                    onClick={processShiftAssignments}
                    disabled={isProcessingShifts || (selectedShifts.length === 0 && selectedPiketts.length === 0) || !startDate || !endDate}
                    className="w-full bg-blue-600 hover:bg-blue-700"
>
                    {isProcessingShifts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>

                  {shiftAssignments.length > 0 && (
                    <Button 
                      onClick={sendShiftInvitations}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer les Invitations
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendrier et statistiques à droite */}
          <div className="xl:col-span-3 space-y-6">
            {/* Statistiques */}
            {shiftAssignments.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Résumé des Assignations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedShifts.map((shiftId, index) => {
                      const shift = shifts.find((s: any) => s.id === shiftId);
                      const count = shiftAssignments.filter(a => 
                        a.shiftId === shiftId && a.assignedUsers.length > 0
                      ).length;
                      const rotationCount = shiftAssignments.filter(a => 
                        a.shiftId === shiftId && a.isRotationAssignment
                      ).length;
                      const emptyCount = shiftAssignments.filter(a => 
                        a.shiftId === shiftId && a.assignedUsers.length === 0
                      ).length;
                      
                      return (
                        <div 
                          key={shiftId}
                          className="text-center p-3 rounded-lg relative"
                          style={{ backgroundColor: `${SHIFT_COLORS[index % SHIFT_COLORS.length]}15` }}
                        >
                          <div 
                            className="text-sm font-medium mb-1 truncate"
                            style={{ color: SHIFT_COLORS[index % SHIFT_COLORS.length] }}
                          >
                            {shift?.name}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {count}
                          </div>
                          <p className="text-xs text-green-700">Assignés</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            {rotationCount > 0 && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs border-0">
                                <RotateCw className="w-3 h-3 mr-0.5" />
                                {rotationCount}
                              </Badge>
                            )}
                            {emptyCount > 0 && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs border-0">
                                ⚠ {emptyCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendrier */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('fr-FR', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCalendar(!expandedCalendar)}
                      title={expandedCalendar ? "Réduire" : "Agrandir"}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear(calendarYear - 1);
                        } else {
                          setCalendarMonth(calendarMonth - 1);
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setCalendarMonth(today.getMonth());
                        setCalendarYear(today.getFullYear());
                      }}
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear(calendarYear + 1);
                        } else {
                          setCalendarMonth(calendarMonth + 1);
                        }
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((day, index) => (
                    <CalendarDay key={index} day={day} />
                  ))}
                </div>
                
                {/* Légende */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span className="text-slate-600">Assigné</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-100 rounded"></div>
                      <span className="text-slate-600">Non pourvu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-purple-600" />
                      <span className="text-slate-600">Rotation automatique</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Utilisateurs avec rotation */}
            {availableUsers.filter(u => u.rotationConfig?.patternId).length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                    <RotateCw className="w-5 h-5 mr-2 text-purple-600" />
                    Utilisateurs avec Rotation ({availableUsers.filter(u => u.rotationConfig?.patternId).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableUsers
                      .filter(u => u.rotationConfig?.patternId)
                      .map(user => {
                        const pattern = rotationPatterns.find(p => p.id === user.rotationConfig.patternId);
                        return (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-slate-600">
                                  {pattern?.name || 'Pattern inconnu'}
                                </p>
                              </div>
                              {/* AJOUT: Badge si l'utilisateur a un pikett cette semaine */}
                              {(() => {
                                const week = getCurrentWeek(); // Utilisez un nom différent
                                const savedPiketts = localStorage.getItem('piketts');
                                const piketts = savedPiketts ? JSON.parse(savedPiketts) : [];
                                const userPikett = piketts.find((p: any) => 
                                  p.userId === user.id && 
                                  p.startWeek === week && // Utilisez 'week' au lieu de 'currentWeek'
                                  p.status === 'ACTIVE'
                                );
                                
                                if (userPikett) {
                                  return (
                                    <Badge className="bg-red-100 text-red-700 text-xs border-0 mt-1">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Pikett {userPikett.name}
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`text-xs border-0 ${
                                user.rotationConfig.priority === 'high' ? 'bg-red-100 text-red-700' :
                                user.rotationConfig.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-green-100 text-green-700'
                              }`}>
                                {user.rotationConfig.priority === 'high' ? 'Haute' :
                                 user.rotationConfig.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {pattern?.cycleLength || 0} sem.
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog détails jour améliorée */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDayAssignments && selectedDayAssignments[0] && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>
                        {new Date(selectedDayAssignments[0].date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      <Badge variant="outline">
                        {selectedDayAssignments.length} shift{selectedDayAssignments.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedDayAssignments && (
              <div className="space-y-4">
                {selectedDayAssignments
                  .sort((a, b) => {
                    const timeA = a.shift?.startTime || '00:00';
                    const timeB = b.shift?.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                  })
                  .map((assignment, index) => {
                    const shiftIndex = selectedShifts.findIndex(id => id === assignment.shiftId);
                    const color = SHIFT_COLORS[shiftIndex % SHIFT_COLORS.length];
                    
                    return (
                      <div key={`${assignment.shiftId}-${index}`} 
                           className="border rounded-lg p-4 transition-all hover:shadow-md" 
                           style={{ borderColor: color }}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            {assignment.shift?.name}
                            {assignment.isRotationAssignment && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                <RotateCw className="w-3 h-3 mr-1" />
                                Rotation
                              </Badge>
                            )}
                          </h3>
                          <Badge variant="outline" style={{ borderColor: color, color }}>
                            {assignment.shift?.startTime} - {assignment.shift?.endTime}
                          </Badge>
                        </div>

                        {assignment.assignedUsers.length > 0 ? (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    {assignment.assignedUsers[0].firstName?.[0]}
                                    {assignment.assignedUsers[0].lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {assignment.assignedUsers[0].firstName} {assignment.assignedUsers[0].lastName}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {assignment.assignedUsers[0].email}
                                  </p>
                                </div>
                              </div>
                              {assignment.isRotationAssignment && (
                                <Badge className={`text-xs border-0 ${
                                  assignment.rotationPriority === 'high' ? 'bg-red-100 text-red-700' :
                                  assignment.rotationPriority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-green-100 text-green-700'
                                }`}>
                                  Priorité: {assignment.rotationPriority === 'high' ? 'Haute' :
                                            assignment.rotationPriority === 'medium' ? 'Moyenne' : 'Basse'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              Aucune personne disponible pour ce shift
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Liste des personnes non disponibles */}
                        {assignment.unavailableUsers.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-800">
                              {assignment.unavailableUsers.length} personne{assignment.unavailableUsers.length > 1 ? 's' : ''} non disponible{assignment.unavailableUsers.length > 1 ? 's' : ''}
                            </summary>
                            <div className="mt-2 space-y-1">
                              {assignment.unavailableUsers.map((item, idx) => (
                                <div key={idx} className="text-xs flex items-center justify-between p-2 bg-slate-50 rounded">
                                  <span className="font-medium">{item.user.firstName} {item.user.lastName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.reason}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PlannerPage;