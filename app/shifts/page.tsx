'use client';

import React, { useState } from 'react';
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
  X
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        membersRequired: 1, // Valeur par défaut
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
        includedUserIds: selectedShift.includedUserIds || [],
        excludedUserIds: selectedShift.excludedUserIds || [],
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
        includedUserIds: shift.includedUserIds || [],
        excludedUserIds: shift.excludedUserIds || []
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
    // Récupérer les utilisateurs de base de l'équipe (sans les exclus)
    const baseTeamUsers = users.filter(u => u.teamId === teamId && u.status === 'ACTIVE');
    
    // Récupérer les utilisateurs d'autres équipes
    const otherTeamUsers = users.filter(u => u.teamId !== teamId && u.status === 'ACTIVE');
    
    // Construire la liste effective des membres de l'équipe pour ce shift
    // = membres de l'équipe NON exclus + utilisateurs ajoutés d'autres équipes
    const effectiveTeamMembers = [
      ...baseTeamUsers.filter(u => !excludedUserIds.includes(u.id)),
      ...otherTeamUsers.filter(u => selectedUserIds.includes(u.id))
    ];
    
    // Utilisateurs disponibles = autres équipes non encore ajoutés + membres exclus
    const availableUsers = [
      ...otherTeamUsers.filter(u => !selectedUserIds.includes(u.id)),
      ...baseTeamUsers.filter(u => excludedUserIds.includes(u.id))
    ];

    const handleRemoveFromShift = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (user.teamId === teamId) {
        // C'est un membre de l'équipe de base -> on l'exclut
        onExcludeChange([...excludedUserIds, userId]);
      } else {
        // C'est un utilisateur ajouté d'une autre équipe -> on le retire
        onIncludeChange(selectedUserIds.filter(id => id !== userId));
      }
    };

    const handleAddToShift = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (user.teamId === teamId) {
        // C'est un membre exclu de l'équipe -> on le réintègre
        onExcludeChange(excludedUserIds.filter(id => id !== userId));
      } else {
        // C'est un utilisateur d'une autre équipe -> on l'ajoute
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

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Les membres de l'équipe sont automatiquement inclus</p>
          <p>• Utilisez <UserMinus className="w-3 h-3 inline text-red-600" /> pour retirer un membre du shift</p>
          <p>• Utilisez <UserPlus className="w-3 h-3 inline text-green-600" /> pour ajouter des membres d'autres équipes</p>
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Shifts</h1>
            <p className="text-slate-600 mt-1">
              Créez, modifiez et organisez vos shifts d'équipe
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={refetchShifts}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            
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
          </div>
        </div>

        {/* Dialog de modification */}
        {selectedShift && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le shift</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du shift</Label>
                    <Input
                      value={selectedShift.name}
                      onChange={(e) => setSelectedShift({...selectedShift, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedShift.description || ''}
                      onChange={(e) => setSelectedShift({...selectedShift, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heure de début</Label>
                      <Input
                        type="time"
                        value={selectedShift.startTime}
                        onChange={(e) => setSelectedShift({...selectedShift, startTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure de fin</Label>
                      <Input
                        type="time"
                        value={selectedShift.endTime}
                        onChange={(e) => setSelectedShift({...selectedShift, endTime: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Équipe</Label>
                    <Select 
                      value={selectedShift.teamId} 
                      onValueChange={(value) => setSelectedShift({...selectedShift, teamId: value})}
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

                  {selectedShift.teamId && (
                    <MembersSelector
                      selectedUserIds={selectedShift.includedUserIds || []}
                      excludedUserIds={selectedShift.excludedUserIds || []}
                      onIncludeChange={(ids) => setSelectedShift({...selectedShift, includedUserIds: ids})}
                      onExcludeChange={(ids) => setSelectedShift({...selectedShift, excludedUserIds: ids})}
                      teamId={selectedShift.teamId}
                    />
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleEditShift}
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

        {/* Filters and Search */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher un shift..."
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
                <span>{filteredShifts.length} shift{filteredShifts.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shifts Grid */}
        {filteredShifts.length > 0 ? (
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
                  : 'Aucun shift configuré'
                }
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                {searchQuery || filterTeam !== 'all' || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche ou créez un nouveau shift.'
                  : 'Commencez par créer votre premier shift pour organiser vos équipes.'
                }
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
        )}
      </main>
    </div>
  );
};

export default ShiftsPage;