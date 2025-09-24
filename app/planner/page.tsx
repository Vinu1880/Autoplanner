'use client';

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
  Maximize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  // États
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
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

  const [settings, setSettings] = useState(loadSettings());

  const loadRotationPatterns = (): RotationPattern[] => {
    const saved = localStorage.getItem('rotationPatterns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erreur chargement patterns:', e);
        return [];
      }
    }
    return [];
  };

  const [rotationPatterns] = useState<RotationPattern[]>(loadRotationPatterns());

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

  const generateDateRange = (start: string, end: string, daysOfWeek: number[]): string[] => {
    const dates: string[] = [];
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        dates.push(d.toISOString().split('T')[0]);
      }
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
    if (selectedShifts.length === 0 || !startDate || !endDate || selectedDaysOfWeek.length === 0) {
      alert('Veuillez sélectionner au moins un shift et des dates');
      return;
    }

    setIsProcessingShifts(true);
    
    try {
      console.log('=== DÉBUT DU PROCESSUS D\'ASSIGNATION ===');
      console.log(`Shifts sélectionnés: ${selectedShifts.length}`);
      console.log(`Période: ${startDate} à ${endDate}`);
      console.log(`Random Seed actuel: ${randomSeed}`);
      
      let currentUsers = availableUsers.length > 0 ? availableUsers : await fetchUsersFromCalendars();
      
      if (currentUsers.length === 0) {
        alert('Aucun utilisateur trouvé');
        setIsProcessingShifts(false);
        return;
      }
      
      console.log(`Utilisateurs disponibles: ${currentUsers.length}`);
      
      const oofEvents = settings.checkCalendars ? await fetchOutOfOfficeForPeriod() : [];
      setOutOfOfficeEvents(oofEvents);
      
      const dates = generateDateRange(startDate, endDate, selectedDaysOfWeek);
      setSelectedDates(dates);
      console.log(`Dates à traiter: ${dates.length}`);
      
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
      
      const assignments: ShiftAssignment[] = [];
      const userShiftsTracking: { [userId: string]: { [shiftId: string]: number } } = {};
      
      for (const date of dates) {
        const dailyAssignments: { [userId: string]: string[] } = {};
        console.log(`\n=== Traitement du ${date} ===`);
        
        // PARTIE 1: Traiter les rotations si activées
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
              console.log(`Comparing shift "${shift.name}" with rotation type "${shiftType}"`);
              
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
        
        // PARTIE 2: Traiter les shifts non assignés par rotation
        for (const shiftId of shiftsToProcess) {
          const shift = shifts.find(s => s.id === shiftId);
          if (!shift) continue;
          
          const alreadyAssigned = assignments.some(a => 
            a.date === date && a.shiftId === shiftId && a.isRotationAssignment
          );
          
          if (alreadyAssigned) {
            console.log(`  ${shift.name}: Déjà assigné par rotation`);
            continue;
          }
          
          console.log(`  ${shift.name}: Recherche d'un utilisateur disponible`);
          console.log(`    Nom du shift pour debug: "${shift.name}"`);
          console.log(`    ID du shift: ${shift.id}`);
          
          const eligibleUsers = getEligibleUsersForShift(shift);
          console.log(`    ${eligibleUsers.length} utilisateurs éligibles`);
          
          const availableForThisDate: any[] = [];
          const unavailableUsers: Array<{user: any; reason: string; conflictEvents: OutlookEvent[]}> = [];
          
          for (const user of eligibleUsers) {
            if (dailyAssignments[user.id]) {
              unavailableUsers.push({
                user,
                reason: 'Déjà assigné aujourd\'hui',
                conflictEvents: []
              });
              continue;
            }
            
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
              if (hasConsecutiveShift(user.id, date, assignments)) {
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
            // MÉLANGE AMÉLIORÉ: Utilise le seed global + shiftId + date
            const seedString = `${shiftId}-${date}`;
            let candidateUsers = shuffleArray(availableForThisDate, randomSeed, seedString);
            console.log(`    Mélange avec seed: ${randomSeed} et string: "${seedString}"`);
            console.log(`    Ordre après mélange: ${candidateUsers.map(u => u.firstName).join(', ')}`);
            
            if (settings.balanceShifts) {
              candidateUsers.sort((a, b) => {
                const aCount = (userShiftsTracking[a.id]?.[shiftId] || 0);
                const bCount = (userShiftsTracking[b.id]?.[shiftId] || 0);
                if (aCount !== bCount) return aCount - bCount;
                
                // Si égalité, maintenir l'ordre aléatoire
                return 0;
              });
              console.log(`    Ordre après équilibrage: ${candidateUsers.map(u => u.firstName).join(', ')}`);
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
            console.log(`    Compteur pour cet utilisateur: ${userShiftsTracking[selectedUser.id][shiftId]}`);
          } else {
            console.log(`    ⚠ Aucune personne disponible`);
          }
          
          assignments.push({
            date,
            shiftId: shift.id,
            shift,
            assignedUsers,
            availableUsers: availableForThisDate,
            unavailableUsers
          });
        }
      }
      
      console.log('\n=== PROCESSUS TERMINÉ ===');
      console.log(`Total assignations créées: ${assignments.length}`);
      console.log(`Assignations avec rotation: ${assignments.filter(a => a.isRotationAssignment).length}`);
      console.log(`Assignations manuelles: ${assignments.filter(a => !a.isRotationAssignment).length}`);
      console.log(`Shifts non pourvus: ${assignments.filter(a => a.assignedUsers.length === 0).length}`);
      
      // Incrémenter le seed pour la prochaine fois
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
            const shiftIndex = selectedShifts.findIndex(id => id === assignment.shiftId);
            const color = SHIFT_COLORS[shiftIndex % SHIFT_COLORS.length];
            
            return (
              <div 
                key={`${assignment.shiftId}-${idx}`} 
                className="rounded px-1 py-0.5 text-xs truncate"
                style={{ 
                  backgroundColor: `${color}15`,
                  borderLeft: `2px solid ${color}`
                }}
              >
                <div className="flex items-center gap-0.5">
                  {assignment.isRotationAssignment && (
                    <RotateCw className="w-3 h-3 flex-shrink-0" style={{ color }} />
                  )}
                  <span style={{ color }} className="font-medium text-xs truncate">
                    {assignment.shift?.name || 'Shift'}
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
                  <h3 className="font-medium text-slate-800">Jours de la semaine</h3>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { value: 1, label: 'L' },
                      { value: 2, label: 'M' },
                      { value: 3, label: 'M' },
                      { value: 4, label: 'J' },
                      { value: 5, label: 'V' },
                      { value: 6, label: 'S' },
                      { value: 0, label: 'D' }
                    ].map((day) => (
                      <div key={day.value}>
                        <input
                          type="checkbox"
                          id={`day-${day.value}`}
                          checked={selectedDaysOfWeek.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDaysOfWeek([...selectedDaysOfWeek, day.value]);
                            } else {
                              setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day.value));
                            }
                          }}
                          className="sr-only"
                        />
                        <label 
                          htmlFor={`day-${day.value}`}
                          className={`flex items-center justify-center p-2 rounded cursor-pointer border-2 text-xs
                            ${selectedDaysOfWeek.includes(day.value)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Shifts à planifier</Label>
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

                <div className="space-y-3 pt-4 border-t">
                  <Button 
                    onClick={processShiftAssignments}
                    disabled={isProcessingShifts || selectedShifts.length === 0 || !startDate || !endDate}
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