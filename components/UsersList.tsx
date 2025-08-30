"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Search, Trash2, Eye, Phone, Mail, Calendar, Baby, 
  MoreVertical, UserPlus, Filter
} from "lucide-react";
import { motion } from "framer-motion";

interface UserExtended {
  $id: string;
  userId: string;
  phone: string;
  address?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Student {
  $id: string;
  name: string;
  age: number;
  dateOfBirth?: string;
  parentId: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
  joinDate: string;
}

interface UserWithDetails {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  registration: string;
  status: boolean;
  extendedData?: UserExtended;
  children: Student[];
  totalSessions: number;
}

interface UsersListProps {
  users: UserWithDetails[];
  loading?: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onViewUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onRefresh: () => void;
  deletingUserId?: string | null;
  className?: string;
}

export default function UsersList({
  users,
  loading = false,
  searchTerm,
  onSearchChange,
  onViewUser,
  onDeleteUser,
  onRefresh,
  deletingUserId = null,
  className = ""
}: UsersListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'children' | 'sessions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.children.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.registration);
        bValue = new Date(b.registration);
        break;
      case 'children':
        aValue = a.children.length;
        bValue = b.children.length;
        break;
      case 'sessions':
        aValue = a.totalSessions;
        bValue = b.totalSessions;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Search Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Αναζήτηση χρηστών, email, τηλέφωνο ή όνομα παιδιού..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Users className="w-4 h-4" />
                <span>Ανανέωση</span>
              </Button>
              
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Ταξινόμηση:</span>
                <select 
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="date-desc">Πρόσφατη εγγραφή</option>
                  <option value="date-asc">Παλαιότερη εγγραφή</option>
                  <option value="name-asc">Όνομα (Α-Ω)</option>
                  <option value="name-desc">Όνομα (Ω-Α)</option>
                  <option value="children-desc">Περισσότερα παιδιά</option>
                  <option value="sessions-desc">Περισσότερες συνεδρίες</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredUsers.length === users.length 
            ? `${users.length} χρήστες` 
            : `${filteredUsers.length} από ${users.length} χρήστες`}
        </span>
        <span>
          Σύνολο: {users.reduce((acc, user) => acc + user.children.length, 0)} παιδιά, {' '}
          {users.reduce((acc, user) => acc + user.totalSessions, 0)} συνεδρίες
        </span>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "Δεν βρέθηκαν χρήστες" : "Δεν υπάρχουν χρήστες"}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "Δοκιμάστε διαφορετικούς όρους αναζήτησης"
                : "Οι νέοι χρήστες θα εμφανιστούν εδώ μετά την εγγραφή τους"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedUsers.map((user, index) => (
            <motion.div
              key={user.$id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          ID: {user.$id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user.status ? 'default' : 'secondary'} className="ml-2">
                      {user.status ? 'Ενεργός' : 'Ανενεργός'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{user.phone || 'Δεν έχει οριστεί'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">
                        {new Date(user.registration).toLocaleDateString('el-GR')}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Baby className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {user.children.length} Παιδί/ά
                      </span>
                    </div>
                    <span className="text-xs text-blue-600">
                      {user.totalSessions} Συνεδρίες
                    </span>
                  </div>

                  {/* Children Preview */}
                  {user.children.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Παιδιά:
                      </p>
                      {user.children.slice(0, 2).map((child) => (
                        <div key={child.$id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate">{child.name}</span>
                          <span className="text-gray-500">{child.age} ετών</span>
                        </div>
                      ))}
                      {user.children.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{user.children.length - 2} περισσότερα
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => onViewUser(user.$id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Προβολή</span>
                    </Button>
                    <Button
                      onClick={() => onDeleteUser(user.$id)}
                      variant="outline"
                      size="sm"
                      disabled={deletingUserId === user.$id}
                      className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingUserId === user.$id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Διαγραφή</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
