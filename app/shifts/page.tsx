'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Archive,
  Star,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  UserPlus,
  UserMinus,
  X,
  CalendarDays,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import des hooks pour les vraies données
import { useShifts } from '@/lib/hooks/useShifts';
import { useTeams } from '@/lib/hooks/useTeams';
import { useUsers } from '@/lib/hooks/useUsers';

const ShiftsPage = () => {
  const [viewType, setViewType] = useState<'shifts' | 'piketts'>('shifts');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatePikettDialogOpen, setIsCreatePikettDialogOpen] = useState(false);
  const [isEditPikettDialogOpen, setIsEditPikettDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedPikett, setSelectedPikett] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour les piketts
  const [piketts, setPiketts] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState('');

  // Utilisation des hooks pour les vraies données
  const { 
    shifts, 
    loading: shiftsLoading, 
    error: shiftsError, 
    createShift, 
    updateShift, 
    deleteShift,
    refetch: refetchShifts 
  } = useShifts();
  
  const { 
    teams, 
    loading: teamsLoading,
    error: teamsError 
  } = useTeams();

  const { 
    users, 
    loading: usersLoading,
    error: usersError 
  } = useUsers();

  // Fonction pour obtenir la semaine actuelle
  const getCurrentWeek = () => {
    const date = new Date();
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // Fonction pour obtenir les dates d'une semaine
  const getWeekDates = (weekString: string) => {
    const [year, week] = weekString.split('-W');
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const daysOffset = (parseInt(week) - 1) * 7;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    // Ajuster au lundi de la semaine
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return { startDate, endDate };
  };

  useEffect(() => {
    setCurrentWeek(getCurrentWeek());
    // Charger les piketts depuis localStorage
    const savedPiketts = localStorage.getItem('piketts');
    if (savedPiketts) {
      setPiketts(JSON.parse(savedPiketts));
    }
  }, []);

  // Sauvegarder les piketts dans localStorage
  useEffect(() => {
    if (piketts.length > 0) {
      localStorage.setItem('piketts', JSON.stringify(piketts));
    }
  }, [piketts]);

  const [newShift, setNewShift] = useState<any>({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    teamId: '',
    includedUserIds: [] as string[],
    excludedUserIds: [] as string[],
    color: '#3b82f6'
  });

  const [newPikett, setNewPikett] = useState({
    id: '',
    name: '',
    description: '',
    teamId: '',
    startWeek: currentWeek,
    endWeek: '',
    userId: '',
    color: '#dc2626',
    status: 'ACTIVE'
  });

  const getStatusBadge = (status: string) => {
    return (
      <Badge 
        variant={status === 'ACTIVE' ? 'default' : 'secondary'}
        className={status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-0' : 'bg-slate-100 text-slate-600 border-0'}
      >
        {status === 'ACTIVE' ? 'Actif' : 'Inactif'}
      </Badge>
    );
  };

  const handleCreateShift = async () => {
    if (!newShift.name || !newShift.teamId || !newShift.startTime || !newShift.endTime) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      await createShift({
        ...newShift,
        membersRequired: 1,
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      });
      
      setIsCreateDialogOpen(false);
      setNewShift({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        teamId: '',
        includedUserIds: [],
        excludedUserIds: [],
        color: '#3b82f6'
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création du shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePikett = () => {
    if (!newPikett.name || !newPikett.teamId || !newPikett.startWeek || !newPikett.userId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const pikett = {
      ...newPikett,
      id: Date.now().toString()
    };

    setPiketts([...piketts, pikett]);
    setIsCreatePikettDialogOpen(false);
    setNewPikett({
      id: '',
      name: '',
      description: '',
      teamId: '',
      startWeek: currentWeek,
      endWeek: '',
      userId: '',
      color: '#dc2626',
      status: 'ACTIVE'
    });
  };

  const handleEditPikett = () => {
    if (!selectedPikett) return;

    setPiketts(piketts.map(p => 
      p.id === selectedPikett.id ? selectedPikett : p
    ));
    
    setIsEditPikettDialogOpen(false);
    setSelectedPikett(null);
  };

  const handleDeletePikett = (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pikett ?')) return;
    setPiketts(piketts.filter(p => p.id !== id));
  };

  const handleEditShift = async () => {
    if (!selectedShift) return;

    setIsSubmitting(true);
    try {
      await updateShift(selectedShift.id, {
        name: selectedShift.name,
        description: selectedShift.description,
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        teamId: selectedShift.teamId,
        membersRequired: 1,
        priority: 'MEDIUM',
        status: selectedShift.status,
        color: selectedShift.color
      });
      
      setIsEditDialogOpen(false);
      setSelectedShift(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification du shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce shift ?')) return;

    try {
      await deleteShift(id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du shift');
    }
  };

  const handleDuplicateShift = async (shift: any) => {
    try {
      await createShift({
        name: `${shift.name} (Copie)`,
        description: shift.description,
        startTime: shift.startTime,
        endTime: shift.endTime,
        teamId: shift.teamId,
        membersRequired: 1,
        priority: 'MEDIUM',
        color: shift.color,
      });
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      alert('Erreur lors de la duplication du shift');
    }
  };

  const handleToggleStatus = async (shift: any) => {
    try {
      await updateShift(shift.id, {
        status: shift.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (shift.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesTeam = filterTeam === 'all' || shift.teamId === filterTeam;
    const matchesStatus = filterStatus === 'all' || shift.status === filterStatus;
    
    return matchesSearch && matchesTeam && matchesStatus;
  });

  const filteredPiketts = piketts.filter(pikett => {
    const matchesSearch = pikett.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (pikett.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesTeam = filterTeam === 'all' || pikett.teamId === filterTeam;
    const matchesStatus = filterStatus === 'all' || pikett.status === filterStatus;
    
    return matchesSearch && matchesTeam && matchesStatus;
  });

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (duration < 0) duration += 24 * 60;
    
    return Math.round(duration / 60 * 10) / 10;
  };

  // Composant pour gérer les membres du shift
  const MembersSelector = ({ 
    selectedUserIds, 
    excludedUserIds,
    onIncludeChange, 
    onExcludeChange,
    teamId 
  }: { 
    selectedUserIds: string[], 
    excludedUserIds: string[],
    onIncludeChange: (userIds: string[]) => void,
    onExcludeChange: (userIds: string[]) => void,
    teamId: string 
  }) => {
    const baseTeamUsers = users.filter(u => u.teamId === teamId && u.status === 'ACTIVE');
    const otherTeamUsers = users.filter(u => u.teamId !== teamId && u.status === 'ACTIVE');
    
    const effectiveTeamMembers = [
      ...baseTeamUsers.filter(u => !excludedUserIds.includes(u.id)),
      ...otherTeamUsers.filter(u => selectedUserIds.includes(u.id))
    ];
    
    const availableUsers = [
      ...otherTeamUsers.filter(u => !selectedUserIds.includes(u.id)),
      ...baseTeamUsers.filter(u => excludedUserIds.includes(u.id))
    ];

    const handleRemoveFromShift = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (user.teamId === teamId) {
        onExcludeChange([...excludedUserIds, userId]);
      } else {
        onIncludeChange(selectedUserIds.filter(id => id !== userId));
      }
    };

    const handleAddToShift = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (user.teamId === teamId) {
        onExcludeChange(excludedUserIds.filter(id => id !== userId));
      } else {
        onIncludeChange([...selectedUserIds, userId]);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Membres assignés au shift</Label>
            <Badge variant="outline" className="text-xs">
              {effectiveTeamMembers.length} membre(s)
            </Badge>
          </div>
          <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto bg-green-50/30">
            {effectiveTeamMembers.length > 0 ? (
              effectiveTeamMembers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/60 rounded">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">{user.role || 'Sans rôle'}</p>
                        {user.teamId !== teamId && (
                          <Badge variant="outline" className="text-xs">
                            {user.team?.name || 'Autre équipe'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveFromShift(user.id)}
                  >
                    <UserMinus className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun membre assigné à ce shift
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Utilisateurs disponibles</Label>
            <Badge variant="outline" className="text-xs">
              {availableUsers.length} disponible(s)
            </Badge>
          </div>
          <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
            {availableUsers.length > 0 ? (
              availableUsers.map(user => {
                const isExcluded = excludedUserIds.includes(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-500">
                            {user.team?.name || 'Sans équipe'}
                          </p>
                          {isExcluded && (
                            <Badge variant="destructive" className="text-xs">
                              Exclu
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => handleAddToShift(user.id)}
                    >
                      <UserPlus className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Tous les utilisateurs sont déjà assignés
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ShiftCard = ({ shift }: { shift: any }) => (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: shift.color }}
            ></div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {shift.name}
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">{shift.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">
                {shift.startTime} - {shift.endTime}
              </p>
              <p className="text-xs text-slate-500">
                {calculateDuration(shift.startTime, shift.endTime)}h
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">
                {shift.team?.name}
              </p>
              <p className="text-xs text-slate-500">
                {shift.excludedUserIds?.length || 0} exclusion(s)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusBadge(shift.status)}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
          <span>Utilisé {shift.usageCount} fois</span>
          {shift.lastUsedAt && (
            <span>Dernier: {new Date(shift.lastUsedAt).toLocaleDateString('fr-FR')}</span>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-3 border-t">
          <Button
            onClick={() => {
              setSelectedShift({
                ...shift,
                includedUserIds: shift.includedUserIds || [],
                excludedUserIds: shift.excludedUserIds || []
              });
              setIsEditDialogOpen(true);
            }}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Modifier
          </Button>
          <Button
            onClick={() => handleDuplicateShift(shift)}
            variant="outline"
            size="sm"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleToggleStatus(shift)}
            variant="outline"
            size="sm"
          >
            <Archive className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleDeleteShift(shift.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PikettCard = ({ pikett }: { pikett: any }) => {
    const team = teams.find(t => t.id === pikett.teamId);
    const user = users.find(u => u.id === pikett.userId);
    const { startDate, endDate } = getWeekDates(pikett.startWeek);
    
    return (
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-8 rounded-full"
                style={{ backgroundColor: pikett.color }}
              ></div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {pikett.name}
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">{pikett.description}</p>
              </div>
            </div>
            <Shield className="w-5 h-5 text-red-600" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Semaine {pikett.startWeek.split('-W')[1]}
                </p>
                <p className="text-xs text-slate-500">
                  {startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - 
                  {endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {team?.name}
                </p>
                <p className="text-xs text-slate-500">
                  Équipe assignée
                </p>
              </div>
            </div>
          </div>

          {user && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-red-500 to-red-600 text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-600">{user.email}</p>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800 border-0">
                De pikett
              </Badge>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {getStatusBadge(pikett.status)}
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-xs">
              Pikett actif pour toute la semaine. L'utilisateur peut recevoir des shifts en plus.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2 pt-3 border-t">
            <Button
              onClick={() => {
                setSelectedPikett({...pikett});
                setIsEditPikettDialogOpen(true);
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button
              onClick={() => handleDeletePikett(pikett.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (shiftsLoading || teamsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (shiftsError || teamsError || usersError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des données.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="p-6 space-y-6">
        {/* Header avec toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {viewType === 'shifts' ? 'Gestion des Shifts' : 'Gestion des Piketts'}
            </h1>
            <p className="text-slate-600 mt-1">
              {viewType === 'shifts' 
                ? 'Créez, modifiez et organisez vos shifts d\'équipe'
                : 'Gérez les astreintes hebdomadaires (piketts)'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Toggle Shifts/Piketts */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewType === 'shifts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('shifts')}
                className="rounded-r-none"
              >
                <Clock className="w-4 h-4 mr-2" />
                Shifts
              </Button>
              <Button
                variant={viewType === 'piketts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('piketts')}
                className="rounded-l-none"
              >
                <Shield className="w-4 h-4 mr-2" />
                Piketts
              </Button>
            </div>

            <Button
              onClick={refetchShifts}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            
            {viewType === 'piketts' ? (
              <Dialog open={isCreatePikettDialogOpen} onOpenChange={setIsCreatePikettDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Pikett
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer un pikett hebdomadaire</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Nom du pikett *</Label>
                      <Input
                        placeholder="ex: Pikett SEC"
                        value={newPikett.name}
                        onChange={(e) => setNewPikett({...newPikett, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Description du pikett..."
                        value={newPikett.description}
                        onChange={(e) => setNewPikett({...newPikett, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Équipe *</Label>
                        <Select 
                          value={newPikett.teamId} 
                          onValueChange={(value) => setNewPikett({...newPikett, teamId: value, userId: ''})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Semaine de début *</Label>
                        <Input
                          type="week"
                          value={newPikett.startWeek}
                          onChange={(e) => setNewPikett({...newPikett, startWeek: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    {newPikett.teamId && (
                      <div>
                        <Label>Personne assignée *</Label>
                        <Select 
                          value={newPikett.userId} 
                          onValueChange={(value) => setNewPikett({...newPikett, userId: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(u => u.teamId === newPikett.teamId && u.status === 'ACTIVE')
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Le pikett s'applique pour toute la semaine sélectionnée. 
                        La personne assignée peut aussi recevoir des shifts normaux durant cette période.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsCreatePikettDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleCreatePikett}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Créer le Pikett
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Shift
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau shift</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Contenu existant du dialog de création de shift */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom du shift</Label>
                        <Input
                          placeholder="ex: Morning Support"
                          value={newShift.name}
                          onChange={(e) => setNewShift({...newShift, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Description du shift..."
                          value={newShift.description}
                          onChange={(e) => setNewShift({...newShift, description: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heure de début</Label>
                          <Input
                            type="time"
                            value={newShift.startTime}
                            onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure de fin</Label>
                          <Input
                            type="time"
                            value={newShift.endTime}
                            onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Équipe</Label>
                        <Select value={newShift.teamId} onValueChange={(value) => setNewShift({...newShift, teamId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une équipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {newShift.teamId && (
                        <MembersSelector
                          selectedUserIds={newShift.includedUserIds}
                          excludedUserIds={newShift.excludedUserIds}
                          onIncludeChange={(ids) => setNewShift({...newShift, includedUserIds: ids})}
                          onExcludeChange={(ids) => setNewShift({...newShift, excludedUserIds: ids})}
                          teamId={newShift.teamId}
                        />
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleCreateShift}
                        disabled={isSubmitting || !newShift.name || !newShift.teamId || !newShift.startTime || !newShift.endTime}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>
                        ) : (
                          'Créer le Shift'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Dialog de modification de pikett */}
        {selectedPikett && (
          <Dialog open={isEditPikettDialogOpen} onOpenChange={setIsEditPikettDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier le pikett</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nom du pikett</Label>
                  <Input
                    value={selectedPikett.name}
                    onChange={(e) => setSelectedPikett({...selectedPikett, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedPikett.description || ''}
                    onChange={(e) => setSelectedPikett({...selectedPikett, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Équipe</Label>
                    <Select 
                      value={selectedPikett.teamId} 
                      onValueChange={(value) => setSelectedPikett({...selectedPikett, teamId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Semaine</Label>
                    <Input
                      type="week"
                      value={selectedPikett.startWeek}
                      onChange={(e) => setSelectedPikett({...selectedPikett, startWeek: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Personne assignée</Label>
                  <Select 
                    value={selectedPikett.userId} 
                    onValueChange={(value) => setSelectedPikett({...selectedPikett, userId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => u.teamId === selectedPikett.teamId && u.status === 'ACTIVE')
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsEditPikettDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleEditPikett}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de modification de shift existant */}
        {selectedShift && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            {/* ... contenu existant ... */}
          </Dialog>
        )}

        {/* Filters and Search */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={viewType === 'shifts' ? "Rechercher un shift..." : "Rechercher un pikett..."}
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les équipes</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="ACTIVE">Actifs</SelectItem>
                    <SelectItem value="INACTIVE">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>
                  {viewType === 'shifts' 
                    ? `${filteredShifts.length} shift${filteredShifts.length > 1 ? 's' : ''}`
                    : `${filteredPiketts.length} pikett${filteredPiketts.length > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu selon le type de vue */}
        {viewType === 'shifts' ? (
          filteredShifts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredShifts.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {searchQuery || filterTeam !== 'all' || filterStatus !== 'all' 
                    ? 'Aucun shift trouvé' 
                    : 'Aucun shift configuré'}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md">
                  {searchQuery || filterTeam !== 'all' || filterStatus !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche ou créez un nouveau shift.'
                    : 'Commencez par créer votre premier shift pour organiser vos équipes.'}
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Shift
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          filteredPiketts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPiketts.map((pikett) => (
                <PikettCard key={pikett.id} pikett={pikett} />
              ))}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Aucun pikett configuré
                </h3>
                <p className="text-slate-600 mb-6 max-w-md">
                  Configurez les astreintes hebdomadaires pour vos équipes.
                </p>
                <Button 
                  onClick={() => setIsCreatePikettDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Pikett
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </main>
    </div>
  );
};

export default ShiftsPage;