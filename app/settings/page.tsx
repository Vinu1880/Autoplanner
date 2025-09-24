'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { 
  Settings, 
  Mail, 
  Calendar, 
  Shield, 
  Bell,
  Users,
  Clock,
  Database,
  Palette,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Key,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // Email Settings
    emailFrom: 'shifts@company.com',
    emailTemplate: 'Bonjour {nom},\n\nVous êtes assigné au shift {shift} le {date} de {heureDebut} à {heureFin}.\n\nMerci de confirmer votre présence.\n\nÉquipe Shift Manager',
    
    // Planning Rules
    avoidConsecutiveShifts: true,
    balanceShifts: true,
    checkCalendars: true,
    respectWorkPercentage: true,
    prioritySystem: true,
    
    // Notifications
    emailNotifications: true,
    browserNotifications: true,
    reminderTime: 24,
    
    // System
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    
    // Security
    sessionTimeout: 480,
    requireMFA: false,
    passwordPolicy: 'medium',
    auditLogs: true,
    
    // Integration
    azureAdEnabled: true,
    outlookIntegration: true,
    teamsIntegration: false,
    webhookUrl: '',
    
    // Database
    backupFrequency: 'daily',
    retentionPeriod: 90,
    autoCleanup: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const SettingItem = ({ icon: Icon, title, description, children }: any) => (
    <div className="flex items-start space-x-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-medium text-slate-800">{title}</h4>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>
            <p className="text-slate-600 mt-1">
              Configurez votre système de gestion des shifts
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurer par défaut
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-slate-800">Azure AD</p>
                <p className="text-sm text-slate-600">Connecté</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-slate-800">Base de données</p>
                <p className="text-sm text-slate-600">Opérationnelle</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div>
                <p className="font-medium text-slate-800">Outlook</p>
                <p className="text-sm text-slate-600">Configuration requise</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          </TabsList>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Configuration Email
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Configurez les paramètres d'envoi des invitations
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Email d'expédition</Label>
                  <Input
                    type="email"
                    value={settings.emailFrom}
                    onChange={(e) => setSettings({...settings, emailFrom: e.target.value})}
                    placeholder="shifts@company.com"
                  />
                  <p className="text-xs text-slate-500">
                    Adresse email utilisée pour envoyer les invitations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Modèle d'invitation</Label>
                  <Textarea
                    value={settings.emailTemplate}
                    onChange={(e) => setSettings({...settings, emailTemplate: e.target.value})}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {'{nom}'} - Nom de l'utilisateur
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {'{shift}'} - Nom du shift
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {'{date}'} - Date du shift
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {'{heureDebut}'} - Heure de début
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {'{heureFin}'} - Heure de fin
                    </Badge>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Les emails seront envoyés via le service SMTP configuré dans Azure AD.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planning Rules */}
          <TabsContent value="rules" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Règles de Planification
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Définissez les contraintes métier pour l'assignation des shifts
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingItem
                  icon={Calendar}
                  title="Éviter les shifts consécutifs"
                  description="Ne pas assigner de shift le jour précédent ou suivant"
                >
                  <Switch
                    checked={settings.avoidConsecutiveShifts}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, avoidConsecutiveShifts: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={Users}
                  title="Répartition équitable"
                  description="Assurer une distribution équitable des shifts entre les membres"
                >
                  <Switch
                    checked={settings.balanceShifts}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, balanceShifts: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={Calendar}
                  title="Vérification des calendriers"
                  description="Parser les calendriers Outlook pour détecter les absences"
                >
                  <Switch
                    checked={settings.checkCalendars}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, checkCalendars: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={Clock}
                  title="Respecter le pourcentage de travail"
                  description="Prendre en compte le temps partiel des utilisateurs"
                >
                  <Switch
                    checked={settings.respectWorkPercentage}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, respectWorkPercentage: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={AlertTriangle}
                  title="Système de priorités"
                  description="Privilégier les équipes avec moins de membres"
                >
                  <Switch
                    checked={settings.prioritySystem}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, prioritySystem: checked})
                    }
                  />
                </SettingItem>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Bell className="w-5 h-5 mr-2 text-blue-600" />
                  Notifications
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Configurez les notifications et rappels
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingItem
                  icon={Mail}
                  title="Notifications par email"
                  description="Envoyer des notifications par email"
                >
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, emailNotifications: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={Bell}
                  title="Notifications navigateur"
                  description="Afficher des notifications dans le navigateur"
                >
                  <Switch
                    checked={settings.browserNotifications}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, browserNotifications: checked})
                    }
                  />
                </SettingItem>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Rappel avant shift (heures)
                  </Label>
                  <Select 
                    value={settings.reminderTime.toString()} 
                    onValueChange={(value) => 
                      setSettings({...settings, reminderTime: parseInt(value)})
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 heure</SelectItem>
                      <SelectItem value="2">2 heures</SelectItem>
                      <SelectItem value="4">4 heures</SelectItem>
                      <SelectItem value="12">12 heures</SelectItem>
                      <SelectItem value="24">24 heures</SelectItem>
                      <SelectItem value="48">48 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  Paramètres Système
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Configuration générale de l'application
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Langue</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => setSettings({...settings, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Fuseau horaire</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => setSettings({...settings, timezone: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Format de date</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => setSettings({...settings, dateFormat: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Format d'heure</Label>
                    <Select 
                      value={settings.timeFormat} 
                      onValueChange={(value) => setSettings({...settings, timeFormat: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 heures</SelectItem>
                        <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Sécurité
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Paramètres de sécurité et d'authentification
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Timeout de session (minutes)
                  </Label>
                  <Select 
                    value={settings.sessionTimeout.toString()} 
                    onValueChange={(value) => 
                      setSettings({...settings, sessionTimeout: parseInt(value)})
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="240">4 heures</SelectItem>
                      <SelectItem value="480">8 heures</SelectItem>
                      <SelectItem value="720">12 heures</SelectItem>
                      <SelectItem value="1440">24 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SettingItem
                  icon={Key}
                  title="Authentification multi-facteurs"
                  description="Exiger l'authentification à deux facteurs"
                >
                  <Switch
                    checked={settings.requireMFA}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, requireMFA: checked})
                    }
                  />
                </SettingItem>

                <SettingItem
                  icon={Database}
                  title="Journaux d'audit"
                  description="Enregistrer toutes les actions utilisateur"
                >
                  <Switch
                    checked={settings.auditLogs}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, auditLogs: checked})
                    }
                  />
                </SettingItem>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    La sécurité est gérée principalement par Azure AD. Ces paramètres complètent la configuration.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Intégrations
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Configurez les intégrations avec les services externes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingItem
                  icon={Shield}
                  title="Azure Active Directory"
                  description="Intégration avec Azure AD pour l'authentification"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connecté
                    </Badge>
                    <Switch
                      checked={settings.azureAdEnabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, azureAdEnabled: checked})
                      }
                    />
                  </div>
                </SettingItem>

                <SettingItem
                  icon={Calendar}
                  title="Microsoft Outlook"
                  description="Synchronisation des calendriers et envoi d'invitations"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-orange-100 text-orange-800 border-0">
                      Configuration requise
                    </Badge>
                    <Switch
                      checked={settings.outlookIntegration}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, outlookIntegration: checked})
                      }
                    />
                  </div>
                </SettingItem>

                <SettingItem
                  icon={Users}
                  title="Microsoft Teams"
                  description="Notifications et intégration avec Teams"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-slate-100 text-slate-600 border-0">
                      Non configuré
                    </Badge>
                    <Switch
                      checked={settings.teamsIntegration}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, teamsIntegration: checked})
                      }
                    />
                  </div>
                </SettingItem>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Webhook personnalisé</h4>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">URL du webhook</Label>
                    <Input
                      placeholder="https://your-webhook-url.com/endpoint"
                      value={settings.webhookUrl}
                      onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                    />
                    <p className="text-xs text-slate-500">
                      URL appelée lors des événements importants (création, acceptation, refus de shifts)
                    </p>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Infrastructure prête :</strong> better-auth + Prisma + PostgreSQL configurés 
                    pour gérer toutes ces intégrations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Database & Backup */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-slate-800">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  Base de Données & Sauvegardes
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Configuration de la base de données PostgreSQL et des sauvegardes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Fréquence de sauvegarde
                    </Label>
                    <Select 
                      value={settings.backupFrequency} 
                      onValueChange={(value) => setSettings({...settings, backupFrequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Période de rétention (jours)
                    </Label>
                    <Select 
                      value={settings.retentionPeriod.toString()} 
                      onValueChange={(value) => 
                        setSettings({...settings, retentionPeriod: parseInt(value)})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="180">180 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SettingItem
                  icon={RefreshCw}
                  title="Nettoyage automatique"
                  description="Supprimer automatiquement les anciennes données"
                >
                  <Switch
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, autoCleanup: checked})
                    }
                  />
                </SettingItem>

                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <Server className="w-8 h-8 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">Base de données PostgreSQL</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Connectée • Dernière sauvegarde: il y a 2h • Taille: 45.2 MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Tester la connexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Configuration Summary */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Résumé de la Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-800 mb-1">Authentification</h4>
                <p className="text-sm text-green-700">Azure AD configuré</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Settings className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 mb-1">Règles Métier</h4>
                <p className="text-sm text-blue-700">5 règles actives</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h4 className="font-medium text-orange-800 mb-1">Intégrations</h4>
                <p className="text-sm text-orange-700">Configuration partielle</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 pt-6 border-t">
          <Button variant="outline" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sauvegarde en cours...</span>
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder tous les paramètres
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;