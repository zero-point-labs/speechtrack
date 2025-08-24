"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send,
  MessageCircle,
  ChevronRight
} from "lucide-react";

// Mock conversations data
const mockConversations = [
  {
    studentId: "1",
    studentName: "Emma Παπαδόπουλου",
    lastMessage: "Θα θέλαμε να μετακινήσουμε το επόμενο ραντεβού...",
    timestamp: "10:30",
    unreadCount: 2,
    messages: [
      { id: "1", sender: "parent", message: "Καλησπέρα! Πώς πήγε η σημερινή συνεδρία;", timestamp: "09:15", isRead: true },
      { id: "2", sender: "therapist", message: "Καλησπέρα! Η Emma τα πήγε εξαιρετικά σήμερα. Έκανε μεγάλη πρόοδο στις ασκήσεις αναπνοής.", timestamp: "09:20", isRead: true },
      { id: "3", sender: "parent", message: "Θα θέλαμε να μετακινήσουμε το επόμενο ραντεβού...", timestamp: "10:30", isRead: false },
      { id: "4", sender: "parent", message: "Είναι δυνατόν να το κάνουμε Παρασκευή αντί για Τετάρτη;", timestamp: "10:31", isRead: false }
    ]
  },
  {
    studentId: "2", 
    studentName: "Νίκος Γεωργίου",
    lastMessage: "Ευχαριστούμε για τις χθεσινές οδηγίες!",
    timestamp: "Χθες",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "parent", message: "Ευχαριστούμε για τις χθεσινές οδηγίες!", timestamp: "18:45", isRead: true },
      { id: "2", sender: "therapist", message: "Παρακαλώ! Συνεχίστε με τις ασκήσεις στο σπίτι.", timestamp: "19:00", isRead: true }
    ]
  }
];

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Check for student parameter in URL to auto-select conversation
  useEffect(() => {
    const studentId = searchParams.get('student');
    if (studentId) {
      // Verify the student exists in our conversations
      const studentExists = mockConversations.find(c => c.studentId === studentId);
      if (studentExists) {
        setSelectedConversation(studentId);
      }
    }
  }, [searchParams]);

  // Event handlers
  const handleBackToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const handleSelectConversation = useCallback((studentId: string) => {
    setSelectedConversation(studentId);
  }, []);

  const handleBackToConversationList = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && selectedConversation) {
      const selectedConversationData = mockConversations.find(c => c.studentId === selectedConversation);
      if (selectedConversationData) {
        console.log('Sending message to', selectedConversationData.studentName, ':', newMessage);
        setNewMessage("");
      }
    }
  }, [newMessage, selectedConversation]);

  // Get selected conversation data
  const selectedConversationData = selectedConversation 
    ? mockConversations.find(c => c.studentId === selectedConversation)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {selectedConversation && selectedConversationData ? (
              // Conversation view header
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToConversationList}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConversationData.studentName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{selectedConversationData.studentName}</h1>
                  <p className="text-sm text-gray-500">Γονέας - Ενεργός</p>
                </div>
              </>
            ) : (
              // Messages list header
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToAdmin}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Μηνύματα</h1>
                  <p className="text-sm text-gray-500">Επικοινωνία με γονείς</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 overflow-x-hidden">
        
        {selectedConversation && selectedConversationData ? (
          // Individual Conversation View
          <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversationData.messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    message.sender === 'therapist' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'therapist' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={handleMessageChange}
                  placeholder="Γράψτε το μήνυμά σας..."
                  className="resize-none flex-1 min-h-[40px] max-h-[120px]"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Conversations List View
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Μηνύματα</h2>
                  <p className="text-gray-600 text-sm mt-1">Επικοινωνία με γονείς και κηδεμόνες</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {mockConversations.map((conversation) => (
                <div 
                  key={conversation.studentId}
                  onClick={() => handleSelectConversation(conversation.studentId)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {conversation.studentName.charAt(0)}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{conversation.studentName}</h3>
                        <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacing for mobile */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
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
  );
}
