"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, CheckCircle } from "lucide-react";

interface Session {
  $id: string;
  title: string;
  date: string;
  status: string;
  type?: string;
  duration?: number;
}

interface SessionSelectorProps {
  availableSessions: Session[];
  selectedSessions: string[];
  onSelectionChange: (sessionIds: string[]) => void;
  onClose: () => void;
}

export function SessionSelector({
  availableSessions,
  selectedSessions,
  onSelectionChange,
  onClose
}: SessionSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedSessions));
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSession = (sessionId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelected(newSelected);
  };

  const handleSave = () => {
    onSelectionChange(Array.from(selected));
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredSessions.map(s => s.$id));
    setSelected(allIds);
  };

  const handleDeselectAll = () => {
    setSelected(new Set());
  };

  const filteredSessions = availableSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.date.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Select Sessions</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {selected.size} of {availableSessions.length} sessions selected
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Actions */}
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredSessions.length} sessions found
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
            {filteredSessions.map((session) => {
              const isSelected = selected.has(session.$id);
              
              return (
                <div
                  key={session.$id}
                  onClick={() => toggleSession(session.$id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(session.status)}
                        >
                          {session.status}
                        </Badge>
                        {session.type && (
                          <Badge variant="outline" className="text-xs">
                            {session.type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatDate(session.date)}
                        {session.duration && ` • ${session.duration} minutes`}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {isSelected ? (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sessions found
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Selection ({selected.size})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
