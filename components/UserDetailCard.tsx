"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Phone, Mail, Calendar, Baby, BookOpen, 
  Clock, CheckCircle, XCircle, Trash2, Plus,
  MapPin, User, Activity
} from "lucide-react";

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
  parentContact: string;
}

interface Session {
  $id: string;
  studentId: string;
  sessionNumber: number;
  title: string;
  date: string;
  status: string;
  duration: string;
  isPaid: boolean;
}

interface Message {
  $id: string;
  studentId: string;
  content: string;
  isFromParent: boolean;
  isRead: boolean;
  priority: string;
  $createdAt: string;
}

interface UserDetails {
  userId: string;
  extendedData?: UserExtended;
  children: Student[];
  sessions: Session[];
  messages: Message[];
}

interface UserDetailCardProps {
  userDetails: UserDetails;
  onDeleteUser: () => void;
  onCreateSession: (studentId: string) => void;
  deletingUser?: boolean;
  className?: string;
}

export default function UserDetailCard({
  userDetails,
  onDeleteUser,
  onCreateSession,
  deletingUser = false,
  className = ""
}: UserDetailCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Ολοκληρώθηκε</Badge>;
      case 'available':
        return <Badge variant="secondary">Διαθέσιμη</Badge>;
      case 'locked':
        return <Badge variant="outline">Κλειδωμένη</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChildStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ενεργό</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Ανενεργό</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Ολοκληρώθηκε</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalSessions = userDetails.sessions.length;
  const completedSessions = userDetails.sessions.filter(s => s.status === 'completed').length;
  const unreadMessages = userDetails.messages.filter(m => !m.isRead && m.isFromParent).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Στοιχεία Γονέα</span>
          </CardTitle>
          <Button
            onClick={onDeleteUser}
            variant="outline"
            size="sm"
            disabled={deletingUser}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deletingUser ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="ml-1">{deletingUser ? "Διαγραφή..." : "Διαγραφή Χρήστη"}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{userDetails.extendedData?.phone || "Δεν έχει οριστεί"}</span>
              </div>
              {userDetails.extendedData?.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{userDetails.extendedData.address}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  Εγγραφή: {userDetails.extendedData?.createdAt 
                    ? new Date(userDetails.extendedData.createdAt).toLocaleDateString('el-GR')
                    : "Δεν έχει οριστεί"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Baby className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{userDetails.children.length} Παιδί/ά</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{totalSessions} Συνεδρίες</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  Τελευταία σύνδεση: {userDetails.extendedData?.lastLoginAt 
                    ? new Date(userDetails.extendedData.lastLoginAt).toLocaleDateString('el-GR')
                    : "Ποτέ"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{userDetails.children.length}</p>
            <p className="text-sm text-gray-600">Παιδιά</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
            <p className="text-sm text-gray-600">Ολοκληρωμένες</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{totalSessions}</p>
            <p className="text-sm text-gray-600">Συνολικές</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{unreadMessages}</p>
            <p className="text-sm text-gray-600">Μη Αναγνωσμένα</p>
          </CardContent>
        </Card>
      </div>

      {/* Children Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Baby className="w-5 h-5 text-blue-600" />
            <span>Παιδιά ({userDetails.children.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userDetails.children.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Δεν έχουν καταχωρηθεί παιδιά</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userDetails.children.map((child) => {
                const childSessions = userDetails.sessions.filter(s => s.studentId === child.$id);
                const childCompletedSessions = childSessions.filter(s => s.status === 'completed').length;
                
                return (
                  <Card key={child.$id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{child.name}</h4>
                        {getChildStatusBadge(child.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ηλικία:</span>
                          <span className="font-medium">{child.age} έτη</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Συνεδρίες:</span>
                          <span className="font-medium">{childCompletedSessions}/{childSessions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Εγγραφή:</span>
                          <span className="font-medium">
                            {new Date(child.joinDate).toLocaleDateString('el-GR')}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => onCreateSession(child.$id)}
                        size="sm"
                        className="w-full mt-3 flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Νέα Συνεδρία</span>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Πρόσφατες Συνεδρίες ({userDetails.sessions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userDetails.sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Δεν έχουν προγραμματιστεί συνεδρίες</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-700">Παιδί</th>
                    <th className="text-left p-3 font-medium text-gray-700">Τίτλος</th>
                    <th className="text-left p-3 font-medium text-gray-700">Ημερομηνία</th>
                    <th className="text-left p-3 font-medium text-gray-700">Κατάσταση</th>
                    <th className="text-left p-3 font-medium text-gray-700">Διάρκεια</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetails.sessions.slice(0, 10).map((session) => {
                    const child = userDetails.children.find(c => c.$id === session.studentId);
                    return (
                      <tr key={session.$id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm">{child?.name || 'Άγνωστο'}</td>
                        <td className="p-3 text-sm font-medium">{session.title}</td>
                        <td className="p-3 text-sm">
                          {new Date(session.date).toLocaleDateString('el-GR')}
                        </td>
                        <td className="p-3">{getStatusBadge(session.status)}</td>
                        <td className="p-3 text-sm">{session.duration}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {userDetails.sessions.length > 10 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Εμφάνιση 10 από {userDetails.sessions.length} συνεδρίες
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Πρόσφατα Μηνύματα ({userDetails.messages.length})</span>
            {unreadMessages > 0 && (
              <Badge className="bg-red-100 text-red-800 ml-auto">
                {unreadMessages} νέα
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userDetails.messages.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Δεν υπάρχουν μηνύματα</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userDetails.messages.slice(0, 5).map((message) => {
                const child = userDetails.children.find(c => c.$id === message.studentId);
                return (
                  <Card key={message.$id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={message.isFromParent ? 'default' : 'secondary'}>
                            {message.isFromParent ? 'Γονέας' : 'Θεραπευτής'}
                          </Badge>
                          <span className="text-sm text-gray-600">για {child?.name || 'Άγνωστο παιδί'}</span>
                          {!message.isRead && message.isFromParent && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Νέο</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.$createdAt).toLocaleDateString('el-GR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
              {userDetails.messages.length > 5 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Εμφάνιση 5 από {userDetails.messages.length} μηνύματα
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
