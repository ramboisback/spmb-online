/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Siswa' | 'Operator' | 'Admin Dinas';

export type Pathway = 'Zonasi' | 'Prestasi' | 'Afirmasi' | 'Pindahan' | 'Tes';

export type RegistrationStatus =
  | 'Draft'
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'Graduated_Choice1'
  | 'Graduated_Choice2'
  | 'Not_Graduated';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  schoolId?: number; // Null for Siswa & Admin Dinas, set for Operator
  jenjang?: 'SD' | 'SMP';
  status?: 'Active' | 'Inactive';
  createdAt: string;
}

export interface School {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  quotas: {
    Zonasi: number;
    Prestasi: number;
    Afirmasi: number;
    Pindahan: number;
    Tes: number;
  };
  totalQuotas: number;
}

export interface DocumentUpload {
  name: string;
  size: number;
  type: string;
  base64Data: string;
  uploadedAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  nisn: string;
  nama: string;
  email: string;
  nik: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  jenjang?: 'SD' | 'SMP';
  
  pilihan1Id: number;
  pilihan2Id: number | null;
  pathway: Pathway;
  
  // Pathway-Specific Data
  raportAverage?: number; // Prestasi
  tkaScore?: number; // Prestasi (Tes Kemampuan Akademik)
  mathScore?: number; // Prestasi
  indScore?: number; // Prestasi
  scienceScore?: number; // Prestasi
  certificateScore?: number; // Prestasi
  certificateName?: string; // Prestasi
  certificateVerified?: boolean; // Prestasi
  
  bansosNumber?: string; // Afirmasi
  skPindahNumber?: string; // Pindahan
  examScore?: number; // Tes
  examDuration?: number; // Tes (in minutes)
  
  // Documents
  documents: {
    kk?: DocumentUpload;
    ijazah?: DocumentUpload;
    certificate?: DocumentUpload;
    bansos?: DocumentUpload;
    skPindah?: DocumentUpload;
  };
  
  status: RegistrationStatus;
  rejectionReason?: string;
  isManualFallback: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  email: string;
  role: Role;
  action: string;
  ip: string;
  userAgent: string;
  payloadBefore: string; // JSON String
  payloadAfter: string;  // JSON String
  createdAt: string;
}

export interface SystemSettings {
  phase: 'Pendaftaran' | 'Seleksi & Verifikasi' | 'Pengumuman';
  canRegister: boolean;
  lockoutAttempts: number;
  lockoutTime: number; // in minutes
}

export interface RankingItem {
  rank: number;
  registrationId: string;
  nama: string;
  nisn: string;
  schoolId: number;
  schoolName: string;
  pathway: Pathway;
  distance: number; // in meters (Haversine)
  score: number; // calculated score (Prestasi score, Exam score, etc.)
  status: RegistrationStatus;
  isTieBreakerUsed: boolean;
  tieBreakerReason?: string;
  createdAt: string;
}
