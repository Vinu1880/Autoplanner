'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Mail,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Download,
  Upload,
  Settings,
  Shield,
  Loader2,
  RefreshCw,
  AlertCircle,
  Save,
  X,
  Sun,
  Moon,
  CalendarDays,
  Building2,
  Crown,
  RotateCw,
  ChevronRight,
  Info,
  Palette,
  UserPlus,
  Grid3X3,
  List,
  Filter,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import des hooks
import { useUsers } from '@/lib/hooks/useUsers';
import { useTeams } from '@/lib/hooks/useTeams';

// Types
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface WeekPattern {
  [key: string]: TimeSlot[];
}

interface RotationPattern {
  id: string;
  name: string;
  description?: string;
  weeks: WeekPattern[];
  cycleLength: number;
}

interface RotationConfig {
  patternId: string;
  priority: 'high' | 'medium' | 'low';
  allowedShiftTypes: string[];
}

type DayAvailability = {
  morning: boolean;
  afternoon: boolean;
};

type WeekAvailability = {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
};

const fullTimeAvailability: WeekAvailability = {
  monday: { morning: true, afternoon: true },
  tuesday: { morning: true, afternoon: true },
  wednesday: { morning: true, afternoon: true },
  thursday: { morning: true, afternoon: true },
  friday: { morning: true, afternoon: true },
  saturday: { morning: false, afternoon: false },
  sunday: { morning: false, afternoon: false }
};

const TEAM_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6'
];

// Patterns par dÃ©faut
const defaultPatterns: RotationPattern[] = [
  {
    id: '1',
    name: 'Alternance Dispatch Matin/AprÃ¨s-midi',
    description: 'Alterne entre matin et aprÃ¨s-midi chaque semaine',
    cycleLength: 2,
    weeks: [
      {
        monday: ['morning'],
        tuesday: ['morning'],
        wednesday: ['morning'],
        thursday: ['morning'],
        friday: ['morning'],
        saturday: [],
        sunday: []
      },
      {
        monday: ['afternoon'],
        tuesday: ['afternoon'],
        wednesday: ['afternoon'],
        thursday: ['afternoon'],
        friday: ['afternoon'],
        saturday: [],
        sunday: []
      }
    ]
  },
  {
    id: '2',
    name: 'Rotation 3 Semaines Mixte',
    description: 'Cycle de 3 semaines avec horaires variÃ©s',
    cycleLength: 3,
    weeks: [
      {
        monday: ['morning'],
        tuesday: ['afternoon'],
        wednesday: ['morning'],
        thursday: ['afternoon'],
        friday: ['morning'],
        saturday: [],
        sunday: []
      },
      {
        monday: ['afternoon'],
        tuesday: ['morning'],
        wednesday: ['afternoon'],
        thursday: ['morning'],
        friday: ['afternoon'],
        saturday: [],
        sunday: []
      },
      {
        monday: ['morning'],
        tuesday: ['morning'],
        wednesday: ['afternoon'],
        thursday: ['afternoon'],
        friday: ['morning'],
        saturday: [],
        sunday: []
      }
    ]
  }
];

// Ajout du style CSS pour l'animation de rotation
const rotationStyle = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
`;

const UsersPage = () => {
  const [viewMode, setViewMode] = useState<'users' | 'teams'>('users');
  const [userViewType, setUserViewType] = useState<'grid' | 'list'>('grid');
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [isCreatePatternOpen, setIsCreatePatternOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'status'>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [workType, setWorkType] = useState<'full' | 'partial' | 'rotation'>('full');
  const [editWorkType, setEditWorkType] = useState<'full' | 'partial' | 'rotation'>('full');
  
  // Ã‰tat pour les patterns de rotation
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>(defaultPatterns);
  
  // Charger les patterns depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rotationPatterns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRotationPatterns(parsed);
        } catch (e) {
          console.error('Erreur chargement patterns:', e);
          setRotationPatterns(defaultPatterns);
        }
      }
    }
  }, []);

  // Sauvegarder les patterns dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rotationPatterns', JSON.stringify(rotationPatterns));
    }
  }, [rotationPatterns]);

  // Ajouter le style CSS
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = rotationStyle;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const [newPattern, setNewPattern] = useState<RotationPattern>({
    id: '',
    name: '',
    description: '',
    cycleLength: 2,
    weeks: [
      { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
      { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
    ]
  });

  const [newUser, setNewUser] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    teamId: '',
    role: '',
    workPercent: 100,
    notes: '',
    availability: fullTimeAvailability,
    rotationConfig: null as RotationConfig | null
  });

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    leadId: ''
  });

  // Utilisation des hooks
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    createUser,
    updateUser,
    deleteUser,
    refetch: refetchUsers 
  } = useUsers();
  
  const { 
    teams, 
    loading: teamsLoading, 
    error: teamsError,
    createTeam,
    updateTeam,
    deleteTeam,
    refetch: refetchTeams 
  } = useTeams();

  // Fonctions utilitaires
  const calculateWorkPercent = (availability: WeekAvailability | null | undefined): number => {
    if (!availability) return 100;
    
    let totalSlots = 0;
    let availableSlots = 0;
    const workDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    workDays.forEach((day) => {
      totalSlots += 2;
      const dayAvail = availability[day as keyof WeekAvailability];
      if (dayAvail?.morning) availableSlots++;
      if (dayAvail?.afternoon) availableSlots++;
    });
    
    return Math.round((availableSlots / totalSlots) * 100);
  };

  const toggleSlot = (weekIndex: number, day: string, slot: TimeSlot) => {
    const updatedWeeks = [...newPattern.weeks];
    const daySlots = updatedWeeks[weekIndex][day] || [];
    
    if (daySlots.includes(slot)) {
      updatedWeeks[weekIndex][day] = daySlots.filter(s => s !== slot);
    } else {
      updatedWeeks[weekIndex][day] = [...daySlots, slot];
    }
    
    setNewPattern({ ...newPattern, weeks: updatedWeeks });
  };

  const adjustCycleLength = (newLength: number) => {
    const updatedWeeks = [...newPattern.weeks];
    
    if (newLength > newPattern.cycleLength) {
      for (let i = newPattern.cycleLength; i < newLength; i++) {
        updatedWeeks.push({
          monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        });
      }
    } else {
      updatedWeeks.splice(newLength);
    }
    
    setNewPattern({
      ...newPattern,
      cycleLength: newLength,
      weeks: updatedWeeks
    });
  };

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

  const getWorkPercentBadge = (percent: number) => {
    let colorClass = '';
    if (percent === 100) colorClass = 'bg-green-100 text-green-800';
    else if (percent >= 80) colorClass = 'bg-blue-100 text-blue-800';
    else colorClass = 'bg-orange-100 text-orange-800';
    
    return (
      <Badge className={`${colorClass} border-0`}>
        {percent}%
      </Badge>
    );
  };

  // Composant AvailabilityEditor amÃ©liorÃ©
  const AvailabilityEditor = ({ 
    availability, 
    onChange, 
    workType: localWorkType,
    onWorkTypeChange,
    rotationConfig,
    onRotationConfigChange
  }: any) => {
    const days = [
      { key: 'monday', label: 'Lundi' },
      { key: 'tuesday', label: 'Mardi' },
      { key: 'wednesday', label: 'Mercredi' },
      { key: 'thursday', label: 'Jeudi' },
      { key: 'friday', label: 'Vendredi' },
      { key: 'saturday', label: 'Samedi' },
      { key: 'sunday', label: 'Dimanche' }
    ];

    const handleDayChange = (day: string, period: 'morning' | 'afternoon', value: boolean) => {
      const newAvailability = { ...availability };
      newAvailability[day as keyof WeekAvailability][period] = value;
      onChange(newAvailability);
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Type de contrat</Label>
          <RadioGroup value={localWorkType} onValueChange={onWorkTypeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="font-normal cursor-pointer">
                Temps plein (100%)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <Label htmlFor="partial" className="font-normal cursor-pointer">
                Temps partiel (personnalisé)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rotation" id="rotation" />
              <Label htmlFor="rotation" className="font-normal cursor-pointer flex items-center">
                <RotateCw className="w-4 h-4 mr-1" />
                Rotation automatique
              </Label>
            </div>
          </RadioGroup>
        </div>

        {localWorkType === 'partial' && (
          <div className="border rounded-lg p-4 space-y-3">
            {days.map(day => (
              <div key={day.key} className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">{day.label}</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={availability[day.key as keyof WeekAvailability].morning}
                      onCheckedChange={(checked) => 
                        handleDayChange(day.key, 'morning', checked as boolean)
                      }
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      Matin
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={availability[day.key as keyof WeekAvailability].afternoon}
                      onCheckedChange={(checked) => 
                        handleDayChange(day.key, 'afternoon', checked as boolean)
                      }
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      Après-midi
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {localWorkType === 'rotation' && (
          <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <RotateCw className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-slate-800">Configuration de rotation</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label>Pattern de rotation</Label>
                <Select
                  value={rotationConfig?.patternId || ''}
                  onValueChange={(patternId) => {
                    onRotationConfigChange({
                      ...rotationConfig,
                      patternId,
                      priority: rotationConfig?.priority || 'medium',
                      allowedShiftTypes: rotationConfig?.allowedShiftTypes || []
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="SÃ©lectionner un pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {rotationPatterns.map(pattern => (
                      <SelectItem key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCreatePatternOpen(true)}
                  className="w-full mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Créer un nouveau pattern
                </Button>
              </div>

              <div>
                <Label>Priorité d'assignation</Label>
                <RadioGroup
                  value={rotationConfig?.priority || 'medium'}
                  onValueChange={(value) => {
                    onRotationConfigChange({
                      ...rotationConfig,
                      patternId: rotationConfig?.patternId || '',
                      priority: value as 'high' | 'medium' | 'low',
                      allowedShiftTypes: rotationConfig?.allowedShiftTypes || []
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="font-normal">Haute - Toujours assigné en priorité</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="font-normal">Moyenne - Selon disponibilité</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="font-normal">Basse - Si nécessaire</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleCreateUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: any = {
        ...newUser,
        teamId: newUser.teamId || undefined,
        workPercent: workType === 'rotation' ? 100 : calculateWorkPercent(newUser.availability),
        status: 'ACTIVE'
      };

      // Ajouter la configuration de rotation si applicable
      if (workType === 'rotation' && newUser.rotationConfig?.patternId) {
        userData.rotationConfig = newUser.rotationConfig;
      } else {
        userData.rotationConfig = null;
      }

      console.log('Creating user with data:', userData);
      await createUser(userData);
      
      setIsCreateUserDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        teamId: '',
        role: '',
        workPercent: 100,
        notes: '',
        availability: fullTimeAvailability,
        rotationConfig: null
      });
      setWorkType('full');
      
      refetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const userData: any = {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        phone: selectedUser.phone || undefined,
        teamId: selectedUser.teamId || undefined,
        role: selectedUser.role || undefined,
        workPercent: editWorkType === 'rotation' ? 100 : calculateWorkPercent(selectedUser.availability),
        notes: selectedUser.notes || undefined,
        status: selectedUser.status,
        availability: selectedUser.availability
      };

      // Ajouter ou supprimer la configuration de rotation
      if (editWorkType === 'rotation' && selectedUser.rotationConfig?.patternId) {
        userData.rotationConfig = selectedUser.rotationConfig;
      } else {
        userData.rotationConfig = null;
      }

      console.log('Updating user with data:', userData);
      await updateUser(selectedUser.id, userData);
      
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      setEditWorkType('full');
      
      refetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name) {
      alert('Le nom est obligatoire');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeam(newTeam);
      setIsCreateTeamDialogOpen(false);
      setNewTeam({
        name: '',
        description: '',
        color: '#3b82f6',
        leadId: ''
      });
      refetchTeams();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'Equipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    setIsSubmitting(true);
    try {
      // CORRECTION: Si leadId est 'none' ou vide, on envoie null
      const updateData = {
        name: selectedTeam.name,
        description: selectedTeam.description || null,
        color: selectedTeam.color,
        leadId: (selectedTeam.leadId === 'none' || !selectedTeam.leadId) ? null : selectedTeam.leadId
      };
      
      console.log('Updating team with data:', updateData);
      await updateTeam(selectedTeam.id, updateData);
      
      setIsEditTeamDialogOpen(false);
      setSelectedTeam(null);
      refetchTeams();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification de l\'Equipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Etes-vous sûr de vouloir supprimer cette Equipe ?')) return;
    
    try {
      await deleteTeam(teamId);
      refetchTeams();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'Equipe');
    }
  };

  // Filtrage et tri
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = filterTeam === 'all' || user.teamId === filterTeam;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesTeam && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === 'team') {
        return (a.team?.name || 'ZZZ').localeCompare(b.team?.name || 'ZZZ');
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  // Constantes pour l'Ã©diteur de pattern
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mer',
    thursday: 'Jeu',
    friday: 'Ven',
    saturday: 'Sam',
    sunday: 'Dim'
  };

  const slots: { value: TimeSlot; label: string; color: string }[] = [
    { value: 'morning', label: 'Matin', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'afternoon', label: 'Après-midi', color: 'bg-blue-100 text-blue-800' },
    { value: 'evening', label: 'Soirée', color: 'bg-purple-100 text-purple-800' },
    { value: 'night', label: 'Nuit', color: 'bg-slate-100 text-slate-800' }
  ];

  if (usersLoading || teamsLoading) {
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
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Utilisateurs & Equipe</h1>
            <p className="text-slate-600 mt-1">Gérez vos Equipes et configurez les rotations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={() => {
              refetchUsers();
              refetchTeams();
            }} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Switcher Users/Teams amÃ©liorÃ© */}
        <div className="flex items-center space-x-4">
          <Button
            variant={viewMode === 'users' ? 'default' : 'outline'}
            onClick={() => setViewMode('users')}
            className={viewMode === 'users' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            size="lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Utilisateurs
            <Badge variant="secondary" className="ml-2">
              {users.length}
            </Badge>
          </Button>
          <Button
            variant={viewMode === 'teams' ? 'default' : 'outline'}
            onClick={() => setViewMode('teams')}
            className={viewMode === 'teams' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            size="lg"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Equipes
            <Badge variant="secondary" className="ml-2">
              {teams.length}
            </Badge>
          </Button>
        </div>

        {/* Barre de filtres et actions */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {viewMode === 'users' && (
                  <>
                    <Select value={filterTeam} onValueChange={setFilterTeam}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les Equipes</SelectItem>
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

                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'team' | 'status')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="team">Ã‰quipe</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {viewMode === 'users' && (
                  <>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant={userViewType === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setUserViewType('grid')}
                        className="rounded-r-none"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={userViewType === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setUserViewType('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-slate-600">
                      {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
                
                {viewMode === 'users' ? (
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvel Utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Créer un utilisateur</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Prénom *</Label>
                            <Input
                              value={newUser.firstName}
                              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Nom *</Label>
                            <Input
                              value={newUser.lastName}
                              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Equipe</Label>
                            <Select 
                              value={newUser.teamId || 'none'} 
                              onValueChange={(value) => setNewUser({...newUser, teamId: value === 'none' ? '' : value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="SÃ©lectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucune</SelectItem>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <AvailabilityEditor
                          availability={newUser.availability}
                          onChange={(newAvailability: WeekAvailability) => setNewUser({...newUser, availability: newAvailability})}
                          workType={workType}
                          onWorkTypeChange={(type: string) => {
                            setWorkType(type as 'full' | 'partial' | 'rotation');
                            if (type === 'rotation' && !newUser.rotationConfig) {
                              setNewUser({
                                ...newUser,
                                rotationConfig: {
                                  patternId: '',
                                  priority: 'medium',
                                  allowedShiftTypes: []
                                }
                              });
                            }
                          }}
                          rotationConfig={newUser.rotationConfig}
                          onRotationConfigChange={(config: RotationConfig) => setNewUser({...newUser, rotationConfig: config})}
                        />
                        
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleCreateUser}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</> : 'Créer'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle Equipe
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer une Equipe</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Nom de l'Equipe *</Label>
                          <Input
                            placeholder="ex: IT Support"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Description de l'Equipe..."
                            value={newTeam.description}
                            onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label>Couleur de l'Equipe</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            {TEAM_COLORS.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-lg border-2 ${
                                  newTeam.color === color ? 'border-slate-800' : 'border-slate-200'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewTeam({...newTeam, color})}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label>Chef d'Equipe</Label>
                          <Select 
                            value={newTeam.leadId || 'none'} 
                            onValueChange={(value) => setNewTeam({...newTeam, leadId: value === 'none' ? '' : value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="SÃ©lectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleCreateTeam}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</> : 'Créer'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vue Utilisateurs */}
        {viewMode === 'users' && (
          <>
            {userViewType === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredUsers.map((user) => {
                  const hasRotation = user.rotationConfig?.patternId ? true : false;
                  const rotationPattern = hasRotation ? rotationPatterns.find(p => p.id === user.rotationConfig.patternId) : null;
                  
                  return (
                    <Card key={user.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all relative">
                      {/* INDICATEUR DE ROTATION TRÃˆS VISIBLE */}
                      {hasRotation && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-2 shadow-lg">
                            <RotateCw className="w-5 h-5 text-white animate-spin-slow" />
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-xs text-slate-600">{user.role}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-600 truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-xs">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-600">{user.phone}</span>
                            </div>
                          )}
                        </div>

                        {hasRotation && rotationPattern && (
                          <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-xs font-semibold text-purple-700 flex items-center">
                              <RotateCw className="w-3 h-3 mr-1" />
                              {rotationPattern.name}
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              Priorité: {user.rotationConfig.priority === 'high' ? 'Haute âš¡' : 
                                        user.rotationConfig.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {user.team && (
                              <Badge variant="outline" className="text-xs">
                                {user.team.name}
                              </Badge>
                            )}
                            {getWorkPercentBadge(user.workPercent || 100)}
                          </div>
                          {getStatusBadge(user.status)}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t">
                          <Button
                            onClick={() => {
                              let userWorkType: 'full' | 'partial' | 'rotation' = 'full';
                              
                              if (user.rotationConfig?.patternId) {
                                userWorkType = 'rotation';
                              } else if (user.workPercent && user.workPercent < 100) {
                                userWorkType = 'partial';
                              }
                              
                              setEditWorkType(userWorkType);
                              
                              setSelectedUser({
                                id: user.id,
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                email: user.email || '',
                                phone: user.phone || '',
                                teamId: user.teamId || '',
                                role: user.role || '',
                                workPercent: user.workPercent || 100,
                                status: user.status || 'ACTIVE',
                                notes: user.notes || '',
                                availability: user.availability || fullTimeAvailability,
                                rotationConfig: user.rotationConfig || null
                              });
                              
                              setIsEditUserDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 mr-2"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white border-0 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Travail</TableHead>
                      <TableHead>Rotation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const hasRotation = user.rotationConfig?.patternId ? true : false;
                      const rotationPattern = hasRotation ? rotationPatterns.find(p => p.id === user.rotationConfig.patternId) : null;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                              </div>
                              {hasRotation && (
                                <RotateCw className="w-4 h-4 text-purple-600 animate-spin-slow" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            {user.team && (
                              <Badge variant="outline" className="text-xs">
                                {user.team.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{user.role}</TableCell>
                          <TableCell>
                            {getWorkPercentBadge(user.workPercent || 100)}
                          </TableCell>
                          <TableCell>
                            {hasRotation ? (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                                  <RotateCw className="w-3 h-3 mr-1" />
                                  {rotationPattern?.name || 'Rotation'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    let userWorkType: 'full' | 'partial' | 'rotation' = 'full';
                                    
                                    if (user.rotationConfig?.patternId) {
                                      userWorkType = 'rotation';
                                    } else if (user.workPercent && user.workPercent < 100) {
                                      userWorkType = 'partial';
                                    }
                                    
                                    setEditWorkType(userWorkType);
                                    
                                    setSelectedUser({
                                      id: user.id,
                                      firstName: user.firstName || '',
                                      lastName: user.lastName || '',
                                      email: user.email || '',
                                      phone: user.phone || '',
                                      teamId: user.teamId || '',
                                      role: user.role || '',
                                      workPercent: user.workPercent || 100,
                                      status: user.status || 'ACTIVE',
                                      notes: user.notes || '',
                                      availability: user.availability || fullTimeAvailability,
                                      rotationConfig: user.rotationConfig || null
                                    });
                                    
                                    setIsEditUserDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        )}

        {/* Vue Ã‰quipes - AmÃ©liorÃ©e avec plus de dÃ©tails */}
        {viewMode === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTeams.map((team) => {
              const teamMembers = users.filter(u => u.teamId === team.id);
              const lead = team.leadId ? users.find(u => u.id === team.leadId) : null;
              const activeMembers = teamMembers.filter(u => u.status === 'ACTIVE');
              const rotationMembers = teamMembers.filter(u => u.rotationConfig?.patternId);
              
              return (
                <Card key={team.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-800">
                            {team.name}
                          </CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{team.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {activeMembers.length} actif{activeMembers.length > 1 ? 's' : ''}
                            </Badge>
                            {rotationMembers.length > 0 && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs border-0">
                                <RotateCw className="w-3 h-3 mr-1" />
                                {rotationMembers.length} rotation{rotationMembers.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {lead && (
                      <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                        <Crown className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Chef d'Equipe
                          </p>
                          <p className="text-sm text-slate-600">
                            {lead.firstName} {lead.lastName} â€¢ {lead.email}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-700">
                          Membres de l'Equipe
                        </p>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member) => {
                            const hasRotation = member.rotationConfig?.patternId ? true : false;
                            return (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                                      {member.firstName[0]}{member.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-xs text-slate-600">{member.role || 'Sans rÃ´le'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasRotation && (
                                    <RotateCw className="w-4 h-4 text-purple-600 animate-spin-slow" />
                                  )}
                                  {getWorkPercentBadge(member.workPercent || 100)}
                                  {getStatusBadge(member.status)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500 italic text-center py-4">
                            Aucun membre dans cette Equipe
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Statistiques de l'Ã©quipe */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(teamMembers.reduce((acc, m) => acc + (m.workPercent || 100), 0) / (teamMembers.length || 1))}%
                        </p>
                        <p className="text-xs text-slate-600">Taux moyen</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round((activeMembers.length / (teamMembers.length || 1)) * 100)}%
                        </p>
                        <p className="text-xs text-slate-600">Membres actifs</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Button
                        onClick={() => {
                          setSelectedTeam({
                            id: team.id,
                            name: team.name,
                            description: team.description || '',
                            color: team.color,
                            leadId: team.leadId || 'none'
                          });
                          setIsEditTeamDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 mr-2"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDeleteTeam(team.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={teamMembers.length > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de modification d'utilisateur */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={selectedUser?.firstName || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={selectedUser?.lastName || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={selectedUser?.email || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Equipe</Label>
                  <Select 
                    value={selectedUser?.teamId || 'none'} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, teamId: value === 'none' ? '' : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="SÃ©lectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedUser && (
                <AvailabilityEditor
                  availability={selectedUser.availability || fullTimeAvailability}
                  onChange={(newAvailability: WeekAvailability) => setSelectedUser({...selectedUser, availability: newAvailability})}
                  workType={editWorkType}
                  onWorkTypeChange={(type: string) => {
                    setEditWorkType(type as 'full' | 'partial' | 'rotation');
                    if (type === 'rotation' && !selectedUser.rotationConfig) {
                      setSelectedUser({
                        ...selectedUser,
                        rotationConfig: {
                          patternId: '',
                          priority: 'medium',
                          allowedShiftTypes: []
                        }
                      });
                    }
                  }}
                  rotationConfig={selectedUser.rotationConfig}
                  onRotationConfigChange={(config: RotationConfig) => setSelectedUser({...selectedUser, rotationConfig: config})}
                />
              )}

              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedUser?.status || 'ACTIVE'} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="INACTIVE">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={selectedUser?.notes || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => {
                  setIsEditUserDialogOpen(false);
                  setSelectedUser(null);
                }}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de modification d'Ã©quipe */}
        {selectedTeam && (
          <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nom de l'Equipe *</Label>
                  <Input
                    value={selectedTeam.name}
                    onChange={(e) => setSelectedTeam({...selectedTeam, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedTeam.description}
                    onChange={(e) => setSelectedTeam({...selectedTeam, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Couleur de l'Equipe</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {TEAM_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          selectedTeam.color === color ? 'border-slate-800' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedTeam({...selectedTeam, color})}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Chef d'Equipe</Label>
                  <Select 
                    value={selectedTeam.leadId || 'none'} 
                    onValueChange={(value) => setSelectedTeam({...selectedTeam, leadId: value === 'none' ? '' : value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {users
                        .filter(u => u.teamId === selectedTeam.id)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsEditTeamDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUpdateTeam}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog création de pattern */}
        <Dialog open={isCreatePatternOpen} onOpenChange={setIsCreatePatternOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Pattern de Rotation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du pattern</Label>
                  <Input
                    placeholder="ex: Alternance Matin/AprÃ¨s-midi"
                    value={newPattern.name}
                    onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Durée du cycle (semaines)</Label>
                  <Select
                    value={newPattern.cycleLength.toString()}
                    onValueChange={(value) => adjustCycleLength(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} semaines
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description (optionnel)</Label>
                <Input
                  placeholder="Description du pattern..."
                  value={newPattern.description}
                  onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Configuration des semaines</Label>
                {newPattern.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="mt-3 p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Semaine {weekIndex + 1}</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day) => (
                        <div key={day} className="text-center">
                          <p className="text-xs font-medium mb-1">{dayLabels[day]}</p>
                          <div className="space-y-1">
                            {slots.map((slot) => (
                              <label key={slot.value} className="cursor-pointer block">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={week[day]?.includes(slot.value) || false}
                                  onChange={() => toggleSlot(weekIndex, day, slot.value)}
                                />
                                <Badge
                                  className={`cursor-pointer text-xs w-full ${
                                    week[day]?.includes(slot.value)
                                      ? slot.color + ' border-0'
                                      : 'bg-slate-100 text-slate-400 border-0'
                                  }`}
                                >
                                  {slot.label[0]}
                                </Badge>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => {
                  setIsCreatePatternOpen(false);
                  setNewPattern({
                    id: '',
                    name: '',
                    description: '',
                    cycleLength: 2,
                    weeks: [
                      { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
                      { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
                    ]
                  });
                }}>
                  Annuler
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (!newPattern.name) {
                      alert('Veuillez donner un nom au pattern');
                      return;
                    }
                    const newId = Date.now().toString();
                    const patternToAdd = { ...newPattern, id: newId };
                    const updatedPatterns = [...rotationPatterns, patternToAdd];
                    setRotationPatterns(updatedPatterns);
                    
                    // Si on Ã©tait en train de configurer une rotation, on met Ã  jour automatiquement
                    if (workType === 'rotation') {
                      setNewUser({
                        ...newUser,
                        rotationConfig: {
                          patternId: newId,
                          priority: newUser.rotationConfig?.priority || 'medium',
                          allowedShiftTypes: newUser.rotationConfig?.allowedShiftTypes || []
                        }
                      });
                    }
                    if (editWorkType === 'rotation' && selectedUser) {
                      setSelectedUser({
                        ...selectedUser,
                        rotationConfig: {
                          patternId: newId,
                          priority: selectedUser.rotationConfig?.priority || 'medium',
                          allowedShiftTypes: selectedUser.rotationConfig?.allowedShiftTypes || []
                        }
                      });
                    }
                    
                    setIsCreatePatternOpen(false);
                    setNewPattern({
                      id: '',
                      name: '',
                      description: '',
                      cycleLength: 2,
                      weeks: [
                        { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
                        { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
                      ]
                    });
                  }}
                  disabled={!newPattern.name}
                >
                  Créer le Pattern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default UsersPage;