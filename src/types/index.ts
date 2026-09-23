export type RoleColor =
  | 'red'
  | 'purple'
  | 'orange'
  | 'indigo'
  | 'blue'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'pink'
  | 'cyan'
  | 'magenta';

export interface StaffRole {
  id: string;
  name: string;
  memberCount: number;
  color: RoleColor;
  iconType: string;
  department: string;
  isOwnerRole?: boolean;
  isAdminRole?: boolean;
}

export interface StaffMember {
  id: string;
  username: string;
  name: string;
  minecraftIgn: string;
  role: string;
  department: string;
  avatarUrl: string;
  status: 'active' | 'suspended';
  joinedDate: string;
  isAdmin: boolean; // Only the 3 authorized accounts
  lastActive: string;
}

export interface ActiveSession {
  sessionId: string;
  token?: string;
  userId: string;
  username: string;
  name: string;
  minecraftIgn: string;
  role: string;
  isAdmin: boolean;
  loginTime: string;
  lastActivity: string;
  userAgent: string;
  ip: string;
  status: 'active' | 'terminated';
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  minecraftIgn: string;
  avatarUrl: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  shiftNotes?: string;
  shiftDurationHours?: number;
  proofUrl?: string;
  timestamp: number;
  timeFormatted: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  tag: string;
  isPinned: boolean;
  createdAt: string;
  timeAgo?: string;
  timestamp: number;
}

export interface Strike {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  minecraftIgn: string;
  avatarUrl?: string;
  date?: string;
  strikeNumber: 1 | 2 | 3;
  reason: string;
  severity: 'minor' | 'major' | 'critical';
  evidenceUrl?: string;
  issuedBy: string;
  issuedAt: string;
  timestamp: number;
  status: 'active' | 'appealed' | 'revoked';
  acknowledged: boolean;
  appealReason?: string;
  revokedReason?: string;
  revokedBy?: string;
}

export interface SystemNotification {
  id: string;
  targetUserId?: string;
  title: string;
  message: string;
  type: 'announcement' | 'strike' | 'staff' | 'attendance' | 'security' | 'system';
  timestamp: number;
  timeAgo: string;
  read: boolean;
  linkTab?: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  subtext?: string;
  user: string;
  timeAgo: string;
  timestamp: number;
  type: 'attendance' | 'strike' | 'application' | 'announcement' | 'role' | 'system';
}

export interface StaffLeaveApplication {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  minecraftIgn: string;
  avatarUrl: string;
  type: 'LOA' | 'Leave';
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  additionalDetails?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  timestamp: number;
  reviewedBy?: string;
  adminResponse?: string;
  reviewedAt?: string;
}

export type StaffApplication = StaffLeaveApplication;
