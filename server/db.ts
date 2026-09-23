import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestoreDb = getFirestore(firebaseApp);

export interface StaffAccount {
  id: string;
  username: string;
  name: string;
  minecraftIgn: string;
  role: string;
  department: string;
  passwordHash: string;
  salt: string;
  avatarUrl: string;
  status: 'active' | 'suspended';
  joinedDate: string;
  isAdmin: boolean; // Only true for the 3 authorized accounts
  lastActive: string;
}

export interface ActiveSession {
  sessionId: string;
  token: string;
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

export interface AttendanceEntry {
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

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  tag: string;
  isPinned: boolean;
  createdAt: string;
  timestamp: number;
}

export interface StrikeRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  minecraftIgn: string;
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
}

export interface SystemNotification {
  id: string;
  targetUserId?: string; // If null/empty, broadcast to all
  title: string;
  message: string;
  type: 'announcement' | 'strike' | 'staff' | 'attendance' | 'security' | 'system';
  timestamp: number;
  timeAgo: string;
  readBy: string[]; // List of userIds who marked as read
  linkTab?: string;
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

export interface DatabaseSchema {
  staff: StaffAccount[];
  sessions: ActiveSession[];
  attendance: AttendanceEntry[];
  announcements: AnnouncementItem[];
  strikes: StrikeRecord[];
  notifications: SystemNotification[];
  applications: StaffLeaveApplication[];
  settings: {
    serverIp: string;
    maintenanceMode: boolean;
    requireAttendanceProof: boolean;
    autoSessionTimeoutHours: number;
    allowSelfAttendance: boolean;
  };
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'voidmc_db.json');

// Exact 3 authorized administrators
export const AUTHORIZED_ADMIN_NAMES = ['Elite ansh', 'obito uchiha', 'Santosh Rout'];

export function isAuthorizedAdmin(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  return AUTHORIZED_ADMIN_NAMES.some(name => {
    const target = name.toLowerCase();
    return clean === target ||
      clean.replace(/[\s_]+/g, '') === target.replace(/[\s_]+/g, '');
  });
}

// Password hashing with crypto
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// Exact India Standard Time (IST / Asia/Kolkata) Helper
export const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTDateInfo(date: Date = new Date()): {
  dateStr: string; // YYYY-MM-DD in IST
  timeStr: string; // "08:00:00 PM" in IST
  timeShortStr: string; // "08:00 PM" in IST
  fullStr: string; // "Sep 23, 2026, 08:00 PM IST"
  year: number;
  month: number; // 0-indexed
  day: number;
  timestamp: number;
} {
  const timestamp = date.getTime();

  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // Output: YYYY-MM-DD

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  const timeShortStr = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  const fullStr = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' IST';

  return { dateStr, timeStr, timeShortStr, fullStr, year, month, day, timestamp };
}

// Generate past attendance records for the current month up to yesterday in IST (marked Present for all staff)
export function generatePastAttendanceRecords(staffList: StaffAccount[]): AttendanceEntry[] {
  const records: AttendanceEntry[] = [];
  const istInfo = getISTDateInfo();
  const currentYear = istInfo.year;
  const currentMonth = istInfo.month; // 0-indexed
  const todayDate = istInfo.day;

  // All previous days in current month in IST (from day 1 to today - 1)
  for (let day = 1; day < todayDate; day++) {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const pastDate = new Date(`${dayStr}T18:00:00+05:30`);
    const timestamp = pastDate.getTime();

    staffList.forEach(staff => {
      records.push({
        id: `att_${staff.id}_${dayStr}`,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        minecraftIgn: staff.minecraftIgn,
        avatarUrl: staff.avatarUrl,
        date: dayStr,
        status: 'present',
        shiftNotes: 'Standard staff duty shift - Present',
        shiftDurationHours: 2,
        proofUrl: '',
        timestamp,
        timeFormatted: '06:00 PM IST',
        reviewedBy: 'System Auto-Credit',
        reviewedAt: `${dayStr} 06:00 PM IST`,
      });
    });
  }

  // Sort descending by timestamp
  return records.sort((a, b) => b.timestamp - a.timestamp);
}

export function getCleanSeedData(): DatabaseSchema {
  const ownerPass = hashPassword('VoidOwner@2024');
  const coOwnerPass = hashPassword('VoidCoOwner@2024');
  const staffMgrPass = hashPassword('VoidManager@2024');
  const normalStaffPass = hashPassword('Staff@Void123');

  const now = Date.now();

  const seedStaff: StaffAccount[] = [
    {
      id: 'staff-owner-ansh',
      username: 'elite ansh',
      name: 'Elite ansh',
      minecraftIgn: 'Elite_Ansh',
      role: 'OWNER',
      department: 'Executive',
      passwordHash: ownerPass.hash,
      salt: ownerPass.salt,
      avatarUrl: 'https://minotar.net/helm/Elite_Ansh/100.png',
      status: 'active',
      joinedDate: '2024-01-01',
      isAdmin: true,
      lastActive: 'Just now',
    },
    {
      id: 'staff-coowner-obito',
      username: 'obito uchiha',
      name: 'obito uchiha',
      minecraftIgn: 'Obito_Uchiha',
      role: 'CO OWNER',
      department: 'Executive',
      passwordHash: coOwnerPass.hash,
      salt: coOwnerPass.salt,
      avatarUrl: 'https://minotar.net/helm/Obito_Uchiha/100.png',
      status: 'active',
      joinedDate: '2024-01-05',
      isAdmin: true,
      lastActive: 'Just now',
    },
    {
      id: 'staff-manager-santosh',
      username: 'santosh rout',
      name: 'Santosh Rout',
      minecraftIgn: 'Santosh_Rout',
      role: 'STAFF MANAGER',
      department: 'Management',
      passwordHash: staffMgrPass.hash,
      salt: staffMgrPass.salt,
      avatarUrl: 'https://minotar.net/helm/Santosh_Rout/100.png',
      status: 'active',
      joinedDate: '2024-01-10',
      isAdmin: true,
      lastActive: 'Just now',
    },
    {
      id: 'staff-mod-shadow',
      username: 'shadow',
      name: 'ShadowMC',
      minecraftIgn: 'ShadowMC_',
      role: 'MC MODS',
      department: 'Moderation',
      passwordHash: normalStaffPass.hash,
      salt: normalStaffPass.salt,
      avatarUrl: 'https://minotar.net/helm/ShadowMC_/100.png',
      status: 'active',
      joinedDate: '2024-02-01',
      isAdmin: false,
      lastActive: '10 mins ago',
    },
    {
      id: 'staff-helper-aura',
      username: 'auraknight',
      name: 'AuraKnight',
      minecraftIgn: 'Aura_Knight',
      role: 'MC HELPER',
      department: 'Support',
      passwordHash: normalStaffPass.hash,
      salt: normalStaffPass.salt,
      avatarUrl: 'https://minotar.net/helm/Aura_Knight/100.png',
      status: 'active',
      joinedDate: '2024-03-01',
      isAdmin: false,
      lastActive: '1 hour ago',
    }
  ];

  const pastAttendance = generatePastAttendanceRecords(seedStaff);

  return {
    staff: seedStaff,
    sessions: [],
    attendance: pastAttendance,
    announcements: [
      {
        id: 'ann-welcome',
        title: 'VoidMC SMP Staff Command System Online',
        content: 'Welcome to the official VoidMC SMP Staff Management & Command Portal. All staff members are required to log their daily shift attendance under the Attendance section.',
        author: 'Santosh Rout',
        authorRole: 'STAFF MANAGER',
        tag: 'IMPORTANT',
        isPinned: true,
        createdAt: 'Today',
        timestamp: now,
      }
    ],
    strikes: [],
    notifications: [
      {
        id: 'notif-welcome',
        title: 'System Initialized',
        message: 'VoidMC SMP Staff Command initialized with clean records and secure authentication.',
        type: 'system',
        timestamp: now,
        timeAgo: 'Just now',
        readBy: [],
        linkTab: 'dashboard',
      }
    ],
    applications: [],
    settings: {
      serverIp: 'play.voidmc.fun',
      maintenanceMode: false,
      requireAttendanceProof: false,
      autoSessionTimeoutHours: 24,
      allowSelfAttendance: true,
    }
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.syncFromCloud();
  }

  public async syncFromCloud() {
    try {
      const docRef = doc(firestoreDb, 'portal_database', 'state');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as DatabaseSchema;
        if (cloudData && Array.isArray(cloudData.staff)) {
          this.data = cloudData;
          this.saveDirect(cloudData);
          console.log('[DB] Successfully synced persistent state from Firebase Firestore.');
        }
      } else {
        await setDoc(docRef, this.data);
        console.log('[DB] Uploaded initial database state to Firebase Firestore.');
      }
    } catch (err) {
      console.warn('[DB] Cloud sync notice (operating with local cache):', err);
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure structure validity
        if (parsed && Array.isArray(parsed.staff)) {
          parsed.applications = Array.isArray(parsed.applications) ? parsed.applications : [];
          parsed.announcements = Array.isArray(parsed.announcements) ? parsed.announcements : [];
          parsed.strikes = Array.isArray(parsed.strikes) ? parsed.strikes : [];
          parsed.notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];
          parsed.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];

          // Process and synchronize monthly attendance:
          // Mark all previous recorded days as Present for everyone, and keep today blank.
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          const todayDate = now.getDate();
          const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

          const existingAtt: AttendanceEntry[] = Array.isArray(parsed.attendance) ? parsed.attendance : [];

          // 1. Update any existing past attendance records to 'present'
          existingAtt.forEach(a => {
            if (a.date !== todayStr) {
              a.status = 'present';
            }
          });

          // 2. Ensure all staff have Present records for days 1 to (todayDate - 1)
          const pastSeeds = generatePastAttendanceRecords(parsed.staff);
          pastSeeds.forEach(seedEntry => {
            const exists = existingAtt.some(a => a.staffId === seedEntry.staffId && a.date === seedEntry.date);
            if (!exists) {
              existingAtt.push(seedEntry);
            }
          });

          // Sort descending
          parsed.attendance = existingAtt.sort((a, b) => b.timestamp - a.timestamp);

          this.saveDirect(parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, creating fresh clean database:', err);
    }

    const clean = getCleanSeedData();
    this.saveDirect(clean);
    return clean;
  }

  private saveDirect(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database file:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
    try {
      const docRef = doc(firestoreDb, 'portal_database', 'state');
      setDoc(docRef, this.data).catch(err => {
        console.warn('[DB] Failed to push update to Firebase Firestore:', err);
      });
    } catch (err) {
      console.warn('[DB] Firestore write exception:', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public resetAll() {
    this.data = getCleanSeedData();
    this.save();
    return this.data;
  }
}

export const db = new Database();
