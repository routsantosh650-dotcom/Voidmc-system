import React, { useState } from 'react';
import { VoidMCProvider, useVoidMC } from './context/VoidMCContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StrikeAlertModal } from './components/StrikeAlertModal';
import { MarkAttendanceModal } from './components/MarkAttendanceModal';
import { IssueStrikeModal } from './components/IssueStrikeModal';
import { AddStaffModal } from './components/AddStaffModal';
import { CreateAnnouncementModal } from './components/CreateAnnouncementModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { ForceLogoutModal } from './components/ForceLogoutModal';
import { ProfileDrawer } from './components/ProfileDrawer';

// Views
import { DashboardView } from './components/views/DashboardView';
import { StaffDirectoryView } from './components/views/StaffDirectoryView';
import { AttendanceView } from './components/views/AttendanceView';
import { ApplicationsView } from './components/views/ApplicationsView';
import { StrikesView } from './components/views/StrikesView';
import { DepartmentsView } from './components/views/DepartmentsView';
import { AnnouncementsView } from './components/views/AnnouncementsView';
import { ReportsView } from './components/views/ReportsView';
import { ActivityLogsView } from './components/views/ActivityLogsView';
import { SettingsView } from './components/views/SettingsView';
import { AdminPanelView } from './components/views/AdminPanelView';

const VoidMCAppContent: React.FC = () => {
  const { activeTab } = useVoidMC();

  // Modals state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isIssueStrikeOpen, setIsIssueStrikeOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [preselectedStrikeStaffId, setPreselectedStrikeStaffId] = useState<string | undefined>(undefined);

  const handleOpenIssueStrikeForStaff = (staffId: string) => {
    setPreselectedStrikeStaffId(staffId);
    setIsIssueStrikeOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminPanelView />;
      case 'dashboard':
        return (
          <DashboardView
            onOpenAddStaff={() => setIsAddStaffOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenMarkAttendance={() => setIsMarkAttendanceOpen(true)}
            onOpenIssueStrike={() => {
              setPreselectedStrikeStaffId(undefined);
              setIsIssueStrikeOpen(true);
            }}
          />
        );
      case 'staff-directory':
        return (
          <StaffDirectoryView
            onOpenAddStaff={() => setIsAddStaffOpen(true)}
            onOpenIssueStrikeForStaff={handleOpenIssueStrikeForStaff}
          />
        );
      case 'attendance':
        return <AttendanceView />;
      case 'applications':
        return <ApplicationsView />;
      case 'strikes':
        return (
          <StrikesView
            onOpenIssueStrike={() => {
              setPreselectedStrikeStaffId(undefined);
              setIsIssueStrikeOpen(true);
            }}
          />
        );
      case 'departments':
        return <DepartmentsView />;
      case 'announcements':
        return (
          <AnnouncementsView
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
          />
        );
      case 'reports':
        return <ReportsView />;
      case 'activity-logs':
        return <ActivityLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenAddStaff={() => setIsAddStaffOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenMarkAttendance={() => setIsMarkAttendanceOpen(true)}
            onOpenIssueStrike={() => {
              setPreselectedStrikeStaffId(undefined);
              setIsIssueStrikeOpen(true);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080512] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header with Cosmic Banner Art & Profile Card */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Main Body with Responsive Sidebar and Content View */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Responsive Sidebar (Desktop Pinned, Mobile Slide-out Drawer) */}
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Real-time Strike Alert System */}
      <ProfileDrawer />
      <AdminLoginModal />
      <StaffLoginModal />
      <ForceLogoutModal />
      <StrikeAlertModal />

      <MarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
      />

      <IssueStrikeModal
        isOpen={isIssueStrikeOpen}
        onClose={() => {
          setIsIssueStrikeOpen(false);
          setPreselectedStrikeStaffId(undefined);
        }}
        preselectedStaffId={preselectedStrikeStaffId}
      />

      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
      />

      <CreateAnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <VoidMCProvider>
      <VoidMCAppContent />
    </VoidMCProvider>
  );
}
