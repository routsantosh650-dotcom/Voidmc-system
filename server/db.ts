import crypto from 'crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

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
  isAdmin: boolean;
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
  date: string;
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
  targetUserId?: string;
  title: string;
  message: string;
  type:
    | 'announcement'
    | 'strike'
    | 'staff'
    | 'attendance'
    | 'security'
    | 'system';
  timestamp: number;
  timeAgo: string;
  readBy: string[];
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
  startDate: string;
  endDate: string;
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

// ============================================================
// AUTHORIZED ADMINS
// ============================================================

export const AUTHORIZED_ADMIN_NAMES = [
  'Elite ansh',
  'obito uchiha',
  'Santosh Rout',
  'Ayeshaa',
  'Proscholar',
];

export function isAuthorizedAdmin(identifier: string): boolean {
  if (!identifier) return false;

  const clean = identifier.trim().toLowerCase();

  return AUTHORIZED_ADMIN_NAMES.some((name) => {
    const target = name.toLowerCase();

    return (
      clean === target ||
      clean.replace(/[\s_]+/g, '') ===
        target.replace(/[\s_]+/g, '')
    );
  });
}

// ============================================================
// PASSWORD HASHING
// ============================================================

export function hashPassword(
  password: string,
  salt?: string
): { hash: string; salt: string } {
  const generatedSalt =
    salt || crypto.randomBytes(16).toString('hex');

  const hash = crypto
    .pbkdf2Sync(
      password,
      generatedSalt,
      1000,
      64,
      'sha512'
    )
    .toString('hex');

  return {
    hash,
    salt: generatedSalt,
  };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const testHash = crypto
    .pbkdf2Sync(
      password,
      salt,
      1000,
      64,
      'sha512'
    )
    .toString('hex');

  return testHash === hash;
}

// ============================================================
// IST TIME
// ============================================================

export const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTDateInfo(
  date: Date = new Date()
): {
  dateStr: string;
  timeStr: string;
  timeShortStr: string;
  fullStr: string;
  year: number;
  month: number;
  day: number;
  timestamp: number;
} {
  const timestamp = date.getTime();

  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const [yearStr, monthStr, dayStr] =
    dateStr.split('-');

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

  const fullStr =
    new Intl.DateTimeFormat('en-US', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' IST';

  return {
    dateStr,
    timeStr,
    timeShortStr,
    fullStr,
    year,
    month,
    day,
    timestamp,
  };
}

// ============================================================
// PAST ATTENDANCE
// ============================================================

export function generatePastAttendanceRecords(
  staffList: StaffAccount[]
): AttendanceEntry[] {
  const records: AttendanceEntry[] = [];

  const istInfo = getISTDateInfo();

  const currentYear = istInfo.year;
  const currentMonth = istInfo.month;
  const todayDate = istInfo.day;

  for (let day = 1; day < todayDate; day++) {
    const dayStr =
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const pastDate =
      new Date(`${dayStr}T18:00:00+05:30`);

    const timestamp = pastDate.getTime();

    staffList.forEach((staff) => {
      records.push({
        id: `att_${staff.id}_${dayStr}`,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        minecraftIgn: staff.minecraftIgn,
        avatarUrl: staff.avatarUrl,
        date: dayStr,
        status: 'present',
        shiftNotes:
          'Standard staff duty shift - Present',
        shiftDurationHours: 2,
        proofUrl: '',
        timestamp,
        timeFormatted: '06:00 PM IST',
        reviewedBy: 'System Auto-Credit',
        reviewedAt:
          `${dayStr} 06:00 PM IST`,
      });
    });
  }

  return records.sort(
    (a, b) => b.timestamp - a.timestamp
  );
}

// ============================================================
// CLEAN SEED DATA
// ============================================================

export function getCleanSeedData(): DatabaseSchema {
  const ownerPass =
    hashPassword('VoidOwner@2024');

  const coOwnerPass =
    hashPassword('VoidCoOwner@2024');

  const staffMgrPass =
    hashPassword('VoidManager@2024');

  const normalStaffPass =
    hashPassword('Staff@Void123');

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
      avatarUrl:
        'https://minotar.net/helm/Elite_Ansh/100.png',
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
      avatarUrl:
        'https://minotar.net/helm/Obito_Uchiha/100.png',
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
      avatarUrl:
        'https://minotar.net/helm/Santosh_Rout/100.png',
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
      avatarUrl:
        'https://minotar.net/helm/ShadowMC_/100.png',
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
      avatarUrl:
        'https://minotar.net/helm/Aura_Knight/100.png',
      status: 'active',
      joinedDate: '2024-03-01',
      isAdmin: false,
      lastActive: '1 hour ago',
    },
  ];

  const pastAttendance =
    generatePastAttendanceRecords(seedStaff);

  return {
    staff: seedStaff,

    sessions: [],

    attendance: pastAttendance,

    announcements: [
      {
        id: 'ann-welcome',
        title:
          'VoidMC SMP Staff Command System Online',
        content:
          'Welcome to the official VoidMC SMP Staff Management & Command Portal. All staff members are required to log their daily shift attendance under the Attendance section.',
        author: 'Santosh Rout',
        authorRole: 'STAFF MANAGER',
        tag: 'IMPORTANT',
        isPinned: true,
        createdAt: 'Today',
        timestamp: now,
      },
    ],

    strikes: [],

    notifications: [
      {
        id: 'notif-welcome',
        title: 'System Initialized',
        message:
          'VoidMC SMP Staff Command initialized with clean records and secure authentication.',
        type: 'system',
        timestamp: now,
        timeAgo: 'Just now',
        readBy: [],
        linkTab: 'dashboard',
      },
    ],

    applications: [],

    settings: {
      serverIp: 'play.voidmc.fun',
      maintenanceMode: false,
      requireAttendanceProof: false,
      autoSessionTimeoutHours: 24,
      allowSelfAttendance: true,
    },
  };
}

// ============================================================
// FIRESTORE DATABASE
// ============================================================

class Database {
  private data: DatabaseSchema;
  private firestore: Firestore | null = null;

  // Keeps writes in order.
  private saveQueue: Promise<void> = Promise.resolve();

  private readonly collectionName = 'voidmc';
  private readonly documentName = 'database';

  constructor() {
  // Start with clean in-memory data.
  // Firestore data is loaded by init().
  this.data = getCleanSeedData();
  }

    private ensureAuthorizedAdminAccounts(): void {
    const adminAccounts = [
      {
        username: 'ayeshaa',
        name: 'Ayeshaa',
        minecraftIgn: 'Ayeshaa',
        password: process.env.AYESHAA_ADMIN_PASSWORD,
      },
      {
        username: 'proscholar',
        name: 'Proscholar',
        minecraftIgn: 'Proscholar',
        password: process.env.PROSCHOLAR_ADMIN_PASSWORD,
      },
    ];

    for (const admin of adminAccounts) {
      const existing = this.data.staff.find(
        (staff) =>
          staff.username.toLowerCase() ===
            admin.username.toLowerCase() ||
          staff.name.toLowerCase() ===
            admin.name.toLowerCase()
      );

      if (existing) {
  existing.isAdmin = true;
  existing.role = 'MANAGER';
  existing.department = 'Management';

  // Sync password from Render Environment Variable
  if (admin.password) {
    const pw = hashPassword(admin.password);
    existing.passwordHash = pw.hash;
    existing.salt = pw.salt;
  }

  continue;
}

      if (!admin.password) {
        console.warn(
          `[VoidMC DB] Password missing for ${admin.username}. Admin account was not created.`
        );
        continue;
      }

      const pw = hashPassword(admin.password);

      this.data.staff.push({
        id: `staff-admin-${admin.username}`,
        username: admin.username,
        name: admin.name,
        minecraftIgn: admin.minecraftIgn,
        role: 'MANAGER',
        department: 'Management',
        passwordHash: pw.hash,
        salt: pw.salt,
        avatarUrl:
          `https://minotar.net/helm/${encodeURIComponent(
            admin.minecraftIgn
          )}/100.png`,
        status: 'active',
        joinedDate:
          new Date().toISOString().split('T')[0],
        isAdmin: true,
        lastActive: 'Never',
      });
    }
    }

  // ----------------------------------------------------------
  // FIREBASE INITIALIZATION
  // ----------------------------------------------------------

  public async init(): Promise<void> {
    try {
      const serviceAccountPath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        '/etc/secrets/firebase-service-account.json';

      console.log(
        `[DB] Loading Firebase service account from: ${serviceAccountPath}`
      );

      const raw = await import('fs').then((fs) =>
        fs.promises.readFile(
          serviceAccountPath,
          'utf8'
        )
      );

      const serviceAccount =
        JSON.parse(raw);

      const firebaseApp =
        getApps().length > 0
          ? getApps()[0]
          : initializeApp({
              credential: cert(serviceAccount),
            });

      this.firestore =
        getFirestore(firebaseApp);

      // Allow optional fields with undefined values.
      this.firestore.settings({
        ignoreUndefinedProperties: true,
      });

      const docRef = this.firestore
        .collection(this.collectionName)
        .doc(this.documentName);

      const snapshot = await docRef.get();

      if (snapshot.exists) {
        const firestoreData =
          snapshot.data() as Partial<DatabaseSchema>;

        this.data =
          this.normalizeData(firestoreData);

        console.log(
          '[DB] Firestore database loaded successfully.'
        );
      } else {
        this.data = getCleanSeedData();

        await docRef.set(this.data);

        console.log(
          '[DB] Firestore database did not exist. Clean database created.'
        );
      }

            // Add/verify authorized admin accounts.
      this.ensureAuthorizedAdminAccounts();

      // Synchronize old attendance records.
      this.syncPastAttendance();

      // Save synchronization back to Firestore.
      await this.saveAsync();
      
      console.log(
        '[DB] Firebase Firestore is ready.'
      );
    } catch (error) {
      console.error(
        '[DB] Firebase initialization failed:',
        error
      );

      throw error;
    }
  }

  // ----------------------------------------------------------
  // NORMALIZE FIRESTORE DATA
  // ----------------------------------------------------------

  private normalizeData(
    input: Partial<DatabaseSchema>
  ): DatabaseSchema {
    const clean = getCleanSeedData();

    return {
      staff: Array.isArray(input.staff)
        ? input.staff
        : clean.staff,

      sessions: Array.isArray(input.sessions)
        ? input.sessions
        : [],

      attendance: Array.isArray(input.attendance)
        ? input.attendance
        : [],

      announcements:
        Array.isArray(input.announcements)
          ? input.announcements
          : [],

      strikes: Array.isArray(input.strikes)
        ? input.strikes
        : [],

      notifications:
        Array.isArray(input.notifications)
          ? input.notifications
          : [],

      applications:
        Array.isArray(input.applications)
          ? input.applications
          : [],

      settings: {
        ...clean.settings,
        ...(input.settings || {}),
      },
    };
  }

  // ----------------------------------------------------------
  // ATTENDANCE SYNCHRONIZATION
  // ----------------------------------------------------------

  private syncPastAttendance(): void {
    const istInfo = getISTDateInfo();

    const todayStr = istInfo.dateStr;

    const existing =
      Array.isArray(this.data.attendance)
        ? this.data.attendance
        : [];

    // All old dates become present.
    existing.forEach((entry) => {
      if (entry.date !== todayStr) {
        entry.status = 'present';
      }
    });

    // Make sure every staff member has
    // a present record for previous days.
    const pastSeeds =
      generatePastAttendanceRecords(
        this.data.staff
      );

    pastSeeds.forEach((seed) => {
      const exists = existing.some(
        (entry) =>
          entry.staffId === seed.staffId &&
          entry.date === seed.date
      );

      if (!exists) {
        existing.push(seed);
      }
    });

    this.data.attendance = existing.sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  public save(): void {
    if (!this.firestore) {
      console.warn(
        '[DB] save() called before Firestore initialization.'
      );
      return;
    }

    this.saveQueue = this.saveQueue
      .then(async () => {
        await this.saveAsync();
      })
      .catch((error) => {
        console.error(
          '[DB] Firestore save failed:',
          error
        );
      });
  }

  private async saveAsync(): Promise<void> {
    if (!this.firestore) {
      throw new Error(
        'Firestore is not initialized.'
      );
    }

    const docRef = this.firestore
      .collection(this.collectionName)
      .doc(this.documentName);

    await docRef.set(this.data);

    console.log(
      '[DB] Data saved to Firestore.'
    );
  }

  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  public get(): DatabaseSchema {
    return this.data;
  }

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  public resetAll(): DatabaseSchema {
    this.data = getCleanSeedData();

    this.syncPastAttendance();

    this.save();

    return this.data;
  }
}

// ============================================================
// SINGLE DATABASE INSTANCE
// ============================================================

export const db = new Database();
