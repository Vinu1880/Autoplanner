'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { 
      key: '/dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      description: 'Vue d\'ensemble des shifts'
    },
    { 
      key: '/users', 
      label: 'Users', 
      icon: Users,
      description: 'Gérer les utilisateurs'
    },    
    { 
      key: '/shifts', 
      label: 'Shifts', 
      icon: Clock,
      description: 'Gérer les shifts'
    },
    { 
      key: '/planner', 
      label: 'Planner', 
      icon: Calendar,
      description: 'Planifier les shifts'
    },
    { 
      key: '/settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'Configuration'
    }
  ];

  const NavigationLink = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
    const Icon = item.icon;
    const isActive = pathname === item.key;
    
    return (
      <Link
        href={item.key}
        className={`
          flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200
          ${mobile ? 'w-full' : ''}
          ${isActive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }
        `}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
        <div className="flex flex-col">
          <span className={`font-medium ${isActive ? 'text-blue-700' : ''}`}>
            {item.label}
          </span>
          {mobile && (
            <span className="text-xs text-slate-500 mt-0.5">
              {item.description}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Shift Manager</h1>
                  <p className="text-xs text-slate-500">Gestion des équipes</p>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="flex items-center space-x-2">
                {navigationItems.map((item) => (
                  <NavigationLink key={item.key} item={item} />
                ))}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Jean Dupont</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        jean.dupont@company.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800">Shift Manager</span>
            </Link>

            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-red-500 text-xs">
                  3
                </Badge>
              </Button>

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">Menu</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 py-6 space-y-2">
                      {navigationItems.map((item) => (
                        <NavigationLink key={item.key} item={item} mobile />
                      ))}
                    </div>

                    {/* User Info */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center space-x-3 px-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Jean Dupont</p>
                          <p className="text-xs text-slate-500">jean.dupont@company.com</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;