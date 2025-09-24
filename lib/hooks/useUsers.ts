// lib/hooks/useUsers.ts
import { useState, useEffect } from 'react';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: any) => {
    // Préparer les données de rotation si présentes
    const dataToSend = { ...userData };
    
    if (userData.rotationConfig && userData.rotationConfig.patternId) {
      // Créer ou lier la configuration de rotation
      dataToSend.rotationConfig = {
        create: {
          patternId: userData.rotationConfig.patternId,
          priority: userData.rotationConfig.priority || 'MEDIUM',
          allowedShiftTypes: userData.rotationConfig.allowedShiftTypes || []
        }
      };
    } else {
      delete dataToSend.rotationConfig;
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    
    if (!response.ok) throw new Error('Failed to create user');
    
    await fetchUsers();
    return response.json();
  };

  const updateUser = async (id: string, userData: any) => {
    const dataToSend = { ...userData };
    
    // Gérer la mise à jour de la rotation
    if (userData.rotationConfig) {
      if (userData.rotationConfig.patternId) {
        dataToSend.rotationConfig = {
          upsert: {
            create: {
              patternId: userData.rotationConfig.patternId,
              priority: userData.rotationConfig.priority || 'MEDIUM',
              allowedShiftTypes: userData.rotationConfig.allowedShiftTypes || []
            },
            update: {
              patternId: userData.rotationConfig.patternId,
              priority: userData.rotationConfig.priority || 'MEDIUM',
              allowedShiftTypes: userData.rotationConfig.allowedShiftTypes || []
            }
          }
        };
      } else {
        // Si pas de pattern, on déconnecte la rotation
        dataToSend.rotationConfig = {
          disconnect: true
        };
      }
    }

    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    
    if (!response.ok) throw new Error('Failed to update user');
    
    await fetchUsers();
    return response.json();
  };

  const deleteUser = async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete user');
    
    await fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
}