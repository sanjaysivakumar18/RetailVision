import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import VideoAnalysis from './pages/VideoAnalysis';
import TrafficShelves from './pages/TrafficShelves';
import CustomerIntelligence from './pages/CustomerIntelligence';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import { api } from './services/api';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pollingRef = useRef(null);

  // Load initial session list
  useEffect(() => {
    loadSessions();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // When active session ID changes, load full details
  useEffect(() => {
    if (currentSessionId) {
      loadSessionDetails(currentSessionId);
    }
  }, [currentSessionId]);

  // Polling loop for active processing
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (currentSession?.status === 'processing') {
      pollingRef.current = setInterval(async () => {
        try {
          const statusData = await api.getStatus(currentSession.id);
          setCurrentSession(prev => prev ? {
            ...prev,
            status: statusData.status,
            progress: statusData.progress,
            stage: statusData.stage,
            error_message: statusData.error_message
          } : null);

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(pollingRef.current);
            loadSessionDetails(currentSession.id);
            loadSessions();
          }
        } catch (e) {
          console.error("Status polling error:", e);
        }
      }, 1500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentSession?.status, currentSession?.id]);

  const loadSessions = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (e) {
      console.error("Error loading sessions:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      const [sessionData, shelvesData, customersData, eventsData] = await Promise.all([
        api.getSession(sessionId),
        api.getShelves(sessionId),
        api.getCustomers(sessionId),
        api.getEvents(sessionId)
      ]);

      setCurrentSession(sessionData);
      setShelves(shelvesData.shelves || []);
      setCustomers(customersData.customers || []);
      setEvents(eventsData.events || []);
    } catch (e) {
      console.error("Error loading session details:", e);
    }
  };

  const handleUpload = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const res = await api.uploadVideo(file, (pct) => setUploadProgress(pct));
      setIsUploading(false);
      
      // Refresh sessions & select newly created session
      await loadSessions();
      setCurrentSessionId(res.session_id);
      setActiveSection('video-analysis');
    } catch (e) {
      setIsUploading(false);
      alert(`Upload error: ${e.message}`);
    }
  };

  const handleGenerateSample = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(10);
      const res = await api.generateSampleVideo();
      setIsUploading(false);
      
      await loadSessions();
      setCurrentSessionId(res.session_id);
      setActiveSection('video-analysis');
    } catch (e) {
      setIsUploading(false);
      alert(`Sample generation error: ${e.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#070C18] text-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        currentSession={currentSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          activeSection={activeSection}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewUpload={() => setActiveSection('video-analysis')}
          isRefreshing={isRefreshing}
          onRefresh={() => {
            loadSessions();
            if (currentSessionId) loadSessionDetails(currentSessionId);
          }}
        />

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <Overview
              session={currentSession}
              shelves={shelves}
              customers={customers}
              events={events}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'video-analysis' && (
            <VideoAnalysis
              session={currentSession}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onUpload={handleUpload}
              onGenerateSample={handleGenerateSample}
            />
          )}

          {activeSection === 'traffic-shelves' && (
            <TrafficShelves
              session={currentSession}
              shelves={shelves}
            />
          )}

          {activeSection === 'customer-intelligence' && (
            <CustomerIntelligence
              session={currentSession}
              customers={customers}
              events={events}
            />
          )}

          {activeSection === 'recommendations' && (
            <Recommendations
              session={currentSession}
              shelves={shelves}
              customers={customers}
              events={events}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'reports' && (
            <Reports
              session={currentSession}
              sessions={sessions}
              shelves={shelves}
              customers={customers}
              events={events}
              onSelectSession={(id) => {
                setCurrentSessionId(id);
                setActiveSection('overview');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

