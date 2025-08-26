"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminRoute, useAuth } from "@/lib/auth-middleware";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  ArrowLeft, 
  Send,
  MessageCircle,
  ChevronRight,
  CheckCircle
} from "lucide-react";

// TypeScript interfaces for messages
interface Message {
  $id: string;
  studentId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  messageType: 'text' | 'system' | 'notification';
  $createdAt: string;
  $updatedAt: string;
}

interface Student {
  $id: string;
  name: string;
  parentContact: string;
}

interface Conversation {
  student: Student;
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
}

// Helper functions
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Σήμερα';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Χθες';
  } else {
    return date.toLocaleDateString('el-GR');
  }
};

const parseParentContact = (parentContactString: string) => {
  try {
    const contact = JSON.parse(parentContactString);
    return contact.name || 'Γονέας';
  } catch {
    return 'Γονέας';
  }
};

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load messages for a specific student
  const loadMessagesForStudent = useCallback(async (studentId: string): Promise<Message[]> => {
    try {
      const messagesResponse = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.messages!,
        [
          Query.equal('studentId', studentId),
          Query.orderAsc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      return messagesResponse.documents as Message[];
    } catch (error) {
      console.error('Error loading messages for student:', studentId, error);
      return [];
    }
  }, []);

  // Load all conversations (students with messages)
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all students
      const studentsResponse = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.students!,
        [Query.orderDesc('$createdAt')]
      );
      
      const students = studentsResponse.documents as Student[];
      const conversationData: Conversation[] = [];
      
      // For each student, get their messages and conversation data
      for (const student of students) {
        const messages = await loadMessagesForStudent(student.$id);
        const unreadCount = messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
        
        conversationData.push({
          student,
          messages,
          lastMessage,
          unreadCount
        });
      }
      
      // Sort by most recent message
      conversationData.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.$createdAt).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.$createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setConversations(conversationData);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadMessagesForStudent]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Check for student parameter in URL to auto-select conversation
  useEffect(() => {
    const studentId = searchParams.get('student');
    if (studentId && conversations.length > 0) {
      const studentExists = conversations.find(c => c.student.$id === studentId);
      if (studentExists) {
        setSelectedConversation(studentId);
      } else {
        // If student doesn't exist, remove invalid parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('student');
        window.history.replaceState({}, '', newUrl.toString());
      }
    } else if (!studentId && conversations.length > 0 && !selectedConversation) {
      // If no URL parameter and no selection, optionally auto-select first conversation
      // Comment this out if you don't want auto-selection
      // setSelectedConversation(conversations[0].student.$id);
    }
  }, [searchParams, conversations, selectedConversation]);





  // Event handlers
  const handleBackToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleSelectConversation = useCallback((studentId: string) => {
    setSelectedConversation(studentId);
    // Update URL to preserve selection
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('student', studentId);
    window.history.pushState({}, '', newUrl.toString());
  }, []);

  const handleBackToConversationList = useCallback(() => {
    setSelectedConversation(null);
    // Remove student parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('student');
    window.history.pushState({}, '', newUrl.toString());
  }, []);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;
    
    try {
      setSending(true);
      
      // Find the conversation and get the parent's user ID
      const conversation = conversations.find(c => c.student.$id === selectedConversation);
      if (!conversation) return;
      
      // Parse parent contact to get their user info (for future use)
      // const parentContact = parseParentContact(conversation.student.parentContact);
      
      // Create message in database
      await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.messages!,
        'unique()',
        {
          studentId: selectedConversation,
          senderId: user.id,
          receiverId: 'parent', // We'll need to get the actual parent user ID later
          content: newMessage.trim(),
          isRead: false,
          messageType: 'text'
        }
      );
      
      // Clear message input
      setNewMessage("");
      
      // Preserve the current selection before reloading
      const currentSelection = selectedConversation;
      
      // Reload conversations to show the new message
      await loadConversations();
      
      // Restore the selection after reloading
      if (currentSelection) {
        setSelectedConversation(currentSelection);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Σφάλμα κατά την αποστολή του μηνύματος. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConversation, user?.id, conversations, loadConversations]);

  // Get selected conversation data
  const selectedConversationData = selectedConversation 
    ? conversations.find(c => c.student.$id === selectedConversation)
    : null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        {selectedConversation && selectedConversationData ? (
          // Conversation view header with gradient
          <div className="flex items-center space-x-3 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToConversationList}
              className="hover:bg-white/50 transition-colors p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {selectedConversationData.student.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{selectedConversationData.student.name}</h3>
              <p className="text-sm text-gray-600">Γονέας</p>
            </div>
          </div>
        ) : (
          // Messages list header
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToAdmin}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Μηνύματα</h1>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex flex-col">
        
        {selectedConversation && selectedConversationData ? (
          // Individual Conversation View - Full Screen
          <div className="flex-1 flex flex-col bg-white">
            {/* Messages Container - Full Screen Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedConversationData.messages.map((message, index) => {
                const showDate = index === 0 || 
                  new Date(message.$createdAt).toDateString() !== 
                  new Date(selectedConversationData.messages[index - 1].$createdAt).toDateString();

                return (
                  <div key={message.$id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex justify-center mb-4">
                        <span className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
                          {formatDate(message.$createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] ${
                        message.senderId === user?.id 
                          ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                          : 'bg-white text-gray-900 rounded-r-2xl rounded-tl-2xl rounded-bl-md border border-gray-200'
                      } p-3 shadow-sm`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center justify-end mt-2 space-x-1 ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.$createdAt)}</span>
                          {message.senderId === user?.id && (
                            <CheckCircle className={`w-3 h-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Bottom padding to ensure last message is visible above input */}
              <div className="h-4"></div>
            </div>

            {/* Message Input - Fixed at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Textarea
                    placeholder="Πληκτρολογήστε το μήνυμά σας..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    className="min-h-[60px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-500 hover:bg-blue-600 px-4 h-auto flex-shrink-0"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Conversations List View
          <div className="flex-1 bg-white m-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Μηνύματα</h2>
                  <p className="text-gray-600 text-sm mt-1">Επικοινωνία με γονείς και κηδεμόνες</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Φόρτωση συνομιλιών...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν συνομιλίες</h3>
                  <p className="text-gray-600">Όταν οι γονείς στείλουν μηνύματα, θα εμφανιστούν εδώ.</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div 
                    key={conversation.student.$id}
                    onClick={() => handleSelectConversation(conversation.student.$id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {conversation.student.name.charAt(0)}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{conversation.student.name}</h3>
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.$createdAt) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage ? conversation.lastMessage.content : 'Δεν υπάρχουν μηνύματα'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AdminRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Φόρτωση μηνυμάτων...</p>
          </div>
        </div>
      }>
        <MessagesPageContent />
      </Suspense>
    </AdminRoute>
  );
}
