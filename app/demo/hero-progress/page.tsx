"use client";

import HeroStepsProgress from "@/components/HeroStepsProgress";

// Demo data for different scenarios
const demoSessions = [
  { id: "1", sessionNumber: 1, status: "completed" as const, date: "2024-01-01", title: "Γνωριμία" },
  { id: "2", sessionNumber: 2, status: "completed" as const, date: "2024-01-08", title: "Βασικές Έννοιες" },
  { id: "3", sessionNumber: 3, status: "completed" as const, date: "2024-01-15", title: "Φωνήματα" },
  { id: "4", sessionNumber: 4, status: "available" as const, date: "2024-01-22", title: "Πρακτική" },
  { id: "5", sessionNumber: 5, status: "locked" as const, date: "2024-01-29", title: "Αξιολόγηση" },
  { id: "6", sessionNumber: 6, status: "locked" as const, date: "2024-02-05", title: "Προχωρημένες Έννοιες" },
  { id: "7", sessionNumber: 7, status: "locked" as const, date: "2024-02-12", title: "Εξάσκηση" },
  { id: "8", sessionNumber: 8, status: "locked" as const, date: "2024-02-19", title: "Παιχνίδια Λόγου" },
  { id: "9", sessionNumber: 9, status: "locked" as const, date: "2024-02-26", title: "Συζήτηση" },
  { id: "10", sessionNumber: 10, status: "locked" as const, date: "2024-03-04", title: "Επανάληψη" },
  { id: "11", sessionNumber: 11, status: "locked" as const, date: "2024-03-11", title: "Προσαρμογή" },
  { id: "12", sessionNumber: 12, status: "locked" as const, date: "2024-03-18", title: "Τελική Αξιολόγηση" },
];

export default function HeroProgressDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hero Steps Progress Demo</h1>
          <p className="text-gray-600">Interactive demo of the kid-friendly progress tracker</p>
        </div>

        {/* Demo 1: New Student (Level 1) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Scenario 1: New Student (Level 1 Hero)</h2>
          <HeroStepsProgress
            studentName="Νίκος"
            sessions={demoSessions.map((s, i) => ({ 
              ...s, 
              status: i === 0 ? "available" : "locked" 
            }))}
            currentSessionIndex={0}
            onSessionClick={(session) => alert(`Clicked session ${session.sessionNumber}: ${session.title}`)}
            showParentInfo={true}
          />
        </div>

        {/* Demo 2: Progress Student (Level 2) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Scenario 2: Making Progress (Level 2 Hero with Cape)</h2>
          <HeroStepsProgress
            studentName="Μαρία"
            sessions={demoSessions}
            currentSessionIndex={3}
            onSessionClick={(session) => alert(`Clicked session ${session.sessionNumber}: ${session.title}`)}
            showParentInfo={false}
          />
        </div>

        {/* Demo 3: Advanced Student (Level 3) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Scenario 3: Advanced Student (Level 3 Hero with Stars)</h2>
          <HeroStepsProgress
            studentName="Γιώργος"
            sessions={demoSessions.map((s, i) => ({ 
              ...s, 
              status: i < 7 ? "completed" : i === 7 ? "available" : "locked" 
            }))}
            currentSessionIndex={7}
            onSessionClick={(session) => alert(`Clicked session ${session.sessionNumber}: ${session.title}`)}
            showParentInfo={true}
          />
        </div>

        {/* Demo 4: Champion Student (Level 4) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Scenario 4: Champion Student (Level 4 Hero with Sparkles)</h2>
          <HeroStepsProgress
            studentName="Ελένη"
            sessions={demoSessions.map((s, i) => ({ 
              ...s, 
              status: i < 10 ? "completed" : i === 10 ? "available" : "locked" 
            }))}
            currentSessionIndex={10}
            onSessionClick={(session) => alert(`Clicked session ${session.sessionNumber}: ${session.title}`)}
            showParentInfo={true}
          />
        </div>

        {/* Demo 5: Completed Journey */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Scenario 5: Journey Complete!</h2>
          <HeroStepsProgress
            studentName="Δημήτρης"
            sessions={demoSessions.map(s => ({ ...s, status: "completed" }))}
            currentSessionIndex={11}
            onSessionClick={(session) => alert(`Clicked session ${session.sessionNumber}: ${session.title}`)}
            showParentInfo={false}
          />
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Component Features</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✨ <strong>Hero Evolution:</strong> The hero character evolves based on completed sessions (every 3 sessions)</li>
            <li>🎯 <strong>Interactive Path:</strong> Click on available/completed sessions to see details</li>
            <li>📱 <strong>Mobile Responsive:</strong> Horizontal scroll on mobile devices</li>
            <li>🦸 <strong>Level System:</strong>
              <ul className="ml-6 mt-1 space-y-1 text-sm">
                <li>• Level 1: Basic hero (0-2 sessions)</li>
                <li>• Level 2: Hero with cape (3-5 sessions)</li>
                <li>• Level 3: Cape with stars (6-8 sessions)</li>
                <li>• Level 4: Champion with sparkles (9+ sessions)</li>
              </ul>
            </li>
            <li>🎨 <strong>CSS Animations:</strong> Cape waves, sparkles, and smooth transitions</li>
            <li>🔒 <strong>Session States:</strong> Locked, Available (pulsing), and Completed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
