'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { 
  CheckCircle, 
  XCircle, 
  Clock3, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage = () => {
  const [dateFilter, setDateFilter] = useState('7d');
  
  // Mock data
  const stats = {
    accepted: 24,
    refused: 3,
    pending: 8,
    total: 35
  };

  const recentShifts = [
    { 
      id: 1, 
      shift: 'Morning Shift', 
      user: 'Jean Dupont', 
      date: '2025-01-15', 
      status: 'accepted',
      team: 'IT Support',
      time: '08:00 - 16:00'
    },
    { 
      id: 2, 
      shift: 'Afternoon Shift', 
      user: 'Marie Martin', 
      date: '2025-01-15', 
      status: 'pending',
      team: 'Development',
      time: '14:00 - 22:00'
    },
    { 
      id: 3, 
      shift: 'Night Shift', 
      user: 'Pierre Durand', 
      date: '2025-01-16', 
      status: 'refused',
      team: 'Operations',
      time: '22:00 - 06:00'
    },
    { 
      id: 4, 
      shift: 'Morning Shift', 
      user: 'Sophie Legrand', 
      date: '2025-01-17', 
      status: 'accepted',
      team: 'IT Support',
      time: '08:00 - 16:00'
    },
    { 
      id: 5, 
      shift: 'Weekend Shift', 
      user: 'Thomas Bernard', 
      date: '2025-01-18', 
      status: 'pending',
      team: 'Operations',
      time: '09:00 - 17:00'
    }
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      accepted: { variant: 'default' as const, label: 'Accepté', color: 'bg-green-100 text-green-800' },
      refused: { variant: 'destructive' as const, label: 'Refusé', color: 'bg-red-100 text-red-800' },
      pending: { variant: 'secondary' as const, label: 'En attente', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = configs[status as keyof typeof configs];
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {change && (
                <span className="text-sm text-green-600 font-medium">
                  +{change}%
                </span>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        {change && (
          <div className="mt-4">
            <Progress value={75} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">
              vs période précédente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Vue d'ensemble de vos shifts et statistiques
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Tabs value={dateFilter} onValueChange={setDateFilter} className="w-auto">
              <TabsList className="grid grid-cols-4 w-80">
                <TabsTrigger value="24h" className="text-xs">24h</TabsTrigger>
                <TabsTrigger value="7d" className="text-xs">7 jours</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs">30 jours</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs">90 jours</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={CheckCircle}
            title="Shifts Acceptés"
            value={stats.accepted}
            change={12}
            color="text-green-600"
          />
          <StatCard
            icon={XCircle}
            title="Shifts Refusés"
            value={stats.refused}
            change={-8}
            color="text-red-600"
          />
          <StatCard
            icon={Clock3}
            title="En Attente"
            value={stats.pending}
            color="text-orange-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Shifts"
            value={stats.total}
            change={15}
            color="text-blue-600"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shifts */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Shifts Récents
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Dernières demandes envoyées
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-slate-600 font-medium py-3 px-2">Utilisateur</th>
                        <th className="text-left text-slate-600 font-medium py-3 px-2">Shift</th>
                        <th className="text-left text-slate-600 font-medium py-3 px-2">Date</th>
                        <th className="text-left text-slate-600 font-medium py-3 px-2">Status</th>
                        <th className="text-left text-slate-600 font-medium py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShifts.map((shift) => (
                        <tr key={shift.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {shift.user.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{shift.user}</p>
                                <p className="text-xs text-slate-500">{shift.team}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div>
                              <p className="font-medium text-slate-800">{shift.shift}</p>
                              <p className="text-xs text-slate-500">{shift.time}</p>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-slate-600">
                            {new Date(shift.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-2">
                            {getStatusBadge(shift.status)}
                          </td>
                          <td className="py-4 px-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Renvoyer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Affichage de 5 sur {stats.total} shifts
                  </p>
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier un shift
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Gérer les équipes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Voir les rapports
                </Button>
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Performance des Équipes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'IT Support', accepted: 85, total: 100, color: 'bg-green-500' },
                  { name: 'Development', accepted: 92, total: 100, color: 'bg-blue-500' },
                  { name: 'Operations', accepted: 78, total: 100, color: 'bg-orange-500' }
                ].map((team, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">{team.name}</p>
                      <p className="text-sm text-slate-600">{team.accepted}%</p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${team.color}`}
                        style={{ width: `${team.accepted}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: 'warning',
                      message: '3 shifts en attente nécessitent une action',
                      time: 'Il y a 2h',
                      color: 'text-orange-600'
                    },
                    {
                      type: 'success',
                      message: 'Planning de la semaine validé',
                      time: 'Il y a 4h',
                      color: 'text-green-600'
                    },
                    {
                      type: 'info',
                      message: 'Nouveau membre ajouté à l\'équipe IT',
                      time: 'Hier',
                      color: 'text-blue-600'
                    }
                  ].map((notif, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Timeline */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">
              Activité Récente
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Historique des dernières actions système
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Shift accepté',
                  user: 'Jean Dupont',
                  details: 'Morning Shift - 15/01/2025',
                  time: '14:30',
                  icon: CheckCircle,
                  color: 'text-green-600'
                },
                {
                  action: 'Nouveau shift créé',
                  user: 'Admin',
                  details: 'Weekend Support - Équipe Operations',
                  time: '12:15',
                  icon: Calendar,
                  color: 'text-blue-600'
                },
                {
                  action: 'Shift refusé',
                  user: 'Marie Martin',
                  details: 'Night Shift - 16/01/2025',
                  time: '10:45',
                  icon: XCircle,
                  color: 'text-red-600'
                },
                {
                  action: 'Utilisateur ajouté',
                  user: 'Admin',
                  details: 'Sophie Legrand - Équipe IT Support',
                  time: '09:20',
                  icon: Users,
                  color: 'text-purple-600'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 pb-4 border-b border-slate-100 last:border-b-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800">{activity.action}</h4>
                      <span className="text-sm text-slate-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {activity.user} • {activity.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    );
};

export default DashboardPage;