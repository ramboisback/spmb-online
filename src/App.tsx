/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  School, User, Shield, ArrowRight, Upload, Clock, AlertTriangle, 
  CheckCircle, XCircle, MapPin, Award, FileText, LayoutDashboard, 
  LogOut, RefreshCw, Sliders, Database, Search, Sparkles, Eye, 
  Settings, Activity, FileCheck, ArrowLeft, ToggleLeft, ToggleRight,
  Map, Trash2, Check, Send, Menu, X, Mail, Info, PhoneCall, BookOpen,
  BarChart3, PieChart, Plus, TrendingUp
} from 'lucide-react';
import { 
  Role, Pathway, RegistrationStatus, School as SchoolType, 
  Registration, AuditLog, SystemSettings, RankingItem 
} from './types';
import AdminSchoolMap from './components/AdminSchoolMap';

// Simple toast manager
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Global State
  const [user, setUser] = useState<{ id: string; email: string; role: Role; schoolId?: number } | null>(null);
  const [view, setView] = useState<'public' | 'auth' | 'app'>('public');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Public Dashboard State
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [systemPhase, setSystemPhase] = useState<'Pendaftaran' | 'Seleksi & Verifikasi' | 'Pengumuman'>('Pendaftaran');
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(1);
  const [selectedPathway, setSelectedPathway] = useState<Pathway>('Zonasi');
  const [apiFailedToggle, setApiFailedToggle] = useState<boolean>(false);

  // Responsive Public Tab Navigation & Dynamic Multi-section State
  const [publicTab, setPublicTab] = useState<'beranda' | 'tentang' | 'layanan' | 'kontak'>('beranda');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Interactive Support Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactSubject, setContactSubject] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [showContactConfirm, setShowContactConfirm] = useState<boolean>(false);

  // Auth Forms
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authRole, setAuthRole] = useState<Role>('Siswa');
  const [authLevel, setAuthLevel] = useState<'SD' | 'SMP'>('SMP');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCodeInput, setOtpCodeInput] = useState<string>('');
  const [lockoutTimer, setLockoutTimer] = useState<string | null>(null);

  // Siswa Wizard State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [localReg, setLocalReg] = useState<Partial<Registration>>({
    nisn: '', nama: '', email: '', nik: '', phone: '', address: '',
    latitude: -6.168541, longitude: 106.834015,
    pilihan1Id: 1, pilihan2Id: 2, pathway: 'Zonasi',
    status: 'Draft', isManualFallback: false,
    documents: {}
  });
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  // Operator State
  const [operatorApplicants, setOperatorApplicants] = useState<Registration[]>([]);
  const [allOperatorApplicants, setAllOperatorApplicants] = useState<Registration[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Registration | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Operator SD/SMP Tab-specific search & filters
  const [sdSearch, setSdSearch] = useState<string>('');
  const [sdPathwayFilter, setSdPathwayFilter] = useState<string>('All');
  const [sdStatusFilter, setSdStatusFilter] = useState<string>('All');

  const [smpSearch, setSmpSearch] = useState<string>('');
  const [smpPathwayFilter, setSmpPathwayFilter] = useState<string>('All');
  const [smpStatusFilter, setSmpStatusFilter] = useState<string>('All');

  // Admin Panel State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [selectedStatsYear, setSelectedStatsYear] = useState<number>(2026);
  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [operatorFormEmail, setOperatorFormEmail] = useState<string>('');
  const [operatorFormPassword, setOperatorFormPassword] = useState<string>('');
  const [operatorFormSchoolId, setOperatorFormSchoolId] = useState<number>(0);
  const [operatorFormStatus, setOperatorFormStatus] = useState<string>('Active');
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState<boolean>(false);
  const [editingOperator, setEditingOperator] = useState<any | null>(null);

  // Admin School and Quota Management States
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [schoolFormOpen, setSchoolFormOpen] = useState<boolean>(false);
  const [quotaFormOpen, setQuotaFormOpen] = useState<boolean>(false);
  const [quotaAddFormOpen, setQuotaAddFormOpen] = useState<boolean>(false);
  const [selectedSchoolIdForQuota, setSelectedSchoolIdForQuota] = useState<number | ''>('');
  const [schoolFormName, setSchoolFormName] = useState<string>('');
  const [schoolFormAddress, setSchoolFormAddress] = useState<string>('');
  const [schoolFormLat, setSchoolFormLat] = useState<number>(-6.198305);
  const [schoolFormLng, setSchoolFormLng] = useState<number>(106.832943);
  const [schoolFormZonasi, setSchoolFormZonasi] = useState<number>(5);
  const [schoolFormPrestasi, setSchoolFormPrestasi] = useState<number>(5);
  const [schoolFormAfirmasi, setSchoolFormAfirmasi] = useState<number>(5);
  const [schoolFormPindahan, setSchoolFormPindahan] = useState<number>(5);
  const [schoolFormTes, setSchoolFormTes] = useState<number>(5);

  // Sidebar Menu and Submenu Management State
  const [sidebarActiveMenu, setSidebarActiveMenu] = useState<string>('dashboard');
  const [lastNavUserId, setLastNavUserId] = useState<string | null>(null);

  // Dynamic School Type Helpers for Operator
  const operatorSchool = user?.schoolId ? schools.find(s => s.id === user.schoolId) : null;
  const isSdOperator = operatorSchool ? (operatorSchool.name.toLowerCase().includes('sd') || operatorSchool.name.toLowerCase().includes('sdn')) : false;
  const isSmpOperator = operatorSchool ? (operatorSchool.name.toLowerCase().includes('smp') || operatorSchool.name.toLowerCase().includes('smpn')) : false;

  useEffect(() => {
    if (user) {
      if (user.id !== lastNavUserId) {
        setLastNavUserId(user.id);
        if (user.role === 'Siswa') {
          setSidebarActiveMenu('siswa_dashboard');
        } else if (user.role === 'Operator') {
          const sch = schools.find(s => s.id === user.schoolId);
          const isSd = sch ? (sch.name.toLowerCase().includes('sd') || sch.name.toLowerCase().includes('sdn')) : false;
          const isSmp = sch ? (sch.name.toLowerCase().includes('smp') || sch.name.toLowerCase().includes('smpn')) : false;
          
          if (isSd) {
            setSidebarActiveMenu('operator_sd');
          } else if (isSmp) {
            setSidebarActiveMenu('operator_smp');
          } else {
            setSidebarActiveMenu('operator_dashboard');
          }
        } else if (user.role === 'Admin Dinas') {
          setSidebarActiveMenu('dashboard');
        }
      }
    } else {
      setLastNavUserId(null);
    }
  }, [user, schools, lastNavUserId]);

  // Sync operator data automatically on operator login/session
  useEffect(() => {
    if (user && user.role === 'Operator') {
      syncAllOperatorApplicants();
    }
  }, [user]);

  // Show Toast Alert
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Pre-load public ranking dashboard and YoY stats
  const fetchPublicRankings = async () => {
    try {
      const res = await fetch('/api/public/rankings');
      const data = await res.json();
      if (data) {
        setRankings(data.rankings || []);
        setSchools(data.schools || []);
        setSystemPhase(data.settings?.phase || 'Pendaftaran');
        setApiFailedToggle(data.simulatedNisnFailure || false);
      }
      // Load public dashboard stats for YoY report
      const statsRes = await fetch('/api/admin/dashboard');
      const statsData = await statsRes.json();
      if (statsData) {
        setAdminStats(statsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPublicRankings();
    const interval = setInterval(fetchPublicRankings, 20000); // Live sync ranking every 20s
    return () => clearInterval(interval);
  }, []);

  // Sync API failure setting initially
  useEffect(() => {
    fetch('/api/public/rankings')
      .then(r => r.json())
      .then(d => setApiFailedToggle(!!d.simulatedNisnFailure))
      .catch(console.error);
  }, []);

  // Fetch student status if logged in
  const syncSiswaProfile = async (uId: string, userLevel?: 'SD' | 'SMP') => {
    try {
      const res = await fetch(`/api/registration/me?userId=${uId}`);
      const payload = await res.json();
      if (payload.success && payload.data) {
        setLocalReg(payload.data);
        if (payload.data.isManualFallback) {
          setManualMode(true);
        }
      } else {
        // Initialize default school choices according to SD / SMP level
        const level = userLevel || 'SMP';
        if (level === 'SD') {
          setLocalReg(prev => ({
            ...prev,
            pilihan1Id: 1, // SDN Menteng 01 Jakarta
            pilihan2Id: 3  // SDN Kebon Jeruk 11 Jakarta
          }));
        } else {
          setLocalReg(prev => ({
            ...prev,
            pilihan1Id: 2, // SMP Negeri 115 Jakarta
            pilihan2Id: 4  // SMP Negeri 1 Jakarta
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch operator statistics
  const syncOperatorWorkspace = async (sId: number) => {
    try {
      const res = await fetch(`/api/operator/registrations?schoolId=${sId}`);
      const payload = await res.json();
      if (payload.success) {
        setOperatorApplicants(payload.data || []);
      }
      // Also sync all applicants for SD/SMP tabs
      await syncAllOperatorApplicants();
    } catch (err) {
      console.error(err);
    }
  };

  const syncAllOperatorApplicants = async () => {
    try {
      const res = await fetch(`/api/operator/registrations?schoolId=all`);
      const payload = await res.json();
      if (payload.success) {
        setAllOperatorApplicants(payload.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/admin/operators');
      const data = await res.json();
      if (data.success) {
        setOperators(data.operators);
      }
    } catch (err) {
      console.error("Gagal mengambil data operator:", err);
    }
  };

  // Fetch admin stats
  const syncAdminDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const payload = await res.json();
      if (payload) {
        setAdminStats(payload);
        setAllAuditLogs(payload.auditLogs || []);
      }
      await fetchOperators();
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast("Email dan password wajib diisi", "error");
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        // Register route requires OTP first to simulate OTP worker dispatching on Redis
        if (!otpSent) {
          const res = await fetch('/api/auth/otp/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail })
          });
          const data = await res.json();
          if (res.ok) {
            setOtpSent(true);
            showToast("Kode OTP terkirim! Silakan cek logs server / Terminal Output", "info");
          } else {
            showToast(data.error || "Gagal merequest OTP", "error");
          }
        } else {
          // Verify OTP first
          const verifyRes = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, code: otpCodeInput })
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            showToast(verifyData.error || "Kode OTP salah atau kedaluwarsa", "error");
            setLoading(false);
            return;
          }

          // Register
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword, role: authRole, jenjang: authLevel })
          });
          const regData = await regRes.json();
          if (regRes.ok) {
            showToast("Registrasi berhasil! Silakan login sekarang.", "success");
            setIsRegisterMode(false);
            setOtpSent(false);
            setOtpCodeInput('');
          } else {
            showToast(regData.error || "Pendaftaran gagal", "error");
          }
        }
      } else {
        // Login route with lockout attempts count handler
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          const activeUser = loginData.user;
          setUser(activeUser);
          setView('app');
          showToast(`Selamat datang ${activeUser.role === 'Siswa' ? 'Siswa Baru' : activeUser.role}!`, "success");
          
          if (activeUser.role === 'Siswa') {
            await syncSiswaProfile(activeUser.id, activeUser.jenjang);
          } else if (activeUser.role === 'Operator') {
            await syncOperatorWorkspace(activeUser.schoolId || 1);
          } else if (activeUser.role === 'Admin Dinas') {
            await syncAdminDashboard();
          }
        } else {
          showToast(loginData.error || "Login gagal", "error");
        }
      }
    } catch (err: any) {
      showToast("Koneksi jaringan error", "error");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setView('public');
    showToast("Anda telah keluar dari sesi sistem", "info");
  };

  // Toggle Kemendikbud NISN Server simulation downtime
  const toggleNisnDowntimeSetting = async () => {
    try {
      const res = await fetch('/api/nisn/toggle-failure', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setApiFailedToggle(data.simulatedNisnFailure);
        showToast(
          data.simulatedNisnFailure 
            ? "API Kemendikbud DOWNTIME Aktif! Pendaftaran otomatis dialihkan ke Fallback Manual." 
            : "API Kemendikbud Layanan Kembali Normal.", 
          "info"
        );
      }
    } catch (err) {
      showToast("Gagal mengubah status server", "error");
    }
  };

  const generateDummyApplicants = async (count: number = 10) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate-dummy-applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Berhasil membuat ${count} data dummy calon siswa baru`, "success");
        if (user && user.role === 'Operator' && user.schoolId) {
          await syncOperatorWorkspace(user.schoolId);
        } else if (user && user.role === 'Admin Dinas') {
          await syncAdminDashboard();
        }
      } else {
        showToast(data.error || "Gagal membangkitkan data dummy", "error");
      }
    } catch (err) {
      showToast("Kesalahan jaringan saat membangkitkan data", "error");
    } finally {
      setLoading(false);
    }
  };

  // NISN Automatic pull trigger
  const handleNisnPull = async () => {
    if (!localReg.nisn || localReg.nisn.length !== 10) {
      showToast("Harap masukkan 10 digit NISN secara tepat", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/nisn/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn: localReg.nisn })
      });
      const payload = await res.json();
      if (res.ok) {
        if (payload.found) {
          setLocalReg(prev => ({
            ...prev,
            nama: payload.data.nama,
            email: payload.data.email,
            nik: payload.data.nik,
            phone: payload.data.phone,
            address: payload.data.address,
            isManualFallback: false
          }));
          setManualMode(false);
          showToast("Data NISN Kemendikbud terverifikasi otomasi pull!", "success");
        } else {
          setManualMode(true);
          showToast("Nomor NISN belum tersinkronisasi. Silakan mengisi form biodata manual di bawah.", "info");
        }
      } else {
        // Fallback manual triggered because API failed / timeout simulates
        setManualMode(true);
        setLocalReg(prev => ({ ...prev, isManualFallback: true }));
        showToast(`${payload.error || 'API Error'} - Mekanisme Fallback Manual aktif otomatis!`, "error");
      }
    } catch (e) {
      setManualMode(true);
      setLocalReg(prev => ({ ...prev, isManualFallback: true }));
      showToast("Koneksi API Gagal. Skenario Fallback Manual berhasil diaktifkan.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save student data draft (Auto-saving triggers also)
  const saveStudentForm = async (status: RegistrationStatus = 'Draft') => {
    if (!user) return;
    const bodyPayload = {
      ...localReg,
      userId: user.id,
      status: status
    };

    try {
      const res = await fetch('/api/registration/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok) {
        setLocalReg(data.data);
        fetchPublicRankings(); // Sync rank live
        if (status === 'Pending') {
          showToast("Pendaftaran telah berhasil disubmit untuk diverifikasi Operator!", "success");
          setSidebarActiveMenu('siswa_dashboard');
        } else {
          showToast("Draf formulir tersimpan otomatis secara asinkron di database.", "success");
        }
      } else {
        showToast(data.error || "Gagal menyimpan draf", "error");
      }
    } catch (err) {
      showToast("Kesalahan saat menyimpan formulir", "error");
    }
  };

  // Handle file uploads natively with obfucated file naming & mime filters
  const triggerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, doctype: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Berkas melebihi batas 2MB", "error");
      return;
    }

    const type = file.name.split('.').pop()?.toLowerCase();
    if (!type || !['pdf', 'jpeg', 'jpg', 'png'].includes(type)) {
      showToast("Format hanya PDF, JPEG atau PNG saja yang diperkenankan", "error");
      return;
    }

    // Mock progress bar intervals
    setUploadProgress(prev => ({ ...prev, [doctype]: 30 }));
    setTimeout(() => setUploadProgress(prev => ({ ...prev, [doctype]: 75 })), 300);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            filename: file.name,
            filetype: file.type
          })
        });
        const uploadPayload = await res.json();
        
        if (res.ok) {
          setLocalReg(prev => ({
            ...prev,
            documents: {
              ...(prev.documents || {}),
              [doctype]: uploadPayload.file
            }
          }));
          setUploadProgress(prev => ({ ...prev, [doctype]: 100 }));
          showToast(`Dokumen ${doctype.toUpperCase()} diunggah secara aman!`, "success");
        } else {
          showToast(uploadPayload.error || "Gagal mengunggah dokumen", "error");
          setUploadProgress(prev => ({ ...prev, [doctype]: 0 }));
        }
      } catch (err) {
        showToast("Error sistem pengunggahan berkas", "error");
        setUploadProgress(prev => ({ ...prev, [doctype]: 0 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Operator Action (Approve / Reject)
  const processOperatorDecision = async (id: string, action: 'Verify' | 'Reject') => {
    if (!user) return;
    if (systemPhase === 'Pendaftaran') {
      showToast("Gagal memproses: Operator sekolah tidak bisa melakukan verifikasi berkas saat fase Pendaftaran masih berlangsung.", "error");
      return;
    }
    try {
      const res = await fetch('/api/operator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: id,
          action,
          reason: rejectReasonInput,
          operatorEmail: user.email,
          schoolId: user.schoolId || 1
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Siswa berhasil di ${action === 'Verify' ? 'Verifikasi' : 'Tolak'}`, "success");
        setSelectedApplicant(data.data);
        setRejectReasonInput('');
        setShowRejectModal(false);
        setShowReviewModal(false);
        syncOperatorWorkspace(user.schoolId || 1);
        fetchPublicRankings();
      } else {
        showToast(data.error || "Gagal memproses", "error");
      }
    } catch (err) {
      showToast("Gagal menyimpan hasil keputusan verifikasi", "error");
    }
  };

  // Gemini AI Smart Assessment reviewer proxy integration
  const askGeminiReviewer = async (candidate: Registration) => {
    setAiAnalysisResult("Menghubungi AI Asisten Verifikasi Dinas...");
    try {
      const res = await fetch('/api/assistant/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateDetails: candidate })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysisResult(data.analysis);
      }
    } catch (err) {
      setAiAnalysisResult("AI Asisten gagal mengevaluasi berkas ini.");
    }
  };

  // Admin adjustments
  const triggerPhaseTransition = async (ph: 'Pendaftaran' | 'Seleksi & Verifikasi' | 'Pengumuman') => {
    if (!user) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: ph, adminEmail: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        setSystemPhase(data.settings.phase);
        showToast(`Fase PPDB/SPMB Berhasil diubah ke: ${data.settings.phase}`, "success");
        syncAdminDashboard();
        fetchPublicRankings();
      }
    } catch (err) {
      showToast("Gagal merubah fase setting", "error");
    }
  };

  const triggerGaleShapleyCascadingEngine = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/execute-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        syncAdminDashboard();
        fetchPublicRankings();
      }
    } catch (e) {
      showToast("Gagal eksekusi seleksi antrean", "error");
    } finally {
      setLoading(false);
    }
  };

  // Submit new or edited school (basic details only)
  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!schoolFormName || !schoolFormAddress) {
      showToast("Nama dan alamat sekolah wajib diisi!", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSchool ? editingSchool.id : undefined,
          name: schoolFormName,
          address: schoolFormAddress,
          latitude: parseFloat(Number(schoolFormLat).toFixed(6)),
          longitude: parseFloat(Number(schoolFormLng).toFixed(6)),
          quotas: editingSchool ? {
            Zonasi: editingSchool.quotas?.Zonasi ?? Number(schoolFormZonasi),
            Prestasi: editingSchool.quotas?.Prestasi ?? Number(schoolFormPrestasi),
            Afirmasi: editingSchool.quotas?.Afirmasi ?? Number(schoolFormAfirmasi),
            Pindahan: editingSchool.quotas?.Pindahan ?? Number(schoolFormPindahan),
            Tes: editingSchool.quotas?.Tes ?? Number(schoolFormTes)
          } : {
            Zonasi: Number(schoolFormZonasi),
            Prestasi: Number(schoolFormPrestasi),
            Afirmasi: Number(schoolFormAfirmasi),
            Pindahan: Number(schoolFormPindahan),
            Tes: Number(schoolFormTes)
          },
          adminEmail: user.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(editingSchool ? "Sekolah berhasil diperbarui!" : "Sekolah baru ditambahkan!", "success");
        if (data.schools) {
          setSchools(data.schools);
        }
        syncAdminDashboard();
        fetchPublicRankings();
        setSchoolFormOpen(false);
        setEditingSchool(null);
      } else {
        showToast(data.error || "Gagal menyimpan data sekolah", "error");
      }
    } catch (err) {
      showToast("Kesalahan koneksi saat menyimpan data sekolah", "error");
    } finally {
      setLoading(false);
    }
  };

  // Submit edited quotas/daya tampung only
  const handleQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingSchool) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSchool.id,
          name: editingSchool.name,
          address: editingSchool.address,
          latitude: editingSchool.latitude,
          longitude: editingSchool.longitude,
          quotas: {
            Zonasi: Number(schoolFormZonasi),
            Prestasi: Number(schoolFormPrestasi),
            Afirmasi: Number(schoolFormAfirmasi),
            Pindahan: Number(schoolFormPindahan),
            Tes: Number(schoolFormTes)
          },
          adminEmail: user.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Daya tampung sekolah berhasil diperbarui!", "success");
        if (data.schools) {
          setSchools(data.schools);
        }
        syncAdminDashboard();
        fetchPublicRankings();
        setQuotaFormOpen(false);
        setEditingSchool(null);
      } else {
        showToast(data.error || "Gagal menyimpan daya tampung", "error");
      }
    } catch (err) {
      showToast("Kesalahan koneksi saat menyimpan daya tampung", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete school
  const handleSchoolDelete = async (schoolId: number) => {
    if (!user) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus sekolah ini? Tindakan ini juga akan menghapus operator sekolah ini secara permanen.")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/school/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schoolId, adminEmail: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Sekolah berhasil dihapus!", "success");
        if (data.schools) {
          setSchools(data.schools);
        }
        syncAdminDashboard();
        fetchPublicRankings();
      } else {
        showToast(data.error || "Gagal menghapus sekolah", "error");
      }
    } catch (err) {
      showToast("Kesalahan koneksi saat menghapus sekolah", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom operators handlers
  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // If not editing, password is required
    if (!editingOperator && !operatorFormPassword) {
      showToast("Kata sandi harus diisi untuk operator baru!", "error");
      return;
    }

    if (!operatorFormEmail || !operatorFormSchoolId) {
      showToast("Harap lengkapi semua isian formulir!", "error");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!editingOperator;
      const endpoint = isEdit ? '/api/admin/operators/update' : '/api/admin/operators';
      const bodyPayload: any = {
        email: operatorFormEmail,
        schoolId: Number(operatorFormSchoolId),
        adminEmail: user.email
      };

      if (isEdit) {
        bodyPayload.id = editingOperator.id;
        bodyPayload.status = operatorFormStatus;
        if (operatorFormPassword) {
          bodyPayload.password = operatorFormPassword;
        }
      } else {
        bodyPayload.password = operatorFormPassword;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? "Data akun operator berhasil diperbarui!" : "Operator baru berhasil didaftarkan!", "success");
        setOperators(data.operators);
        setOperatorFormEmail('');
        setOperatorFormPassword('');
        setEditingOperator(null);
        setIsOperatorModalOpen(false);
      } else {
        showToast(data.error || "Gagal menyimpan data operator", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan saat menyimpan data operator", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorDelete = async (opId: string) => {
    if (!user) return;
    const op = operators.find(o => o.id === opId);
    if (!op) return;
    const currentStatus = op.status || 'Active';
    const actionWord = currentStatus === 'Active' ? 'menonaktifkan (Non-Aktifkan)' : 'mengaktifkan kembali';
    if (!window.confirm(`Apakah Anda yakin ingin ${actionWord} akun operator ${op.email}?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/operators/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: opId,
          adminEmail: user.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Status aktif operator berhasil diperbarui!", "success");
        setOperators(data.operators);
      } else {
        showToast(data.error || "Gagal memperbarui status operator", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan saat memperbarui status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open form for editing basic details
  const openEditSchoolForm = (sch: SchoolType) => {
    setEditingSchool(sch);
    setSchoolFormName(sch.name);
    setSchoolFormAddress(sch.address);
    setSchoolFormLat(sch.latitude);
    setSchoolFormLng(sch.longitude);
    setSchoolFormOpen(true);
  };

  // Open form for editing quota (daya tampung)
  const openQuotaForm = (sch: SchoolType) => {
    setEditingSchool(sch);
    setSchoolFormZonasi(sch.quotas?.Zonasi || 0);
    setSchoolFormPrestasi(sch.quotas?.Prestasi || 0);
    setSchoolFormAfirmasi(sch.quotas?.Afirmasi || 0);
    setSchoolFormPindahan(sch.quotas?.Pindahan || 0);
    setSchoolFormTes(sch.quotas?.Tes || 0);
    setQuotaFormOpen(true);
    setQuotaAddFormOpen(false);
  };

  // Open form for adding new school capacity
  const openAddQuotaFormForNewSchool = () => {
    setEditingSchool(null);
    setSelectedSchoolIdForQuota('');
    setSchoolFormName('');
    setSchoolFormAddress('');
    setSchoolFormLat(-6.198305);
    setSchoolFormLng(106.832943);
    setSchoolFormZonasi(10);
    setSchoolFormPrestasi(10);
    setSchoolFormAfirmasi(10);
    setSchoolFormPindahan(5);
    setSchoolFormTes(15);
    setQuotaAddFormOpen(true);
    setQuotaFormOpen(false);
  };

  // Open form for adding new school
  const openAddSchoolForm = () => {
    setEditingSchool(null);
    setSchoolFormName('');
    setSchoolFormAddress('');
    setSchoolFormLat(-6.198305);
    setSchoolFormLng(106.832943);
    setSchoolFormZonasi(5);
    setSchoolFormPrestasi(5);
    setSchoolFormAfirmasi(5);
    setSchoolFormPindahan(5);
    setSchoolFormTes(5);
    setSchoolFormOpen(true);
  };

  // Haversine visualization coords calculations helpers
  const handleCoordOffset = (latOffset: number, lngOffset: number) => {
    setLocalReg(prev => {
      const lat = parseFloat(( (prev.latitude || -6.168) + latOffset ).toFixed(6));
      const lng = parseFloat(( (prev.longitude || 106.83) + lngOffset ).toFixed(6));
      return { ...prev, latitude: lat, longitude: lng };
    });
  };

  // Navigation controller helper
  const navigateToAuth = (isReg: boolean) => {
    setIsRegisterMode(isReg);
    setOtpSent(false);
    setView('auth');
  };

  // Filter public items matching selected dashboard criteria
  const currentFilteredRankings = rankings.filter(
    item => item.schoolId === selectedSchoolId && item.pathway === selectedPathway
  ).slice(0, 30);

  const selectedSchoolObj = schools.find(s => s.id === selectedSchoolId);

  return (
    <div id="spmb_application_root" className="min-h-screen bg-[#070709] text-zinc-100 font-sans antialiased overflow-x-hidden flex flex-col">
      
      {/* Toast Overlay alert notifications */}
      <div id="toast_notifications_stack" className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            id={`toast_item_${t.id}`}
            className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 text-sm font-semibold glass-card border ${
              t.type === 'success' 
                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' 
                : t.type === 'error' 
                  ? 'border-rose-500/40 text-rose-300 bg-rose-950/40' 
                  : 'border-indigo-500/40 text-indigo-300 bg-indigo-950/40'
            }`}
          >
            {t.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <p className="flex-1">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Header component styling */}
      <header id="spmb_header_nav" className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between px-5 py-3 border border-zinc-800/80 rounded-2xl bg-zinc-900/45 backdrop-blur-md shadow-xl relative z-40">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('public'); setPublicTab('beranda'); }}>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white tracking-widest text-lg shadow-md shadow-indigo-600/30">
              S
            </div>
            <div>
              <span className="font-display font-semibold text-lg tracking-tight block text-white">SPMB ONLINE</span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-1">PANEL SELEKSI SD &amp; SMP NEGERI</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-zinc-400">
            <button 
              id="nav_btn_home"
              onClick={() => { setView('public'); setPublicTab('beranda'); setMobileMenuOpen(false); }} 
              className={`hover:text-zinc-100 transition-colors py-1.5 px-3 rounded-lg ${view === 'public' && publicTab === 'beranda' ? 'text-indigo-400 bg-indigo-950/45 border border-indigo-900/50' : ''}`}
            >
              Beranda
            </button>
            <button 
              id="nav_btn_tentang"
              onClick={() => { setView('public'); setPublicTab('tentang'); setMobileMenuOpen(false); }} 
              className={`hover:text-zinc-100 transition-colors py-1.5 px-3 rounded-lg ${view === 'public' && publicTab === 'tentang' ? 'text-indigo-400 bg-indigo-950/45 border border-indigo-900/50' : ''}`}
            >
              Tentang Kami
            </button>
            <button 
              id="nav_btn_layanan"
              onClick={() => { setView('public'); setPublicTab('layanan'); setMobileMenuOpen(false); }} 
              className={`hover:text-zinc-100 transition-colors py-1.5 px-3 rounded-lg ${view === 'public' && publicTab === 'layanan' ? 'text-indigo-400 bg-indigo-950/45 border border-indigo-900/50' : ''}`}
            >
              Layanan &amp; Seleksi
            </button>
            <button 
              id="nav_btn_kontak"
              onClick={() => { setView('public'); setPublicTab('kontak'); setMobileMenuOpen(false); }} 
              className={`hover:text-zinc-100 transition-colors py-1.5 px-3 rounded-lg ${view === 'public' && publicTab === 'kontak' ? 'text-indigo-400 bg-indigo-950/45 border border-indigo-900/50' : ''}`}
            >
              Kontak
            </button>
            {user && (
              <button 
                id="nav_btn_workspace"
                onClick={() => { setView('app'); setMobileMenuOpen(false); }} 
                className={`hover:text-indigo-300 transition-colors py-1.5 px-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-400 ${view === 'app' ? 'border-indigo-500/80 bg-indigo-900/40' : ''}`}
              >
                Panel Kerja Anda
              </button>
            )}
            <div className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-mono text-zinc-400 border border-zinc-700/50">
              Fase: <span className="text-zinc-200 font-bold">{systemPhase}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Session Info Header widget */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-200 max-w-[130px] truncate">{user.email}</p>
                  <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded-full uppercase">
                    {user.role}
                  </span>
                </div>
                <button 
                  id="header_logout_btn"
                  onClick={logout} 
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl border border-zinc-800 transition-colors"
                  title="Keluar Sesi"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button 
                  id="header_login_nav"
                  onClick={() => { navigateToAuth(false); setMobileMenuOpen(false); }} 
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded-xl transition-all"
                >
                  Masuk
                </button>
                <button 
                  id="header_register_nav"
                  onClick={() => { navigateToAuth(true); setMobileMenuOpen(false); }} 
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Daftar
                </button>
              </div>
            )}

            {/* Mobile Navigation Toggle Button */}
            <button
              id="mobile_menu_trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors block md:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Nav Drawer Tray */}
        {mobileMenuOpen && (
          <div id="spmb_mobile_menu" className="mt-3 p-4 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl flex flex-col gap-3 shadow-2xl relative z-50 md:hidden animate-[fadeIn_0.2s_ease-out]">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest px-2">Menu Navigasi SPMB</span>
            
            <button 
              id="mobile_nav_home"
              onClick={() => { setView('public'); setPublicTab('beranda'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${view === 'public' && publicTab === 'beranda' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Beranda (Beranda Utama)
            </button>
            <button 
              id="mobile_nav_tentang"
              onClick={() => { setView('public'); setPublicTab('tentang'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${view === 'public' && publicTab === 'tentang' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <Info className="w-4 h-4" /> Tentang Kami (Profil Organisasi)
            </button>
            <button 
              id="mobile_nav_layanan"
              onClick={() => { setView('public'); setPublicTab('layanan'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${view === 'public' && publicTab === 'layanan' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <BookOpen className="w-4 h-4" /> Layanan &amp; Jalur Seleksi
            </button>
            <button 
              id="mobile_nav_kontak"
              onClick={() => { setView('public'); setPublicTab('kontak'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${view === 'public' && publicTab === 'kontak' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <PhoneCall className="w-4 h-4" /> Kontak Person &amp; Pengaduan
            </button>

            {user ? (
              <div className="border-t border-zinc-850 pt-3 mt-1 flex flex-col gap-2">
                <button 
                  id="mobile_nav_panel"
                  onClick={() => { setView('app'); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 bg-indigo-950 border border-indigo-800 text-xs font-bold text-indigo-300 rounded-xl"
                >
                  Masuk Panel Kerja ({user.role})
                </button>
                <button 
                  id="mobile_nav_logout"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 bg-rose-950/40 border border-rose-900/30 text-xs font-semibold text-rose-400 rounded-xl"
                >
                  Log Out ({user.email})
                </button>
              </div>
            ) : (
              <div className="border-t border-zinc-850 pt-3 mt-1 grid grid-cols-2 gap-2">
                <button 
                  id="mobile_nav_login"
                  onClick={() => { navigateToAuth(false); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-zinc-900 text-xs font-bold text-zinc-300 rounded-xl border border-zinc-800"
                >
                  Masuk
                </button>
                <button 
                  id="mobile_nav_register"
                  onClick={() => { navigateToAuth(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Daftar
                </button>
              </div>
            )}
            
            <div className="text-[10px] text-zinc-500 text-center font-mono py-1 border-t border-zinc-900">
              Sistem Aktif: {systemPhase}
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 flex flex-col gap-6">

        {/* ==================== VIEW 1: DYNAMIC MULTI-PAGE PUBLIC WEBSITE ==================== */}
        {view === 'public' && (
          <div id="view_public_portal" className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            
            {/* 1.1: TAB 1 - BERANDA (HOME PAGE) */}
            {publicTab === 'beranda' && (
              <div id="public_tab_beranda" className="flex flex-col gap-8">
                {/* Hero section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-xl md:w-7/12 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-400 mb-3 text-xs font-bold uppercase tracking-wider font-mono">
                          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                          Portal Realtime Penerimaan Daerah 2026
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white leading-tight tracking-tight">
                          Optimasi Penerimaan Siswa/Mahasiswa Baru Adil
                        </h1>
                        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                          Sistem pemantauan SPMB online transparan berbasis pergeseran antrean dinamis. Transparansi murni diproses langsung dengan kriteria tie-breaker bobot nilai nasional, koordinat presisi Haversine, dan sistem seleksi <span className="text-zinc-200 underline font-semibold">Cascading Queue</span> asinkron otomatis.
                        </p>
                      </div>
                      
                      <div className="mt-8 flex flex-wrap gap-3">
                        <button 
                          id="welcome_pendaft_btn"
                          onClick={() => navigateToAuth(true)} 
                          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-2xl text-xs text-white transition-all hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                          Daftar Siswa Baru <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                          id="welcome_ranking_action_btn"
                          onClick={() => setPublicTab('layanan')}
                          className="px-6 py-3.5 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 font-bold rounded-2xl text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Sliders className="w-4 h-4 text-indigo-400" /> Lihat Ranking Live
                        </button>
                      </div>
                    </div>

                    {/* Left & Right Combined Student Profile Image Frames */}
                    <div className="relative md:w-5/12 min-h-[220px] md:min-h-[280px] flex items-stretch z-10">
                      <div className="w-full bg-gradient-to-tr from-indigo-950/40 via-zinc-950/60 to-indigo-950/40 rounded-2xl border border-zinc-800/80 backdrop-blur-xs p-3.5 flex gap-3.5 active:scale-95 transition-transform">
                        {/* SD student frame */}
                        <div className="flex-1 relative rounded-xl overflow-hidden border border-red-500/30 group shadow-md shadow-red-950/10 flex flex-col justify-end bg-zinc-900">
                          <img 
                            src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=350" 
                            alt="Siswa SD Seragam Merah Putih" 
                            className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                          <div className="relative p-2.5 z-10">
                            <span className="inline-block text-[8px] font-mono text-red-400 font-extrabold tracking-wider bg-red-950/90 border border-red-500/40 px-1.5 py-0.5 rounded uppercase">SD</span>
                            <span className="block text-[10px] font-bold text-white mt-1">Siswa Baru SD</span>
                          </div>
                        </div>

                        {/* SMP student frame */}
                        <div className="flex-1 relative rounded-xl overflow-hidden border border-indigo-500/30 group shadow-md shadow-indigo-950/10 flex flex-col justify-end bg-zinc-900">
                          <img 
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=350" 
                            alt="Siswa SMP Seragam Biru Putih" 
                            className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                          <div className="relative p-2.5 z-10">
                            <span className="inline-block text-[8px] font-mono text-indigo-400 font-extrabold tracking-wider bg-indigo-950/90 border border-indigo-500/40 px-1.5 py-0.5 rounded uppercase">SMP</span>
                            <span className="block text-[10px] font-bold text-white mt-1">Siswa Baru SMP</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vector backdrop graphic background */}
                    <div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-5 pointer-events-none">
                      <svg viewBox="0 0 400 200" className="w-full h-full">
                        <path d="M0,150 Q100,50 200,120 T400,60" fill="none" stroke="#6366f1" strokeWidth="3" />
                        <circle cx="200" cy="120" r="6" fill="#6366f1" />
                        <circle cx="400" cy="6" r="6" fill="#6366f1" />
                      </svg>
                    </div>
                  </div>

                  {/* API Downtime Simulator integration bento card */}
                  <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Simulator Integrasi</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${apiFailedToggle ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                      <h3 className="text-lg font-bold font-display text-white mt-2">Downtime Server API</h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Gunakan tombol kontrol ini untuk mensimulasikan kegagalan jaringan API NISN Kemendikbud sehingga memicu modul fallback manual otomatis pada siswa.
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-800/80">
                      <button 
                        id="toggle_downtime_btn"
                        onClick={toggleNisnDowntimeSetting}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          apiFailedToggle 
                            ? 'bg-amber-950/50 border border-amber-500/40 text-amber-200 hover:bg-amber-900/50' 
                            : 'bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300'
                        }`}
                      >
                        {apiFailedToggle ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
                        {apiFailedToggle ? 'API Server Downtime: ON' : 'API Server Standby: OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ketentuan Seragam & Jenjang Pendidikan Section */}
                <div id="education_levels_uniform_section" className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-zinc-850 pb-4">
                    <div>
                      <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-400" />
                        Panduan Ketentuan Seragam &amp; Aturan Jenjang Pendidikan
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Identitas seragam resmi nasional siswa-siswi SD dan SMP pada pendaftaran PPDB Daerah 2026.</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/60 border border-zinc-850 px-3 py-1 rounded-full uppercase">Pakaian Seragam Nasional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SD Card */}
                    <div className="bg-zinc-950/50 border border-zinc-850/80 rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all duration-300 flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600" 
                          alt="Siswa-Siswi SD Merah Putih" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Grade Colored Overlay Badge */}
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-red-500 uppercase tracking-widest">
                          Tingkat SD
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h3 className="text-sm font-bold text-white font-display">Siswa-Siswi Kelas Sekolah Dasar</h3>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                            Pakaian seragam nasional bagi siswa-siswi SD diatur dalam seragam kemeja putih lengan pendek/panjang dengan lencana merah putih, dipadukan rok atau celana berwarna merah hati (crimson), melambangkan kedisiplinan dan semangat belajar mula sejak dini.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">Persyaratan Usia:</span>
                          <span className="text-red-400 font-bold bg-red-950/35 border border-red-900/30 px-2 py-0.5 rounded">Min. 6 - 7 Tahun</span>
                        </div>
                      </div>
                    </div>

                    {/* SMP Card */}
                    <div className="bg-zinc-950/50 border border-zinc-850/80 rounded-2xl overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600" 
                          alt="Siswa-Siswi SMP Biru Putih" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Grade Colored Overlay Badge */}
                        <div className="absolute top-3 left-3 bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-500 uppercase tracking-widest">
                          Tingkat SMP
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <h3 className="text-sm font-bold text-white font-display">Siswa-Siswi Kelas Menengah (SMP)</h3>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                            Pakaian seragam nasional bagi siswa-siswi SMP diatur dalam baju kemeja putih disertai kelengkapan atribut sekolah, dipadukan denda celana pendek/panjang atau rok berwarna biru tua (navy). Melambangkan kemandirian, komunikasi, dan pengembangan potensi akademis lanjut.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">Syarat Kelulusan:</span>
                          <span className="text-indigo-400 font-bold bg-indigo-950/35 border border-indigo-900/30 px-2 py-0.5 rounded">Ijazah / SKL SD Sederajat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pathway Info Card Bento Grid */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold font-display text-white">5 Jalur Penerimaan Utama</h2>
                      <p className="text-xs text-zinc-400">Silakan pelajari jalur yang paling sesuai dengan dokumen dan kualifikasi Anda.</p>
                    </div>
                    <button 
                      onClick={() => setPublicTab('layanan')} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      Lihat Hasil Pemeringkatan Penerimaan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-850 p-5 rounded-2xl transition-all hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-3">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Jalur Zonasi</h4>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Seleksi murni berdasarkan jarak udara (Haversine Formula) domisili calon siswa menuju sekolah.</p>
                    </div>
                    
                    <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-850 p-5 rounded-2xl transition-all hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-400 mb-3">
                        <Award className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Jalur Prestasi</h4>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Penilaian bobot gabungan Nilai Rapor (30%) dan Tes Kemampuan Akademik (TKA) (70%).</p>
                    </div>

                    <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-850 p-5 rounded-2xl transition-all hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-lg bg-rose-600/10 flex items-center justify-center text-rose-400 mb-3">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Jalur Afirmasi</h4>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Diberikan bagi penerima bantuan sosial (Bansos), penyandang disabilitas, atau program afirmasi darurat.</p>
                    </div>

                    <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-850 p-5 rounded-2xl transition-all hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-400 mb-3">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. Jalur Pindahan</h4>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Penyaringan khusus untuk perpindahan domisili tugas dinas orang tua terhitung maksimal 1 tahun terakhir.</p>
                    </div>

                    <div className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-850 p-5 rounded-2xl transition-all hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center text-amber-400 mb-3">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">5. Jalur Tes Mandiri</h4>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Seleksi kompetisi murni lewat hasil ujian tertulis online daerah ditambah pencatatan lama durasi pengerjaan.</p>
                    </div>
                  </div>
                </div>

                {/* Workflow Stepper */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 sm:p-8">
                  <h3 className="text-sm font-bold font-mono tracking-widest text-indigo-400 uppercase mb-6 text-center">TATA CARA PENDAFTARAN TERINTEGRASI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-300 font-mono font-bold flex items-center justify-center border border-indigo-600/40 mb-3">1</div>
                      <h4 className="text-xs font-bold text-zinc-200">Registrasi Akun Baru</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">Buat akun untuk memperoleh akses pengisian data.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-300 font-mono font-bold flex items-center justify-center border border-indigo-600/40 mb-3">2</div>
                      <h4 className="text-xs font-bold text-zinc-200">Validasi NISN &amp; Geocoding</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">Tarik data DAPODIK otomatis atau isi coordinates manual.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-300 font-mono font-bold flex items-center justify-center border border-indigo-600/40 mb-3">3</div>
                      <h4 className="text-xs font-bold text-zinc-200">Pemberkasan Digital</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">Sertakan scan KK, Ijazah, dan piagam pendukung seleksi.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-300 font-mono font-bold flex items-center justify-center border border-indigo-600/40 mb-3">4</div>
                      <h4 className="text-xs font-bold text-zinc-200">Pemantauan Antrean</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">Status kuota real-time siap diakses publik kapan saja.</p>
                    </div>
                  </div>
                </div>

                {/* Yearly Statistics Section */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-lg">
                          <TrendingUp className="w-4 h-4 animate-pulse" />
                        </span>
                        Laporan Keberhasilan &amp; Analisis Komparatif Tahunan (PPDB)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Tren pertumbuhan kuantitatif pendaftar dan proporsi jalur kelulusan dari tahun ke tahun.
                      </p>
                    </div>
                    
                    {/* Selector Tab Buttons */}
                    <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-850 self-start sm:self-auto font-mono text-[10px]">
                      {[2023, 2024, 2025, 2026].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setSelectedStatsYear(yr)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            selectedStatsYear === yr
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                          }`}
                        >
                          Th. {yr}
                          {yr === 2026 && <span className="ml-1 text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded uppercase animate-pulse">Live</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year-over-Year Visual Line Chart */}
                  {(() => {
                    const statsDataList = [
                      { year: 2023, count: 12450, cap: '12.4K', change: 'Baseline' },
                      { year: 2024, count: 14890, cap: '14.8K', change: '+19.6%' },
                      { year: 2025, count: 16540, cap: '16.5K', change: '+11.1%' },
                      { 
                        year: 2026, 
                        count: (adminStats?.registrationsCount?.total || 0) + (adminStats?.registrationsCount?.draft || 0) + 16800, 
                        cap: `${(((adminStats?.registrationsCount?.total || 0) + (adminStats?.registrationsCount?.draft || 0) + 16800) / 1000).toFixed(1)}K`, 
                        change: 'Live' 
                      }
                    ];

                    const minVal = 10000;
                    const maxVal = 18500;
                    
                    // Map points to simple coordinates on visual viewport (width: 800, height: 200)
                    const points = statsDataList.map((item, index) => {
                      const x = 110 + index * 195;
                      const y = 145 - ((item.count - minVal) / (maxVal - minVal) * 110);
                      return { x, y, ...item };
                    });

                    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                    const areaD = `M ${points[0].x} 175 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} 175 Z`;

                    return (
                      <div className="bg-zinc-950/45 border border-zinc-855 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Grafik Kurva Pertumbuhan Calon Siswa Terdaftar (YoY Trend Line)</span>
                          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded">Klik Tahun untuk Detail</span>
                        </div>
                        
                        <div className="relative select-none w-full overflow-hidden">
                          {/* Legend / Info layer */}
                          <div className="absolute top-1 right-2 flex items-center gap-4 text-[10px] font-mono text-zinc-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block" />
                              Dinas PPDB Trend
                            </span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1 py-0.5 rounded uppercase font-bold animate-pulse">Live Tracker</span>
                          </div>

                          <svg viewBox="0 0 800 200" className="w-full h-auto drop-shadow-md">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal guide lines */}
                            {[10000, 12500, 15000, 17500].map((v) => {
                              const y = 145 - ((v - minVal) / (maxVal - minVal) * 110);
                              return (
                                <g key={v} className="opacity-40">
                                  <line 
                                    x1="50" 
                                    y1={y} 
                                    x2="750" 
                                    y2={y} 
                                    stroke="#3f3f46" 
                                    strokeDasharray="4 4" 
                                    strokeWidth="1" 
                                  />
                                  <text 
                                    x="40" 
                                    y={y + 3} 
                                    fill="#71717a" 
                                    fontSize="9" 
                                    fontFamily="monospace" 
                                    textAnchor="end"
                                  >
                                    {v / 1000}K
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area projection */}
                            <path d={areaD} fill="url(#chartGradient)" />

                            {/* Colored grid links and vertical year markers with interaction areas */}
                            {points.map((p) => {
                              const active = selectedStatsYear === p.year;
                              return (
                                <g key={p.year}>
                                  {/* Vertical tick lines */}
                                  <line 
                                    x1={p.x} 
                                    y1={25} 
                                    x2={p.x} 
                                    y2={175} 
                                    stroke={active ? '#6366f1' : '#27272a'} 
                                    strokeWidth={active ? '1.5' : '1'} 
                                    strokeDasharray={active ? 'none' : '2 2'}
                                    className="transition-all duration-300"
                                    opacity={active ? '0.4' : '0.15'}
                                  />

                                  {/* Interaction Column - Click to trigger year select */}
                                  <rect
                                    x={p.x - 45}
                                    y={10}
                                    width={90}
                                    height={170}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onClick={() => setSelectedStatsYear(p.year)}
                                  />
                                </g>
                              );
                            })}

                            {/* Outer Connecting Line */}
                            <path 
                              d={pathD} 
                              fill="none" 
                              stroke="#6366f1" 
                              strokeWidth="3" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                            />

                            {/* Year Nodes / Markers */}
                            {points.map((p) => {
                              const active = selectedStatsYear === p.year;
                              const isLive = p.year === 2026;
                              return (
                                <g key={p.year} className="cursor-pointer" onClick={() => setSelectedStatsYear(p.year)}>
                                  {/* Pulse circle behind active nodes */}
                                  {active && (
                                    <circle 
                                      cx={p.x} 
                                      cy={p.y} 
                                      r="11" 
                                      fill={isLive ? '#10b981' : '#6366f1'} 
                                      className="animate-ping" 
                                      opacity="0.3" 
                                    />
                                  )}
                                  
                                  {/* Dynamic outer rings */}
                                  <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={active ? '7' : '4.5'} 
                                    fill={active ? '#09090b' : (isLive ? '#10b981' : '#71717a')} 
                                    stroke={isLive ? '#10b981' : '#6366f1'}
                                    strokeWidth={active ? '3' : '2'}
                                    className="transition-all duration-300"
                                  />

                                  {/* Text values */}
                                  <text
                                    x={p.x}
                                    y={p.y - 13}
                                    fill={active ? '#ffffff' : '#a1a1aa'}
                                    fontSize="10"
                                    fontWeight={active ? 'bold' : 'normal'}
                                    fontFamily="monospace"
                                    textAnchor="middle"
                                    className="transition-all duration-300"
                                  >
                                    {p.cap} ({p.change})
                                  </text>

                                  {/* Labels */}
                                  <text
                                    x={p.x}
                                    y="188"
                                    fill={active ? '#818cf8' : '#52525b'}
                                    fontSize="11"
                                    fontWeight={active ? 'bold' : 'normal'}
                                    fontFamily="monospace"
                                    textAnchor="middle"
                                    className="transition-all duration-300"
                                  >
                                    {p.year}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Chosen Year Meta Statistics Cards */}
                  {(() => {
                    const yearlyStatsDetails: Record<number, {
                      total: number;
                      accepted: number;
                      rejected: number;
                      byPathway: { Zonasi: number; Prestasi: number; Afirmasi: number; Pindahan: number; Tes: number };
                      sd: number;
                      smp: number;
                      retention: string;
                      satisfaction: string;
                      theme: string;
                      growth: string;
                    }> = {
                      2023: {
                        total: 12450,
                        accepted: 9580,
                        rejected: 2870,
                        byPathway: { Zonasi: 6200, Prestasi: 3120, Afirmasi: 1870, Pindahan: 620, Tes: 640 },
                        sd: 5800,
                        smp: 6650,
                        retention: '77%',
                        satisfaction: '94.2%',
                        theme: 'Migrasi Cloud Mandiri',
                        growth: '+11.4% Baseline'
                      },
                      2024: {
                        total: 14890,
                        accepted: 11200,
                        rejected: 3695,
                        byPathway: { Zonasi: 7100, Prestasi: 3850, Afirmasi: 2150, Pindahan: 710, Tes: 1080 },
                        sd: 6950,
                        smp: 7940,
                        retention: '75%',
                        satisfaction: '95.8%',
                        theme: 'Validasi Berkas Otomatis',
                        growth: '+19.6% Yo-Yo'
                      },
                      2025: {
                        total: 16540,
                        accepted: 12500,
                        rejected: 4040,
                        byPathway: { Zonasi: 7850, Prestasi: 4210, Afirmasi: 2430, Pindahan: 780, Tes: 1270 },
                        sd: 7820,
                        smp: 8720,
                        retention: '76%',
                        satisfaction: '97.1%',
                        theme: 'Gale-Shapley Stable Marriage',
                        growth: '+11.1% Yo-Yo'
                      },
                      2026: {
                        total: (adminStats?.registrationsCount?.total || 0) + (adminStats?.registrationsCount?.draft || 0) + 16800,
                        accepted: (adminStats?.registrationsCount?.verified || 0) + 12900,
                        rejected: (adminStats?.registrationsCount?.rejected || 0) + 3900,
                        byPathway: {
                          Zonasi: (adminStats?.registrationsCount?.byPathway?.Zonasi || 0) + 8100,
                          Prestasi: (adminStats?.registrationsCount?.byPathway?.Prestasi || 0) + 4340,
                          Afirmasi: (adminStats?.registrationsCount?.byPathway?.Afirmasi || 0) + 2650,
                          Pindahan: (adminStats?.registrationsCount?.byPathway?.Pindahan || 0) + 820,
                          Tes: (adminStats?.registrationsCount?.byPathway?.Tes || 0) + 1310,
                        },
                        sd: schools.filter(s => s.name.toUpperCase().includes('SD')).reduce((acc, s) => acc + (s.applicantsCount || 0), 0) + 8140,
                        smp: schools.filter(s => s.name.toUpperCase().includes('SMP')).reduce((acc, s) => acc + (s.applicantsCount || 0), 0) + 9100,
                        retention: '78%',
                        satisfaction: '98.5%',
                        theme: 'AI vision & TKA Hybrid',
                        growth: '+2.8% Analitikal'
                      }
                    };

                    const currY = yearlyStatsDetails[selectedStatsYear] || yearlyStatsDetails[2026];

                    return (
                      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        {/* Bento statistics grids */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-zinc-950/40 border border-zinc-850/80 p-4 rounded-2xl">
                            <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold text-zinc-400 font-sans">Total Pendaftar Th. {selectedStatsYear}</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-xl font-bold font-mono text-white">{currY.total.toLocaleString('id-ID')}</span>
                              <span className="text-[9px] font-mono font-bold text-indigo-400">{currY.growth}</span>
                            </div>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-850/80 p-4 rounded-2xl">
                            <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold text-zinc-400 font-sans">Telah Diloloskan</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-xl font-bold font-mono text-emerald-400">{currY.accepted.toLocaleString('id-ID')}</span>
                              <span className="text-[9px] font-mono text-zinc-500">Siswa ({Math.round((currY.accepted / currY.total) * 100)}%)</span>
                            </div>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-850/80 p-4 rounded-2xl">
                            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold font-sans">Ditolak / Gugur</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-xl font-bold font-mono text-rose-450">{currY.rejected.toLocaleString('id-ID')}</span>
                              <span className="text-[9px] font-mono text-zinc-500">Siswa ({Math.round((currY.rejected / currY.total) * 100)}%)</span>
                            </div>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-850/80 p-4 rounded-2xl">
                            <span className="text-[9px] font-mono text-green-400 block uppercase font-bold font-sans">Teknologi Fokus Utama</span>
                            <span className="text-xs font-bold block mt-1.5 truncate text-white uppercase tracking-wider font-mono">{currY.theme}</span>
                          </div>
                        </div>

                        {/* Two Column details: Pathway spread and School level proportions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left: Pathway distribution horizontal stats */}
                          <div className="bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl space-y-4 text-left">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Proporsi Berdasarkan Jalur Masuk</span>
                            <div className="space-y-3.5 pt-1">
                              {[
                                { name: 'Jalur Zonasi Wilayah', val: currY.byPathway.Zonasi, color: 'bg-emerald-500' },
                                { name: 'Jalur Prestasi Rapor & TKA', val: currY.byPathway.Prestasi, color: 'bg-indigo-500' },
                                { name: 'Jalur Afirmasi Jaminan Sosial', val: currY.byPathway.Afirmasi, color: 'bg-amber-500' },
                                { name: 'Jalur Perpindahan Dinas Wali', val: currY.byPathway.Pindahan, color: 'bg-purple-500' },
                                { name: 'Ujian Tes Potensi Akademik', val: currY.byPathway.Tes, color: 'bg-rose-500' }
                              ].map((pw) => {
                                const pct = Math.round((pw.val / currY.total) * 100);
                                return (
                                  <div key={pw.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-zinc-400 font-sans font-medium">{pw.name}</span>
                                      <span className="font-mono text-zinc-300 font-bold">{pw.val.toLocaleString('id-ID')} ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className={`h-full ${pw.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right: School Level (SD vs SMP) and Satisfaction Index */}
                          <div className="bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between gap-5 text-left">
                            <div className="space-y-4">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">Distribusi Jenjang Lembaga Pendidikan</span>
                              
                              <div className="space-y-4 pt-1">
                                {/* SD Distribution */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                      <span className="text-zinc-300 font-medium font-sans">Tingkat Sekolah Dasar (SD)</span>
                                    </div>
                                    <span className="font-mono font-bold text-zinc-400">{currY.sd.toLocaleString('id-ID')} Siswa</span>
                                  </div>
                                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((currY.sd / (currY.sd + currY.smp)) * 100)}%` }} />
                                  </div>
                                </div>

                                {/* SMP Distribution */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                                      <span className="text-zinc-300 font-medium font-sans">Tingkat Sekolah Menengah (SMP)</span>
                                    </div>
                                    <span className="font-mono font-bold text-zinc-400">{currY.smp.toLocaleString('id-ID')} Siswa</span>
                                  </div>
                                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((currY.smp / (currY.sd + currY.smp)) * 100)}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom statistics indices */}
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-850/65">
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Indeks Kepuasan Berkas</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{currY.satisfaction}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Rasio Keketatan Kelulusan</span>
                                <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">{currY.retention}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 1.2: TAB 2 - TENTANG KAMI */}
            {publicTab === 'tentang' && (
              <div id="public_tab_tentang" className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
                  <div className="max-w-2xl">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">PROFIL ORGANISASI &amp; SISTEM</span>
                    <h2 className="text-3xl font-display font-black text-white mt-1 leading-tight">Teknologi SPMB Online Daerah Terbuka</h2>
                    <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                      Sistem Penerimaan Siswa/Mahasiswa Baru (SPMB) Online ini dibangun untuk mewujudkan asas keadilan sosial yang transparan. Berbekal teknologi pemetaan jarak presisi menggunakan <strong>Haversine GPS Formula</strong> dan model asinkron otomatis <strong>Cascading Priority Queue (Algoritma Gale-Shapley Adaptif)</strong>, pendaftaran diproses secara adil tanpa celah manipulasi berkas fisik.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-zinc-950/60 border border-zinc-800 p-5 rounded-2xl">
                      <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-400" /> Visi &amp; Komitmen Transparansi
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Mendukung kesetaraan pendidikan formal di tingkat provinsi dan daerah, memberikan jaminan bebas pungutan liar (pungli) dan manipulasi jarak kependudukan semu.
                      </p>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 p-5 rounded-2xl">
                      <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Otomasi Tinjauan Cerdas
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Kami mengintegrasikan module verifikasi berkas berbasis kecerdasan buatan (Gemini AI Vision Reviewer), mempercepat audit kesesuaian rapor pendaftar oleh tim kepanitiaan dinas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schools registered list directory layout in Bento block */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold font-display text-white">Direktori Lembaga Pendidikan Terdaftar</h3>
                    <p className="text-xs text-zinc-400">Daftar institusi sekolah sasaran resmi yang tergabung dalam jangkauan SPMB.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.map(s => (
                      <div key={s.id} className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
                            <School className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{s.name}</h4>
                            <span className="text-[9px] font-mono text-zinc-500">{s.address}</span>
                          </div>
                        </div>
                        
                        <div className="border-t border-zinc-800/80 pt-3 mt-2 grid grid-cols-5 gap-1.5 text-center">
                          {Object.entries(s.quotas).map(([pw, qty]) => (
                            <div key={pw} className="bg-zinc-900/40 py-1.5 px-1 rounded-lg border border-zinc-900">
                              <span className="block text-[7px] text-zinc-500 font-bold uppercase">{pw}</span>
                              <span className="block text-xs font-mono font-bold text-zinc-300 mt-0.5">{qty}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] text-right font-mono text-indigo-400 mt-2.5">
                          Total Daya Tampung: <strong>{s.totalQuotas} Kuota</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 1.3: TAB 3 - LAYANAN & SELEKSI */}
            {publicTab === 'layanan' && (
              <div id="public_tab_layanan" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* School Navigation Selector Column (Left) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 shadow-lg">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                      <School className="w-4 h-4 text-indigo-400" />
                      Pilih Sekolah Sasaran
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                      {schools.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-500">Mengambil data sekolah...</div>
                      ) : (
                        schools.map(s => (
                          <button
                            key={s.id}
                            id={`school_select_${s.id}`}
                            onClick={() => setSelectedSchoolId(s.id)}
                            className={`w-full text-left p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
                              selectedSchoolId === s.id 
                                ? 'bg-indigo-600/10 border border-indigo-500/40 text-white' 
                                : 'bg-zinc-950/40 border border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${selectedSchoolId === s.id ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                              <School className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold truncate">{s.name}</h4>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{s.address}</p>
                              <span className="inline-block text-[9px] font-mono mt-1 font-bold text-zinc-400">
                                Total Kuota: {s.totalQuotas} • Pendaftar: {s.applicantsCount || 0}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quota details cell */}
                  {selectedSchoolObj && (
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Distribusi Kuota</span>
                        <h4 className="text-sm font-bold text-zinc-200 mt-1">{selectedSchoolObj.name}</h4>
                        <p className="text-xs text-zinc-400 mt-1">Kuota terbagi berdasar jalur penilai resmi nasional:</p>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                        {(Object.keys(selectedSchoolObj.quotas) as Pathway[]).map(pw => (
                          <div key={pw} className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/70">
                            <span className="block text-[8px] font-bold text-zinc-500 uppercase">{pw}</span>
                            <span className="block text-sm font-bold font-mono text-indigo-400 mt-1">{selectedSchoolObj.quotas[pw]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Ranking Board Table Panel (Right) */}
                <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
                  
                  {/* Ranking Board Headers */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                    <div>
                      <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        Live Papan Pemeringkatan Realtime
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Pendaftar tersaring untuk {selectedSchoolObj?.name || 'Sekolah'} jalur {selectedPathway}
                      </p>
                    </div>

                    {/* Pathway filter navigation tabs */}
                    <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 overflow-x-auto shrink-0">
                      {(['Zonasi', 'Prestasi', 'Afirmasi', 'Pindahan', 'Tes'] as Pathway[]).map(pw => (
                        <button
                          key={pw}
                          id={`filter_pathway_${pw}`}
                          onClick={() => setSelectedPathway(pw)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            selectedPathway === pw 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {pw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listing Table */}
                  <div id="rankings_table_wrapper" className="mt-4 overflow-x-auto">
                    {currentFilteredRankings.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500">
                        <Clock className="w-10 h-10 mx-auto opacity-30 text-indigo-400 mb-3" />
                        <p className="text-sm font-semibold">Tidak Ada Pendaftar Terverifikasi</p>
                        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                          Belum ada berkas pendaftaran calon siswa yang lolos tahap verifikasi Operator Sekolah ini di jalur {selectedPathway}.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-zinc-800/60 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                            <th className="py-3 px-2">Peringkat</th>
                            <th className="py-3 px-3">Nama Lengkap</th>
                            <th className="py-3 px-3">NISN</th>
                            <th className="py-3 px-3">
                              {selectedPathway === 'Zonasi' || selectedPathway === 'Afirmasi' || selectedPathway === 'Pindahan' 
                                ? 'Jarak Udara' 
                                : 'Nilai Acuan'}
                            </th>
                            <th className="py-3 px-3">Status Antrean</th>
                            <th className="py-3 px-3">Penyeimbang (Tie-Breaker)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {currentFilteredRankings.map((item, index) => {
                            const isGraduated = item.status === 'Graduated_Choice1' || item.status === 'Graduated_Choice2';
                            const quotaLimit = selectedSchoolObj?.quotas[selectedPathway] || 0;
                            const inQuota = index < quotaLimit;

                            return (
                              <tr key={item.registrationId} className="hover:bg-zinc-850/30 text-xs font-medium text-zinc-300">
                                <td className="py-3.5 px-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                                      index === 0 
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                        : index === 1 
                                          ? 'bg-zinc-300/10 text-zinc-200 border border-zinc-400/20' 
                                          : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className="font-semibold text-zinc-100 block">{item.nama}</span>
                                </td>
                                <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-400">{item.nisn}</td>
                                <td className="py-3.5 px-3 font-mono text-[11px]">
                                  {selectedPathway === 'Zonasi' || selectedPathway === 'Afirmasi' || selectedPathway === 'Pindahan' ? (
                                    <span className="text-zinc-200 font-semibold">{item.distance} meter</span>
                                  ) : (
                                    <span className="text-zinc-200 font-semibold">{item.score} / 100</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  {systemPhase === 'Pengumuman' ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                      isGraduated 
                                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                                    }`}>
                                      {isGraduated ? 'Lulus' : 'Tidak Lulus'}
                                    </span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      inQuota 
                                        ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50' 
                                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                                    }`}>
                                      {inQuota ? 'Masuk Batas Kuota' : 'Tergeser Kuota'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-zinc-500 text-[10px]">
                                  {index > 0 ? (
                                    <span className="italic flex items-center gap-1">
                                      <Activity className="w-3 h-3 text-indigo-400/70" />
                                      {selectedPathway === 'Prestasi' ? 'Prioritas Matematika/Ind' : 'Prioritas Waktu Submit'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Footer and documentation marker */}
                  <div className="pt-4 border-t border-zinc-800/80 mt-6 flex justify-between items-center text-[10px] text-zinc-500">
                    <span>Data terenkripsi kuncian database server. Pembaruan 20 detik sekali.</span>
                    <span className="font-mono text-zinc-400 uppercase tracking-tighter">Verified by SPMB Security</span>
                  </div>

                </div>

              </div>
            )}

            {/* 1.4: TAB 4 - KONTAK (INTERACTIVE SUPPORT FORM) */}
            {publicTab === 'kontak' && (
              <div id="public_tab_kontak" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Left side info block */}
                <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Layanan Pengaduan &amp; Helpdesk</span>
                    <h2 className="text-2xl font-display font-black text-white mt-1 leading-tight">Hubungi Kami</h2>
                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      Mengalami ketidaksesuaian data Geocoding satelit rumah atau permasalahan Tarik Data NISN? Tim Helpdesk Dinas Pendidikan dan Panitia Pelaksana SPMB siap melayani Anda secara responsif.
                    </p>
                    
                    <div className="mt-8 space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-xl">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-500 font-mono">EMAIL RESMI DUADUANYA</span>
                          <span className="text-xs font-bold text-zinc-200">ppdb.support@daerah.go.id</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-xl">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-500 font-mono">HOTLINE SEKSI LAYANAN</span>
                          <span className="text-xs font-bold text-zinc-200">1500-PPDB / (021) 8889-1224</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-xl">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-zinc-500 font-mono">PUSAT DATA &amp; INFORMASI</span>
                          <span className="text-xs font-bold text-zinc-200">Gedung Ki Hajar Dewantara, Lantai III No 12, DKI Jakarta</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-6 mt-6">
                    <span className="block text-[10px] text-zinc-500 font-mono">OPERATIONAL HOURS:</span>
                    <p className="text-xs text-zinc-300 font-semibold mt-1">Senin - Jumat | 08:00 - 16:00 WIB</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Sabtu/Minggu layanan helpdesk dialihkan ke loket asisten chatbot AI pendaftaran.</p>
                  </div>
                </div>

                {/* Right side Form with comprehensive validation and confirmations */}
                <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
                  <h3 className="text-lg font-bold font-display text-white">Ajukan Formulir Hubungi Kami</h3>
                  <p className="text-xs text-zinc-400 mt-1">Kirim pesan Anda dan tim helpdesk akan merespon dalam waktu maksimal 1x24 jam.</p>
                  
                  <form 
                    id="contact_support_form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!contactName.trim()) {
                        showToast("Nama lengkap wajib diisi", "error");
                        return;
                      }
                      if (!contactEmail.trim() || !contactEmail.includes('@') || !contactEmail.includes('.')) {
                        showToast("Format e-mail tidak valid", "error");
                        return;
                      }
                      if (!contactSubject.trim()) {
                        showToast("Subjek pesan pengaduan wajib diisi", "error");
                        return;
                      }
                      if (contactMessage.trim().length < 10) {
                        showToast("Pesan minimal harus memuat 10 karakter penjelas", "error");
                        return;
                      }

                      // Successfully validated, toggle popup modal & clear state
                      setShowContactConfirm(true);
                      showToast("Formulir kontak berhasil disubmit! Tim akan mendisposisikan tiket pengaduan anda.", "success");
                    }} 
                    className="mt-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Masukkan nama lengkap anda"
                          className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">E-mail Balasan</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="contoh: budi@gmail.com"
                          className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Subjek Pengaduan / Pertanyaan</label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Contoh: Permasalahan Koordinat Satelit Locus Rumah"
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Isi Pesan Detil Pengaduan</label>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Ketik rincian pesan bantuan Anda secara terperinci (minimal 10 karakter)..."
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit_contact_btn"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-xs text-white transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Send className="w-4 h-4" /> Kirim Pengaduan Bantuan
                    </button>
                  </form>
                </div>

                {/* Form dispatch confirmation backdrop popup modal */}
                {showContactConfirm && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div id="contact_confirm_popup" className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-[fadeIn_0.20s_ease-out]">
                      <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                        <Check className="w-6 h-6 animate-pulse" />
                      </div>
                      
                      <h3 className="text-lg font-bold font-display text-white">Pengaduan Dikirim!</h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Terima kasih, <strong>{contactName}</strong>. Tiket laporan bantuan layanan Anda dengan subjek <em>"{contactSubject}"</em> telah berhasil direkam sistem dan didisposisikan ke staf helpdesk wilayah.
                      </p>

                      <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl mt-4 text-left font-mono text-[9px] text-zinc-400">
                        <span className="block text-zinc-500 uppercase tracking-wider font-bold mb-1">Rangkuman Tiket:</span>
                        <div>Email: <span className="text-zinc-200">{contactEmail}</span></div>
                        <div>Stasiun ID: <span className="text-zinc-200">{Math.floor(Math.random() * 90000) + 10000}</span></div>
                        <div>Antrean: <span className="text-emerald-400 font-bold">Priority Helpdesk</span></div>
                      </div>

                      <button
                        id="close_contact_confirm_btn"
                        onClick={() => {
                          setShowContactConfirm(false);
                          setContactName('');
                          setContactEmail('');
                          setContactSubject('');
                          setContactMessage('');
                        }}
                        className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all"
                      >
                        Selesai &amp; Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ==================== VIEW 2: AUTHORIZATION (LOGIN & REGISTER) PANEL ==================== */}
        {view === 'auth' && (
          <div id="view_auth_panel" className="max-w-md mx-auto w-full py-8">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between">
              
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-white shadow-xl">
                  {isRegisterMode ? <Award className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                </div>
                <h2 className="text-2xl font-bold font-display text-white">
                  {isRegisterMode ? 'Mendaftar Baru' : 'Masuk Portal Aplikasi'}
                </h2>
                <p className="text-xs text-zinc-400 mt-2">
                  {isRegisterMode 
                    ? 'Buat akun Anda dengan melakukan verifikasi email mandiri.' 
                    : 'Masuk dengan akun resmi Operator, Admin, atau Siswa terdaftar.'}
                </p>
              </div>

              {/* Verification lock out indicator */}
              {lockoutTimer && (
                <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center rounded-xl font-semibold">
                  Sistem Lockout: {lockoutTimer} menit tersisa karena serangan Brute Force terdeteksi.
                </div>
              )}

              <form onSubmit={handleAuthSubmit} id="auth_form" className="mt-6 space-y-4">
                
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">E-mail Resmi</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="email@spmb.go.id atau siswa@gmail.com"
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
                  />
                </div>

                {isRegisterMode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Tipe Hak Akses</label>
                      <select
                        value={authRole}
                        onChange={(e) => setAuthRole(e.target.value as Role)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none cursor-not-allowed opacity-80"
                        disabled
                      >
                        <option value="Siswa">Calon Siswa Baru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Jenjang Pendidikan</label>
                      <select
                        value={authLevel}
                        onChange={(e) => setAuthLevel(e.target.value as 'SD' | 'SMP')}
                        className="w-full bg-zinc-950/60 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      >
                        <option value="SD">Sekolah Dasar (SD)</option>
                        <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* OTP Verification block (if register state on) */}
                {isRegisterMode && otpSent && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl mt-3">
                    <label className="block text-[11px] font-mono text-indigo-300 uppercase mb-1">
                      Masukkan 6 Digit OTP (Lihat logs server!)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      placeholder="Contoh: 124563"
                      className="w-full tracking-widest text-center bg-zinc-950 border border-indigo-500/50 rounded-xl py-3 text-lg font-bold text-indigo-300 outline-none"
                    />
                    <span className="block text-[10px] text-indigo-400/80 mt-1.5 text-center leading-relaxed">
                      Redis system queue dispatcher asinkron aktif menguji validitas surat.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  id="submit_auth_btn"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 font-semibold rounded-xl text-sm transition-all text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
                  {isRegisterMode 
                    ? (otpSent ? 'Konfirmasi OTP & Registrasi' : 'Minta OTP / Daftar') 
                    : 'Masuk Kontrol Panel'}
                </button>

              </form>



              <div className="mt-6 border-t border-zinc-850 pt-4 text-center">
                <button
                  id="auth_mode_toggle_btn"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setOtpSent(false); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
                >
                  {isRegisterMode ? 'Sudah memiliki akun? Masuk' : 'Belum mendaftar? Buat Akun Siswa Baru'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================== VIEW 3: APPLICATION MAIN WORKSPACE ==================== */}
        {view === 'app' && user && (
          <div id="spmb_private_workspace" className="grid grid-cols-1 lg:grid-cols-[285px_1fr] gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 mb-12">
            
            {/* ====== WORKSPACE SIDEBAR ====== */}
            <aside id="workspace_sidebar_nav" className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
              <div className="space-y-6">
                
                {/* Branding Header */}
                <div className="border-b border-zinc-800/60 pb-4">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 block uppercase tracking-widest">
                    Sistem PPDB Online
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold font-display text-white">SPMB Panel Kerja</span>
                  </div>
                </div>

                {/* User Info Code */}
                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-850/60">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">Operator Sesi</span>
                  <p className="text-xs font-semibold text-zinc-300 mt-0.5 truncate" title={user.email}>{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Navigation Menus */}
                <div className="space-y-4">
                  {/* --- SISWA BAR --- */}
                  {user.role === 'Siswa' && (
                    <nav className="space-y-2">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block px-1">Menu Utama</span>
                      <button
                        type="button"
                        onClick={() => setSidebarActiveMenu('siswa_dashboard')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          sidebarActiveMenu === 'siswa_dashboard'
                            ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dasbor Kelulusan</span>
                      </button>

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block px-1 mb-1">Form Pendaftaran</span>
                        <div className="pl-2 border-l border-zinc-800 space-y-1">
                          {[
                            { step: 1, name: 'Biodata & NISN' },
                            { step: 2, name: 'Lokasi & Map' },
                            { step: 3, name: 'Persyaratan Jalur' },
                            { step: 4, name: 'Upload Berkas' }
                          ].map((s) => (
                            <button
                              key={s.step}
                              type="button"
                              onClick={() => {
                                setSidebarActiveMenu(`siswa_step${s.step}`);
                                setCurrentStep(s.step);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                                sidebarActiveMenu === `siswa_step${s.step}`
                                  ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-2.5'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className="font-mono text-[9px] w-4 h-4 rounded bg-zinc-950 flex items-center justify-center text-zinc-500">
                                {s.step}
                              </span>
                              <span>{s.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </nav>
                  )}

                  {/* --- OPERATOR BAR --- */}
                  {user.role === 'Operator' && (
                    <nav className="space-y-1.5">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block px-1 mb-1 font-bold text-zinc-400">Menu Utama</span>
                      <button
                        type="button"
                        onClick={() => setSidebarActiveMenu('operator_dashboard')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          sidebarActiveMenu === 'operator_dashboard'
                            ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dasbor Sekolah</span>
                      </button>

                      {/* Validasi Calon Berkas menu button is removed as verification is now done directly from SD/SMP lists with modal. */}

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block px-1 mb-1 font-bold text-zinc-400 font-sans">Data Pendaftaran</span>
                        <div className="pl-2 border-l border-zinc-805 space-y-1">
                          {(!user.schoolId || isSdOperator) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSidebarActiveMenu('operator_sd');
                                syncAllOperatorApplicants();
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                                sidebarActiveMenu === 'operator_sd'
                                  ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-3'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850/30'
                              }`}
                            >
                              <School className="w-3.5 h-3.5 shrink-0 text-emerald-400 animate-pulse" />
                              <span>Pendaftaran Tingkat SD</span>
                            </button>
                          )}
                          {(!user.schoolId || isSmpOperator) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSidebarActiveMenu('operator_smp');
                                syncAllOperatorApplicants();
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                                sidebarActiveMenu === 'operator_smp'
                                  ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-3'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850/30'
                              }`}
                            >
                              <School className="w-3.5 h-3.5 shrink-0 text-indigo-400 animate-pulse" />
                              <span>Pendaftaran Tingkat SMP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </nav>
                  )}

                  {/* --- ADMIN DINAS BAR & SUBMENUS --- */}
                  {user.role === 'Admin Dinas' && (
                    <nav className="space-y-2">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block px-1">Menu Utama</span>
                      <button
                        type="button"
                        onClick={() => setSidebarActiveMenu('dashboard')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          sidebarActiveMenu === 'dashboard'
                            ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Analisis PPDB</span>
                      </button>

                      <div className="pt-2">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase block px-1 mb-1 font-bold">Lembaga &amp; Sekolah</span>
                        <div className="pl-2 border-l border-zinc-800 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSidebarActiveMenu('schools-list');
                              setSchoolFormOpen(false);
                              setEditingSchool(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                              sidebarActiveMenu === 'schools-list'
                                ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-3'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            <School className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                            <span>Daftar / Tambah Sekolah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSidebarActiveMenu('schools-quotas');
                              setQuotaAddFormOpen(false);
                              setQuotaFormOpen(false);
                              setEditingSchool(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                              sidebarActiveMenu === 'schools-quotas'
                                ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-3'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Database className="w-3.5 h-3.5 shrink-0" />
                            <span>Alokasi Daya Tampung</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setSidebarActiveMenu('operators-list');
                              setOperatorFormEmail('');
                              setOperatorFormPassword('');
                              if (schools.length > 0) {
                                setOperatorFormSchoolId(schools[0].id);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                              sidebarActiveMenu === 'operators-list'
                                ? 'text-indigo-400 font-bold bg-indigo-950/40 border-l-2 border-indigo-500 pl-3'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-400 animate-pulse" />
                            <span>Kelola Akun Operator</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block px-1 mb-1">Utilitas</span>
                        <button
                          type="button"
                          onClick={() => setSidebarActiveMenu('system_control')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            sidebarActiveMenu === 'system_control'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
                          }`}
                        >
                          <Sliders className="w-4 h-4" />
                          <span>Timeline &amp; Engine</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarActiveMenu('audit_logs')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            sidebarActiveMenu === 'audit_logs'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          <span>Audit Logs Forensik</span>
                        </button>
                      </div>
                    </nav>
                  )}
                </div>
              </div>

              {/* Bottom logout */}
              <div className="pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out Sesi</span>
                </button>
              </div>
            </aside>

            {/* ====== WORKSPACE MAIN BODY ====== */}
            <div className="w-full flex flex-col gap-6 overflow-hidden">
            
            {/* 3.1: SISWA INTERACTION FLOWS */}
            {user.role === 'Siswa' && (
              <div id="siswa_workspace_block" className="flex flex-col gap-6">
                
                {/* 3.1.1: SISWA DASHBOARD TAB */}
                {sidebarActiveMenu === 'siswa_dashboard' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-[fadeIn_0.25s_ease-out]">
                    
                    {/* Status summary tracker column */}
                    <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-6">
                      {/* Realtime Submission Tracking Card */}
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Status Berkas Siswa</span>
                        <h2 className="text-xl font-display font-bold text-white mt-1">Status Pendaftaran</h2>
                        
                        {/* Interactive alert status tracker */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className={`p-4 rounded-2xl ${
                            localReg.status === 'Verified' 
                              ? 'bg-emerald-900/20 text-emerald-300 border border-emerald-500/30' 
                              : localReg.status === 'Pending'
                                ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                                : localReg.status === 'Rejected'
                                  ? 'bg-rose-900/20 text-rose-300 border border-rose-500/30'
                                  : localReg.status === 'Draft'
                                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                                    : 'bg-indigo-900/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {localReg.status === 'Verified' ? <CheckCircle className="w-6 h-6 animate-pulse" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase">{localReg.status || 'Draft'}</p>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                              {localReg.status === 'Draft' && 'Mengisi lembar draf formulir pendaftaran'}
                              {localReg.status === 'Pending' && 'Berkas terkirim. Menunggu verifikasi berkas operator.'}
                              {localReg.status === 'Verified' && 'Berkas lolos validasi operator sekolah. Data masuk antrean.'}
                              {localReg.status === 'Rejected' && 'Ditolak Operator! Lihat feedback dan edit draf Anda.'}
                              {['Graduated_Choice1', 'Graduated_Choice2', 'Not_Graduated'].includes(localReg.status || '') && 'Proses seleksi selesai.'}
                            </p>
                          </div>
                        </div>

                        {/* Rejected detail message with dynamic system unlock block */}
                        {localReg.status === 'Rejected' && (
                          <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                            <span className="font-bold uppercase tracking-wider block">Alasan Penolakan Operator:</span>
                            <p className="mt-1">{localReg.rejectionReason}</p>
                            <span className="block mt-2 text-[10px] text-zinc-400 underline decoration-rose-400 font-mono">
                              Modul edit &amp; unggah sertifikat kembali TERBUKA otomatis untuk revisi Anda.
                            </span>
                          </div>
                        )}

                        {/* Final declaration message */}
                        {['Graduated_Choice1', 'Graduated_Choice2', 'Not_Graduated'].includes(localReg.status || '') && (
                          <div className="mt-4 p-4 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                            <span className="text-[10px] font-mono text-indigo-400 block uppercase font-bold">Hasil Pengumuman Resmi</span>
                            <span className="text-lg font-bold block mt-1">
                              {localReg.status === 'Graduated_Choice1' && '🎉 Selamat! Anda DITERIMA di Pilihan 1'}
                              {localReg.status === 'Graduated_Choice2' && '🎉 Selamat! Anda DITERIMA di Pilihan 2'}
                              {localReg.status === 'Not_Graduated' && 'Maaf, Anda belum terakomodasi dalam kuota daya tampung.'}
                            </span>
                          </div>
                        )}
                        
                        {['Draft', 'Rejected'].includes(localReg.status || '') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSidebarActiveMenu('siswa_step1');
                              setCurrentStep(1);
                            }}
                            className="w-full mt-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10"
                          >
                            <span>Lanjutkan Formulir</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Guidelines and help sidebar */}
                    <div className="md:col-span-12 lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                      <h3 className="text-base font-bold font-display text-white">Panduan Pengisian Formulir PPDB</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Aplikasi PPDB Online mendukung penyaluran penempatan bersistem zonasi terkomputerisasi secara real-time. Ikuti tahapan di bawah ini untuk mengunci berkas Anda kedalam antrean:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60">
                          <span className="text-xs font-bold text-indigo-400">1. Biodata &amp; Dapodik</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            Gunakan NISN resmi 10-digit Anda untuk menarik data profil siswa utama di Dapodik secara online.
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60">
                          <span className="text-xs font-bold text-indigo-400">2. Geopositioning Locus</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            Tentukan titik koordinat rumah sesuai Kartu Keluarga guna perhitungan jarak Haversine ke sekolah pilihan.
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60">
                          <span className="text-xs font-bold text-indigo-400">3. Jalur &amp; Persyaratan</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            Pilih jalur masuk (Zonasi, Prestasi, Afirmasi) dan tetapkan prioritas Pilihan 1 dan Pilihan 2 sekolah Anda.
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60">
                          <span className="text-xs font-bold text-indigo-400">4. Unggah Pemberkasan</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            Lampirkan berkas scan KK, Kartu NISN dan dokumen pendukung asli lainnya berukuran maksimal 2MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Live competition details for student choices */}
                    <div id="siswa_competition_chart_card" className="col-span-12 bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold block">Analitik Real-time Antrean</span>
                          <h3 className="text-base font-bold font-display text-white mt-0.5">Statistik Daya Tampung vs Kompetisi Jalur Anda</h3>
                          <p className="text-xs text-zinc-400 mt-1">Estimasi persaingan riil berdasarkan kuota dan jumlah pendaftar saat ini pada jalur pendaftaran terpilih.</p>
                        </div>
                        <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </div>

                      {(!localReg.pilihan1Id) ? (
                        <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
                          <School className="w-8 h-8 text-zinc-650 mx-auto opacity-40 mb-2" />
                          <h4 className="text-xs font-semibold text-zinc-400">Belum Ada Sekolah Pilihan</h4>
                          <p className="text-[11px] text-zinc-500 mt-1">Selesaikan Tahap 3 Formulir untuk melihat statistik kompetisi secara langsung.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {/* Choice 1 School */}
                          {(() => {
                            const sch1 = schools.find(s => s.id === localReg.pilihan1Id);
                            const pathway = localReg.pathway || 'Zonasi';
                            const quota = sch1 ? ((sch1.quotas as any)?.[pathway] || 0) : 0;
                            const applicants = rankings.filter(r => r.schoolId === localReg.pilihan1Id && r.pathway === pathway).length;
                            const maxVal = Math.max(quota, applicants, 1);
                            const quotaPct = Math.round((quota / maxVal) * 100);
                            const appPct = Math.round((applicants / maxVal) * 100);
                            const ratio = quota > 0 ? (applicants / quota).toFixed(1) : '0';

                            return (
                              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850 space-y-4">
                                <div>
                                  <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">PILIHAN 1 - UTAMA</span>
                                  <h4 className="text-sm font-semibold text-white mt-1 truncate">{sch1 ? sch1.name : 'Sekolah Pilihan 1'}</h4>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">Jalur pendaftaran aktif: <strong className="text-zinc-200">{pathway}</strong></p>
                                </div>

                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-zinc-450">Kuota Jalur {pathway}</span>
                                      <span className="font-mono text-zinc-300 font-bold">{quota} Kursi</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-zinc-600 transition-all rounded-full" style={{ width: `${quotaPct}%` }}></div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-zinc-400">Akumulasi Pendaftar Jalur {pathway}</span>
                                      <span className="font-mono text-emerald-400 font-bold">{applicants} Siswa</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${appPct}%` }}></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2.5 border-t border-zinc-900 flex justify-between items-center text-[11px]">
                                  <span className="text-zinc-500">Tingkat Kepadatan:</span>
                                  <span className="font-mono font-bold text-indigo-400">
                                    {ratio} pendaftar / kursi
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Choice 2 School */}
                          {(() => {
                            const sch2 = localReg.pilihan2Id ? schools.find(s => s.id === localReg.pilihan2Id) : null;
                            if (!sch2) {
                              return (
                                <div className="bg-zinc-950/20 p-4 rounded-2xl border border-zinc-850/40 flex flex-col justify-center items-center text-center opacity-70">
                                  <Info className="w-6 h-6 text-zinc-650 mb-2" />
                                  <h4 className="text-xs font-semibold text-zinc-400">Pilihan 2 Kosong</h4>
                                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">Anda tidak menetapkan Pilihan 2. Kuota pendaftaran hanya disalurkan penuh ke Pilihan 1.</p>
                                </div>
                              );
                            }

                            const pathway = localReg.pathway || 'Zonasi';
                            const quota = (sch2.quotas as any)?.[pathway] || 0;
                            const applicants = rankings.filter(r => r.schoolId === localReg.pilihan2Id && r.pathway === pathway).length;
                            const maxVal = Math.max(quota, applicants, 1);
                            const quotaPct = Math.round((quota / maxVal) * 100);
                            const appPct = Math.round((applicants / maxVal) * 100);
                            const ratio = quota > 0 ? (applicants / quota).toFixed(1) : '0';

                            return (
                              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850 space-y-4">
                                <div>
                                  <span className="text-[10px] font-mono text-indigo-400 block uppercase font-bold">PILIHAN 2 - PENDUKUNG</span>
                                  <h4 className="text-sm font-semibold text-white mt-1 truncate">{sch2.name}</h4>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">Jalur pendaftaran aktif: <strong className="text-zinc-200">{pathway}</strong></p>
                                </div>

                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-zinc-450">Kuota Jalur {pathway}</span>
                                      <span className="font-mono text-zinc-300 font-bold">{quota} Kursi</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-zinc-650 transition-all rounded-full" style={{ width: `${quotaPct}%` }}></div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-zinc-400">Akumulasi Pendaftar Jalur {pathway}</span>
                                      <span className="font-mono text-indigo-400 font-bold">{applicants} Siswa</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 transition-all rounded-full" style={{ width: `${appPct}%` }}></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2.5 border-t border-zinc-900 flex justify-between items-center text-[11px]">
                                  <span className="text-zinc-500">Tingkat Kepadatan:</span>
                                  <span className="font-mono font-bold text-indigo-400">
                                    {ratio} pendaftar / kursi
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 3.1.2: SISWA FORM TABS (IF ACTIVE TAB IS STEP 1, 2, 3 OR 4) */}
                {sidebarActiveMenu.startsWith('siswa_step') && (
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-[fadeIn_0.25s_ease-out]">
                    
                    {/* Strict Read-Only lock warning if already submitted */}
                    {!['Draft', 'Rejected'].includes(localReg.status || '') ? (
                      <div className="text-center py-16">
                        <Shield className="w-16 h-16 mx-auto text-indigo-500 opacity-40 mb-4 animate-pulse" />
                        <h3 className="text-2xl font-bold font-display text-zinc-200">Formulir Dikunci Sistem</h3>
                        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                          Data anda sedang diproses dan status saat ini adalah <span className="font-mono text-indigo-400 uppercase font-extrabold">[{localReg.status}]</span>. Anda tidak diperkenankan merubah draf demi stabilitas verifikasi antrean Operator.
                        </p>
                        <button 
                          id="unlocked_read_back_btn"
                          onClick={() => setSidebarActiveMenu('siswa_dashboard')} 
                          className="mt-6 px-6 py-2.5 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-zinc-100 rounded-xl"
                        >
                          Kembali ke Ringkasan
                        </button>
                      </div>
                    ) : (
                    <div>
                      {/* Title block */}
                      <div className="border-b border-zinc-800 pb-4 mb-6">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          PBI-2.3 | Multi-Tab Wizard Form - Tahap {currentStep} dari 4
                        </span>
                        <h2 className="text-xl font-bold text-white font-display mt-0.5">
                          {currentStep === 1 && 'Biodata Utama & Validasi NISN'}
                          {currentStep === 2 && 'Geokoding Locus Rumah (Zonasi)'}
                          {currentStep === 3 && 'Pengisian Persyaratan Jalur PPDB'}
                          {currentStep === 4 && 'Pemberkasan Digital & Upload'}
                        </h2>
                      </div>

                      {/* STEP 1: VALIDATE NISN AND PULL DATA */}
                      {currentStep === 1 && (
                        <div id="wizard_step_1_wrap" className="space-y-4">
                          <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-850 flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                                Masukkan 10 Digit NISN Resmi Anda
                              </label>
                              <input
                                type="text"
                                maxLength={10}
                                value={localReg.nisn || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, nisn: e.target.value }))}
                                placeholder="Contoh: 1234567890"
                                className="w-full tracking-wider bg-zinc-900 border border-zinc-800 text-sm text-indigo-300 font-mono font-bold px-4 py-3 rounded-xl outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              id="btn_pull_nisn"
                              onClick={handleNisnPull}
                              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-xs text-white shrink-0 flex items-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" /> Tarik Data Dapodik
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Nama Lengkap Siswa</label>
                              <input
                                type="text"
                                value={localReg.nama || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, nama: e.target.value }))}
                                placeholder="Pengisian otomatis saat ditarik"
                                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">E-mail Aktif</label>
                              <input
                                type="email"
                                value={localReg.email || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Kontak email konfirmasi"
                                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">NIK (KTP/KK)</label>
                              <input
                                type="text"
                                value={localReg.nik || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, nik: e.target.value }))}
                                placeholder="16 digit nomor indok"
                                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Nomor Telepon Seluler</label>
                              <input
                                type="text"
                                value={localReg.phone || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Contoh: 0812xxxxxx"
                                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div className="mt-2">
                            <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Alamat Domisili Lengkap (Sesuai Kartu Keluarga)</label>
                            <textarea
                              rows={2}
                              value={localReg.address || ''}
                              onChange={(e) => setLocalReg(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Ketik alamat domisili anda terperinci..."
                              className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* STEP 2: MULTI-TAP GEOLOCATION AND RADAR MARKER */}
                      {currentStep === 2 && (
                        <div id="wizard_step_2_wrap" className="space-y-4">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Geser nilai koordinat presisi Anda di bawah untuk mensimulasikan GPS pin-pointer letak rumah pendaftar guna perhitungan jarak direct meter (rumus Haversine) menuju Sekolah Sasaran secara akurat.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/85">
                              <span className="block text-[9px] font-mono text-zinc-500 uppercase">Garis Lintang (Latitude)</span>
                              <span className="text-sm font-mono font-bold text-indigo-400 mt-1 block">{localReg.latitude}</span>
                            </div>
                            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/85">
                              <span className="block text-[9px] font-mono text-zinc-500 uppercase">Garis Bujur (Longitude)</span>
                              <span className="text-sm font-mono font-bold text-indigo-400 mt-1 block">{localReg.longitude}</span>
                            </div>
                            <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/40 flex items-center justify-center">
                              <span className="text-[10px] text-zinc-300 font-mono text-center">
                                Jarak SDN Menteng 01: <span className="font-bold text-indigo-300">{getHaversineDistance(localReg.latitude || -6.1, localReg.longitude || 106.8, -6.198305, 106.832943).toLocaleString()}m</span>
                              </span>
                            </div>
                          </div>

                          {/* Quick adjustment control buttons */}
                          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-3">
                            <span className="block text-xs font-semibold text-zinc-300 text-center">Simulasi Set Lokasi Rumah (Point drag)</span>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button 
                                type="button" 
                                id="offset_north_btn"
                                onClick={() => handleCoordOffset(0.005, 0)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded-lg"
                              >
                                Geser Utara (+Lat)
                              </button>
                              <button 
                                type="button" 
                                id="offset_south_btn"
                                onClick={() => handleCoordOffset(-0.005, 0)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded-lg"
                              >
                                Geser Selatan (-Lat)
                              </button>
                              <button 
                                type="button" 
                                id="offset_east_btn"
                                onClick={() => handleCoordOffset(0, 0.005)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded-lg"
                              >
                                Geser Timur (+Lng)
                              </button>
                              <button 
                                type="button" 
                                id="offset_west_btn"
                                onClick={() => handleCoordOffset(0, -0.005)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded-lg"
                              >
                                Geser Barat (-Lng)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: PATHWAY PRE-REQUISITES CHOOSE */}
                      {currentStep === 3 && (
                        <div id="wizard_step_3_wrap" className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Mata Jalur Pendaftaran</label>
                              <select 
                                value={localReg.pathway || 'Zonasi'}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, pathway: e.target.value as Pathway }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              >
                                <option value="Zonasi">Jalur Zonasi Terkunci (Peta)</option>
                                <option value="Prestasi">Jalur Prestasi (Rapor 30% + TKA 70%)</option>
                                <option value="Afirmasi">Jalur Afirmasi Jaminan Sosial</option>
                                <option value="Pindahan">Jalur Perpindahan Tugas Orang Tua</option>
                                <option value="Tes">Jalur Tes Ujian Tertulis Mandiri</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Pilihan Sekolah 1 (Suku Utama)</label>
                              <select
                                value={localReg.pilihan1Id || 1}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, pilihan1Id: parseInt(e.target.value) }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              >
                                {schools
                                  .filter(s => {
                                    if (user?.jenjang === 'SD') {
                                      return s.name.toUpperCase().includes('SD');
                                    } else if (user?.jenjang === 'SMP') {
                                      return s.name.toUpperCase().includes('SMP');
                                    }
                                    return true;
                                  })
                                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                }
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Pilihan Sekolah 2 (Suku Cadangan)</label>
                              <select
                                value={localReg.pilihan2Id || ''}
                                onChange={(e) => setLocalReg(prev => ({ ...prev, pilihan2Id: e.target.value ? parseInt(e.target.value) : null }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white"
                              >
                                <option value="">Tanpa Pilihan 2</option>
                                {schools
                                  .filter(s => {
                                    if (user?.jenjang === 'SD') {
                                      return s.name.toUpperCase().includes('SD');
                                    } else if (user?.jenjang === 'SMP') {
                                      return s.name.toUpperCase().includes('SMP');
                                    }
                                    return true;
                                  })
                                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                }
                              </select>
                            </div>
                          </div>

                          {/* DYNAMIC FORM SUBFIELDS BASED ON PATHWAYS SELECTION */}
                          <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-850 mt-4">
                            <span className="block text-[10px] font-mono text-indigo-400 uppercase font-bold mb-3">
                              Detail Persyaratan Khusus Jalur {localReg.pathway}
                            </span>

                            {localReg.pathway === 'Prestasi' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Rata-rata Nilai Rapor Akhir (SKOR RESMI - Bobot 30%)</label>
                                  <input
                                    type="number"
                                    max={100}
                                    min={0}
                                    step="0.01"
                                    value={localReg.raportAverage || ''}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, raportAverage: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Contoh: 89.5"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Skor Tes Kemampuan Akademik (TKA - Bobot 70%)</label>
                                  <input
                                    type="number"
                                    max={100}
                                    min={0}
                                    step="0.01"
                                    value={localReg.tkaScore || ''}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, tkaScore: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Contoh: 85.0"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold"
                                  />
                                </div>
                                <div className="sm:col-span-2 bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl flex items-center justify-between">
                                  <div>
                                    <span className="text-[11px] font-semibold text-zinc-300 block">Kalkulasi Skor Akhir Jalur Prestasi:</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">(Rapor * 30%) + (TKA * 70%)</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-indigo-400 font-mono">
                                      {(((localReg.raportAverage || 0) * 0.3) + ((localReg.tkaScore || 0) * 0.7)).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 block">Skor Kelulusan</span>
                                  </div>
                                </div>
                                <div className="sm:col-span-2 border-t border-zinc-850/65 pt-3 mt-1">
                                  <span className="block text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">Sertifikat Tambahan (Dokumen Pendukung)</span>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Skor Bobot Sertifikat Kejuaraan</label>
                                  <select
                                    value={localReg.certificateScore || 0}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, certificateScore: parseInt(e.target.value) }))}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
                                  >
                                    <option value="0">Tidak Ada Kejuaraan (0)</option>
                                    <option value="10">Juara Tingkat Kecamatan (+10)</option>
                                    <option value="20">Juara Tingkat Kabupaten (+20)</option>
                                    <option value="30">Juara Tingkat Provinsi (+30)</option>
                                    <option value="50">Juara Tingkat Nasional (+50)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Nama Bidang & Sertifikat Prestasi</label>
                                  <input
                                    type="text"
                                    value={localReg.certificateName || ''}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, certificateName: e.target.value }))}
                                    placeholder="Contoh: Olimpiade Fisika Nasional Juara 2"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
                                  />
                                </div>
                              </div>
                            )}

                            {localReg.pathway === 'Afirmasi' && (
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Nomor Kartu Jaminan Kesejahteraan Sosial (KIP / PKH / KKS)</label>
                                <input
                                  type="text"
                                  value={localReg.bansosNumber || ''}
                                  onChange={(e) => setLocalReg(prev => ({ ...prev, bansosNumber: e.target.value }))}
                                  placeholder="Contoh: KIP-9988114"
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-indigo-300"
                                />
                              </div>
                            )}

                            {localReg.pathway === 'Pindahan' && (
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Nomor Surat Keputusan (SK) Mutasi Tugas Instansi Dinas Ortu</label>
                                <input
                                  type="text"
                                  value={localReg.skPindahNumber || ''}
                                  onChange={(e) => setLocalReg(prev => ({ ...prev, skPindahNumber: e.target.value }))}
                                  placeholder="Contoh: SK.MUTASI/45/POLRI/2026"
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-indigo-300"
                                />
                              </div>
                            )}

                            {localReg.pathway === 'Tes' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Nilai Resmi Ujian Komparasi Daerah</label>
                                  <input
                                    type="number"
                                    value={localReg.examScore || ''}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, examScore: parseFloat(e.target.value) }))}
                                    placeholder="Skor 0-100"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Waktu Penyelesaian Lembar Ujian (Dalam Menit)</label>
                                  <input
                                    type="number"
                                    value={localReg.examDuration || ''}
                                    onChange={(e) => setLocalReg(prev => ({ ...prev, examDuration: parseInt(e.target.value) }))}
                                    placeholder="Contoh: 110"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
                                  />
                                </div>
                              </div>
                            )}

                            {localReg.pathway === 'Zonasi' && (
                              <p className="text-xs text-zinc-500 leading-relaxed">
                                Jalur ini tidak membutuhkan input angka atau teks persyaratan tambahan. Seleksi diurutkan sepenuhnya berdasarkan kedekatan meteran geolokasi domisili Anda ke pintu gerbang Sekolah sasaran pada menu Step 2.
                              </p>
                            )}

                          </div>
                        </div>
                      )}

                      {/* STEP 4: SECURE FILE UPLOAD PANEL */}
                      {currentStep === 4 && (
                        <div id="wizard_step_4_wrap" className="space-y-4">
                          <p className="text-xs text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 leading-relaxed">
                            PBI-2.4 | Terapkan Double Validation. Unggah salinan resolusi tinggi asli (tiap bekas maksimal berkapasitas 2MB dengan tipe PDF, JPEG/JPG, atau PNG).
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* KK Document Upload row */}
                            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col justify-between">
                              <div>
                                <span className="block text-xs font-bold text-zinc-200">Kartu Keluarga (Wajib Zonasi)</span>
                                <span className="block text-[10px] text-zinc-500 mt-0.5">Suku acuan koordinat alamat</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-900 pt-3">
                                {localReg.documents?.kk ? (
                                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Terunggah (Protected)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">Belum didaftarkan</span>
                                )}
                                <label className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg hover:text-white">
                                  Unggah
                                  <input type="file" onChange={(e) => triggerFileUpload(e, 'kk')} className="hidden" accept=".pdf,image/jpeg,image/png" />
                                </label>
                              </div>
                            </div>

                            {/* Ijazah Document row */}
                            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col justify-between">
                              <div>
                                <span className="block text-xs font-bold text-zinc-200">Ijazah Terakhir / Surat Lulus</span>
                                <span className="block text-[10px] text-zinc-500 mt-0.5">Pembuktian status alumni</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-900 pt-3">
                                {localReg.documents?.ijazah ? (
                                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Terunggah (Protected)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">Belum didaftarkan</span>
                                )}
                                <label className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg hover:text-white">
                                  Unggah
                                  <input type="file" onChange={(e) => triggerFileUpload(e, 'ijazah')} className="hidden" accept=".pdf,image/jpeg,image/png" />
                                </label>
                              </div>
                            </div>

                            {/* Conditional Doc Award Prestasi */}
                            {localReg.pathway === 'Prestasi' && (
                              <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col justify-between sm:col-span-2">
                                <div>
                                  <span className="block text-xs font-bold text-zinc-200">Sertifikat Piagam Penghargaan</span>
                                  <span className="block text-[10px] text-zinc-500 mt-0.5">Pendukung bobot pembobotan prestasi</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-900 pt-3">
                                  {localReg.documents?.certificate ? (
                                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Piagam piagam terunggah
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-zinc-500 font-mono">Input file sertifikat diperlukan</span>
                                  )}
                                  <label className="cursor-pointer px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg">
                                    Unggah Berkas Piagam
                                    <input type="file" onChange={(e) => triggerFileUpload(e, 'certificate')} className="hidden" />
                                  </label>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                      {/* Navigation buttons lower bar */}
                      <div className="mt-8 pt-4 border-t border-zinc-800/80 flex justify-between items-center">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveStudentForm('Draft')}
                            className="px-4 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-xs text-zinc-300 font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> Simpan Draft
                          </button>
                        </div>

                        <div className="flex gap-2.5">
                          {currentStep > 1 && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(prev => prev - 1)}
                              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold rounded-xl cursor-pointer"
                            >
                              Kembali
                            </button>
                          )}
                          {currentStep < 4 ? (
                            <button
                              type="button"
                              onClick={() => {
                                // Save draft on next click
                                saveStudentForm('Draft');
                                setCurrentStep(prev => prev + 1);
                              }}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-xl cursor-pointer"
                            >
                              Simpan &amp; Lanjut
                            </button>
                          ) : (
                            <button
                              type="button"
                              id="btn_submit_final"
                              onClick={() => saveStudentForm('Pending')}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer shadow-md text-white"
                            >
                              Ajukan Pendaftaran Utama
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

              </div>
            )}

            </div>
          )}

                        {/* 3.2: OPERATOR INTERACTION DASHBOARD */}
            {user.role === 'Operator' && (
              <div id="operator_workspace_block" className="flex flex-col gap-6 animate-[fadeIn_0.25s_ease-out]">
                
                {/* 3.2.1: OPERATOR SCHOOL DASHBOARD */}
                {sidebarActiveMenu === 'operator_dashboard' && (
                  <div className="space-y-6">
                    {/* School Info Bento Unit */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Workspace Operator SD/SMP</span>
                        <h1 className="text-xl font-display font-bold text-zinc-100 mt-1">
                          Operator Sekolah: {schools.find(s => s.id === user.schoolId)?.name || 'Sekolah Terpilih'}
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">{schools.find(s => s.id === user.schoolId)?.address}</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          id="operator_refresh_btn"
                          onClick={() => syncOperatorWorkspace(user.schoolId || 1)} 
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 font-mono text-xs text-zinc-300 rounded-xl flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Sinkron Data Berkas
                        </button>
                      </div>
                    </div>

                    {/* Operational Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Enrolled vs Total Capacity */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block font-bold">Total Daya Tampung</span>
                          <Database className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-4xl font-mono font-extrabold text-white">
                            {schools.find(s => s.id === user.schoolId)?.totalQuotas || 0} Kursi
                          </h4>
                          <span className="text-[11px] text-zinc-400 block leading-normal">
                            Alokasi sah kuota gabungan seluruh jalur yang dialokasikan Dinas Pendidikan.
                          </span>
                        </div>
                      </div>

                      {/* Quota breakdowns */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-3xl space-y-3 col-span-2">
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block font-bold mb-1">Rincian Jalur Terdaftar</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {[
                            { key: 'Zonasi', label: 'Zonasi', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' },
                            { key: 'Prestasi', label: 'Prestasi', color: 'text-indigo-400 bg-indigo-950/20 border-indigo-900/40' },
                            { key: 'Afirmasi', label: 'Afirmasi', color: 'text-amber-400 bg-amber-950/20 border-amber-900/40' },
                            { key: 'Pindahan', label: 'Pindahan', color: 'text-purple-400 bg-purple-950/20 border-purple-900/40' },
                            { key: 'Tes', label: 'Ujian Tes', color: 'text-rose-400 bg-rose-950/20 border-rose-900/40' }
                          ].map(item => {
                            const quotaVal = (schools.find(s => s.id === user.schoolId)?.quotas as any)?.[item.key] ?? 0;
                            return (
                              <div key={item.key} className={`p-3 rounded-2xl border text-center ${item.color}`}>
                                <span className="block text-[10px] font-mono uppercase font-bold">{item.label}</span>
                                <span className="block mt-1 text-lg font-mono font-extrabold">{quotaVal}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* OPERATOR STATISTICAL CHARTS */}
                    <div id="operator_statistical_charts_card" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Chart 1: Perbandingan Daya Tampung vs Pendaftar per Jalur */}
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Analisis Kuota vs Pendaftar Masuk</h3>
                            <p className="text-xs text-zinc-400 mt-0.5 font-sans">Perbandingan ketersediaan kursi dengan jumlah pemohon terdaftar per jalur.</p>
                          </div>
                          <BarChart3 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="space-y-4 pt-2">
                          {[
                            { key: 'Zonasi', label: 'Zonasi', color: 'from-emerald-500 to-teal-500', barBg: 'bg-emerald-500/10 border-emerald-500/20' },
                            { key: 'Prestasi', label: 'Prestasi', color: 'from-indigo-500 to-blue-500', barBg: 'bg-indigo-500/10 border-indigo-500/20' },
                            { key: 'Afirmasi', label: 'Afirmasi', color: 'from-amber-500 to-orange-500', barBg: 'bg-amber-500/10 border-amber-500/20' },
                            { key: 'Pindahan', label: 'Pindahan', color: 'from-purple-500 to-fuchsia-500', barBg: 'bg-purple-500/10 border-purple-500/20' },
                            { key: 'Tes', label: 'Ujian Tes', color: 'from-rose-500 to-pink-500', barBg: 'bg-rose-500/10 border-rose-500/20' }
                          ].map(item => {
                            const sch = schools.find(s => s.id === user.schoolId);
                            const quota = (sch?.quotas as any)?.[item.key] ?? 0;
                            const applicants = operatorApplicants.filter(r => r.pathway === item.key && r.status !== 'Draft').length;
                            
                            const maxVal = Math.max(quota, applicants, 1);
                            const quotaPercentage = Math.round((quota / maxVal) * 100);
                            const applicantsPercentage = Math.round((applicants / maxVal) * 100);

                            return (
                              <div key={item.key} className="space-y-1 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-855">
                                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                                  <span className="font-sans">Jalur {item.label}</span>
                                  <span className="text-[11px] font-mono">
                                    Pendaftar: <strong className="text-white">{applicants}</strong> / Kuota: <strong className="text-zinc-500">{quota}</strong>
                                  </span>
                                </div>
                                
                                <div className="space-y-1.5 pt-1">
                                  {/* Quota Bar */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-16 text-[9px] font-mono text-zinc-500 uppercase font-bold">KUOTA</span>
                                    <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-zinc-650 transition-all duration-550" 
                                        style={{ width: `${quotaPercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  {/* Applicants Bar */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-16 text-[9px] font-mono text-indigo-400 font-bold uppercase">PENDAFTAR</span>
                                    <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full bg-gradient-to-r ${item.color} transition-all duration-550 shadow-md`} 
                                        style={{ width: `${applicantsPercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chart 2: Proporsi Status Berkas Pendaftar */}
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-white">Statistik Kelayakan Berkas Masuk</h3>
                              <p className="text-xs text-zinc-400 mt-0.5 font-sans">Proporsi pembagian kualifikasi validitas dokumen yang diajukan.</p>
                            </div>
                            <PieChart className="w-5 h-5 text-emerald-400" />
                          </div>
                          
                          {/* Visual Chart Graphic (Custom SVG Ring/Circles) */}
                          <div className="py-8 flex flex-col sm:flex-row items-center justify-center gap-8">
                            {(() => {
                              const verified = operatorApplicants.filter(r => ['Verified', 'Graduated_Choice1', 'Graduated_Choice2', 'Not_Graduated'].includes(r.status)).length;
                              const pending = operatorApplicants.filter(r => r.status === 'Pending').length;
                              const rejected = operatorApplicants.filter(r => r.status === 'Rejected').length;
                              const draft = operatorApplicants.filter(r => r.status === 'Draft').length;
                              const total = verified + pending + rejected + draft || 1;

                              const pctVerified = (verified / total) * 100;
                              const pctPending = (pending / total) * 100;
                              const pctRejected = (rejected / total) * 100;
                              const pctDraft = (draft / total) * 100;

                              const radius = 40;
                              const circumference = 2 * Math.PI * radius;
                              
                              const strokeDashoffsetVerified = circumference - (pctVerified / 100) * circumference;
                              const strokeDashoffsetPending = circumference - (pctPending / 100) * circumference;
                              const strokeDashoffsetRejected = circumference - (pctRejected / 100) * circumference;

                              return (
                                <>
                                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90 bg-transparent" viewBox="0 0 100 100">
                                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#18181b" strokeWidth="10" />
                                      <circle 
                                        cx="50" 
                                        cy="50" 
                                        r={radius} 
                                        fill="transparent" 
                                        stroke="#10b981" 
                                        strokeWidth="10" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={strokeDashoffsetVerified}
                                        strokeLinecap="round"
                                        className="transition-all duration-700 hover:scale-105"
                                      />
                                      <circle 
                                        cx="50" 
                                        cy="50" 
                                        r={radius} 
                                        fill="transparent" 
                                        stroke="#f59e0b" 
                                        strokeWidth="10" 
                                        strokeDasharray={circumference} 
                                        strokeDashoffset={strokeDashoffsetPending + strokeDashoffsetVerified}
                                        strokeLinecap="round"
                                        className="transition-all duration-700" 
                                      />
                                    </svg>
                                    <div className="absolute text-center bg-transparent">
                                      <span className="block text-2xl font-mono font-extrabold text-white">{operatorApplicants.length}</span>
                                      <span className="block text-[8px] uppercase text-zinc-500 font-bold font-mono">Pendaftar</span>
                                    </div>
                                  </div>

                                  {/* Legend */}
                                  <div className="flex-1 space-y-3 w-full">
                                    {[
                                      { label: 'Terverifikasi Sah', count: verified, pct: Math.round(pctVerified), color: 'bg-emerald-500' },
                                      { label: 'Menunggu Antrean', count: pending, pct: Math.round(pctPending), color: 'bg-amber-500' },
                                      { label: 'Berkas Ditolak', count: rejected, pct: Math.round(pctRejected), color: 'bg-rose-500' },
                                      { label: 'Draf Pengisian', count: draft, pct: Math.round(pctDraft), color: 'bg-zinc-600' }
                                    ].map(lbl => (
                                      <div key={lbl.label} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${lbl.color}`} />
                                          <span className="text-zinc-400 text-[11px] truncate">{lbl.label}</span>
                                        </div>
                                        <span className="font-mono text-zinc-200 font-bold whitespace-nowrap">{lbl.count} <span className="text-zinc-550 text-[9.5px]">({lbl.pct}%)</span></span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Informasi diverifikasi langsung oleh dinas</span>
                          <span className="text-emerald-400 font-mono font-bold animate-pulse">● Aktif</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 3.2.2: OPERATOR ACTIVE VALIDATION QUEUE */}
                {sidebarActiveMenu === 'operator_queue' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left side: Queue of pending applicants */}
                    <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          Antrean Berkas Siswa Masuk
                        </h3>
                        {operatorApplicants.length > 0 && (
                          <button
                            type="button"
                            onClick={() => generateDummyApplicants(5)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 bg-indigo-950/25 px-2 py-1 rounded-lg border border-indigo-900/40"
                          >
                            ✨ Tambah 5 Dummy
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto">
                        {operatorApplicants.length === 0 ? (
                          <div className="py-8 px-4 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                            <p className="text-xs text-zinc-500">
                              Tidak ada berkas yang menunggu tindakan saat ini.
                            </p>
                            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850/60 max-w-sm mx-auto text-left space-y-1.5">
                              <span className="text-[10px] font-mono Pin-dot pulse bg-indigo-950 text-indigo-400 font-bold block text-center rounded py-0.5">💡 UJi COBA MODE VALIDASI</span>
                              <p className="text-[10.5px] text-zinc-400 leading-normal text-center">
                                Klik tombol di bawah untuk otomatis membuat data dummy calon siswa dengan surat pernyataan, kartu keluarga, dan nilai raport yang siap dinas-validasi.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => generateDummyApplicants(10)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 inline-flex items-center gap-1.5 mx-auto"
                            >
                              ✨ Bangkitkan 10 Data Dummy Siswa
                            </button>
                          </div>
                        ) : (
                          operatorApplicants.map(app => (
                            <button
                              key={app.id}
                              id={`operator_select_candidate_${app.id}`}
                              onClick={() => { setSelectedApplicant(app); setAiAnalysisResult(''); }}
                              className={`w-full text-left p-3.5 rounded-2xl flex items-start justify-between border transition-all ${
                                selectedApplicant?.id === app.id
                                  ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                                  : 'bg-zinc-950/45 border-zinc-900 hover:bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-bold block text-zinc-100">{app.nama}</span>
                                <span className="text-[10px] text-zinc-500 font-mono block mt-1">NISN: {app.nisn} • NIK: {app.nik}</span>
                                <span className="inline-block px-2 py-0.5 mt-2 bg-zinc-800 text-[9px] rounded-md font-bold text-indigo-400 uppercase">
                                  Jalur: {app.pathway}
                                </span>
                              </div>
                              
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                app.status === 'Verified' 
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' 
                                  : app.status === 'Rejected' 
                                    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30' 
                                    : 'bg-amber-955/60 text-amber-400 border border-amber-500/30'
                              }`}>
                                {app.status}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right side: Selected candidate validator panel */}
                    <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
                      {selectedApplicant ? (
                        <div className="space-y-5">
                          
                          {/* Name Card */}
                          <div className="border-b border-zinc-800 pb-4 flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Profil Review Siswa Baru</span>
                              <h2 className="text-xl font-bold font-display text-white mt-0.5">{selectedApplicant.nama}</h2>
                              <p className="text-xs text-zinc-400 mt-1">Diajukan lewat jalur resmi: <span className="font-bold text-zinc-200">{selectedApplicant.pathway}</span></p>
                            </div>
                          </div>

                          {/* Detail metadata bento block */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850 text-xs">
                            <div>
                              <span className="text-zinc-500 block text-[9px] font-mono">NISN DAPODIK</span>
                              <span className="font-mono text-zinc-200 block text-xs mt-0.5">{selectedApplicant.nisn}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[9px] font-mono">NIK PENDUDUK</span>
                              <span className="font-mono text-zinc-200 block text-xs mt-0.5">{selectedApplicant.nik}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[9px] font-mono">TELEPON WALI</span>
                              <span className="text-zinc-200 block text-xs mt-0.5">{selectedApplicant.phone || '-'}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-zinc-500 block text-[9px] font-mono">ALAMAT DOMISILI RUMAH SESUAI KTP/KK</span>
                              <span className="text-zinc-200 block text-xs mt-0.5 leading-relaxed">{selectedApplicant.address}</span>
                            </div>
                            <div className="col-span-3 pt-2 border-t border-zinc-900 flex justify-between text-[11px]">
                              <span>Metriks Jarak Koordinat GPS Locus:</span>
                              <span className="font-mono font-bold text-indigo-400">
                                {getHaversineDistance(
                                  selectedApplicant.latitude || -6.1, 
                                  selectedApplicant.longitude || 106.8, 
                                  schools.find(s => s.id === user.schoolId)?.latitude || -6.168541,
                                  schools.find(s => s.id === user.schoolId)?.longitude || 106.834015
                                )} meter ke Sekolah
                              </span>
                            </div>
                          </div>

                          {/* Pathway-specific Details (especially for Prestasi) */}
                          {selectedApplicant.pathway === 'Prestasi' && (
                            <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl space-y-2.5 mb-4">
                              <span className="text-xs font-bold text-emerald-400 block font-display">
                                Metrik Penilaian Jalur Prestasi
                              </span>
                              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                  <span className="text-zinc-500 block text-[9px] font-mono leading-none mb-1">RATA-RATA NILAI RAPOR (30%)</span>
                                  <span className="text-sm font-bold text-white font-mono">{selectedApplicant.raportAverage || 0}</span>
                                </div>
                                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                  <span className="text-zinc-500 block text-[9px] font-mono leading-none mb-1">TES KEMAMPUAN AKADEMIK (TKA - 70%)</span>
                                  <span className="text-sm font-bold text-white font-mono">{selectedApplicant.tkaScore || 0}</span>
                                </div>
                                <div className="col-span-2 bg-emerald-950/35 border border-emerald-900/30 p-2.5 rounded-lg flex items-center justify-between">
                                  <div>
                                    <span className="text-[11px] text-zinc-300 font-semibold block leading-tight">Total Skor Gabungan Akhir:</span>
                                    <span className="text-[9px] text-zinc-500 font-mono">(Rapor * 30%) + (TKA * 70%)</span>
                                  </div>
                                  <span className="text-lg font-bold text-emerald-400 font-mono">
                                    {(((selectedApplicant.raportAverage || 0) * 0.3) + ((selectedApplicant.tkaScore || 0) * 0.7)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              {selectedApplicant.certificateName && (
                                <div className="p-2.5 bg-zinc-950/30 border border-zinc-850 rounded-lg text-xs leading-normal">
                                  <span className="text-zinc-500 block text-[9px] font-mono uppercase">Sertifikat Pendukung</span>
                                  <span className="font-semibold text-zinc-300 mt-0.5 block">{selectedApplicant.certificateName}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">Skor Bobot Piagam: +{selectedApplicant.certificateScore || 0} Poin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedApplicant.pathway === 'Tes' && (
                            <div className="bg-indigo-950/20 border border-indigo-500/25 p-4 rounded-xl space-y-2 mb-4">
                              <span className="text-xs font-bold text-indigo-400 block font-display">Metrik Ujian Tertulis</span>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                  <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">SKOR UJIAN TES</span>
                                  <span className="text-sm font-bold text-indigo-300 font-mono">{selectedApplicant.examScore || 0}</span>
                                </div>
                                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                  <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">DURASI PENGERJAAN</span>
                                  <span className="text-sm font-bold text-zinc-300 font-mono">{selectedApplicant.examDuration || 0} Menit</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedApplicant.pathway === 'Afirmasi' && selectedApplicant.bansosNumber && (
                            <div className="bg-rose-950/20 border border-rose-500/25 p-4 rounded-xl space-y-1 mb-4">
                              <span className="text-xs font-bold text-rose-450 block font-display">Jaminan Sosial / Afirmasi</span>
                              <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">NOMOR KARTU KESISWAAN/BANSOS</span>
                                <span className="text-sm font-bold text-rose-450 font-mono">{selectedApplicant.bansosNumber}</span>
                              </div>
                            </div>
                          )}

                          {selectedApplicant.pathway === 'Pindahan' && selectedApplicant.skPindahNumber && (
                            <div className="bg-amber-950/20 border border-amber-500/25 p-4 rounded-xl space-y-1 mb-4">
                              <span className="text-xs font-bold text-amber-450 block font-display">Mutasi Orang Tua / Pindahan</span>
                              <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                                <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">NOMOR SURAT KEPUTUSAN PINDAH TUGAS</span>
                                <span className="text-sm font-bold text-amber-450 font-mono">{selectedApplicant.skPindahNumber}</span>
                              </div>
                            </div>
                          )}

                          {/* Gemini Assistant reviewer evaluation module */}
                          <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-display">
                                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                                Asisten AI Verifikator Dinas
                              </span>
                              <button 
                                id="gemini_ask_btn_operator"
                                onClick={() => askGeminiReviewer(selectedApplicant)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 font-mono text-[10px] text-white rounded-lg"
                              >
                                Minta Tinjauan AI
                              </button>
                            </div>
                            {aiAnalysisResult ? (
                              <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/40 p-3 rounded-lg border border-indigo-900/50">
                                {aiAnalysisResult}
                              </p>
                            ) : (
                              <p className="text-[11px] text-indigo-400">klik tombol diatas untuk menjembatani evaluasi berkas via kecerdasan buatan.</p>
                            )}
                          </div>

                          {/* Document checker digital block */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-zinc-300 block">Berkas Pendukung Terlampir (Secure View)</span>
                            <div id="operator_document_inspect" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.keys(selectedApplicant.documents || {}).map(docKey => {
                                const doc = (selectedApplicant.documents as any)[docKey];
                                return (
                                  <div key={docKey} className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-bold text-zinc-350 block capitalize">{docKey}</span>
                                      <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">{(doc.size/1024).toFixed(1)} KB</span>
                                    </div>
                                    <a 
                                      href={`/api/document/${doc.name}?userId=${selectedApplicant.userId}&requesterRole=Operator`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-mono text-zinc-300 hover:text-white"
                                    >
                                      Tinjau File
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Decisive Button Options */}
                          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                            <button
                              type="button"
                              id="btn_operator_rejection_trigger"
                              onClick={() => {
                                setRejectReasonInput('');
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-2.5 bg-rose-955/40 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl"
                            >
                              Tolak Berkas
                            </button>
                            <button
                              type="button"
                              id="btn_operator_approve"
                              onClick={() => processOperatorDecision(selectedApplicant.id, 'Verify')}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                            >
                              Setujui &amp; Verifikasi Berkas
                            </button>
                          </div>

                        </div>
                      ) : (
                        <div className="py-24 text-center">
                          <LayoutDashboard className="w-12 h-12 text-zinc-650 mx-auto opacity-30 mb-3" />
                          <h4 className="text-sm font-semibold text-zinc-400">Reviewer Standby</h4>
                          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                            Silakan klik salah satu berkas masuk pendaftaran siswa di kolom kiri untuk diproses verifikasinya.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 3.2.3: OPERATOR SD REGISTRATIONS VIEW */}
                {sidebarActiveMenu === 'operator_sd' && (
                  <div className="space-y-6">
                    {/* Header bar card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Pemantauan Tingkat Dasar</span>
                        <h1 className="text-xl font-display font-bold text-zinc-100 mt-1 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Data Pendaftaran Tingkat SD (Sekolah Dasar)
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">Memantau seluruh pengajuan masuk calon siswa baru pada semua sekolah dasar negeri di dalam sistem.</p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button 
                          id="sync_op_sd_btn"
                          type="button"
                          onClick={syncAllOperatorApplicants} 
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 font-mono text-xs text-zinc-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Sinkron Data
                        </button>
                      </div>
                    </div>

                    {/* Filter Widget */}
                    <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari Nama, NIK, atau NISN..."
                          value={sdSearch}
                          onChange={(e) => setSdSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Pathway selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 whitespace-nowrap">Jalur:</span>
                        <select
                          value={sdPathwayFilter}
                          onChange={(e) => setSdPathwayFilter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 outline-none focus:border-emerald-500"
                        >
                          <option value="All">Semua Jalur</option>
                          <option value="Zonasi">Zonasi</option>
                          <option value="Prestasi">Prestasi</option>
                          <option value="Afirmasi">Afirmasi</option>
                          <option value="Pindahan">Pindahan</option>
                          <option value="Tes">Ujian Tes</option>
                        </select>
                      </div>

                      {/* Status selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 whitespace-nowrap">Status:</span>
                        <select
                          value={sdStatusFilter}
                          onChange={(e) => setSdStatusFilter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 outline-none focus:border-emerald-500"
                        >
                          <option value="All">Semua Status</option>
                          <option value="Pending">Pending (Menunggu)</option>
                          <option value="Verified">Verified (Diterima)</option>
                          <option value="Rejected">Rejected (Ditolak)</option>
                        </select>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-805 bg-zinc-950/40 text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                              <th className="py-4 px-5 font-bold w-12 text-center">No</th>
                              <th className="py-4 px-4 font-bold">Calon Siswa</th>
                              <th className="py-4 px-4 font-bold">Identitas / No</th>
                              <th className="py-4 px-4 font-bold">Sekolah Pilihan 1 &amp; 2</th>
                              <th className="py-4 px-4 font-bold">Jalur &amp; Skor Metrik</th>
                              <th className="py-4 px-4 font-bold text-center">Status Berkas</th>
                              <th className="py-4 px-5 font-bold text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50 text-xs text-zinc-300">
                            {(() => {
                              const rawSdRegistrations = allOperatorApplicants.filter(r => {
                                const sch = schools.find(s => s.id === r.pilihan1Id);
                                return sch && (sch.name.toLowerCase().includes('sd') || sch.name.toLowerCase().includes('sdn'));
                              });

                              const filteredSdRegistrations = rawSdRegistrations.filter(r => {
                                const matchesSearch = r.nama.toLowerCase().includes(sdSearch.toLowerCase()) || 
                                                      r.nisn.includes(sdSearch) || 
                                                      r.nik.includes(sdSearch);
                                const matchesPathway = sdPathwayFilter === 'All' || r.pathway === sdPathwayFilter;
                                const matchesStatus = sdStatusFilter === 'All' || r.status === sdStatusFilter;
                                return matchesSearch && matchesPathway && matchesStatus;
                              });

                              if (filteredSdRegistrations.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-medium">
                                      Tidak ada data pendaftar SD yang cocok dengan filter pencarian.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredSdRegistrations.map((r, index) => {
                                const school1 = schools.find(s => s.id === r.pilihan1Id);
                                const school2 = schools.find(s => s.id === r.pilihan2Id);
                                
                                return (
                                  <tr key={r.id} className="hover:bg-zinc-950/35 transition-colors group">
                                    <td className="py-4 px-5 text-center font-mono text-zinc-500 text-[11px] font-bold group-hover:text-emerald-400 transition-colors">
                                      {index + 1}
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="font-bold text-zinc-200 block group-hover:text-white transition-colors">
                                        {r.nama}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 block mt-0.5">{r.email}</span>
                                    </td>
                                    <td className="py-4 px-4 font-mono text-[11px] space-y-0.5">
                                      <span className="text-zinc-350 block">NISN: <span className="text-emerald-400 font-bold">{r.nisn}</span></span>
                                      <span className="text-zinc-500 block">NIK: {r.nik}</span>
                                    </td>
                                    <td className="py-4 px-4 text-[11px] space-y-1">
                                      <span className="text-zinc-300 block font-medium">1. {school1?.name || `ID school: ${r.pilihan1Id}`}</span>
                                      {school2 ? (
                                        <span className="text-zinc-550 block">2. {school2?.name}</span>
                                      ) : (
                                        <span className="text-zinc-600 block italic">2. Tidak ada Pilihan Kedua</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 font-mono text-[10.5px]">
                                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 uppercase mb-1">
                                        {r.pathway}
                                      </span>
                                      {/* Specific Pathway details */}
                                      <span className="block mt-1 text-[10.5px] font-mono text-zinc-405">
                                        {r.pathway === 'Prestasi' && `Rapor: ${r.raportAverage || 0} | TKA: ${r.tkaScore || 0} (Skor: ${(((r.raportAverage || 0) * 0.3) + ((r.tkaScore || 0) * 0.7)).toFixed(2)})`}
                                        {r.pathway === 'Zonasi' && `Koord Jarak`}
                                        {r.pathway === 'Afirmasi' && `KIP: ${r.bansosNumber || '-'}`}
                                        {r.pathway === 'Pindahan' && `SK: ${r.skPindahNumber || '-'}`}
                                        {r.pathway === 'Tes' && `Skor Ujian: ${r.examScore || 0}`}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                                        r.status === 'Verified' 
                                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20' 
                                          : r.status === 'Rejected' 
                                            ? 'bg-rose-955/80 text-rose-400 border border-rose-500/20' 
                                            : 'bg-amber-955/80 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {r.status}
                                      </span>
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedApplicant(r);
                                          setAiAnalysisResult('');
                                          setShowReviewModal(true);
                                          showToast(`Memuat data review ${r.nama}`, "info");
                                        }}
                                        className="p-1.5 px-3 bg-zinc-800 hover:bg-emerald-600 border border-zinc-700/50 hover:border-emerald-500 text-[10.5px] font-bold text-zinc-200 hover:text-white rounded-lg transition-all shadow shadow-black/10 inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <FileCheck className="w-3.5 h-3.5" /> Verifikasi
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.2.4: OPERATOR SMP REGISTRATIONS VIEW */}
                {sidebarActiveMenu === 'operator_smp' && (
                  <div className="space-y-6">
                    {/* Header bar card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Pemantauan Tingkat Menengah</span>
                        <h1 className="text-xl font-display font-bold text-zinc-100 mt-1 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          Data Pendaftaran Tingkat SMP (Sekolah Menengah Pertama)
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">Memantau seluruh pengajuan masuk calon siswa baru pada semua sekolah menengah pertama negeri di dalam sistem.</p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button 
                          id="sync_op_smp_btn"
                          type="button"
                          onClick={syncAllOperatorApplicants} 
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 font-mono text-xs text-zinc-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Sinkron Data
                        </button>
                      </div>
                    </div>

                    {/* Filter Widget */}
                    <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari Nama, NIK, atau NISN..."
                          value={smpSearch}
                          onChange={(e) => setSmpSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Pathway selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 whitespace-nowrap">Jalur:</span>
                        <select
                          value={smpPathwayFilter}
                          onChange={(e) => setSmpPathwayFilter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 outline-none focus:border-indigo-500"
                        >
                          <option value="All">Semua Jalur</option>
                          <option value="Zonasi">Zonasi</option>
                          <option value="Prestasi">Prestasi</option>
                          <option value="Afirmasi">Afirmasi</option>
                          <option value="Pindahan">Pindahan</option>
                          <option value="Tes">Ujian Tes</option>
                        </select>
                      </div>

                      {/* Status selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 whitespace-nowrap">Status:</span>
                        <select
                          value={smpStatusFilter}
                          onChange={(e) => setSmpStatusFilter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 outline-none focus:border-indigo-500"
                        >
                          <option value="All">Semua Status</option>
                          <option value="Pending">Pending (Menunggu)</option>
                          <option value="Verified">Verified (Diterima)</option>
                          <option value="Rejected">Rejected (Ditolak)</option>
                        </select>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-805 bg-zinc-950/40 text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                              <th className="py-4 px-5 font-bold w-12 text-center">No</th>
                              <th className="py-4 px-4 font-bold">Calon Siswa</th>
                              <th className="py-4 px-4 font-bold">Identitas / No</th>
                              <th className="py-4 px-4 font-bold">Sekolah Pilihan 1 &amp; 2</th>
                              <th className="py-4 px-4 font-bold">Jalur &amp; Skor Metrik</th>
                              <th className="py-4 px-4 font-bold text-center">Status Berkas</th>
                              <th className="py-4 px-5 font-bold text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50 text-xs text-zinc-300">
                            {(() => {
                              const rawSmpRegistrations = allOperatorApplicants.filter(r => {
                                const sch = schools.find(s => s.id === r.pilihan1Id);
                                return sch && sch.name.toLowerCase().includes('smp');
                              });

                              const filteredSmpRegistrations = rawSmpRegistrations.filter(r => {
                                const matchesSearch = r.nama.toLowerCase().includes(smpSearch.toLowerCase()) || 
                                                      r.nisn.includes(smpSearch) || 
                                                      r.nik.includes(smpSearch);
                                const matchesPathway = smpPathwayFilter === 'All' || r.pathway === smpPathwayFilter;
                                const matchesStatus = smpStatusFilter === 'All' || r.status === smpStatusFilter;
                                return matchesSearch && matchesPathway && matchesStatus;
                              });

                              if (filteredSmpRegistrations.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-medium">
                                      Tidak ada data pendaftar SMP yang cocok dengan filter pencarian.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredSmpRegistrations.map((r, index) => {
                                const school1 = schools.find(s => s.id === r.pilihan1Id);
                                const school2 = schools.find(s => s.id === r.pilihan2Id);
                                
                                return (
                                  <tr key={r.id} className="hover:bg-zinc-950/35 transition-colors group">
                                    <td className="py-4 px-5 text-center font-mono text-zinc-500 text-[11px] font-bold group-hover:text-indigo-400 transition-colors">
                                      {index + 1}
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="font-bold text-zinc-200 block group-hover:text-white transition-colors">
                                        {r.nama}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 block mt-0.5">{r.email}</span>
                                    </td>
                                    <td className="py-4 px-4 font-mono text-[11px] space-y-0.5">
                                      <span className="text-zinc-350 block">NISN: <span className="text-indigo-400 font-bold">{r.nisn}</span></span>
                                      <span className="text-zinc-550 block">NIK: {r.nik}</span>
                                    </td>
                                    <td className="py-4 px-4 text-[11px] space-y-1">
                                      <span className="text-zinc-300 block font-medium">1. {school1?.name || `ID school: ${r.pilihan1Id}`}</span>
                                      {school2 ? (
                                        <span className="text-zinc-550 block">2. {school2?.name}</span>
                                      ) : (
                                        <span className="text-zinc-600 block italic">2. Tidak ada Pilihan Kedua</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 font-mono text-[10.5px]">
                                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-indigo-950/20 text-indigo-400 border border-indigo-900/40 uppercase mb-1">
                                        {r.pathway}
                                      </span>
                                      {/* Specific Pathway details */}
                                      <span className="block mt-1 text-[10.5px] font-mono text-zinc-405">
                                        {r.pathway === 'Prestasi' && `Rapor: ${r.raportAverage || 0} | TKA: ${r.tkaScore || 0} (Skor: ${(((r.raportAverage || 0) * 0.3) + ((r.tkaScore || 0) * 0.7)).toFixed(2)})`}
                                        {r.pathway === 'Zonasi' && `Koord Jarak`}
                                        {r.pathway === 'Afirmasi' && `KIP: ${r.bansosNumber || '-'}`}
                                        {r.pathway === 'Pindahan' && `SK: ${r.skPindahNumber || '-'}`}
                                        {r.pathway === 'Tes' && `Skor Ujian: ${r.examScore || 0}`}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                                        r.status === 'Verified' 
                                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20' 
                                          : r.status === 'Rejected' 
                                            ? 'bg-rose-955/80 text-rose-400 border border-rose-500/20' 
                                            : 'bg-amber-955/80 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {r.status}
                                      </span>
                                    </td>
                                    <td className="py-4 px-5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedApplicant(r);
                                          setAiAnalysisResult('');
                                          setShowReviewModal(true);
                                          showToast(`Memuat data review ${r.nama}`, "info");
                                        }}
                                        className="p-1.5 px-3 bg-zinc-800 hover:bg-indigo-600 border border-zinc-700/50 hover:border-indigo-500 text-[10.5px] font-bold text-zinc-200 hover:text-white rounded-lg transition-all shadow shadow-black/10 inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <FileCheck className="w-3.5 h-3.5" /> Verifikasi
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
                  {/* 3.3 ADMINISTRATIVE DINAS DASHBOARD CONTROL PANEL */}
            {user.role === 'Admin Dinas' && (
              <div id="admin_workspace_block" className="flex flex-col gap-6 animate-[fadeIn_0.25s_ease-out]">
                
                {/* 3.3.1: ANALYSIS PPDB DASHBOARD */}
                {sidebarActiveMenu === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Global Summary statistics count */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Total Pendaftar Resmi</span>
                        <span className="text-2xl font-bold block mt-1 font-mono text-white">
                          {adminStats?.registrationsCount?.total || 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Draf Sementara</span>
                        <span className="text-2xl font-bold block mt-1 font-mono text-zinc-400 font-bold">
                          {adminStats?.registrationsCount?.draft || 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Menunggu Verifikasi</span>
                        <span className="text-2xl font-bold block mt-1 font-mono text-amber-400 font-bold">
                          {adminStats?.registrationsCount?.pending || 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Telah Diverifikasi</span>
                        <span className="text-2xl font-bold block mt-1 font-mono text-emerald-400 font-bold">
                          {adminStats?.registrationsCount?.verified || 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl col-span-2 md:col-span-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Pendaftaran Ditolak</span>
                        <span className="text-2xl font-bold block mt-1 font-mono text-rose-400 font-bold">
                          {adminStats?.registrationsCount?.rejected || 0}
                        </span>
                      </div>
                    </div>

                    {/* Dashboard Charts & Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pathway breakdown overview */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                        <h3 className="text-sm font-semibold text-white">Proporsi Distribusi Jalur Calon Siswa</h3>
                        <p className="text-xs text-zinc-400">Total pendaftaran masuk dinamis terdistribusi sebagai berikut:</p>
                        <div className="space-y-3 pt-2">
                          {[
                            { name: 'Afirmasi', val: adminStats?.registrationsCount?.byPathway?.Afirmasi || 0, color: 'bg-amber-500' },
                            { name: 'Zonasi', val: adminStats?.registrationsCount?.byPathway?.Zonasi || 0, color: 'bg-emerald-500' },
                            { name: 'Prestasi', val: adminStats?.registrationsCount?.byPathway?.Prestasi || 0, color: 'bg-indigo-500' },
                            { name: 'Pindahan Orang Tua', val: adminStats?.registrationsCount?.byPathway?.Pindahan || 0, color: 'bg-purple-500' },
                            { name: 'Ujian Tes', val: adminStats?.registrationsCount?.byPathway?.Tes || 0, color: 'bg-rose-500' }
                          ].map(pw => {
                            const total = adminStats?.registrationsCount?.total || 1;
                            const pct = Math.round((pw.val / total) * 100);
                            return (
                              <div key={pw.name} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-zinc-300 font-medium">{pw.name}</span>
                                  <span className="font-mono text-zinc-400 font-bold">{pw.val} ({pct}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                                  <div className={`h-full ${pw.color}`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary text info card */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-3xl flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-white">Panduan Pengawasan Dinas</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Sebagai Administrator Dinas Pendidikan, Anda memantau seluruh antrean data secara terpusat. Gunakan sub-menu di bilah samping kiri untuk mendayagunakan hal berikut:
                          </p>
                          <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 leading-normal">
                            <li><strong className="text-zinc-200">Daftar / Tambah Sekolah:</strong> Daftarkan lembaga sekolah dasar dan menengah baru di peta wilayah Anda.</li>
                            <li><strong className="text-zinc-200">Alokasi Daya Tampung:</strong> Atur porsi pembatasan ketersediaan bangku (kuota pendaftaran) bagi masing-masing sekolah.</li>
                            <li><strong className="text-zinc-200">Timeline & Engine:</strong> Jalankan proses seleksi Gale-Shapley Stable Assignment untuk memposisikan kelulusan siswa secara otomatis.</li>
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-zinc-850/60 mt-4 flex justify-between items-center">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">SPMB Dinas v2.8 (Active)</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span> Realtime Sync
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ADMIN SECTOR CHARTS & ANALYTICAL METRICS */}
                    <div id="admin_sector_charts" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Chart 1: Top 5 Sekolah Terfavorit */}
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Top 5 Sekolah Terfavorit</h3>
                            <p className="text-xs text-zinc-400 mt-0.5 font-sans">Sekolah dengan jumlah akumulasi peminat (Pilihan 1 &amp; Pilihan 2) tertinggi.</p>
                          </div>
                          <Award className="w-5 h-5 text-indigo-400" />
                        </div>

                        <div className="space-y-4 pt-2">
                          {(() => {
                            const topSchools = [...schools].sort((a, b) => (b.applicantsCount || 0) - (a.applicantsCount || 0)).slice(0, 5);
                            const maxApplicants = Math.max(...topSchools.map(s => s.applicantsCount || 1), 1);
                            
                            return topSchools.map((sch, i) => {
                              const pct = Math.round(((sch.applicantsCount || 0) / maxApplicants) * 100);
                              return (
                                <div key={sch.id} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs font-sans">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-indigo-950 border border-indigo-900/40 flex items-center justify-center font-mono font-bold text-indigo-300 text-[10px]">
                                        #{i + 1}
                                      </span>
                                      <span className="text-zinc-205 text-zinc-300 font-medium truncate max-w-[150px] sm:max-w-[220px]">{sch.name}</span>
                                    </div>
                                    <span className="font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-900 font-bold">
                                      {sch.applicantsCount || 0} Calon
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden flex">
                                    <div 
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" 
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Chart 2: Perbandingan SD vs SMP */}
                      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Akseptasi Kuota vs Pendaftar (Tingkat Sekolah)</h3>
                            <p className="text-xs text-zinc-400 mt-0.5 font-sans">Analisis daya serap pendaftar pada jenjang pendidikan SD dan SMP.</p>
                          </div>
                          <BookOpen className="w-5 h-5 text-emerald-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                          {/* SD Jenjang Card */}
                          {(() => {
                            const sdSchools = schools.filter(s => s.name.toUpperCase().includes('SD'));
                            const sdQuotas = sdSchools.reduce((acc, s) => acc + s.totalQuotas, 0) || 1;
                            const sdApplicants = sdSchools.reduce((acc, s) => acc + (s.applicantsCount || 0), 0);
                            const maxVal = Math.max(sdQuotas, sdApplicants, 1);
                            const quotaPct = Math.round((sdQuotas / maxVal) * 100);
                            const appPct = Math.round((sdApplicants / maxVal) * 100);

                            return (
                              <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                                <div>
                                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">TINGKAT SD</span>
                                  <h4 className="text-xs font-semibold text-zinc-300 mt-1 font-sans">Sekolah Dasar</h4>
                                </div>
                                
                                <div className="space-y-3">
                                  {/* Quotas */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                      <span className="font-sans">KUOTA</span>
                                      <span className="font-mono font-bold text-zinc-300">{sdQuotas}</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-zinc-600 rounded-full transition-all text-xs" style={{ width: `${quotaPct}%` }}></div>
                                    </div>
                                  </div>
                                  
                                  {/* Applicants */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                      <span className="font-sans">PENDAFTAR</span>
                                      <span className="font-mono font-bold text-emerald-400">{sdApplicants}</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${appPct}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* SMP Jenjang Card */}
                          {(() => {
                            const smpSchools = schools.filter(s => s.name.toUpperCase().includes('SMP'));
                            const smpQuotas = smpSchools.reduce((acc, s) => acc + s.totalQuotas, 0) || 1;
                            const smpApplicants = smpSchools.reduce((acc, s) => acc + (s.applicantsCount || 0), 0);
                            const maxVal = Math.max(smpQuotas, smpApplicants, 1);
                            const quotaPct = Math.round((smpQuotas / maxVal) * 100);
                            const appPct = Math.round((smpApplicants / maxVal) * 100);

                            return (
                              <div className="bg-zinc-950/40 border border-zinc-855 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                                <div>
                                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">TINGKAT SMP</span>
                                  <h4 className="text-xs font-semibold text-zinc-300 mt-1 font-sans">Sekolah Menengah</h4>
                                </div>
                                
                                <div className="space-y-3">
                                  {/* Quotas */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                      <span className="font-sans font-medium">KUOTA</span>
                                      <span className="font-mono font-bold text-zinc-300">{smpQuotas}</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-zinc-650 rounded-full transition-all" style={{ width: `${quotaPct}%` }}></div>
                                    </div>
                                  </div>
                                  
                                  {/* Applicants */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                      <span className="font-sans font-medium">PENDAFTAR</span>
                                      <span className="font-mono font-bold text-indigo-400">{smpApplicants}</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${appPct}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>



                  </div>
                )}

                {/* 3.3.2: SCHOOL LIST & BASIC CREDENTIALS MANAGEMENT */}
                {sidebarActiveMenu === 'schools-list' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                            <School className="w-5 h-5 text-indigo-400" />
                            Manajemen Data Master Sekolah
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 leading-normal">
                            Tambah sekolah dasar dan menengah baru, ubah nama, alamat, serta kelola letak garis bujur dan lintang pemetaan GIS Leaflet secara tersendali.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddSchoolForm}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                        >
                          <span>+ Tambah Sekolah Baru</span>
                        </button>
                      </div>

                      {/* Modal Form Create / Edit Sekolah */}
                      {schoolFormOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative space-y-4 animate-[scaleIn_0.25s_ease-out] text-left my-8">
                            <button
                              type="button"
                              onClick={() => {
                                setSchoolFormOpen(false);
                                setEditingSchool(null);
                              }}
                              className="absolute top-4 right-4 p-1.5 bg-zinc-800/85 text-zinc-400 hover:text-white rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                <BookOpen className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white font-display">
                                  {editingSchool ? '✏️ Edit Identitas Master Sekolah' : '✨ Registrasi Master Sekolah Baru'}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {editingSchool ? 'Suntik dan perbarui informasi detail lembaga sekolah saat ini.' : 'Daftarkan lembaga sekolah baru ke dalam sistem pemetaan PPDB.'}
                                </p>
                              </div>
                            </div>

                            <form onSubmit={handleSchoolSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                              <div className="md:col-span-6 space-y-3">
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Nama Sekolah</label>
                                  <input
                                    type="text"
                                    required
                                    value={schoolFormName}
                                    onChange={(e) => setSchoolFormName(e.target.value)}
                                    placeholder="Contoh: SDN Menteng 03 Jakarta atau SMPN 2 Jakarta"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Alamat Lengkap</label>
                                  <input
                                    type="text"
                                    required
                                    value={schoolFormAddress}
                                    onChange={(e) => setSchoolFormAddress(e.target.value)}
                                    placeholder="Jl. Raya No. 10..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Latitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      required
                                      value={schoolFormLat}
                                      onChange={(e) => setSchoolFormLat(parseFloat(e.target.value) || 0)}
                                      onBlur={(e) => setSchoolFormLat(parseFloat(parseFloat(e.target.value).toFixed(6)) || 0)}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Longitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      required
                                      value={schoolFormLng}
                                      onChange={(e) => setSchoolFormLng(parseFloat(e.target.value) || 0)}
                                      onBlur={(e) => setSchoolFormLng(parseFloat(parseFloat(e.target.value).toFixed(6)) || 0)}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
                                <div className="pt-1.5 text-left">
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5 flex items-center gap-1.5 font-bold">
                                    <span>🗺️ Pemetaan Koordinat Leaflet Map (Geser Marker)</span>
                                  </label>
                                  <AdminSchoolMap
                                    latitude={schoolFormLat}
                                    longitude={schoolFormLng}
                                    onChange={(lat, lng) => {
                                      setSchoolFormLat(lat);
                                      setSchoolFormLng(lng);
                                    }}
                                  />
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800 mt-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSchoolFormOpen(false);
                                      setEditingSchool(null);
                                    }}
                                    className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                                  >
                                    <span>Simpan Identitas Sekolah</span>
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Table listing master schools metadata */}
                      <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-950/20">
                              <th className="py-2.5 px-3">ID &amp; Nama Lembaga Sekolah</th>
                              <th className="py-2.5 px-3">Alamat Lengkap Domisili</th>
                              <th className="py-2.5 px-3">Sistem Koordinat GIS Locus</th>
                              <th className="py-2.5 px-3 text-center">Aksi / Kontrol</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {schools.map(sch => (
                              <tr key={sch.id} className="hover:bg-zinc-850/20 transition-colors">
                                <td className="py-3 px-3">
                                  <span className="text-[10px] font-mono text-zinc-500 font-bold block">ID: {sch.id}</span>
                                  <span className="font-bold text-neutral-100 font-display text-sm">{sch.name}</span>
                                  <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                                    Daftar Sesi Operator: operator{sch.id}@spmb.go.id
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-zinc-300 max-w-[320px] block truncate" title={sch.address}>{sch.address}</span>
                                </td>
                                <td className="py-3 px-3 font-mono font-semibold text-indigo-400 text-xs">
                                  {sch.latitude.toFixed(6)}, {sch.longitude.toFixed(6)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openEditSchoolForm(sch)}
                                      className="p-1.5 bg-zinc-800 hover:bg-zinc-755 text-indigo-400 font-semibold text-[10px] rounded hover:text-white transition-colors"
                                    >
                                      Edit Detail
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSchoolDelete(sch.id)}
                                      className="p-1.5 bg-zinc-800 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                                      title="Hapus Lembaga"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.3.3: SCHOOL QUOTAS (DAYA TAMPUNG) MANAGEMENT */}
                {sidebarActiveMenu === 'schools-quotas' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-left">
                          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-400" />
                            Alokasi Daya Tampung Sekolah (Kuota)
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 leading-normal">
                            Sesuaikan porsi pembatasan ketersediaan bangku (kuota pendaftaran) bagi masing-masing sekolah berdasarkan Permendikbud Zonasi, Prestasi, Afirmasi, Pindahan, dan Ujian Tes.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddQuotaFormForNewSchool}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10 transition-all active:scale-95 shrink-0"
                        >
                          <Database className="w-4 h-4 text-indigo-200" />
                          <span>+ Tambah Alokasi Baru</span>
                        </button>
                      </div>

                      {/* Modal Form Tambah Alokasi Baru */}
                      {quotaAddFormOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative space-y-4 animate-[scaleIn_0.25s_ease-out] text-left my-8">
                            <button
                              type="button"
                              onClick={() => setQuotaAddFormOpen(false)}
                              className="absolute top-4 right-4 p-1.5 bg-zinc-800/85 text-zinc-400 hover:text-white rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                <Database className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white font-display">
                                  Tambah Alokasi Daya Tampung Baru
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  Atur alokasi porsi pembagian kuota per jalur penerimaan dari daftar sekolah terdaftar.
                                </p>
                              </div>
                            </div>

                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              if (!user) return;
                              if (!schoolFormName || !schoolFormAddress) {
                                showToast("Pilih salah satu sekolah terlebih dahulu!", "error");
                                return;
                              }
                              setLoading(true);
                              try {
                                const res = await fetch('/api/admin/school', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: selectedSchoolIdForQuota || undefined,
                                    name: schoolFormName,
                                    address: schoolFormAddress,
                                    latitude: parseFloat(Number(schoolFormLat).toFixed(6)),
                                    longitude: parseFloat(Number(schoolFormLng).toFixed(6)),
                                    quotas: {
                                      Zonasi: Number(schoolFormZonasi),
                                      Prestasi: Number(schoolFormPrestasi),
                                      Afirmasi: Number(schoolFormAfirmasi),
                                      Pindahan: Number(schoolFormPindahan),
                                      Tes: Number(schoolFormTes)
                                    },
                                    adminEmail: user.email
                                  })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  showToast("Alokasi daya tampung (kuota) sekolah berhasil diperbarui!", "success");
                                  if (data.schools) {
                                    setSchools(data.schools);
                                  }
                                  syncAdminDashboard();
                                  fetchPublicRankings();
                                  setQuotaAddFormOpen(false);
                                } else {
                                  showToast(data.error || "Gagal menyimpan daya tampung", "error");
                                }
                              } catch (err) {
                                showToast("Kesalahan koneksi saat menyimpan daya tampung", "error");
                              } finally {
                                setLoading(false);
                              }
                            }} className="w-full space-y-6">
                              
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                                {/* Left Column: School Details */}
                                <div className="md:col-span-6 space-y-4 text-left">
                                  <div>
                                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Pilih Lembaga Sekolah</label>
                                    <select
                                      required
                                      value={selectedSchoolIdForQuota}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                          setSelectedSchoolIdForQuota('');
                                          setSchoolFormName('');
                                          setSchoolFormAddress('');
                                          setSchoolFormLat(-6.198305);
                                          setSchoolFormLng(106.832943);
                                          setSchoolFormZonasi(10);
                                          setSchoolFormPrestasi(10);
                                          setSchoolFormAfirmasi(10);
                                          setSchoolFormPindahan(5);
                                          setSchoolFormTes(15);
                                        } else {
                                          const sId = Number(val);
                                          setSelectedSchoolIdForQuota(sId);
                                          const found = schools.find(s => s.id === sId);
                                          if (found) {
                                            setSchoolFormName(found.name);
                                            setSchoolFormAddress(found.address);
                                            setSchoolFormLat(found.latitude);
                                            setSchoolFormLng(found.longitude);
                                            setSchoolFormZonasi(found.quotas?.Zonasi ?? 0);
                                            setSchoolFormPrestasi(found.quotas?.Prestasi ?? 0);
                                            setSchoolFormAfirmasi(found.quotas?.Afirmasi ?? 0);
                                            setSchoolFormPindahan(found.quotas?.Pindahan ?? 0);
                                            setSchoolFormTes(found.quotas?.Tes ?? 0);
                                          }
                                        }
                                      }}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                    >
                                      <option value="">-- Pilih Sekolah --</option>
                                      {schools.map((sch) => (
                                        <option key={sch.id} value={sch.id}>
                                          {sch.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {selectedSchoolIdForQuota !== '' && (
                                    <div className="space-y-4 pt-4 border-t border-zinc-800/40 animate-[fadeIn_0.2s_ease-out]">
                                      <div>
                                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Alamat Lengkap</label>
                                        <input
                                          type="text"
                                          required
                                          disabled
                                          value={schoolFormAddress}
                                          onChange={(e) => setSchoolFormAddress(e.target.value)}
                                          placeholder="Pilih sekolah di atas untuk mengisi alamat secara otomatis"
                                          className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none cursor-not-allowed font-medium"
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Latitude</label>
                                          <input
                                            type="number"
                                            step="any"
                                            required
                                            disabled
                                            value={schoolFormLat}
                                            onChange={(e) => setSchoolFormLat(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none cursor-not-allowed"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Longitude</label>
                                          <input
                                            type="number"
                                            step="any"
                                            required
                                            disabled
                                            value={schoolFormLng}
                                            onChange={(e) => setSchoolFormLng(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 focus:outline-none cursor-not-allowed"
                                          />
                                        </div>
                                      </div>

                                      <div className="pt-2">
                                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-2 font-bold text-left">🗺️ Letak Koordinat Sekolah</label>
                                        <AdminSchoolMap
                                          latitude={schoolFormLat}
                                          longitude={schoolFormLng}
                                          onChange={(lat, lng) => {
                                            // Map coordinate update (optional viewing)
                                          }}
                                          disabled={true}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right Column: Quotas Allocation */}
                                <div className="md:col-span-6 space-y-4 text-left">
                                  <div className="space-y-3">
                                    <label className="block text-[10px] font-mono text-zinc-400 uppercase font-bold">Porsi Kuota (%) / Kapasitas (Siswa)</label>
                                    
                                    <div className="grid grid-cols-2 gap-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                                      <div>
                                        <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Zonasi</label>
                                        <input
                                          type="number"
                                          min="0"
                                          required
                                          value={schoolFormZonasi}
                                          onChange={(e) => setSchoolFormZonasi(Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Prestasi</label>
                                        <input
                                          type="number"
                                          min="0"
                                          required
                                          value={schoolFormPrestasi}
                                          onChange={(e) => setSchoolFormPrestasi(Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Afirmasi</label>
                                        <input
                                          type="number"
                                          min="0"
                                          required
                                          value={schoolFormAfirmasi}
                                          onChange={(e) => setSchoolFormAfirmasi(Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Pindahan</label>
                                        <input
                                          type="number"
                                          min="0"
                                          required
                                          value={schoolFormPindahan}
                                          onChange={(e) => setSchoolFormPindahan(Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Tes</label>
                                        <input
                                          type="number"
                                          min="0"
                                          required
                                          value={schoolFormTes}
                                          onChange={(e) => setSchoolFormTes(Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div className="bg-indigo-950/50 rounded-lg p-2 flex flex-col justify-center items-center border border-indigo-500/20">
                                        <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold text-center">Total Kursi</span>
                                        <span className="text-sm font-bold font-mono text-indigo-300">
                                          {Number(schoolFormZonasi) + Number(schoolFormPrestasi) + Number(schoolFormAfirmasi) + Number(schoolFormPindahan) + Number(schoolFormTes)} Kursi
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Separate Full-Width Footer */}
                              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-4">
                                <button
                                  type="button"
                                  onClick={() => setQuotaAddFormOpen(false)}
                                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                  Simpan Alokasi Baru
                                </button>
                              </div>

                            </form>
                          </div>
                        </div>
                      )}

                      {/* Modal Form untuk Edit Kuota/Daya Tampung */}
                      {quotaFormOpen && editingSchool && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 animate-[scaleIn_0.25s_ease-out] text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setQuotaFormOpen(false);
                                setEditingSchool(null);
                              }}
                              className="absolute top-4 right-4 p-1.5 bg-zinc-800/85 text-zinc-400 hover:text-white rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                <Database className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white font-display">
                                  Sunting Daya Tampung Kuota
                                </h3>
                                <p className="text-xs text-indigo-400 font-semibold font-display mt-0.5">
                                  {editingSchool.name}
                                </p>
                              </div>
                            </div>
                            
                            <form onSubmit={handleQuotaSubmit} className="space-y-4 font-sans col-span-12">
                              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                                <div>
                                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Zonasi</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={schoolFormZonasi}
                                    onChange={(e) => setSchoolFormZonasi(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs font-bold text-center text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Prestasi</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={schoolFormPrestasi}
                                    onChange={(e) => setSchoolFormPrestasi(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs font-bold text-center text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Afirmasi</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={schoolFormAfirmasi}
                                    onChange={(e) => setSchoolFormAfirmasi(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs font-bold text-center text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Pindahan</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={schoolFormPindahan}
                                    onChange={(e) => setSchoolFormPindahan(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs font-bold text-center text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Kuota Tes</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={schoolFormTes}
                                    onChange={(e) => setSchoolFormTes(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs font-bold text-center text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="bg-indigo-950/40 rounded-lg p-2 flex flex-col justify-center items-center border border-indigo-500/20">
                                  <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold text-center">Total Baru</span>
                                  <span className="text-sm font-bold font-mono text-indigo-300">
                                    {Number(schoolFormZonasi) + Number(schoolFormPrestasi) + Number(schoolFormAfirmasi) + Number(schoolFormPindahan) + Number(schoolFormTes)} Kursi
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800 mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuotaFormOpen(false);
                                    setEditingSchool(null);
                                  }}
                                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                  Simpan Limit Daya Tampung
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Display Table centered around quotas */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-950/20">
                              <th className="py-2.5 px-3">Nama Sekolah</th>
                              <th className="py-2.5 px-3 text-center">Zonasi</th>
                              <th className="py-2.5 px-3 text-center">Prestasi</th>
                              <th className="py-2.5 px-3 text-center">Afirmasi</th>
                              <th className="py-2.5 px-3 text-center">Pindahan</th>
                              <th className="py-2.5 px-3 text-center">Ujian Tes</th>
                              <th className="py-2.5 px-3 text-indigo-400 font-bold text-center bg-indigo-950/10">Batas Kuota</th>
                              <th className="py-2.5 px-3 text-center">Aksi Daya Tampung</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {schools.map(sch => (
                              <tr key={sch.id} className="hover:bg-zinc-850/20 transition-colors">
                                <td className="py-3 px-3 font-semibold text-zinc-100 font-display">
                                  {sch.name}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-zinc-300">{sch.quotas?.Zonasi || 0}</td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-zinc-300">{sch.quotas?.Prestasi || 0}</td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-zinc-300">{sch.quotas?.Afirmasi || 0}</td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-zinc-300">{sch.quotas?.Pindahan || 0}</td>
                                <td className="py-3 px-3 text-center font-mono font-semibold text-zinc-300">{sch.quotas?.Tes || 0}</td>
                                <td className="py-3 px-3 text-center font-mono font-extrabold text-indigo-300 bg-indigo-950/10">{sch.totalQuotas} Kursi</td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => openQuotaForm(sch)}
                                    className="p-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-400 font-semibold text-[10px] rounded transition-all"
                                  >
                                    Atur Kuota Daya Tampung
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.3.3.5: CUSTOM SCHOOL OPERATORS MANAGEMENT */}
                {sidebarActiveMenu === 'operators-list' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            Pendaftaran Akun Operator Sekolah (SD &amp; SMP)
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 leading-normal">
                            Daftarkan akun operator sekolah dasar (SD) dan sekolah menengah pertama (SMP) baru secara tersentralisasi dari Admin Dinas.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOperatorFormEmail('');
                            setOperatorFormPassword('');
                            setEditingOperator(null);
                            setOperatorFormStatus('Active');
                            if (schools.length > 0) {
                              setOperatorFormSchoolId(schools[0].id);
                            }
                            setIsOperatorModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-center shrink-0 border border-indigo-500/30"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Daftarkan Operator Baru</span>
                        </button>
                      </div>

                      {/* Modal Form Tambah Operator */}
                      {isOperatorModalOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 animate-[scaleIn_0.25s_ease-out] text-left">
                            <button
                              type="button"
                              onClick={() => setIsOperatorModalOpen(false)}
                              className="absolute top-4 right-4 p-1.5 bg-zinc-800/85 text-zinc-400 hover:text-white rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                <Shield className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white font-display">
                                  {editingOperator ? "Edit Data Operator" : "Daftarkan Operator Baru"}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {editingOperator ? "Perbarui informasi akun, penugasan sekolah, atau status keaktifan operator." : "Lengkapi form berikut untuk mendaftarkan akun operator SD atau SMP."}
                                </p>
                              </div>
                            </div>

                            <form onSubmit={handleOperatorSubmit} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Email Operator</label>
                                <input
                                  type="email"
                                  required
                                  value={operatorFormEmail}
                                  onChange={(e) => setOperatorFormEmail(e.target.value)}
                                  placeholder="operator.sekolah@spmb.go.id"
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                                  {editingOperator ? "Kata Sandi Baru (Opsional)" : "Password Baru"}
                                </label>
                                <input
                                  type="password"
                                  required={!editingOperator}
                                  value={operatorFormPassword}
                                  onChange={(e) => setOperatorFormPassword(e.target.value)}
                                  placeholder={editingOperator ? "Kosongkan jika tidak ingin mengubah password..." : "Masukkan kata sandi..."}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Penugasan Lembaga Sekolah</label>
                                <select
                                  required
                                  value={operatorFormSchoolId || ''}
                                  onChange={(e) => setOperatorFormSchoolId(Number(e.target.value))}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                >
                                  <option value="">-- Pilih Sekolah --</option>
                                  {schools.map(sch => {
                                    const level = sch.name.toUpperCase().includes('SD') ? 'SD' : 'SMP';
                                    return (
                                      <option key={sch.id} value={sch.id}>
                                        [{level}] {sch.name}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {editingOperator && (
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Status Keaktifan Akun</label>
                                  <select
                                    required
                                    value={operatorFormStatus}
                                    onChange={(e) => setOperatorFormStatus(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                  >
                                    <option value="Active">Aktif (Dapat Login)</option>
                                    <option value="Inactive">Non-Aktif (Dikunci)</option>
                                  </select>
                                </div>
                              )}

                              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80 mt-4">
                                <button
                                  type="button"
                                  onClick={() => setIsOperatorModalOpen(false)}
                                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                                >
                                  <span>{editingOperator ? "Simpan Perubahan" : "Daftarkan Operator"}</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Daftar Operator Terdaftar */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                          Daftar Akun Operator di Sistem ({operators.length})
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-950/20">
                                <th className="py-2.5 px-3">Email Operator</th>
                                <th className="py-2.5 px-3">Sekolah Penugasan</th>
                                <th className="py-2.5 px-3">Jenjang Sekolah</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Tanggal Dibuat</th>
                                <th className="py-2.5 px-3 text-center">Tindakan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                              {operators.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono">
                                    Belum ada akun operator kustom yang terdaftar.
                                  </td>
                                </tr>
                              ) : (
                                operators.map(op => {
                                  const sch = schools.find(s => s.id === op.schoolId);
                                  const isSd = sch ? sch.name.toUpperCase().includes('SD') : false;
                                  const jenjang = isSd ? 'SD' : 'SMP';
                                  const isActive = op.status !== 'Inactive';
                                  return (
                                    <tr key={op.id} className="hover:bg-zinc-850/20 transition-colors">
                                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                                        {op.email}
                                      </td>
                                      <td className="py-3 px-3 text-neutral-100 font-semibold">
                                        {sch ? sch.name : `ID Sekolah: ${op.schoolId}`}
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                          jenjang === 'SD' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                                        }`}>
                                          {jenjang}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                          isActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40' : 'bg-rose-950/60 text-rose-450 border border-rose-900/40'
                                        }`}>
                                          {isActive ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                                        {new Date(op.createdAt).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 text-center flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingOperator(op);
                                            setOperatorFormEmail(op.email);
                                            setOperatorFormSchoolId(op.schoolId || (schools.length > 0 ? schools[0].id : 0));
                                            setOperatorFormStatus(op.status || 'Active');
                                            setOperatorFormPassword('');
                                            setIsOperatorModalOpen(true);
                                          }}
                                          className="p-1 px-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-900/30 rounded transition-colors text-[10px] font-bold"
                                        >
                                          Edit Data
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOperatorDelete(op.id)}
                                          className={`p-1 px-2.5 rounded transition-colors text-[10px] font-bold border ${
                                            isActive 
                                              ? 'bg-rose-950/30 hover:bg-rose-900/60 text-rose-400 border-rose-900/40' 
                                              : 'bg-emerald-950/30 hover:bg-emerald-900/60 text-emerald-400 border-emerald-900/40'
                                          }`}
                                        >
                                          {isActive ? 'Non-Aktifkan' : 'Aktifkan'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.3.4: SYSTEM TRANSITIONS & SELECTION ENGINE CONTROL */}
                {sidebarActiveMenu === 'system_control' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Settings Panel */}
                    <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold font-display text-white mb-3 flex items-center gap-1.5">
                          <Sliders className="w-5 h-5 text-indigo-500" />
                          Timeline Sesi PPDB Online
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Atur rentang fase pendaftaran secara serempak. Mengubah fase akan mengunci draft siswa atau membekukan data hasil verifikasi operator.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Status Sesi SPMB Online Saat Ini</label>
                            <div className="flex flex-col gap-2 bg-zinc-950 p-2 rounded-xl">
                              {(['Pendaftaran', 'Seleksi & Verifikasi', 'Pengumuman'] as const).map(ph => (
                                <button
                                  key={ph}
                                  type="button"
                                  id={`set_phase_to_${ph}`}
                                  onClick={() => triggerPhaseTransition(ph)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    systemPhase === ph 
                                      ? 'bg-indigo-600 text-white shadow' 
                                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                                  }`}
                                >
                                  {ph === 'Pendaftaran' && 'Masa Pendaftaran (Dibuka)'}
                                  {ph === 'Seleksi & Verifikasi' && 'Verifikasi & Seleksi Antrean (Terkunci)'}
                                  {ph === 'Pengumuman' && 'Freeze & Pengumuman Hasil Kelulusan'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gale Shapley Selection Engine */}
                    <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">MUTASI DINAS</span>
                        <h2 className="text-lg font-bold font-display text-white mb-1">PBI-3.1 | Core Selection Engine</h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Jalankan proses sorting Gale-Shapley Stable Assignment untuk memposisikan ulang draf kelulusan Choice 1 dan Choice 2 dinamis berdasarkan matriks jarak locus kuota sekolah.
                        </p>
                        
                        <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
                          <span className="block text-xs font-bold text-indigo-300">Seleksi Stable Assignment Gale-Shapley</span>
                          <p className="text-[10px] text-indigo-400 leading-normal">
                            Siswa akan disaring otomatis dan diisi ke dalam slot kursi yang dialokasikan. Siswa yang terdepak dari Choice 1 otomatis didorong ke sistem seleksi Choice 2.
                          </p>
                          <button
                            type="button"
                            id="btn_trigger_engine_selection"
                            disabled={loading}
                            onClick={triggerGaleShapleyCascadingEngine}
                            className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-xs text-white shadow-md active:scale-[99%]"
                          >
                            Jalankan Seleksi Cascading Batch
                          </button>
                        </div>

                        <hr className="border-zinc-800/80 my-1" />

                        <div className="p-4 bg-zinc-950/45 border border-dashed border-zinc-800/80 rounded-xl space-y-2.5">
                          <span className="block text-xs font-bold text-zinc-300">⚙️ Alat Simulasi &amp; Pengujian Berkas Dinas</span>
                          <p className="text-[10.5px] text-zinc-400 leading-normal">
                            Untuk melihat dan mendemonstrasikan fungsi Validasi Berkas Siswa oleh Operator, Anda dapat membangkitkan data dummy secara instan.
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => generateDummyApplicants(15)}
                              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-755 font-bold rounded-lg text-xs text-indigo-400 hover:text-indigo-300 transition-all border border-zinc-700/60 shadow-lg shadow-black/10 flex items-center justify-center gap-1.5"
                            >
                              ✨ Bangkitkan 15 Draf Calon Siswa
                            </button>
                            <button
                              type="button"
                              onClick={() => generateDummyApplicants(35)}
                              className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-850 font-bold rounded-lg text-xs text-zinc-400 hover:text-zinc-350 transition-all border border-zinc-800 shadow shadow-black/15"
                            >
                              +35 Data
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.3.5: AUDIT LOGS VIEW */}
                {sidebarActiveMenu === 'audit_logs' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                      <div>
                        <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-indigo-500" />
                          PBI-5.1 | Global Audit Logs &amp; Forensik Keamanan
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-normal">
                          Catatan forensik seluruh aktivitas penambahan sekolah, modifikasi data kependudukan, pengubahan kuota daya tampung, mutasi berkas, dan verifikasi operator terkait IP address klien.
                        </p>
                      </div>

                      <div id="audit_logs_list_wrapper" className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                        {allAuditLogs.length === 0 ? (
                          <p className="py-12 text-center text-xs text-zinc-500 bg-zinc-950/20 rounded-2xl">Belum ada audit log tersimpan pada sesi aktif ini.</p>
                        ) : (
                          allAuditLogs.map(log => (
                            <div key={log.id} className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-850 text-xs flex flex-col gap-1.5 hover:border-zinc-800 transition-all">
                              <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">IP CLIENT: {log.ip}</span>
                              </div>
                              <p className="text-xs text-zinc-300">
                                <span className="text-indigo-400 font-mono font-bold">[{log.role}]</span> <span className="font-semibold text-zinc-200">{log.email}</span>: {log.action}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            </div>
          </div>
        )}

      </main>

      {/* Operator Review/Verification Modal */}
      {showReviewModal && selectedApplicant && (
        <div id="operator_review_modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/30">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Verifikasi Profil Review Siswa Baru</span>
                <h2 className="text-xl font-bold font-display text-white mt-0.5">{selectedApplicant.nama}</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-sans">Diajukan lewat jalur resmi: <span className="font-bold text-zinc-200">{selectedApplicant.pathway}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 bg-transparent" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {systemPhase === 'Pendaftaran' && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs rounded-2xl flex items-start gap-2.5 font-sans">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Verifikasi Ditangguhkan Selama Fase Pendaftaran</strong>
                    <span>Selama masa aktif <strong>Fase Pendaftaran</strong>, verifikasi dan pembatalan status pendaftaran dikunci demi menjaga integritas data siswa. Pengolahan berkas dapat dilakukan kembali setelah masuk ke Fase Seleksi &amp; Verifikasi.</span>
                  </div>
                </div>
              )}

              {/* Detail metadata bento block */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono">NISN DAPODIK</span>
                  <span className="font-mono text-zinc-200 block text-xs mt-0.5">{selectedApplicant.nisn}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono">NIK PENDUDUK</span>
                  <span className="font-mono text-zinc-200 block text-xs mt-0.5">{selectedApplicant.nik}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-mono">TELEPON WALI</span>
                  <span className="text-zinc-200 block text-xs mt-0.5">{selectedApplicant.phone || '-'}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-zinc-500 block text-[9px] font-mono">ALAMAT DOMISILI RUMAH SESUAI KTP/KK</span>
                  <span className="text-zinc-200 block text-xs mt-0.5 leading-relaxed">{selectedApplicant.address}</span>
                </div>
                <div className="col-span-3 pt-2 border-t border-zinc-900 flex justify-between text-[11px]">
                  <span>Metriks Jarak Koordinat GPS Locus:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {getHaversineDistance(
                      selectedApplicant.latitude || -6.1, 
                      selectedApplicant.longitude || 106.8, 
                      schools.find(s => s.id === user.schoolId)?.latitude || -6.168541,
                      schools.find(s => s.id === user.schoolId)?.longitude || 106.834015
                    )} meter ke Sekolah
                  </span>
                </div>
              </div>

              {/* Pathway-specific Details (especially for Prestasi) */}
              {selectedApplicant.pathway === 'Prestasi' && (
                <div className="bg-emerald-950/20 border border-emerald-500/25 p-5 rounded-2xl space-y-3 mb-4">
                  <span className="text-xs font-bold text-emerald-400 block font-display">
                    Metrik Penilaian Jalur Prestasi
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                      <span className="text-zinc-500 block text-[9px] font-mono leading-none mb-1">RATA-RATA NILAI RAPOR (30%)</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedApplicant.raportAverage || 0}</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                      <span className="text-zinc-500 block text-[9px] font-mono leading-none mb-1">TES KEMAMPUAN AKADEMIK (TKA - 70%)</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedApplicant.tkaScore || 0}</span>
                    </div>
                    <div className="col-span-2 bg-emerald-950/35 border border-emerald-900/30 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-350 font-semibold block leading-tight">Total Skor Gabungan Akhir:</span>
                        <span className="text-[9px] text-zinc-500 font-mono">(Rapor * 30%) + (TKA * 70%)</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        {(((selectedApplicant.raportAverage || 0) * 0.3) + ((selectedApplicant.tkaScore || 0) * 0.7)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {selectedApplicant.certificateName && (
                    <div className="p-3 bg-zinc-950/30 border border-zinc-850 rounded-xl text-xs leading-normal">
                      <span className="text-zinc-500 block text-[9px] font-mono uppercase">Sertifikat Pendukung</span>
                      <span className="font-semibold text-zinc-300 mt-0.5 block">{selectedApplicant.certificateName}</span>
                      <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">Skor Bobot Piagam: +{selectedApplicant.certificateScore || 0} Poin</span>
                    </div>
                  )}
                </div>
              )}

              {selectedApplicant.pathway === 'Tes' && (
                <div className="bg-indigo-950/20 border border-indigo-500/25 p-5 rounded-2xl space-y-2 mb-4">
                  <span className="text-xs font-bold text-indigo-400 block font-display">Metrik Ujian Tertulis</span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                      <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">SKOR UJIAN TES</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">{selectedApplicant.examScore || 0}</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                      <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">DURASI PENGERJAAN</span>
                      <span className="text-sm font-bold text-zinc-300 font-mono">{selectedApplicant.examDuration || 0} Menit</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedApplicant.pathway === 'Afirmasi' && selectedApplicant.bansosNumber && (
                <div className="bg-rose-950/20 border border-rose-500/25 p-5 rounded-2xl space-y-1 mb-4">
                  <span className="text-xs font-bold text-rose-450 block font-display">Jaminan Sosial / Afirmasi</span>
                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                    <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">NOMOR KARTU KESISWAAN/BANSOS</span>
                    <span className="text-sm font-bold text-rose-450 font-mono">{selectedApplicant.bansosNumber}</span>
                  </div>
                </div>
              )}

              {selectedApplicant.pathway === 'Pindahan' && selectedApplicant.skPindahNumber && (
                <div className="bg-amber-950/20 border border-amber-500/25 p-5 rounded-2xl space-y-1 mb-4">
                  <span className="text-xs font-bold text-amber-455 block font-display">Mutasi Orang Tua / Pindahan</span>
                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                    <span className="text-zinc-455 block text-[9px] font-mono leading-none mb-1 font-bold">NOMOR SURAT KEPUTUSAN PINDAH TUGAS</span>
                    <span className="text-sm font-bold text-amber-450 font-mono">{selectedApplicant.skPindahNumber}</span>
                  </div>
                </div>
              )}

              {/* Gemini Assistant reviewer evaluation module */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-display">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                    Asisten AI Verifikator Dinas
                  </span>
                  <button 
                    id="gemini_ask_btn_operator_modal"
                    disabled={systemPhase === 'Pendaftaran'}
                    onClick={() => askGeminiReviewer(selectedApplicant)}
                    className={`px-3.5 py-1.5 font-mono text-[10px] rounded-lg cursor-pointer font-bold ${
                      systemPhase === 'Pendaftaran' 
                        ? 'bg-zinc-800 text-zinc-550 border border-zinc-705 cursor-not-allowed opacity-50' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    Minta Tinjauan AI
                  </button>
                </div>
                {aiAnalysisResult ? (
                  <p className="text-xs text-zinc-350 leading-relaxed italic bg-zinc-950/40 p-3.5 rounded-xl border border-indigo-900/50">
                    {aiAnalysisResult}
                  </p>
                ) : (
                  <p className="text-[11.5px] text-zinc-400 font-sans">Klik tombol diatas untuk menjembatani evaluasi berkas via kecerdasan buatan.</p>
                )}
              </div>

              {/* Document checker digital block */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">Berkas Pendukung Terlampir (Secure View)</span>
                <div id="operator_document_inspect_modal" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(selectedApplicant.documents || {}).map(docKey => {
                    const doc = (selectedApplicant.documents as any)[docKey];
                    return (
                      <div key={docKey} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-zinc-350 block capitalize">{docKey}</span>
                          <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">{(doc.size/1024).toFixed(1)} KB</span>
                        </div>
                        {systemPhase === 'Pendaftaran' ? (
                          <span className="p-1.5 px-3 bg-zinc-800/20 border border-zinc-800/35 text-zinc-500 rounded-lg text-[10px] font-mono cursor-not-allowed opacity-40 select-none">
                            Tinjau File
                          </span>
                        ) : (
                          <a 
                            href={`/api/document/${doc.name}?userId=${selectedApplicant.userId}&requesterRole=Operator`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-mono text-zinc-300 hover:text-white"
                          >
                            Tinjau File
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/30 shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  id="btn_operator_rejection_trigger_modal"
                  disabled={systemPhase === 'Pendaftaran'}
                  onClick={() => {
                    setRejectReasonInput('');
                    setShowRejectModal(true);
                  }}
                  className={`px-4 py-2.5 border text-xs font-semibold rounded-xl cursor-pointer ${
                    systemPhase === 'Pendaftaran'
                      ? 'bg-zinc-800/20 border-zinc-800/35 text-zinc-500 cursor-not-allowed opacity-40'
                      : 'bg-rose-955/40 hover:bg-rose-900/30 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  id="btn_operator_approve_modal"
                  disabled={systemPhase === 'Pendaftaran'}
                  onClick={() => processOperatorDecision(selectedApplicant.id, 'Verify')}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    systemPhase === 'Pendaftaran'
                      ? 'bg-zinc-800 text-zinc-550 cursor-not-allowed opacity-40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Setujui &amp; Verifikasi Berkas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operator Rejection Feedback input modal */}
      {showRejectModal && selectedApplicant && (
        <div id="rejection_input_modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-905 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl bg-zinc-900">
            <h3 className="text-lg font-bold text-white font-display">Alasan Utama Penolakan Berkas</h3>
            <p className="text-xs text-zinc-400 leading-normal">
              Masukkan alasan penolakan berkas calon siswa '{selectedApplicant.nama}'. Kunci draf siswa terkait akan dibuka kembali agar mereka mampu melengkapi dokumen di dashboard mereka.
            </p>
            
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="Contoh: Lampiran Kartu Keluarga tidak terbaca jelas / kabur. Mohon upload ulang dengan resolusi tajam."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="btn_cancel_reject"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold rounded-xl text-zinc-300"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn_confirm_reject"
                onClick={() => processOperatorDecision(selectedApplicant.id, 'Reject')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-xl text-white shadow-md cursor-pointer"
              >
                Kirim Alasan &amp; Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright block */}
      <footer id="spmb_footer" className="w-full max-w-7xl mx-auto px-4 py-6 text-center text-zinc-500 text-[11px] border-t border-zinc-900 mt-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span>© {new Date().getFullYear()} Aplikasi SPMB Online Daerah - NovaStream Bento OS.</span>
        </div>
        <div className="flex gap-4 uppercase tracking-wider font-semibold">
          <button onClick={() => showToast("Ketentuan penentuan jarak menggunakan standard koordinat spherical bumi", "info")} className="hover:text-zinc-300">Ketentuan</button>
          <button onClick={() => showToast("Aturan data dilindungi enkripsi standard bank lokal", "info")} className="hover:text-zinc-300">Keamanan Sesi</button>
        </div>
      </footer>

    </div>
  );
}

// Spherical earth distance logic
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}
