import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  db,
  isAuthorizedAdmin,
  hashPassword,
  verifyPassword,
  getISTDateInfo,
  StaffAccount,
  ActiveSession,
  AttendanceEntry,
  AnnouncementItem,
  StrikeRecord,
  SystemNotification,
  StaffLeaveApplication,
} from './db';

const router = express.Router();
router.use(express.json());

// Extend express Request
export interface AuthenticatedRequest extends Request {
  user?: StaffAccount;
  sessionObj?: ActiveSession;
  isAdmin?: boolean;
}

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const database = db.get();
  const session = database.sessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  if (session.status === 'terminated') {
    // Remove terminated session
    database.sessions = database.sessions.filter(s => s.token !== token);
    db.save();
    return res.status(401).json({ error: 'Your session has been terminated by an administrator.' });
  }

  const staff = database.staff.find(s => s.id === session.userId);
  if (!staff || staff.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended or not found.' });
  }

  // Update session last activity
  session.lastActivity = new Date().toISOString();
  staff.lastActive = 'Online';

  req.user = staff;
  req.sessionObj = session;
  // Strictly enforce: only the 3 authorized accounts have admin permissions
  req.isAdmin = isAuthorizedAdmin(staff.name) || isAuthorizedAdmin(staff.username);

  next();
}

// Admin only middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Administrative permissions required. Only Elite ansh, obito uchiha, and Santosh Rout can access this feature.',
      });
    }
    next();
  });
}

// Optional Auth (populates req.user & req.isAdmin if token provided, but doesn't reject if omitted)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const database = db.get();
    const session = database.sessions.find(s => s.token === token && s.status === 'active');
    if (session) {
      const staff = database.staff.find(s => s.id === session.userId);
      if (staff && staff.status !== 'suspended') {
        session.lastActivity = new Date().toISOString();
        req.user = staff;
        req.sessionObj = session;
        req.isAdmin = isAuthorizedAdmin(staff.name) || isAuthorizedAdmin(staff.username);
      }
    }
  }
  next();
}

// ----------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------

// 1. Normal Staff Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const database = db.get();
  const cleanInput = username.trim().toLowerCase();

  const user = database.staff.find(s =>
    s.username.toLowerCase() === cleanInput ||
    s.name.toLowerCase() === cleanInput ||
    s.minecraftIgn.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact server administration.' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isAdmin = isAuthorizedAdmin(user.name) || isAuthorizedAdmin(user.username);
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');

  // Detect user agent & IP
  const userAgent = (req.headers['user-agent'] as string) || 'Desktop Browser';
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const ist = getISTDateInfo();

  const newSession: ActiveSession = {
    sessionId,
    token,
    userId: user.id,
    username: user.username,
    name: user.name,
    minecraftIgn: user.minecraftIgn,
    role: user.role,
    isAdmin,
    loginTime: ist.fullStr,
    lastActivity: ist.fullStr,
    userAgent,
    ip: ip.toString(),
    status: 'active',
  };

  database.sessions.push(newSession);
  user.lastActive = 'Online';
  db.save();

  // Return clean user object (no password/salt)
  const { passwordHash, salt, ...safeUser } = user;

  res.json({
    message: 'Login successful',
    token,
    user: {
      ...safeUser,
      isAdmin,
    },
    isAdmin,
  });
});

// 2. Dedicated Admin Panel Login
router.post('/auth/admin-login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Admin username and password are required.' });
  }

  const database = db.get();
  const cleanInput = username.trim().toLowerCase();

  const user = database.staff.find(s =>
    s.username.toLowerCase() === cleanInput ||
    s.name.toLowerCase() === cleanInput ||
    s.minecraftIgn.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  // Strict validation: Only the 3 authorized accounts can log into the Admin Panel!
  const isAuthorized = isAuthorizedAdmin(user.name) || isAuthorizedAdmin(user.username);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Access Denied: Only authorized administrators (Elite ansh, obito uchiha, Santosh Rout) are allowed to access the Admin Panel.',
    });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = 'admin_sess_' + crypto.randomBytes(8).toString('hex');
  const userAgent = (req.headers['user-agent'] as string) || 'Admin Console';
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const ist = getISTDateInfo();

  const newSession: ActiveSession = {
    sessionId,
    token,
    userId: user.id,
    username: user.username,
    name: user.name,
    minecraftIgn: user.minecraftIgn,
    role: user.role,
    isAdmin: true,
    loginTime: ist.fullStr,
    lastActivity: ist.fullStr,
    userAgent,
    ip: ip.toString(),
    status: 'active',
  };

  database.sessions.push(newSession);
  user.lastActive = 'Online';

  // Add system notification about admin login
  database.notifications.push({
    id: 'notif_' + Date.now(),
    title: 'Admin Console Access',
    message: `${user.name} logged into the Admin Command Panel.`,
    type: 'security',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [user.id],
    linkTab: 'admin',
  });

  db.save();

  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    message: 'Admin authentication successful',
    token,
    user: {
      ...safeUser,
      isAdmin: true,
    },
    isAdmin: true,
  });
});

// 3. Current User Info (/api/auth/me)
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    user: {
      ...safeUser,
      isAdmin: req.isAdmin,
    },
    isAdmin: req.isAdmin,
    sessionId: req.sessionObj?.sessionId,
  });
});

// 4. Logout
router.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const token = req.headers.authorization?.split(' ')[1];
  database.sessions = database.sessions.filter(s => s.token !== token);
  db.save();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Normal Staff Self-Password Change (Requirement 4)
router.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current password and new password are required.' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  const database = db.get();
  const staff = database.staff.find(s => s.id === req.user!.id);
  if (!staff) {
    return res.status(404).json({ error: 'Staff account not found.' });
  }

  if (!verifyPassword(currentPassword, staff.passwordHash, staff.salt)) {
    return res.status(401).json({ error: 'Incorrect current password. Please re-enter your current password.' });
  }

  const pw = hashPassword(newPassword);
  staff.passwordHash = pw.hash;
  staff.salt = pw.salt;

  database.notifications.push({
    id: 'notif_pwchange_' + Date.now(),
    targetUserId: staff.id,
    title: 'Password Updated',
    message: 'Your account password was updated successfully.',
    type: 'security',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [],
  });

  db.save();
  res.json({ success: true, message: 'Your password was changed successfully.' });
});

// 5. Active Sessions (Real-time online staff & active login sessions)
router.get('/auth/sessions', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  // Filter active sessions
  const activeSessions = database.sessions.filter(s => s.status === 'active');
  const isAdminUser = req.user && (
    isAuthorizedAdmin(req.user.name) ||
    isAuthorizedAdmin(req.user.username) ||
    req.user.role === 'OWNER' ||
    req.user.role === 'CO OWNER' ||
    req.user.role === 'STAFF MANAGER' ||
    req.isAdmin
  );

  const sanitizedSessions = activeSessions.map(sess => {
    if (isAdminUser) {
      return sess;
    }
    // For non-admin, mask sensitive IP
    return {
      ...sess,
      ip: sess.ip ? sess.ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.***.***') : 'Internal Network',
      token: undefined, // never expose token
    };
  });

  res.json({ sessions: sanitizedSessions });
});

// Real-time system activity logs
router.get('/activity-logs', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const logs: Array<{
    id: string;
    text: string;
    subtext?: string;
    timeAgo: string;
    timestamp: number;
    type: string;
  }> = [];

  // 1. Add attendance activities
  database.attendance.slice(0, 15).forEach(att => {
    logs.push({
      id: 'act_' + att.id,
      text: `${att.staffName} checked in ${att.status.toUpperCase()}`,
      subtext: `Shift: ${att.shiftNotes || 'Standard shift'} (${att.shiftDurationHours || 2} hrs) • ${att.date} at ${att.timeFormatted}`,
      timeAgo: att.date,
      timestamp: att.timestamp,
      type: 'attendance',
    });
  });

  // 2. Add strike activities
  database.strikes.forEach(str => {
    logs.push({
      id: 'act_' + str.id,
      text: `Strike ${str.strikeNumber}/3 issued to ${str.staffName}`,
      subtext: `Reason: ${str.reason} (Issued by: ${str.issuedBy})`,
      timeAgo: str.issuedAt,
      timestamp: str.timestamp,
      type: 'strike',
    });
  });

  // 3. Add announcements activities
  database.announcements.forEach(ann => {
    logs.push({
      id: 'act_' + ann.id,
      text: `Announcement published: "${ann.title}"`,
      subtext: `By ${ann.author} • [${ann.tag}]`,
      timeAgo: ann.createdAt || 'Recent',
      timestamp: ann.timestamp,
      type: 'announcement',
    });
  });

  // 4. Add applications activities
  (database.applications || []).forEach(app => {
    logs.push({
      id: 'act_' + app.id,
      text: `${app.staffName} submitted a ${app.type} application (${app.status.toUpperCase()})`,
      subtext: `Dates: ${app.startDate} to ${app.endDate} • Reason: ${app.reason}`,
      timeAgo: app.submittedAt || 'Recent',
      timestamp: app.timestamp,
      type: 'application',
    });
  });

  // Sort descending by timestamp
  const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
  res.json({ activities: sortedLogs });
});

// 6. Terminate Session / Force Logout (Admin Only)
router.post('/auth/terminate-session', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, userId } = req.body;
  const database = db.get();

  let count = 0;
  if (sessionId) {
    const session = database.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      session.status = 'terminated';
      count++;
    }
  } else if (userId) {
    database.sessions.forEach(s => {
      if (s.userId === userId) {
        s.status = 'terminated';
        count++;
      }
    });
  }

  // Create security notification
  database.notifications.push({
    id: 'notif_term_' + Date.now(),
    title: 'Staff Session Force Terminated',
    message: `An active session was terminated by administrator ${req.user!.name}.`,
    type: 'security',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [req.user!.id],
  });

  db.save();
  res.json({ success: true, message: `Terminated ${count} session(s)` });
});

// ----------------------------------------
// STAFF MANAGEMENT ENDPOINTS
// ----------------------------------------

// List staff
router.get('/staff', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const safeStaff = database.staff.map(s => {
    const { passwordHash, salt, ...safe } = s;
    return {
      ...safe,
      isAdmin: isAuthorizedAdmin(s.name) || isAuthorizedAdmin(s.username),
    };
  });
  res.json({ staff: safeStaff });
});

// Add staff (Admin only)
router.post('/staff', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, username, minecraftIgn, role, department, password } = req.body;
  if (!name || !username || !password || !minecraftIgn || !role) {
    return res.status(400).json({ error: 'Name, username, Minecraft IGN, role, and password are required.' });
  }

  const database = db.get();
  const cleanUsername = username.trim().toLowerCase();

  // Check duplicate
  const exists = database.staff.some(s =>
    s.username.toLowerCase() === cleanUsername ||
    s.minecraftIgn.toLowerCase() === minecraftIgn.trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: 'A staff member with this username or Minecraft IGN already exists.' });
  }

  const pw = hashPassword(password);
  const newStaff: StaffAccount = {
    id: 'staff_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name.trim(),
    username: cleanUsername,
    minecraftIgn: minecraftIgn.trim(),
    role: role.trim().toUpperCase(),
    department: department ? department.trim() : 'Staff Team',
    passwordHash: pw.hash,
    salt: pw.salt,
    avatarUrl: 'https://minotar.net/helm/Steve/100.png',
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
    isAdmin: false, // Only the 3 authorized accounts can ever have admin rights
    lastActive: 'Never',
  };

  database.staff.push(newStaff);

  // Add notification
  database.notifications.push({
    id: 'notif_newstaff_' + Date.now(),
    title: 'New Staff Member Onboarded',
    message: `${newStaff.name} (${newStaff.role}) was added by ${req.user!.name}.`,
    type: 'staff',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [req.user!.id],
    linkTab: 'staff-directory',
  });

  db.save();

  const { passwordHash, salt, ...safe } = newStaff;
  res.json({
    success: true,
    message: 'Staff member created successfully',
    staff: safe,
    rawCredentials: {
      username: newStaff.username,
      password,
    },
  });
});

// Edit staff (Admin only)
router.put('/staff/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, role, department, minecraftIgn, status } = req.body;

  const database = db.get();
  const staff = database.staff.find(s => s.id === id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // Prevent changing the role of the 3 primary admins unless editing themselves safely
  const isPrimary = isAuthorizedAdmin(staff.name) || isAuthorizedAdmin(staff.username);

  if (name) staff.name = name.trim();
  if (role && !isPrimary) staff.role = role.trim().toUpperCase();
  if (department) staff.department = department.trim();
  if (minecraftIgn) {
    staff.minecraftIgn = minecraftIgn.trim();
    staff.avatarUrl = `https://minotar.net/helm/${encodeURIComponent(minecraftIgn.trim())}/100.png`;
  }
  if (status && !isPrimary) staff.status = status;

  db.save();

  const { passwordHash, salt, ...safe } = staff;
  res.json({ success: true, message: 'Staff member updated', staff: safe });
});

// Reset password (Admin only)
router.post('/staff/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  const database = db.get();
  const staff = database.staff.find(s => s.id === id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const pw = hashPassword(newPassword);
  staff.passwordHash = pw.hash;
  staff.salt = pw.salt;

  // Invalidate any existing sessions for this user so they must log in with the new password
  database.sessions.forEach(s => {
    if (s.userId === staff.id) {
      s.status = 'terminated';
    }
  });

  // Log notification
  database.notifications.push({
    id: 'notif_pwreset_' + Date.now(),
    targetUserId: staff.id,
    title: 'Password Updated',
    message: `Your password was reset by administrator ${req.user!.name}.`,
    type: 'security',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [],
  });

  db.save();

  res.json({
    success: true,
    message: `Password for ${staff.name} reset successfully.`,
    credentials: {
      username: staff.username,
      newPassword,
    },
  });
});

// Delete staff (Admin only)
router.delete('/staff/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  const staff = database.staff.find(s => s.id === id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // Strictly prevent deletion of the 3 authorized admins!
  if (isAuthorizedAdmin(staff.name) || isAuthorizedAdmin(staff.username)) {
    return res.status(400).json({ error: 'Cannot delete primary authorized administrative accounts.' });
  }

  database.staff = database.staff.filter(s => s.id !== id);
  // Terminate any active sessions
  database.sessions = database.sessions.filter(s => s.userId !== id);

  db.save();
  res.json({ success: true, message: `Staff member ${staff.name} removed successfully.` });
});

// ----------------------------------------
// ATTENDANCE ENDPOINTS
// ----------------------------------------

// Get attendance
router.get('/attendance', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  // Return records sorted by timestamp descending
  const sorted = [...database.attendance].sort((a, b) => b.timestamp - a.timestamp);
  res.json({ attendance: sorted });
});

// Mark own attendance (Present only - system automatically records exact date & time in IST)
router.post('/attendance/mark', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { shiftNotes, shiftDurationHours, proofUrl } = req.body;

  const database = db.get();
  const user = req.user!;
  const ist = getISTDateInfo();
  const today = ist.dateStr; // e.g. "2026-09-23" (IST)
  const timeFormatted = `${ist.timeShortStr} IST`; // e.g. "08:00 PM IST"

  // Check if already marked today
  const existingIndex = database.attendance.findIndex(
    a => a.staffId === user.id && a.date === today
  );

  const entry: AttendanceEntry = {
    id: existingIndex >= 0 ? database.attendance[existingIndex].id : 'att_' + Date.now(),
    staffId: user.id,
    staffName: user.name,
    staffRole: user.role,
    minecraftIgn: user.minecraftIgn,
    avatarUrl: user.avatarUrl,
    date: today,
    status: 'present',
    shiftNotes: shiftNotes?.trim() || 'Active duty shift completed',
    shiftDurationHours: Number(shiftDurationHours || 2),
    proofUrl: proofUrl || '',
    timestamp: ist.timestamp,
    timeFormatted,
  };

  if (existingIndex >= 0) {
    database.attendance[existingIndex] = entry;
  } else {
    database.attendance.unshift(entry);
  }

  // Create notification for admins
  database.notifications.push({
    id: 'notif_att_' + Date.now(),
    title: `Attendance Checked In: ${user.name}`,
    message: `${user.name} (${user.role}) checked in PRESENT on ${today} at ${timeFormatted}.`,
    type: 'attendance',
    timestamp: ist.timestamp,
    timeAgo: 'Just now',
    readBy: [user.id],
    linkTab: 'attendance',
  });

  db.save();
  res.json({
    success: true,
    message: `Attendance marked: PRESENT recorded on ${today} at ${timeFormatted}!`,
    attendance: entry,
  });
});

// Admin review / edit attendance record
router.put('/attendance/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, shiftNotes, shiftDurationHours } = req.body;

  const database = db.get();
  const record = database.attendance.find(a => a.id === id);

  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  if (status) record.status = status;
  if (shiftNotes !== undefined) record.shiftNotes = shiftNotes;
  if (shiftDurationHours !== undefined) record.shiftDurationHours = Number(shiftDurationHours);
  record.reviewedBy = req.user!.name;
  record.reviewedAt = new Date().toISOString();

  db.save();
  res.json({ success: true, message: 'Attendance record updated', record });
});

// Delete attendance record (Admin only)
router.delete('/attendance/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  database.attendance = database.attendance.filter(a => a.id !== id);
  db.save();
  res.json({ success: true, message: 'Attendance record deleted' });
});

// Clear all attendance records (Admin only)
router.post('/attendance/clear', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  database.attendance = [];
  db.save();
  res.json({ success: true, message: 'All attendance records cleared successfully' });
});

// ----------------------------------------
// ANNOUNCEMENTS ENDPOINTS
// ----------------------------------------

// Get announcements
router.get('/announcements', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const sorted = [...database.announcements].sort((a, b) => b.timestamp - a.timestamp);
  res.json({ announcements: sorted });
});

// Create announcement (Admin only)
router.post('/announcements', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, content, tag, isPinned } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const database = db.get();
  const newAnn: AnnouncementItem = {
    id: 'ann_' + Date.now(),
    title: title.trim(),
    content: content.trim(),
    author: req.user!.name,
    authorRole: req.user!.role,
    tag: tag ? tag.trim().toUpperCase() : 'GENERAL',
    isPinned: Boolean(isPinned),
    createdAt: 'Just now',
    timestamp: Date.now(),
  };

  database.announcements.unshift(newAnn);

  // Broadcast notification to all staff
  database.notifications.unshift({
    id: 'notif_ann_' + Date.now(),
    title: `Announcement: ${newAnn.title}`,
    message: newAnn.content.slice(0, 100) + (newAnn.content.length > 100 ? '...' : ''),
    type: 'announcement',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [req.user!.id],
    linkTab: 'announcements',
  });

  db.save();
  res.json({ success: true, message: 'Announcement created successfully', announcement: newAnn });
});

// Edit announcement (Admin only)
router.put('/announcements/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, tag, isPinned } = req.body;

  const database = db.get();
  const ann = database.announcements.find(a => a.id === id);

  if (!ann) {
    return res.status(404).json({ error: 'Announcement not found.' });
  }

  if (title) ann.title = title.trim();
  if (content) ann.content = content.trim();
  if (tag) ann.tag = tag.trim().toUpperCase();
  if (isPinned !== undefined) ann.isPinned = Boolean(isPinned);

  db.save();
  res.json({ success: true, message: 'Announcement updated', announcement: ann });
});

// Delete announcement (Admin only)
router.delete('/announcements/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  database.announcements = database.announcements.filter(a => a.id !== id);
  db.save();
  res.json({ success: true, message: 'Announcement deleted' });
});

// Clear ALL announcements (Admin only)
router.post('/announcements/clear-all', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  database.announcements = [];
  db.save();
  res.json({ success: true, message: 'All announcements have been cleared.' });
});

// ----------------------------------------
// NOTIFICATIONS ENDPOINTS
// ----------------------------------------

// Get notifications for current user
router.get('/notifications', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const userId = req.user?.id;

  const userNotifs = database.notifications
    .filter(n => !n.targetUserId || (userId && n.targetUserId === userId))
    .map(n => ({
      ...n,
      read: userId ? n.readBy.includes(userId) : false,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = userNotifs.filter(n => !n.read).length;

  res.json({
    notifications: userNotifs,
    unreadCount,
  });
});

// Mark single notification as read
router.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  const userId = req.user!.id;

  const notif = database.notifications.find(n => n.id === id);
  if (notif && !notif.readBy.includes(userId)) {
    notif.readBy.push(userId);
    db.save();
  }

  res.json({ success: true });
});

// Mark all notifications as read
router.post('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const userId = req.user!.id;

  database.notifications.forEach(n => {
    if (!n.readBy.includes(userId)) {
      n.readBy.push(userId);
    }
  });

  db.save();
  res.json({ success: true });
});

// Clear all notifications
router.post('/notifications/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  const userId = req.user!.id;

  // Filter out notifications targeted to this user or mark them
  database.notifications = database.notifications.filter(n => n.targetUserId !== userId);
  database.notifications.forEach(n => {
    if (!n.readBy.includes(userId)) {
      n.readBy.push(userId);
    }
  });

  db.save();
  res.json({ success: true, message: 'Notifications cleared' });
});

// ----------------------------------------
// STRIKES & DISCIPLINARY ENDPOINTS
// ----------------------------------------

// Get strikes
router.get('/strikes', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  res.json({ strikes: database.strikes });
});

// Issue strike (Admin only)
router.post('/strikes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { staffId, reason, severity, evidenceUrl } = req.body;
  if (!staffId || !reason) {
    return res.status(400).json({ error: 'Staff ID and reason are required.' });
  }

  const database = db.get();
  const staff = database.staff.find(s => s.id === staffId);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  // Count existing active strikes
  const existingActive = database.strikes.filter(s => s.staffId === staffId && s.status === 'active');
  const strikeNumber = ((existingActive.length % 3) + 1) as 1 | 2 | 3;

  const ist = getISTDateInfo();
  const newStrike: StrikeRecord = {
    id: 'strike_' + Date.now(),
    staffId: staff.id,
    staffName: staff.name,
    staffRole: staff.role,
    minecraftIgn: staff.minecraftIgn,
    strikeNumber,
    reason: reason.trim(),
    severity: severity || 'minor',
    evidenceUrl: evidenceUrl || '',
    issuedBy: req.user!.name,
    issuedAt: ist.fullStr,
    timestamp: ist.timestamp,
    status: 'active',
    acknowledged: false,
  };

  database.strikes.push(newStrike);

  // Send urgent notification to the staff member
  database.notifications.unshift({
    id: 'notif_strike_' + Date.now(),
    targetUserId: staff.id,
    title: `DISCIPLINARY STRIKE ${strikeNumber}/3 ISSUED`,
    message: `You received a strike: "${newStrike.reason}". Issued by ${req.user!.name}.`,
    type: 'strike',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [],
    linkTab: 'strikes',
  });

  db.save();
  res.json({ success: true, message: `Strike ${strikeNumber}/3 issued to ${staff.name}`, strike: newStrike });
});

// Acknowledge strike
router.post('/strikes/:id/acknowledge', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  const strike = database.strikes.find(s => s.id === id);

  if (!strike) {
    return res.status(404).json({ error: 'Strike not found.' });
  }

  strike.acknowledged = true;
  db.save();
  res.json({ success: true, message: 'Strike acknowledged' });
});

// Revoke strike (Admin only)
router.post('/strikes/:id/revoke', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  const strike = database.strikes.find(s => s.id === id);

  if (!strike) {
    return res.status(404).json({ error: 'Strike not found.' });
  }

  strike.status = 'revoked';
  db.save();
  res.json({ success: true, message: 'Strike revoked' });
});

// ----------------------------------------
// APPLICATIONS (LOA & LEAVE) ENDPOINTS (Requirement 9)
// ----------------------------------------

// Get applications
router.get('/applications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const database = db.get();
  database.applications = Array.isArray(database.applications) ? database.applications : [];

  if (req.isAdmin) {
    // Admin sees all applications
    const sorted = [...database.applications].sort((a, b) => b.timestamp - a.timestamp);
    return res.json({ applications: sorted });
  } else {
    // Normal staff sees only their own applications
    const myApps = database.applications
      .filter(a => a.staffId === req.user!.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    return res.json({ applications: myApps });
  }
});

// Submit application (LOA or Leave)
router.post('/applications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { type, reason, startDate, endDate, additionalDetails } = req.body;

  if (!type || (type !== 'LOA' && type !== 'Leave')) {
    return res.status(400).json({ error: "Application type must be 'LOA' or 'Leave'." });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Please provide a reason for the application.' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Both start date and end date are required.' });
  }

  const database = db.get();
  database.applications = Array.isArray(database.applications) ? database.applications : [];
  const ist = getISTDateInfo();

  const newApp: StaffLeaveApplication = {
    id: 'app_' + Date.now(),
    staffId: req.user!.id,
    staffName: req.user!.name,
    staffRole: req.user!.role,
    minecraftIgn: req.user!.minecraftIgn,
    avatarUrl: req.user!.avatarUrl,
    type,
    reason: reason.trim(),
    startDate,
    endDate,
    additionalDetails: additionalDetails?.trim() || undefined,
    status: 'pending',
    submittedAt: ist.fullStr,
    timestamp: ist.timestamp,
  };

  database.applications.unshift(newApp);

  // Notify admins
  database.notifications.push({
    id: 'notif_app_' + Date.now(),
    title: `New ${type} Application: ${req.user!.name}`,
    message: `${req.user!.name} (${req.user!.role}) submitted a ${type} application for ${startDate} to ${endDate}. Reason: "${reason.trim()}"`,
    type: 'staff',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [],
    linkTab: 'applications',
  });

  db.save();
  res.json({
    success: true,
    message: `Your ${type} application has been submitted successfully for admin review.`,
    application: newApp,
  });
});

// Review application (Admin only: Approve / Reject + Admin Response)
router.put('/applications/:id/review', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }

  const database = db.get();
  database.applications = Array.isArray(database.applications) ? database.applications : [];
  const app = database.applications.find(a => a.id === id);

  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const ist = getISTDateInfo();
  app.status = status;
  app.reviewedBy = req.user!.name;
  app.adminResponse = adminResponse ? adminResponse.trim() : undefined;
  app.reviewedAt = ist.fullStr;

  // NOTIFICATION REQUIREMENT:
  // "The applicant should receive a notification whenever their application is approved, rejected, or receives an admin response."
  const responseText = app.adminResponse ? ` Admin Response: "${app.adminResponse}"` : '';
  database.notifications.unshift({
    id: 'notif_app_rev_' + Date.now(),
    targetUserId: app.staffId,
    title: `Your ${app.type} Application Was ${status.toUpperCase()}`,
    message: `Your ${app.type} application for dates ${app.startDate} to ${app.endDate} was ${status} by ${req.user!.name}.${responseText}`,
    type: status === 'approved' ? 'staff' : 'system',
    timestamp: Date.now(),
    timeAgo: 'Just now',
    readBy: [],
    linkTab: 'applications',
  });

  db.save();
  res.json({ success: true, message: `Application ${status} successfully.`, application: app });
});

// Delete application
router.delete('/applications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const database = db.get();
  database.applications = Array.isArray(database.applications) ? database.applications : [];
  const app = database.applications.find(a => a.id === id);

  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  // Only admin or the applicant themselves can delete
  if (!req.isAdmin && app.staffId !== req.user!.id) {
    return res.status(403).json({ error: 'Not authorized to delete this application.' });
  }

  database.applications = database.applications.filter(a => a.id !== id);
  db.save();
  res.json({ success: true, message: 'Application deleted successfully.' });
});

// ----------------------------------------
// SYSTEM SETTINGS & WORKING RESET
// ----------------------------------------

// System Reset (Admin only - Requirement 8 & 9)
router.post('/system/reset', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const resetData = db.resetAll();
  res.json({
    success: true,
    message: 'System successfully reset to clean default state with the 3 authorized accounts.',
    data: {
      staffCount: resetData.staff.length,
      attendanceCount: resetData.attendance.length,
      announcementsCount: resetData.announcements.length,
    },
  });
});

export default router;
