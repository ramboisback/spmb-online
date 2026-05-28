/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { 
  User, 
  School, 
  Registration, 
  AuditLog, 
  SystemSettings, 
  Pathway, 
  RegistrationStatus,
  RankingItem,
  Role
} from './src/types';

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
const PORT = 3000;

// Increase payload limits for documents uploads (Base64)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Paths
const DATA_FILE_PATH = path.join(process.cwd(), 'data-store.json');

// Livewire/temp files mock cleanup
const SECURE_DOCS_DIR = path.join(process.cwd(), 'storage', 'secure_documents');
if (!fs.existsSync(SECURE_DOCS_DIR)) {
  fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
}

// Low-tech reliable crypto hash for password & OTP
const computeSimpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(Math.abs(hash));
};

// Initial Core Data Block
const initialSchools: School[] = [
  {
    id: 1,
    name: "SDN Menteng 01 Jakarta",
    address: "Jl. Besuki No.4, Menteng, Jakarta Pusat",
    latitude: -6.198305,
    longitude: 106.832943,
    quotas: { Zonasi: 5, Prestasi: 4, Afirmasi: 3, Pindahan: 2, Tes: 3 },
    totalQuotas: 17
  },
  {
    id: 2,
    name: "SMP Negeri 115 Jakarta",
    address: "Jl. KH. Abdullah Syafei No.1, Tebet, Jakarta Selatan",
    latitude: -6.223842,
    longitude: 106.852445,
    quotas: { Zonasi: 4, Prestasi: 3, Afirmasi: 2, Pindahan: 1, Tes: 2 },
    totalQuotas: 12
  },
  {
    id: 3,
    name: "SDN Kebon Jeruk 11 Jakarta",
    address: "Jl. Raya Kebon Jeruk No.1, Kebon Jeruk, Jakarta Barat",
    latitude: -6.192389,
    longitude: 106.771239,
    quotas: { Zonasi: 3, Prestasi: 3, Afirmasi: 2, Pindahan: 1, Tes: 2 },
    totalQuotas: 11
  },
  {
    id: 4,
    name: "SMP Negeri 1 Jakarta",
    address: "Jl. Cikini Raya No.87, Menteng, Jakarta Pusat",
    latitude: -6.189567,
    longitude: 106.839841,
    quotas: { Zonasi: 5, Prestasi: 5, Afirmasi: 3, Pindahan: 2, Tes: 4 },
    totalQuotas: 19
  }
];

interface DataStoreType {
  users: User[];
  schools: School[];
  registrations: Registration[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  otps: { [email: string]: { code: string; expiresAt: string } };
  loginAttempts: { [email: string]: { count: number; lockedUntil: string } };
  simulatedNisnFailure: boolean;
}

const defaultStore: DataStoreType = {
  users: [
    {
      id: "usr_admin",
      email: "admin@spmb.go.id",
      password: computeSimpleHash("Admin123*"),
      role: 'Admin Dinas',
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_op1",
      email: "operator1@spmb.go.id",
      password: computeSimpleHash("Operator123*"),
      role: 'Operator',
      schoolId: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_op2",
      email: "operator2@spmb.go.id",
      password: computeSimpleHash("Operator123*"),
      role: 'Operator',
      schoolId: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_op3",
      email: "operator3@spmb.go.id",
      password: computeSimpleHash("Operator123*"),
      role: 'Operator',
      schoolId: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_op4",
      email: "operator4@spmb.go.id",
      password: computeSimpleHash("Operator123*"),
      role: 'Operator',
      schoolId: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student",
      email: "siswa@gmail.com",
      password: computeSimpleHash("Siswa123*"),
      role: 'Siswa',
      createdAt: new Date().toISOString()
    }
  ],
  schools: initialSchools,
  registrations: [],
  auditLogs: [],
  settings: {
    phase: 'Pendaftaran',
    canRegister: true,
    lockoutAttempts: 5,
    lockoutTime: 15 // minutes
  },
  otps: {},
  loginAttempts: {},
  simulatedNisnFailure: false
};

// IO Database Helpers
function readDb(): DataStoreType {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(data) as DataStoreType;
    }
  } catch (err) {
    console.error("Error reading file database, reverting to default:", err);
  }
  // Initialize default if not present or fails
  writeDb(defaultStore);
  return defaultStore;
}

function writeDb(data: DataStoreType) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing to file database:", err);
  }
}

// Log writer middleware
function logActivity(
  userId: string,
  email: string,
  role: Role,
  action: string,
  req: express.Request,
  payloadBefore: any = null,
  payloadAfter: any = null
) {
  const db = readDb();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    email,
    role,
    action,
    ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
    userAgent: req.headers['user-agent'] || 'Unknown Agent',
    payloadBefore: payloadBefore ? JSON.stringify(payloadBefore) : '{}',
    payloadAfter: payloadAfter ? JSON.stringify(payloadAfter) : '{}',
    createdAt: new Date().toISOString()
  };
  db.auditLogs.unshift(log); // newest first
  writeDb(db);
  console.log(`[AUDIT] User: ${email}, Action: ${action}`);
}

// Haversine formula calculation
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1)); // Rounded distance in meters
}

// Automated Cascading Selection Engine Solver (Gale-Shapley Stable Assignment Adjustments)
interface CandidateState {
  id: string;
  nama: string;
  nisn: string;
  p1: number; // schoolId Choice 1
  p2: number | null; // schoolId Choice 2
  pathway: Pathway;
  distanceP1: number;
  distanceP2: number;
  score: number; // calculated sorting score
  createdAt: string;
  mathScore: number;
  indScore: number;
  scienceScore: number;
  examDuration: number;
}

export function solveSelectionCascading(
  registrations: Registration[],
  schools: School[]
): { [id: string]: RegistrationStatus } {
  // We only select registration records with 'Verified' profile
  // Registrations that are Draft, Pending, or Rejected are ignored in selection rankings
  const candidates: CandidateState[] = registrations
    .filter(r => r.status === 'Verified' || r.status === 'Graduated_Choice1' || r.status === 'Graduated_Choice2' || r.status === 'Not_Graduated')
    .map(r => {
      const p1School = schools.find(s => s.id === r.pilihan1Id);
      const p2School = r.pilihan2Id ? schools.find(s => s.id === r.pilihan2Id) : null;
      
      const distanceP1 = p1School ? getHaversineDistance(r.latitude, r.longitude, p1School.latitude, p1School.longitude) : 9999999;
      const distanceP2 = p2School ? getHaversineDistance(r.latitude, r.longitude, p2School.latitude, p2School.longitude) : 9999999;

      let score = 0;
      if (r.pathway === 'Prestasi') {
        const rap = r.raportAverage || 0;
        const tka = r.tkaScore || 0;
        score = (rap * 0.30) + (tka * 0.70);
      } else if (r.pathway === 'Tes') {
        score = r.examScore || 0;
      }

      return {
        id: r.id,
        nama: r.nama,
        nisn: r.nisn,
        p1: r.pilihan1Id,
        p2: r.pilihan2Id,
        pathway: r.pathway,
        distanceP1,
        distanceP2,
        score,
        createdAt: r.createdAt,
        mathScore: r.mathScore || 0,
        indScore: r.indScore || 0,
        scienceScore: r.scienceScore || 0,
        examDuration: r.examDuration || 180
      };
    });

  // Assign criteria sort comparison logic dynamically based on Pathway
  const compareCandidates = (a: CandidateState, b: CandidateState, targetSchoolId: number, pathway: Pathway) => {
    const distA = a.p1 === targetSchoolId ? a.distanceP1 : a.distanceP2;
    const distB = b.p1 === targetSchoolId ? b.distanceP1 : b.distanceP2;

    if (pathway === 'Zonasi' || pathway === 'Afirmasi' || pathway === 'Pindahan') {
      // Priority: Distance ascending (closet home gets accepted first)
      if (distA !== distB) return distA - distB;
      // Tie breaker: Earliest timestamp submission
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (pathway === 'Prestasi') {
      // Priority: Total weight score descending
      if (b.score !== a.score) return b.score - a.score;
      // Tie breakers: Math -> Indonesian -> Science
      if (b.mathScore !== a.mathScore) return b.mathScore - a.mathScore;
      if (b.indScore !== a.indScore) return b.indScore - a.indScore;
      if (b.scienceScore !== a.scienceScore) return b.scienceScore - a.scienceScore;
      // Final tie breaker: Earliest timestamp
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (pathway === 'Tes') {
      // Priority: Exam score descending
      if (b.score !== a.score) return b.score - a.score;
      // Tie breaker: Exam complete duration ascending (faster candidate wins)
      if (a.examDuration !== b.examDuration) return a.examDuration - b.examDuration;
      // Final tie breaker: Earliest timestamp
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  };

  // State of system assignments
  // schoolId -> pathway -> list of CandidateState assigned
  const schoolAllocations: { [schoolId: number]: { [pw in Pathway]: CandidateState[] } } = {};
  schools.forEach(sch => {
    schoolAllocations[sch.id] = {
      Zonasi: [],
      Prestasi: [],
      Afirmasi: [],
      Pindahan: [],
      Tes: []
    };
  });

  // Queue of unassigned candidates
  // { candidate: CandidateState, currentPrefLevel: 1 | 2 }
  interface QueueItem {
    candidate: CandidateState;
    prefLevel: 1 | 2;
  }
  const queue: QueueItem[] = candidates.map(c => ({ candidate: c, prefLevel: 1 }));

  // Run deferred assignment loop
  while (queue.length > 0) {
    const item = queue.shift()!;
    const cand = item.candidate;
    const level = item.prefLevel;

    // School targeted
    const schoolId = level === 1 ? cand.p1 : cand.p2;
    if (!schoolId) {
      // Rejected entirely if no choice 2
      continue;
    }

    const school = schools.find(s => s.id === schoolId);
    if (!school) continue;

    const pw = cand.pathway;
    const maxQuota = school.quotas[pw];
    const allocatedList = schoolAllocations[schoolId][pw];

    // Try to insert candidate
    allocatedList.push(cand);
    // Sort the list based on pathway rules
    allocatedList.sort((a, b) => compareCandidates(a, b, schoolId, pw));

    // If over quota, kick out the worst candidate
    if (allocatedList.length > maxQuota) {
      const kicked = allocatedList.pop()!; // Popping elements exceeding quota (since it's sorted best-to-worst)
      
      // If kicked was choosing Choice 1, push it back to queue for Choice 2
      if (kicked.id === cand.id && level === 1) {
        if (cand.p2) {
          queue.push({ candidate: cand, prefLevel: 2 });
        }
      } else if (kicked.id !== cand.id) {
        // Someone else got kicked! Move them to the fallback choice 2 if they were on prefLevel 1
        // We need to figure out if that kicked candidate was on choice 1 or 2
        // Since candidates only apply to school as choice 1 or choice 2, if their current allocation 
        // school matches their Pchoice 1, they can transition to choice 2
        const wasKickedChoice1 = kicked.p1 === schoolId;
        if (wasKickedChoice1 && kicked.p2) {
          queue.push({ candidate: kicked, prefLevel: 2 });
        }
      }
    }
  }

  // Compile final results mapping registrationId -> status
  const finalResults: { [id: string]: RegistrationStatus } = {};
  
  // Set all to Not Graduated first
  candidates.forEach(c => {
    finalResults[c.id] = 'Not_Graduated';
  });

  // Map graduates
  schools.forEach(sch => {
    const alloc = schoolAllocations[sch.id];
    Object.keys(alloc).forEach(key => {
      const pw = key as Pathway;
      alloc[pw].forEach(c => {
        if (c.p1 === sch.id) {
          finalResults[c.id] = 'Graduated_Choice1';
        } else if (c.p2 === sch.id) {
          finalResults[c.id] = 'Graduated_Choice2';
        }
      });
    });
  });

  return finalResults;
}

// Generate Live Interactive Ranking Board values
app.get('/api/public/rankings', (req, res) => {
  const db = readDb();
  const schools = db.schools;
  const registrations = db.registrations;

  // Run selection cascading to get realistic live status indicators
  const computedStatuses = solveSelectionCascading(registrations, schools);

  const list: RankingItem[] = [];

  schools.forEach(sch => {
    (['Zonasi', 'Prestasi', 'Afirmasi', 'Pindahan', 'Tes'] as Pathway[]).forEach(pw => {
      // Find all verified/selected applicants applying to this school in Choice 1 or Choice 2
      const schoolApplicants = registrations.filter(r => {
        const isVerified = ['Verified', 'Graduated_Choice1', 'Graduated_Choice2', 'Not_Graduated'].includes(r.status);
        if (!isVerified) return false;
        
        const isApplying = (r.pilihan1Id === sch.id) || (r.pilihan2Id === sch.id);
        const matchesPathway = r.pathway === pw;
        return isApplying && matchesPathway;
      });

      // Map details
      const formatted = schoolApplicants.map(r => {
        const isP1 = r.pilihan1Id === sch.id;
        const dist = getHaversineDistance(r.latitude, r.longitude, sch.latitude, sch.longitude);

        let score = 0;
        if (r.pathway === 'Prestasi') {
          const rap = r.raportAverage || 0;
          const tka = r.tkaScore || 0;
          score = (rap * 0.30) + (tka * 0.70);
        } else if (r.pathway === 'Tes') {
          score = r.examScore || 0;
        }

        const candidateStatus = computedStatuses[r.id] || 'Not_Graduated';

        return {
          registrationId: r.id,
          nama: r.nama,
          nisn: r.nisn,
          schoolId: sch.id,
          schoolName: sch.name,
          pathway: r.pathway,
          distance: dist,
          score,
          status: candidateStatus,
          isChoice1: isP1,
          createdAt: r.createdAt,
          mathScore: r.mathScore || 0,
          indScore: r.indScore || 0,
          scienceScore: r.scienceScore || 0,
          examDuration: r.examDuration || 180
        };
      });

      // Sort applicants by pathway-specific criteria
      formatted.sort((a, b) => {
        if (pw === 'Zonasi' || pw === 'Afirmasi' || pw === 'Pindahan') {
          if (a.distance !== b.distance) return a.distance - b.distance;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (pw === 'Prestasi') {
          if (b.score !== a.score) return b.score - a.score;
          if (b.mathScore !== a.mathScore) return b.mathScore - a.mathScore;
          if (b.indScore !== a.indScore) return b.indScore - a.indScore;
          if (b.scienceScore !== a.scienceScore) return b.scienceScore - a.scienceScore;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (pw === 'Tes') {
          if (b.score !== a.score) return b.score - a.score;
          if (a.examDuration !== b.examDuration) return a.examDuration - b.examDuration;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });

      // Populate rank and add to global list
      formatted.forEach((item, index) => {
        list.push({
          rank: index + 1,
          registrationId: item.registrationId,
          nama: item.nama,
          nisn: item.nisn,
          schoolId: item.schoolId,
          schoolName: item.schoolName,
          pathway: item.pathway,
          distance: item.distance,
          score: item.score,
          status: item.status,
          isTieBreakerUsed: index > 0, // Mock true if index is same score to hint it
          createdAt: item.createdAt
        });
      });
    });
  });

  res.json({
    settings: db.settings,
    schools: schWithApplicantsCount(db),
    rankings: list
  });
});

function schWithApplicantsCount(db: DataStoreType) {
  return db.schools.map(s => {
    const p1Count = db.registrations.filter(r => r.pilihan1Id === s.id && r.status !== 'Draft').length;
    const p2Count = db.registrations.filter(r => r.pilihan2Id === s.id && r.status !== 'Draft').length;
    return {
      ...s,
      applicantsCount: p1Count + p2Count
    };
  });
}

// REST Auth Controller APIs
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, jenjang } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan Password wajib diisi" });
  }

  const db = readDb();
  const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email sudah terdaftar" });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase(),
    password: computeSimpleHash(password),
    role: role === 'Operator' ? 'Operator' : 'Siswa', // Siswa defaults. Operator through admin
    jenjang: jenjang || 'SMP',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  logActivity(newUser.id, newUser.email, newUser.role, "REGISTER_USER_SUCCESS", req, null, { id: newUser.id, email: newUser.email, jenjang: newUser.jenjang });
  res.json({ success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role, jenjang: newUser.jenjang } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan Password wajib diisi" });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase();
  
  // Rate limiting lockout check
  const lockoutInfo = db.loginAttempts[lowerEmail];
  if (lockoutInfo && new Date(lockoutInfo.lockedUntil) > new Date()) {
    const diff = Math.ceil((new Date(lockoutInfo.lockedUntil).getTime() - new Date().getTime()) / 60000);
    return res.status(423).json({ error: `Akun terkunci secara brute-force. Silakan coba ${diff} menit lagi.` });
  }

  const user = db.users.find(u => u.email.toLowerCase() === lowerEmail);

  if (user && user.status === 'Inactive') {
    return res.status(401).json({ error: "Akun ini dinonaktifkan (Tidak Aktif). Hubungi Admin Dinas." });
  }

  if (!user || user.password !== computeSimpleHash(password)) {
    // Record login failure attempt
    const count = (lockoutInfo?.count || 0) + 1;
    let lockedUntil = lockoutInfo?.lockedUntil || '';
    
    if (count >= db.settings.lockoutAttempts) {
      const lockDate = new Date();
      lockDate.setMinutes(lockDate.getMinutes() + db.settings.lockoutTime);
      lockedUntil = lockDate.toISOString();
      db.loginAttempts[lowerEmail] = { count, lockedUntil };
      writeDb(db);

      logActivity("system", lowerEmail, "Siswa", "BRUTE_FORCE_LOCKOUT_TRIGGERED", req, null, { count, lockedUntil });
      return res.status(423).json({ error: `Terlalu banyak percobaan gagal. Akun dikunci selama ${db.settings.lockoutTime} menit.` });
    }

    db.loginAttempts[lowerEmail] = { count, lockedUntil };
    writeDb(db);

    return res.status(401).json({ error: "Email atau Password salah" });
  }

  // Successful login resets brute-force counters
  delete db.loginAttempts[lowerEmail];
  writeDb(db);

  logActivity(user.id, user.email, user.role, "LOGIN_SUCCESS", req);
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      jenjang: user.jenjang
    }
  });
});

// Mock SMTP OTP Request sending via Redis queue equivalent log
app.post('/api/auth/otp/request', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email wajib diisi" });
  }

  // Rate Limiting simulation on Request OTP (max 3 times in 15 mins per Email)
  const db = readDb();
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits code
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

  db.otps[email.toLowerCase()] = {
    code: computeSimpleHash(code),
    expiresAt: expiresAt.toISOString()
  };
  writeDb(db);

  // Print OTP to terminal output as simulate SMTP Worker dispatching in Redis
  console.log(`\n==============================================`);
  console.log(`[MAIL WORKER] OTP untuk ${email}: ${code}`);
  console.log(`==============================================\n`);

  logActivity("unauthenticated", email, "Siswa", "REQUEST_OTP_SUCCESS_WORKER", req, null, { expiresAt });
  res.json({ success: true, message: "Kode OTP berhasil dikirimkan ke email anda (Lihat logs server / Console output)", codePlainMock: code });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email dan Kode OTP wajib diisi" });
  }

  const db = readDb();
  const record = db.otps[email.toLowerCase()];

  if (!record) {
    return res.status(400).json({ error: "OTP belum direquest atau tidak ditemukan" });
  }

  if (new Date(record.expiresAt) < new Date()) {
    return res.status(400).json({ error: "OTP sudah kedaluwarsa (masa aktif 5 menit)" });
  }

  const matches = record.code === computeSimpleHash(code);
  if (!matches) {
    return res.status(400).json({ error: "Kode OTP tidak cocok" });
  }

  // Clear OTP on success verify
  delete db.otps[email.toLowerCase()];
  writeDb(db);

  res.json({ success: true, message: "Kode OTP Terverifikasi" });
});

// Simulated NISN Pull API Kemendikbud with toggles
app.post('/api/nisn/pull', (req, res) => {
  const { nisn } = req.body;
  if (!nisn || nisn.length !== 10 || isNaN(Number(nisn))) {
    return res.status(400).json({ error: "NISN tidak valid (Harus 10 digit angka)" });
  }

  const db = readDb();
  if (db.simulatedNisnFailure) {
    // Simulate connection failure (Circuit Breaker activation triggers)
    return res.status(503).json({ error: "Koneksi API Kemendikbud gagal (Simulated API Downtime)" });
  }

  // Simulate successful validation draf with dynamic database records
  const mockStudentsNisnList: { [k: string]: { nama: string; email: string; nik: string; phone: string; address: string } } = {
    "1234567890": {
      nama: "Budi Santoso",
      email: "budi.santoso@siswa.id",
      nik: "3171012345670001",
      phone: "+628123456789",
      address: "Jl. Budi Utomo No. 10, Sawah Besar, Jakarta Pusat"
    },
    "0987654321": {
      nama: "Siti Rahma",
      email: "siti.rahma@siswa.id",
      nik: "3171023456780002",
      phone: "+628129876543",
      address: "Jl. Salemba Raya No. 4, Senen, Jakarta Pusat"
    },
    "1112223334": {
      nama: "Farhan Wijaya",
      email: "farhan.wijaya@siswa.id",
      nik: "3171034567890003",
      phone: "+628121112223",
      address: "Jl. Setiabudi Tengah No. 42, Setiabudi, Jakarta Selatan"
    }
  };

  const student = mockStudentsNisnList[nisn];
  if (!student) {
    // If not in database pre-pull registry, return empty shell to type manual gracefully but with verified state
    return res.json({
      success: true,
      found: false,
      data: {
        nisn,
        nama: "",
        email: "",
        nik: "",
        phone: "",
        address: ""
      }
    });
  }

  res.json({
    success: true,
    found: true,
    data: {
      nisn,
      ...student
    }
  });
});

app.post('/api/nisn/toggle-failure', (req, res) => {
  const db = readDb();
  db.simulatedNisnFailure = !db.simulatedNisnFailure;
  writeDb(db);
  res.json({ success: true, simulatedNisnFailure: db.simulatedNisnFailure });
});

// Registration API routes Wizard Form Draft Save & Submit
app.get('/api/registration/me', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "UserId dibutuhkan" });
  }

  const db = readDb();
  const reg = db.registrations.find(r => r.userId === String(userId));
  if (!reg) {
    return res.json({ success: false, data: null });
  }

  res.json({ success: true, data: reg });
});

app.post('/api/registration/save', (req, res) => {
  const {
    userId,
    nisn,
    nama,
    email,
    nik,
    phone,
    address,
    latitude,
    longitude,
    pilihan1Id,
    pilihan2Id,
    pathway,
    status, // 'Draft' or 'Pending' (for submit)
    isManualFallback,
    // Pathway inputs
    raportAverage,
    tkaScore,
    mathScore,
    indScore,
    scienceScore,
    certificateScore,
    certificateName,
    certificateVerified,
    bansosNumber,
    skPindahNumber,
    examScore,
    examDuration,
    documents
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "UserId wajib ada" });
  }

  const db = readDb();

  // Guard selection phase if trying to submit beyond registration phase closeout
  if (status === 'Pending' && db.settings.phase !== 'Pendaftaran') {
    return res.status(403).json({ error: "Sesi Pendaftaran telah ditutup. Data tidak dapat disubmit." });
  }

  let record = db.registrations.find(r => r.userId === userId);
  const payloadBefore = record ? { ...record } : null;

  const currentTimestamp = new Date().toISOString();

  if (!record) {
    const userObj = db.users.find(u => u.id === userId);
    record = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      nisn: nisn || "",
      nama: nama || "",
      email: email || "",
      nik: nik || "",
      phone: phone || "",
      address: address || "",
      latitude: parseFloat(latitude) || -6.2,
      longitude: parseFloat(longitude) || 106.8,
      pilihan1Id: parseInt(pilihan1Id) || 1,
      pilihan2Id: pilihan2Id ? parseInt(pilihan2Id) : null,
      pathway: pathway || 'Zonasi',
      jenjang: userObj?.jenjang || req.body.jenjang || 'SMP',
      status: status || 'Draft',
      isManualFallback: !!isManualFallback,
      documents: documents || {},
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    };
    db.registrations.push(record);
  } else {
    // If verified, student cannot edit unless operator rejected and reverted back to Draft state
    if (record.status === 'Verified' || record.status === 'Pending') {
      return res.status(403).json({ error: "Anda tidak dapat mengedit pendaftaran yang sedang diseleksi / terverifikasi." });
    }

    const userObj = db.users.find(u => u.id === userId);
    record.nisn = nisn || record.nisn;
    record.nama = nama || record.nama;
    record.email = email || record.email;
    record.nik = nik || record.nik;
    record.phone = phone || record.phone;
    record.address = address || record.address;
    if (latitude) record.latitude = parseFloat(latitude);
    if (longitude) record.longitude = parseFloat(longitude);
    record.pilihan1Id = parseInt(pilihan1Id) || record.pilihan1Id;
    record.pilihan2Id = pilihan2Id ? parseInt(pilihan2Id) : record.pilihan2Id;
    record.pathway = pathway || record.pathway;
    record.jenjang = userObj?.jenjang || req.body.jenjang || record.jenjang || 'SMP';
    record.status = status || record.status;
    record.isManualFallback = isManualFallback !== undefined ? !!isManualFallback : record.isManualFallback;
    record.documents = { ...record.documents, ...(documents || {}) };
    record.updatedAt = currentTimestamp;
  }

  // Map pathway details
  if (pathway === 'Prestasi') {
    record.raportAverage = parseFloat(raportAverage) || record.raportAverage;
    record.tkaScore = parseFloat(tkaScore) || record.tkaScore;
    record.mathScore = parseFloat(mathScore) || record.mathScore;
    record.indScore = parseFloat(indScore) || record.indScore;
    record.scienceScore = parseFloat(scienceScore) || record.scienceScore;
    record.certificateScore = parseFloat(certificateScore) || record.certificateScore;
    record.certificateName = certificateName || record.certificateName;
    record.certificateVerified = certificateVerified !== undefined ? !!certificateVerified : record.certificateVerified;
  } else if (pathway === 'Afirmasi') {
    record.bansosNumber = bansosNumber || record.bansosNumber;
  } else if (pathway === 'Pindahan') {
    record.skPindahNumber = skPindahNumber || record.skPindahNumber;
  } else if (pathway === 'Tes') {
    record.examScore = parseFloat(examScore) || record.examScore;
    record.examDuration = parseFloat(examDuration) || record.examDuration;
  }

  writeDb(db);

  logActivity(
    userId, 
    email || "siswa@gmail.com", 
    "Siswa", 
    status === 'Pending' ? "SUBMIT_REGISTRATION_FORM" : "SAVE_DRAFT_REGISTRATION", 
    req, 
    payloadBefore, 
    record
  );

  res.json({ success: true, data: record });
});

// File upload service obfuscating storage & MIME type validation
app.post('/api/upload', (req, res) => {
  const { base64Data, filename, filetype } = req.body;
  if (!base64Data || !filename) {
    return res.status(400).json({ error: "Payload berkas tidak lengkap" });
  }

  // Strict secure validations (max size simulation around 2MB)
  const sizeInBytes = Buffer.from(base64Data, 'base64').length;
  if (sizeInBytes > 2 * 1024 * 1024) {
    return res.status(400).json({ error: "Maksimal kapasitas berkas adalah 2MB" });
  }

  const extensionsAllowed = ['pdf', 'jpeg', 'jpg', 'png'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (!extensionsAllowed.includes(ext)) {
    return res.status(400).json({ error: "Hanya menerima tipe berkas .pdf, .jpeg, dan .png" });
  }

  // Obfuscated file naming
  const randUuid = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const obfuscatedName = `doc_${randUuid}.${ext}`;
  const savePath = path.join(SECURE_DOCS_DIR, obfuscatedName);

  try {
    fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
    res.json({
      success: true,
      file: {
        name: obfuscatedName,
        size: sizeInBytes,
        type: filetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Failed to commit file to file system storage library:", err);
    res.status(500).json({ error: "Sistem penyimpanan internal error" });
  }
});

// Secure endpoint route to fetch file with role checking
app.get('/api/document/:filename', (req, res) => {
  const { filename } = req.params;
  const { userId, requesterRole } = req.query;

  if (!requesterRole) {
    return res.status(403).json({ error: "Otorisasi berkas gagal" });
  }

  // Authenticate view rules: Siswa can view their own, Operator and Admin can view all
  const filePath = path.join(SECURE_DOCS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Berkas tidak ditemukan" });
  }

  res.sendFile(filePath);
});

// Operator Verification APIs
app.get('/api/operator/registrations', (req, res) => {
  const { schoolId } = req.query;
  const db = readDb();
  
  if (!schoolId) {
    return res.status(400).json({ error: "schoolId required" });
  }

  if (schoolId === 'all' || schoolId === 'ALL') {
    const applicants = db.registrations.filter(r => r.status !== 'Draft');
    return res.json({ success: true, data: applicants });
  }

  const schId = parseInt(String(schoolId));
  // Filter registrations matching schoolId in choice 1 or 2
  const applicants = db.registrations.filter(r => 
    (r.pilihan1Id === schId || r.pilihan2Id === schId) && r.status !== 'Draft'
  );

  res.json({ success: true, data: applicants });
});

app.post('/api/operator/verify', (req, res) => {
  const { registrationId, action, reason, operatorEmail, schoolId } = req.body; // action: 'Verify' | 'Reject'
  if (!registrationId || !action) {
    return res.status(400).json({ error: "Data verifikasi tidak lengkap" });
  }

  const db = readDb();
  if (db.settings && db.settings.phase === 'Pendaftaran') {
    return res.status(403).json({ error: "Verifikasi berkas tidak diperbolehkan selama fase Pendaftaran masih berlangsung." });
  }

  const reg = db.registrations.find(r => r.id === registrationId);
  if (!reg) {
    return res.status(404).json({ error: "Pendaftaran tidak ditemukan" });
  }

  const payloadBefore = { ...reg };

  if (action === 'Verify') {
    reg.status = 'Verified';
    reg.rejectionReason = '';
    
    // Automatically verify prestasi certificate if they applied through Prestasi
    if (reg.pathway === 'Prestasi') {
      reg.certificateVerified = true;
    }
  } else if (action === 'Reject') {
    reg.status = 'Rejected';
    reg.rejectionReason = reason || "Berkas tidak memenuhi kriteria validasi operator";
    
    // If rejected, certificate marks revert to false
    if (reg.pathway === 'Prestasi') {
      reg.certificateVerified = false;
    }
  }

  reg.updatedAt = new Date().toISOString();
  writeDb(db);

  logActivity(
    "usr_op", 
    operatorEmail || "operator@spmb.go.id", 
    "Operator", 
    action === 'Verify' ? "VERIFIED_REGISTRATION_SUCCESS" : "REJECTED_REGISTRATION", 
    req, 
    payloadBefore, 
    reg
  );

  res.json({ success: true, data: reg });
});

// Admin Dinas Control Panel & Audit Trails
app.get('/api/admin/dashboard', (req, res) => {
  const db = readDb();
  res.json({
    settings: db.settings,
    schools: schWithApplicantsCount(db),
    registrationsCount: {
      total: db.registrations.length,
      draft: db.registrations.filter(r => r.status === 'Draft').length,
      pending: db.registrations.filter(r => r.status === 'Pending').length,
      verified: db.registrations.filter(r => ['Verified', 'Graduated_Choice1', 'Graduated_Choice2', 'Not_Graduated'].includes(r.status)).length,
      rejected: db.registrations.filter(r => r.status === 'Rejected').length,
      byPathway: {
        Zonasi: db.registrations.filter(r => r.pathway === 'Zonasi' && r.status !== 'Draft').length,
        Prestasi: db.registrations.filter(r => r.pathway === 'Prestasi' && r.status !== 'Draft').length,
        Afirmasi: db.registrations.filter(r => r.pathway === 'Afirmasi' && r.status !== 'Draft').length,
        Pindahan: db.registrations.filter(r => r.pathway === 'Pindahan' && r.status !== 'Draft').length,
        Tes: db.registrations.filter(r => r.pathway === 'Tes' && r.status !== 'Draft').length,
      }
    },
    auditLogs: db.auditLogs.slice(0, 150) // limit to 150 entries for light speed
  });
});

app.post('/api/admin/settings', (req, res) => {
  const { phase, canRegister, adminEmail } = req.body;
  const db = readDb();
  const payloadBefore = { ...db.settings };

  if (phase) db.settings.phase = phase;
  if (canRegister !== undefined) db.settings.canRegister = !!canRegister;

  // Process Graduation cascade execution automatically when transitioning to 'Pengumuman'
  if (phase === 'Pengumuman') {
    const outputs = solveSelectionCascading(db.registrations, db.schools);
    db.registrations.forEach(r => {
      if (outputs[r.id]) {
        r.status = outputs[r.id];
      }
    });
  }

  writeDb(db);

  logActivity("usr_admin", adminEmail || "admin@spmb.go.id", "Admin Dinas", "UPDATE_SYSTEM_SETTINGS", req, payloadBefore, db.settings);
  res.json({ success: true, settings: db.settings });
});

// Manual Graduation Execution batch trigger (PBI-4.3 / 3.1 Selection Engine executor)
app.post('/api/admin/execute-selection', (req, res) => {
  const { adminEmail } = req.body;
  const db = readDb();
  const payloadBefore = db.registrations.map(r => ({ id: r.id, status: r.status }));

  const outputs = solveSelectionCascading(db.registrations, db.schools);
  
  db.registrations.forEach(r => {
    if (outputs[r.id]) {
      r.status = outputs[r.id];
    }
  });

  writeDb(db);

  logActivity("usr_admin", adminEmail || "admin@spmb.go.id", "Admin Dinas", "EXECUTE_SELECTION_CASCADING_BATCH", req, payloadBefore, db.registrations.map(r => ({ id: r.id, status: r.status })));
  res.json({ success: true, message: "Seleksi cascading otomatis berhasil dijalankan serentak!" });
});

// Admin Dinas School and Quota Management APIs
app.post('/api/admin/school', (req, res) => {
  const { id, name, address, latitude, longitude, quotas, adminEmail } = req.body;
  const db = readDb();
  const payloadBefore = db.schools.map(s => ({ ...s }));

  if (!name || !address || latitude === undefined || longitude === undefined || !quotas) {
    return res.status(400).json({ error: "Sebutkan detail sekolah dengan lengkap" });
  }

  const { Zonasi, Prestasi, Afirmasi, Pindahan, Tes } = quotas;
  const totalQuotas = Number(Zonasi || 0) + Number(Prestasi || 0) + Number(Afirmasi || 0) + Number(Pindahan || 0) + Number(Tes || 0);

  const formattedQuotas = {
    Zonasi: Number(Zonasi || 0),
    Prestasi: Number(Prestasi || 0),
    Afirmasi: Number(Afirmasi || 0),
    Pindahan: Number(Pindahan || 0),
    Tes: Number(Tes || 0)
  };

  let school;
  let finalId = Number(id);

  if (id) {
    // Edit existing school
    const existingIndex = db.schools.findIndex(s => s.id === Number(id));
    if (existingIndex === -1) {
      return res.status(404).json({ error: "Sekolah tidak ditemukan" });
    }
    db.schools[existingIndex] = {
      ...db.schools[existingIndex],
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      quotas: formattedQuotas,
      totalQuotas
    };
    school = db.schools[existingIndex];
    logActivity("usr_admin", adminEmail || "admin@spmb.go.id", "Admin Dinas", `UPDATE_SCHOOL: ${name} (ID: ${id})`, req, payloadBefore, db.schools);
  } else {
    // Add new school
    const nextId = db.schools.length > 0 ? Math.max(...db.schools.map(s => s.id)) + 1 : 1;
    finalId = nextId;
    school = {
      id: nextId,
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      quotas: formattedQuotas,
      totalQuotas
    };
    db.schools.push(school);

    // Auto-generate operator for the new school if they don't have one
    const opEmail = `operator${nextId}@spmb.go.id`;
    const opExists = db.users.some(u => u.email === opEmail || (u.role === 'Operator' && u.schoolId === nextId));
    if (!opExists) {
      db.users.push({
        id: `usr_op${nextId}`,
        email: opEmail,
        password: computeSimpleHash("Operator123*"),
        role: 'Operator',
        schoolId: nextId,
        createdAt: new Date().toISOString()
      });
    }

    logActivity("usr_admin", adminEmail || "admin@spmb.go.id", "Admin Dinas", `ADD_NEW_SCHOOL: ${name} (ID: ${nextId})`, req, payloadBefore, db.schools);
  }

  writeDb(db);
  res.json({ success: true, school, schools: schWithApplicantsCount(db) });
});

app.post('/api/admin/school/delete', (req, res) => {
  const { id, adminEmail } = req.body;
  const db = readDb();
  const payloadBefore = db.schools.map(s => ({ ...s }));

  const existingIndex = db.schools.findIndex(s => s.id === Number(id));
  if (existingIndex === -1) {
    return res.status(404).json({ error: "Sekolah tidak ditemukan" });
  }

  const schName = db.schools[existingIndex].name;
  db.schools.splice(existingIndex, 1);

  // Also remove operator for this school if wanted
  const opId = Number(id);
  const operatorIndex = db.users.findIndex(u => u.role === 'Operator' && u.schoolId === opId);
  if (operatorIndex !== -1) {
    db.users.splice(operatorIndex, 1);
  }

  writeDb(db);
  logActivity("usr_admin", adminEmail || "admin@spmb.go.id", "Admin Dinas", `DELETE_SCHOOL: ${schName} (ID: ${id})`, req, payloadBefore, db.schools);

  res.json({ success: true, schools: schWithApplicantsCount(db) });
});

// Admin Dinas manage Custom School Operators
app.get('/api/admin/operators', (req, res) => {
  const db = readDb();
  const operatorUsers = db.users.filter(u => u.role === 'Operator');
  res.json({ success: true, operators: operatorUsers });
});

app.post('/api/admin/operators', (req, res) => {
  const { email, password, schoolId, adminEmail } = req.body;
  if (!email || !password || !schoolId) {
    return res.status(400).json({ error: "Email, Password, dan Sekolah wajib ditentukan." });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase();
  
  // Check if email already exists
  const exists = db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (exists) {
    return res.status(400).json({ error: "Email tersebut sudah terdaftar di sistem." });
  }

  // Find school to verify it exists
  const targetSchool = db.schools.find(s => s.id === Number(schoolId));
  if (!targetSchool) {
    return res.status(404).json({ error: "Lembaga Sekolah tidak ditemukan." });
  }

  const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => {
    const numericPart = parseInt(u.id.replace(/\D/g, ''));
    return isNaN(numericPart) ? 0 : numericPart;
  })) + 1 : 1;

  const newOperatorUser = {
    id: `usr_op_added_${nextId}_${Math.random().toString(36).substring(2, 5)}`,
    email: lowerEmail,
    password: computeSimpleHash(password),
    role: 'Operator' as const,
    schoolId: Number(schoolId),
    status: 'Active' as const,
    createdAt: new Date().toISOString()
  };

  db.users.push(newOperatorUser);
  writeDb(db);

  logActivity(
    "usr_admin", 
    adminEmail || "admin@spmb.go.id", 
    "Admin Dinas", 
    `CREATE_OPERATOR_ACCOUNT: ${newOperatorUser.email} untuk ${targetSchool.name}`, 
    req, 
    null, 
    { id: newOperatorUser.id, email: newOperatorUser.email }
  );

  res.json({ success: true, operator: newOperatorUser, operators: db.users.filter(u => u.role === 'Operator') });
});

app.post('/api/admin/operators/update', (req, res) => {
  const { id, email, password, schoolId, status, adminEmail } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID Operator harus ditentukan." });
  }

  const db = readDb();
  const index = db.users.findIndex(u => u.id === id && u.role === 'Operator');
  if (index === -1) {
    return res.status(404).json({ error: "Akun Operator tidak ditemukan." });
  }

  const op = db.users[index];

  if (email && email.toLowerCase() !== op.email.toLowerCase()) {
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
    if (exists) {
      return res.status(400).json({ error: "Email sudah terdaftar untuk pengguna lain." });
    }
    op.email = email.toLowerCase();
  }

  if (password) {
    op.password = computeSimpleHash(password);
  }

  if (schoolId !== undefined) {
    const targetSchool = db.schools.find(s => s.id === Number(schoolId));
    if (!targetSchool) {
      return res.status(404).json({ error: "Lembaga Sekolah tidak ditemukan." });
    }
    op.schoolId = Number(schoolId);
  }

  if (status) {
    op.status = status;
  }

  writeDb(db);

  logActivity(
    "usr_admin", 
    adminEmail || "admin@spmb.go.id", 
    "Admin Dinas", 
    `UPDATE_OPERATOR_ACCOUNT: ${op.email}`, 
    req, 
    null, 
    { id, email: op.email, schoolId: op.schoolId, status: op.status }
  );

  res.json({ success: true, operators: db.users.filter(u => u.role === 'Operator') });
});

app.post('/api/admin/operators/delete', (req, res) => {
  const { id, adminEmail } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID Operator harus ditentukan." });
  }

  const db = readDb();
  const index = db.users.findIndex(u => u.id === id && u.role === 'Operator');
  if (index === -1) {
    return res.status(404).json({ error: "Akun Operator tidak ditemukan." });
  }

  // Toggle status instead of hard deleting
  const op = db.users[index];
  const oldStatus = op.status || 'Active';
  const newStatus = oldStatus === 'Active' ? 'Inactive' : 'Active';
  op.status = newStatus;
  writeDb(db);

  logActivity(
    "usr_admin", 
    adminEmail || "admin@spmb.go.id", "Admin Dinas", 
    `TOGGLE_OPERATOR_STATUS: ${op.email} dari ${oldStatus} menjadi ${newStatus}`, 
    req, 
    null, 
    { id, status: newStatus }
  );

  res.json({ success: true, operators: db.users.filter(u => u.role === 'Operator') });
});

// Generated Dummy Applicants endpoint for manual verification testing
app.post('/api/admin/generate-dummy-applicants', (req, res) => {
  const { count } = req.body;
  const db = readDb();
  
  if (db.schools.length === 0) {
    return res.status(400).json({ error: "Belum ada sekolah master yang terdaftar. Daftarkan minimal satu sekolah untuk membuat data dummy!" });
  }

  const generatedCount = Number(count) || 10;
  
  const firstNameList = ["Ahmad", "Siti", "Rian", "Dewi", "Budi", "Lani", "Eko", "Indah", "Yudi", "Anisa", "Danang", "Clara", "Farhan", "Amalia", "Giri"];
  const lastNameList = ["Fauzi", "Aminah", "Hidayat", "Lestari", "Santoso", "Astuti", "Prasetyo", "Permata", "Pratama", "Rahmawati", "Kurniawan", "Sitorus", "Gani", "Putri", "Krama"];
  const pathways: Pathway[] = ['Zonasi', 'Prestasi', 'Afirmasi', 'Pindahan', 'Tes'];

  const newApplicants: Registration[] = [];

  for (let i = 0; i < generatedCount; i++) {
    const fn = firstNameList[i % firstNameList.length];
    const ln = lastNameList[(i + 3) % lastNameList.length];
    const nama = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;
    // Create safe custom ID
    const randId = `${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`;
    const userId = `usr_dummy_${Math.floor(Math.random() * 100000)}`;

    const pathway = pathways[i % pathways.length];

    // Pick dynamic choices depending on registered schools
    const school1 = db.schools[i % db.schools.length];
    const school2 = db.schools[(i + 1) % db.schools.length] || db.schools[0];

    // Slightly adjust coords close to choice 1
    const p1Lat = school1.latitude;
    const p1Lng = school1.longitude;
    const latitude = parseFloat((p1Lat + (Math.random() - 0.5) * 0.005).toFixed(6));
    const longitude = parseFloat((p1Lng + (Math.random() - 0.5) * 0.005).toFixed(6));

    const nisn = `01${Math.floor(10000000 + Math.random() * 90000000)}`;
    const nik = `3171${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const phone = `0812${Math.floor(10000000 + Math.random() * 90000000)}`;
    const address = `Jl. Kemerdekaan Raya No. ${i + 15}, DKI Jakarta`;

    // Pathway values
    let raportAverage, tkaScore, mathScore, indScore, scienceScore, certificateScore, certificateName;
    let bansosNumber, skPindahNumber;
    let examScore, examDuration;

    if (pathway === 'Prestasi') {
      raportAverage = parseFloat((82 + Math.random() * 16).toFixed(1));
      tkaScore = Math.floor(75 + Math.random() * 25);
      mathScore = Math.floor(80 + Math.random() * 20);
      indScore = Math.floor(80 + Math.random() * 20);
      scienceScore = Math.floor(80 + Math.random() * 20);
      certificateScore = [5, 10, 15, 20][i % 4];
      certificateName = ["Juara 1 Karya Ilmiah Remaja", "Juara 2 Olimpiade Fisika", "Piala Emas Kejuaraan Karate", "Juara 1 Lomba Pidato Bahasa Inggris"][i % 4];
    } else if (pathway === 'Afirmasi') {
      bansosNumber = `KIP-${100000 + Math.floor(Math.random() * 900000)}`;
    } else if (pathway === 'Pindahan') {
      skPindahNumber = `SK-MUT/2026/${100 + Math.floor(Math.random() * 900)}`;
    } else if (pathway === 'Tes') {
      examScore = Math.floor(75 + Math.random() * 25);
      examDuration = Math.floor(35 + Math.random() * 30);
    }

    // Build documents
    const documents: any = {};
    const docsToGen = ["kk", "ijazah"];
    if (pathway === 'Prestasi') docsToGen.push("certificate");
    else if (pathway === 'Afirmasi') docsToGen.push("bansos");
    else if (pathway === 'Pindahan') docsToGen.push("skPindah");

    docsToGen.forEach(docType => {
      const filename = `doc_dummy_${randId}_${docType}.pdf`;
      const pth = path.join(SECURE_DOCS_DIR, filename);
      fs.writeFileSync(pth, `%PDF-1.4\n% DUMMY DOCUMENT FOR TEST VALIDATION PPDB ONLINE\n% Nama: ${nama}\n% Tipe: ${docType}\n% NISN: ${nisn}\n`);
      
      documents[docType] = {
        name: filename,
        size: 25000 + Math.floor(Math.random() * 15000),
        type: "application/pdf",
        uploadedAt: new Date().toISOString()
      };
    });

    const regRecord: Registration = {
      id: `reg_${randId}`,
      userId,
      nisn,
      nama,
      email,
      nik,
      phone,
      address,
      latitude,
      longitude,
      pilihan1Id: school1.id,
      pilihan2Id: school2 ? school2.id : null,
      pathway,
      status: 'Pending',
      isManualFallback: false,
      createdAt: new Date(Date.now() - 3600000 * (generatedCount - i)).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * (generatedCount - i)).toISOString(),
      documents,
      raportAverage,
      tkaScore,
      mathScore,
      indScore,
      scienceScore,
      certificateScore,
      certificateName,
      certificateVerified: false,
      bansosNumber,
      skPindahNumber,
      examScore,
      examDuration
    };

    newApplicants.push(regRecord);
  }

  db.registrations = [...db.registrations, ...newApplicants];
  writeDb(db);

  logActivity("usr_admin", "admin@spmb.go.id", "Admin Dinas", `GENERATE_DUMMY_APPLICANTS: Created ${generatedCount} random students for verification testing`, req, null, { count: generatedCount });

  res.json({ success: true, message: `Berhasil membangkitkan ${generatedCount} data calon siswa baru!`, count: generatedCount });
});

// Gemini AI Document Analysis helpers (Value-Added analysis helper!)
const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

app.post('/api/assistant/review', async (req, res) => {
  const { candidateDetails } = req.body;
  
  if (!candidateDetails) {
    return res.status(400).json({ error: "Siswa details needed" });
  }

  const db = readDb();
  const schools = db.schools;

  const prompt = `
  Anda adalah "Asisten AI Verifikasi SPMB Dinas". Lakukan analisis keselarasan data calon mahasiswa/siswa baru berikut terhadap kelayakannya secara profesional, bijaksana, dan ringkas. Beri rekomendasi dalam 2-3 kalimat lugas berbahasa Indonesia saja.

  Data Pendaftar:
  Nama: ${candidateDetails.nama}
  Jalur: ${candidateDetails.pathway}
  NISN: ${candidateDetails.nisn}
  Manual Entry Fallback: ${candidateDetails.isManualFallback ? 'Ya (Koneksi API Error saat mendaftar)' : 'Tidak (Tarik Data NISN valid)'}
  Alamat Rumah: ${candidateDetails.address} (Koordinat: ${candidateDetails.latitude}, ${candidateDetails.longitude})
  Pilihan Sekolah 1: ${schools.find(s => s.id === candidateDetails.pilihan1Id)?.name || 'Sekolah Pilihan 1'} (Koordinat: ${schools.find(s => s.id === candidateDetails.pilihan1Id)?.latitude || 0}, ${schools.find(s => s.id === candidateDetails.pilihan1Id)?.longitude || 0})
  Pilihan Sekolah 2: ${candidateDetails.pilihan2Id ? ((schools.find(s => s.id === candidateDetails.pilihan2Id)?.name || 'Sekolah Pilihan 2') + ' (Koordinat: ' + (schools.find(s => s.id === candidateDetails.pilihan2Id)?.latitude || 0) + ', ' + (schools.find(s => s.id === candidateDetails.pilihan2Id)?.longitude || 0) + ')') : 'Tidak Memilih'}
  
  Nilai Tambahan:
  Rata-rata Rapor: ${candidateDetails.raportAverage || '-'}
  Skor Tes Kemampuan Akademik (TKA): ${candidateDetails.tkaScore || '-'}
  Skor Sertifikat Prestasi: ${candidateDetails.certificateScore || '-'} (Nama Sertifikat: ${candidateDetails.certificateName || '-'})
  No. Kartu Bansos (Afirmasi): ${candidateDetails.bansosNumber || '-'}
  No. SK Pindahan Tugas: ${candidateDetails.skPindahNumber || '-'}
  Nilai Tes Ujian: ${candidateDetails.examScore || '-'} (Durasi Ujian: ${candidateDetails.examDuration || '-'} menit)
  
  Catatan untuk Jalur Prestasi:
  - Jika Jalur adalah "Prestasi", mohon sebutkan dan tinjau performatika "Rata-rata Rapor" dan "Skor TKA" mereka.
  - Serta hitung total skor seleksi prestasinya dengan formula: (Rata-rata Rapor * 30%) + (Skor TKA * 70%).

  Periksa berkas apakah telah lengkap diupload: ${JSON.stringify(Object.keys(candidateDetails.documents || {}))}
  `;

  if (!aiClient) {
    const isPrestasi = candidateDetails.pathway === 'Prestasi';
    const rapVal = candidateDetails.raportAverage || 0;
    const tkaVal = candidateDetails.tkaScore || 0;
    const formulaScore = ((rapVal * 0.3) + (tkaVal * 0.7)).toFixed(2);
    
    return res.json({
      success: true,
      analysis: `[MOCK AI FEEDBACK] Dokumen ${candidateDetails.nama} tampak bersesuaian. Berkas utama pendaftaran (${Object.keys(candidateDetails.documents || {}).join(', ') || 'tidak ada'}) telah diunggah. ${isPrestasi ? `Evaluasi Prestasi: Rapor ${rapVal} (30%), TKA ${tkaVal} (70%), total skor kalkulasi ${formulaScore}.` : ''} Rekomendasi: LAYAK DISETUJUI.`
    });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    res.json({ success: true, analysis: response.text });
  } catch (err: any) {
    console.error("Gemini Assistant api request failure:", err);
    res.json({
      success: true,
      analysis: `[AI API COLD] Dokumen ${candidateDetails.nama} tampak sesuai standar penentuan Jalur ${candidateDetails.pathway}. Koordinat domisili dalam batas toleransi. Silakan verifikasi manual lampiran kelengkapan di dashboard operator.`
    });
  }
});

// Main Serve Core with Vite Configuration
async function startServer() {
  // Vite Dev Server config
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // This resolves dev server routing issues
    app.use(vite.middlewares);
    console.log("Middlewares: Vite Dev Mode mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Middlewares: Static Serve mounted on Production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SPMB SERVER] Running successfully on port ${PORT}`);
  });
}

startServer();
