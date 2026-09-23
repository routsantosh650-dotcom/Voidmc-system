import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  StaffMember,
  StaffRole,
  AttendanceRecord,
  Strike,
  Announcement,
  ActivityItem,
  SystemNotification,
  ActiveSession,
  StaffLeaveApplication,
} from '../types';
import { INITIAL_ROLES, INITIAL_STAFF_MEMBERS } from '../data/initialData';
import { soundFX } from '../utils/audio';

interface AddStaffResult {
  success: boolean;
  message: string;
  credentials?: {
    username: string;
    password: string;
  };
}

interface VoidMCContextType {
  currentUser: StaffMember | null;
  token: string | null;
  isAdmin: boolean;
  staffList: StaffMember[];
  rolesList: StaffRole[];
  attendanceRecords: AttendanceRecord[];
  strikesList: Strike[];
  announcements: Announcement[];
  activities: ActivityItem[];
  notifications: SystemNotification[];
  unreadNotificationsCount: number;
  activeSessions: ActiveSession[];
  applicationsList: StaffLeaveApplication[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  forceLogoutNotice: string | null;
  clearForceLogoutNotice: () => void;

  // Modals
  showStaffLoginModal: boolean;
  setShowStaffLoginModal: (show: boolean) => void;
  showAdminLoginModal: boolean;
  setShowAdminLoginModal: (show: boolean) => void;
  showNotificationsDropdown: boolean;
  setShowNotificationsDropdown: (show: boolean) => void;
  isProfileDrawerOpen: boolean;
  setIsProfileDrawerOpen: (show: boolean) => void;
  activeStrikeAlert: Strike | null;
  dismissStrikeAlert: () => void;

  // Auth methods
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; isAdmin?: boolean }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  terminateSession: (sessionId: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Attendance
  markAttendance: (
    status?: 'present' | 'absent',
    shiftNotes?: string,
    shiftDurationHours?: number,
    proofUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
  updateAttendance: (
    id: string,
    status: 'present' | 'absent',
    notes?: string,
    duration?: number
  ) => Promise<{ success: boolean; message: string }>;
  deleteAttendance: (id: string) => Promise<{ success: boolean; message: string }>;
  clearAllAttendance: () => Promise<{ success: boolean; message: string }>;

  // Applications (LOA & Leave - Requirement 9)
  fetchApplications: () => Promise<void>;
  submitApplication: (
    type: 'LOA' | 'Leave',
    reason: string,
    startDate: string,
    endDate: string,
    additionalDetails?: string
  ) => Promise<{ success: boolean; message: string }>;
  reviewApplication: (
    id: string,
    status: 'approved' | 'rejected',
    adminResponse?: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteApplication: (id: string) => Promise<{ success: boolean; message: string }>;

  // Staff Management (Admin only)
  addStaffMember: (member: {
    name: string;
    username: string;
    minecraftIgn: string;
    role: string;
    department?: string;
    password: string;
  }) => Promise<AddStaffResult>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<{ success: boolean; message: string }>;
  resetStaffPassword: (id: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteStaffMember: (id: string) => Promise<{ success: boolean; message: string }>;

  // Announcements (Admin only)
  createAnnouncement: (title: string, content: string, tag: string, isPinned?: boolean) => Promise<{ success: boolean; message: string }>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<{ success: boolean; message: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; message: string }>;
  clearAllAnnouncements: () => Promise<{ success: boolean; message: string }>;

  // Notifications
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Strikes
  issueStrike: (
    staffId: string,
    reason: string,
    severity: 'minor' | 'major' | 'critical',
    evidenceUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
  acknowledgeStrike: (strikeId: string) => Promise<void>;
  revokeStrike: (strikeId: string, reason?: string) => Promise<{ success: boolean; message: string }>;

  // System
  resetSystemData: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
}

const VoidMCContext = createContext<VoidMCContextType | undefined>(undefined);

const TOKEN_KEY = 'voidmc_session_token';

export const VoidMCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);
  const [rolesList, setRolesList] = useState<StaffRole[]>(INITIAL_ROLES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [strikesList, setStrikesList] = useState<Strike[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [applicationsList, setApplicationsList] = useState<StaffLeaveApplication[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forceLogoutNotice, setForceLogoutNotice] = useState<string | null>(null);

  // Modals
  const [showStaffLoginModal, setShowStaffLoginModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [activeStrikeAlert, setActiveStrikeAlert] = useState<Strike | null>(null);

  // Helper: authenticated fetch
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      const headers = new Headers(options.headers || {});
      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      headers.set('Content-Type', 'application/json');

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        // Session expired or force-logged out
        const errJson = await res.json().catch(() => ({}));
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCurrentUser(null);
        setIsAdmin(false);
        setForceLogoutNotice(
          errJson.error || 'Your session has ended or was terminated by an administrator.'
        );
        throw new Error(errJson.error || 'Unauthorized');
      }
      return res;
    },
    [token]
  );

  // Load current session and core data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setIsAdmin(Boolean(data.isAdmin));
          setToken(storedToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Failed to authenticate stored session:', err);
      }
    }

    // Refresh general data
    try {
      const [staffRes, annRes, attRes, notifRes, strikeRes, appRes, sessRes, actRes] = await Promise.all([
        fetch('/api/staff', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        fetch('/api/announcements', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        fetch('/api/attendance', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        fetch('/api/notifications', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        fetch('/api/strikes', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        storedToken
          ? fetch('/api/applications', {
              headers: { Authorization: `Bearer ${storedToken}` },
            }).catch(() => null)
          : null,
        fetch('/api/auth/sessions', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
        fetch('/api/activity-logs', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }).catch(() => null),
      ]);

      if (staffRes && staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff);
        // Calculate roles count
        const updatedRoles = INITIAL_ROLES.map(role => {
          const count = data.staff.filter((s: StaffMember) => s.role.toUpperCase() === role.name.toUpperCase()).length;
          return { ...role, memberCount: count };
        });
        setRolesList(updatedRoles);
      }

      if (annRes && annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements);
      }

      if (attRes && attRes.ok) {
        const data = await attRes.json();
        setAttendanceRecords(data.attendance);
      }

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }

      if (strikeRes && strikeRes.ok) {
        const data = await strikeRes.json();
        setStrikesList(data.strikes);
      }

      if (appRes && appRes.ok) {
        const data = await appRes.json();
        setApplicationsList(data.applications || []);
      }

      if (sessRes && sessRes.ok) {
        const data = await sessRes.json();
        setActiveSessions(data.sessions || []);
      }

      if (actRes && actRes.ok) {
        const data = await actRes.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling for notifications and session validation (every 10s)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
          setIsAdmin(false);
          setForceLogoutNotice(
            errData.error || 'Your session was terminated by an administrator.'
          );
          return;
        }

        // Fetch unread notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications);
          setUnreadNotificationsCount(notifData.unreadCount || 0);
        }

        // Check if user has an unacknowledged active strike
        if (currentUser) {
          const strikeRes = await fetch('/api/strikes', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (strikeRes.ok) {
            const strikeData = await strikeRes.json();
            setStrikesList(strikeData.strikes);
            const urgentStrike = strikeData.strikes.find(
              (s: Strike) => s.staffId === currentUser.id && s.status === 'active' && !s.acknowledged
            );
            if (urgentStrike && !activeStrikeAlert) {
              setActiveStrikeAlert(urgentStrike);
              soundFX.playStrikeWarning();
            }
          }
        }
      } catch {
        // Network or quiet error
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [token, currentUser, activeStrikeAlert]);

  // Fetch active sessions
  const fetchActiveSessions = useCallback(async () => {
    try {
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/auth/sessions', {
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  }, [token]);

  // Force Logout / Terminate Session
  const terminateSession = async (sessionId: string) => {
    try {
      const res = await authFetch('/api/auth/terminate-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchActiveSessions();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to terminate session' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error terminating session';
      return { success: false, message: msg };
    }
  };

  // Normal Staff Login
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Login failed' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAdmin(Boolean(data.isAdmin));
      setShowStaffLoginModal(false);
      soundFX.playSuccess();
      loadInitialData();
      return { success: true, message: 'Login successful', isAdmin: data.isAdmin };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during login';
      return { success: false, message: msg };
    }
  };

  // Dedicated Admin Panel Login
  const adminLogin = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Admin login failed' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAdmin(true);
      setShowAdminLoginModal(false);
      setActiveTab('admin');
      soundFX.playSuccess();
      loadInitialData();
      return { success: true, message: 'Admin authentication verified' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login error';
      return { success: false, message: msg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null);
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setActiveTab('dashboard');
    }
  };

  // Attendance methods
  const markAttendance = async (
    status: 'present' | 'absent' = 'present',
    shiftNotes?: string,
    shiftDurationHours?: number,
    proofUrl?: string
  ) => {
    if (!currentUser) {
      setShowStaffLoginModal(true);
      return { success: false, message: 'Please log in to mark attendance' };
    }

    try {
      const res = await authFetch('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          status,
          shiftNotes,
          shiftDurationHours,
          proofUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to mark attendance' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error marking attendance';
      return { success: false, message: msg };
    }
  };

  const updateAttendance = async (
    id: string,
    status: 'present' | 'absent',
    notes?: string,
    duration?: number
  ) => {
    try {
      const res = await authFetch(`/api/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, shiftNotes: notes, shiftDurationHours: duration }),
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to update attendance' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating attendance';
      return { success: false, message: msg };
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const res = await authFetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to delete attendance' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting attendance';
      return { success: false, message: msg };
    }
  };

  const clearAllAttendance = async () => {
    try {
      const res = await authFetch('/api/attendance/clear', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceRecords([]);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to clear attendance' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error clearing attendance';
      return { success: false, message: msg };
    }
  };

  // Applications (LOA & Leave - Requirement 9)
  const fetchApplications = useCallback(async () => {
    try {
      const res = await authFetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplicationsList(data.applications || []);
      }
    } catch {
      // ignore
    }
  }, [authFetch]);

  const submitApplication = async (
    type: 'LOA' | 'Leave',
    reason: string,
    startDate: string,
    endDate: string,
    additionalDetails?: string
  ) => {
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ type, reason, startDate, endDate, additionalDetails }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        await fetchApplications();
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to submit application' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting application';
      return { success: false, message: msg };
    }
  };

  const reviewApplication = async (id: string, status: 'approved' | 'rejected', adminResponse?: string) => {
    try {
      const res = await authFetch(`/api/applications/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminResponse }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        await fetchApplications();
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to review application' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reviewing application';
      return { success: false, message: msg };
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const res = await authFetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        await fetchApplications();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to delete application' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting application';
      return { success: false, message: msg };
    }
  };

  // Normal staff password change (Requirement 4)
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to change password' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing password';
      return { success: false, message: msg };
    }
  };

  // Staff Management (Admin only)
  const addStaffMember = async (member: {
    name: string;
    username: string;
    minecraftIgn: string;
    role: string;
    department?: string;
    password: string;
  }): Promise<AddStaffResult> => {
    try {
      const res = await authFetch('/api/staff', {
        method: 'POST',
        body: JSON.stringify(member),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        loadInitialData();
        return {
          success: true,
          message: data.message,
          credentials: data.rawCredentials,
        };
      }
      return { success: false, message: data.error || 'Failed to create staff account' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding staff';
      return { success: false, message: msg };
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      const res = await authFetch(`/api/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to update staff' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating staff';
      return { success: false, message: msg };
    }
  };

  const resetStaffPassword = async (id: string, newPassword: string) => {
    try {
      const res = await authFetch(`/api/staff/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to reset password' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resetting password';
      return { success: false, message: msg };
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      const res = await authFetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to remove staff' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing staff';
      return { success: false, message: msg };
    }
  };

  // Announcements
  const createAnnouncement = async (
    title: string,
    content: string,
    tag: string,
    isPinned: boolean = false
  ) => {
    try {
      const res = await authFetch('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, content, tag, isPinned }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to create announcement' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating announcement';
      return { success: false, message: msg };
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const res = await authFetch(`/api/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to update announcement' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating announcement';
      return { success: false, message: msg };
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      const res = await authFetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        await loadInitialData();
        return { success: true, message: data.message || 'Announcement deleted' };
      }
      await loadInitialData();
      return { success: false, message: data.error || 'Failed to delete announcement' };
    } catch (err: unknown) {
      await loadInitialData();
      const msg = err instanceof Error ? err.message : 'Error deleting announcement';
      return { success: false, message: msg };
    }
  };

  const clearAllAnnouncements = async () => {
    try {
      const res = await authFetch('/api/announcements/clear-all', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements([]);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to clear announcements' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error clearing announcements';
      return { success: false, message: msg };
    }
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await authFetch('/api/notifications/clear', { method: 'POST' });
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Strikes
  const issueStrike = async (
    staffId: string,
    reason: string,
    severity: 'minor' | 'major' | 'critical',
    evidenceUrl?: string
  ) => {
    try {
      const res = await authFetch('/api/strikes', {
        method: 'POST',
        body: JSON.stringify({ staffId, reason, severity, evidenceUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        soundFX.playStrikeWarning();
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to issue strike' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error issuing strike';
      return { success: false, message: msg };
    }
  };

  const acknowledgeStrike = async (strikeId: string) => {
    try {
      await authFetch(`/api/strikes/${strikeId}/acknowledge`, { method: 'POST' });
      setActiveStrikeAlert(null);
      loadInitialData();
    } catch (err) {
      console.error('Error acknowledging strike:', err);
    }
  };

  const revokeStrike = async (strikeId: string, reason?: string) => {
    try {
      const res = await authFetch(`/api/strikes/${strikeId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to revoke strike' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error revoking strike';
      return { success: false, message: msg };
    }
  };

  // System Reset (Working reset button with server execution)
  const resetSystemData = async () => {
    try {
      const res = await authFetch('/api/system/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        soundFX.playSuccess();
        await loadInitialData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to reset system data' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resetting system';
      return { success: false, message: msg };
    }
  };

  const dismissStrikeAlert = () => {
    setActiveStrikeAlert(null);
  };

  const clearForceLogoutNotice = () => {
    setForceLogoutNotice(null);
  };

  return (
    <VoidMCContext.Provider
      value={{
        currentUser,
        token,
        isAdmin,
        staffList,
        rolesList,
        attendanceRecords,
        strikesList,
        announcements,
        activities,
        notifications,
        unreadNotificationsCount,
        activeSessions,
        applicationsList,
        activeTab,
        setActiveTab,
        isLoading,
        forceLogoutNotice,
        clearForceLogoutNotice,
        showStaffLoginModal,
        setShowStaffLoginModal,
        showAdminLoginModal,
        setShowAdminLoginModal,
        showNotificationsDropdown,
        setShowNotificationsDropdown,
        isProfileDrawerOpen,
        setIsProfileDrawerOpen,
        activeStrikeAlert,
        dismissStrikeAlert,
        login,
        adminLogin,
        logout,
        fetchActiveSessions,
        terminateSession,
        changePassword,
        markAttendance,
        updateAttendance,
        deleteAttendance,
        clearAllAttendance,
        fetchApplications,
        submitApplication,
        reviewApplication,
        deleteApplication,
        addStaffMember,
        updateStaffMember,
        resetStaffPassword,
        deleteStaffMember,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        clearAllAnnouncements,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        issueStrike,
        acknowledgeStrike,
        revokeStrike,
        resetSystemData,
        refreshData: loadInitialData,
      }}
    >
      {children}
    </VoidMCContext.Provider>
  );
};

export const useVoidMC = () => {
  const context = useContext(VoidMCContext);
  if (!context) {
    throw new Error('useVoidMC must be used within a VoidMCProvider');
  }
  return context;
};
