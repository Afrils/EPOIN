
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ModalType, Rule, ViewType, Profile, Database } from './types';
import Header from './components/Header';
import StudentCard from './components/StudentCard';
import AddStudentForm from './components/AddStudentForm';
import PointModal from './components/PointModal';
import { UserGroupIcon, ExclamationIcon, DatabaseIcon, ShieldCheckIcon, ExternalLinkIcon, PlusIcon, UploadCloudIcon, DownloadIcon, TrophyIcon } from './components/icons';
import RuleManagement from './components/RuleManagement';
import { supabase, supabaseProjectRef } from './supabase/client';
import GroupPointModal from './components/GroupPointModal';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/supabase-js';


type SortByType = 'points-desc' | 'points-asc' | 'name-asc' | 'name-desc';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('points-desc');
  const [currentView, setCurrentView] = useState<ViewType>('students');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSubmittingGroupPoints, setIsSubmittingGroupPoints] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    if (!session) {
      setFetchError(null);
      return;
    };
    
    const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const [studentsResponse, rulesResponse, profileResponse] = await Promise.all([
                supabase.from('students').select('*').eq('user_id', session.user.id),
                supabase.from('rules').select('*').eq('user_id', session.user.id),
                supabase.from('profiles').select('*').eq('id', session.user.id).single()
            ]);

            if (studentsResponse.error) throw studentsResponse.error;
            if (rulesResponse.error) throw rulesResponse.error;
            if (profileResponse.error && profileResponse.error.code !== 'PGRST116') { // Ignore 'Range not satisfactory' for empty profiles
                throw profileResponse.error;
            }

            const studentsData = (studentsResponse.data || []).map(s => ({
                ...s,
                photo_url: s.photo_url || ''
            }));
            const profileData = profileResponse.data ? {
                ...profileResponse.data,
                app_name: profileResponse.data.app_name || '',
                logo_url: profileResponse.data.logo_url || '',
                favicon_url: profileResponse.data.favicon_url || '',
            } : null;

            setStudents(studentsData);
            setRules(rulesResponse.data || []);
            setProfile(profileData);

        } catch (error: any) {
            console.error("Error fetching initial data:", error);
            setFetchError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [session]);
  
  useEffect(() => {
    if (profile) {
        document.title = profile.app_name || 'Sistem Poin Siswa';
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
        if (favicon) {
            favicon.href = profile.favicon_url || '/vite.svg';
        }
    }
  }, [profile]);


  const filteredStudents = useMemo(() => {
    return students
        .filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case 'points-asc':
                    return a.points - b.points;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'points-desc':
                default:
                    return b.points - a.points;
            }
        });
  }, [students, searchTerm, sortBy]);
  
  const handleToggleSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(new Set(allFilteredIds));
  };

  const handleClearSelection = () => {
      setSelectedStudentIds(new Set());
  };

  const handleAddStudent = async (name: string, photo: File | null) => {
    if (!session) return;
    setIsAddingStudent(true);
    try {
        let photoUrl: string | null = null;
        if (photo) {
            const fileName = `${session.user.id}/${Date.now()}_${photo.name}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, photo);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            photoUrl = data.publicUrl;
        }

        const newStudentData: Database['public']['Tables']['students']['Insert'] = { name, points: 75, photo_url: photoUrl || '', user_id: session.user.id };
        const { data: newStudent, error } = await supabase.from('students').insert(newStudentData).select().single();
        if (error) throw error;
        if(newStudent) setStudents([{ ...newStudent, photo_url: newStudent.photo_url || '' }, ...students]);

    } catch (error) {
        console.error('Error adding student:', error);
    } finally {
        setIsAddingStudent(false);
    }
  };

  const handleOpenModal = (student: Student, type: ModalType) => {
    setSelectedStudent(student);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setModalType(null);
  };
  
  const handleCloseGroupModal = () => setIsGroupModalOpen(false);

  const handleSubmitPoints = async (points: number, reason: string) => {
    if (!selectedStudent || !modalType || !session) return;

    const pointsToApply = modalType === 'add' ? points : -points;
    const newTotalPoints = Math.max(0, selectedStudent.points + pointsToApply);

    try {
        const { error: txError } = await supabase.from('point_transactions').insert({ student_id: selectedStudent.id, points: pointsToApply, reason, user_id: session.user.id });
        if (txError) throw txError;

        const { error: studentError } = await supabase.from('students').update({ points: newTotalPoints }).eq('id', selectedStudent.id);
        if (studentError) throw studentError;
        
        setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, points: newTotalPoints } : s));
        handleCloseModal();

    } catch(error) {
        console.error('Error submitting points:', error);
    }
  };

  const handleSubmitGroupPoints = async (points: number, reason: string, type: 'add' | 'subtract') => {
    if(!session) return;
    setIsSubmittingGroupPoints(true);
    const pointsToApply = type === 'add' ? points : -points;
    const selectedStudentsList = students.filter(s => selectedStudentIds.has(s.id));

    if (selectedStudentsList.length === 0) {
        setIsSubmittingGroupPoints(false);
        return;
    }

    try {
        const transactions = selectedStudentsList.map(student => ({ student_id: student.id, points: pointsToApply, reason, user_id: session.user.id }));
        const { error: txError } = await supabase.from('point_transactions').insert(transactions);
        if (txError) throw txError;

        const updatedStudents = selectedStudentsList.map(student => ({ ...student, points: Math.max(0, student.points + pointsToApply) }));
        const updatePromises = updatedStudents.map(student => supabase.from('students').update({ points: student.points }).eq('id', student.id));
        
        await Promise.all(updatePromises);

        setStudents(currentStudents => {
            const updatedStudentMap = new Map(updatedStudents.map(s => [s.id, s]));
            return currentStudents.map(s => updatedStudentMap.get(s.id) || s);
        });
        
        handleCloseGroupModal();
        handleClearSelection();
    } catch (error) {
        console.error("Error submitting group points:", error);
    } finally {
        setIsSubmittingGroupPoints(false);
    }
  };

  const handleAddRule = async (newRuleData: Omit<Rule, 'id' | 'created_at' | 'user_id'>) => {
    if(!session) return;
    try {
        const { data: newRule, error } = await supabase.from('rules').insert({...newRuleData, user_id: session.user.id}).select().single();
        if (error) throw error;
        if (newRule) setRules([...rules, newRule]);
    } catch (error) {
        console.error('Error adding rule:', error);
    }
  };

  const handleUpdateRule = async (updatedRule: Rule) => {
    try {
        const { error } = await supabase.from('rules').update({ description: updatedRule.description, points: updatedRule.points, type: updatedRule.type }).eq('id', updatedRule.id);
        if (error) throw error;
        setRules(rules.map(rule => rule.id === updatedRule.id ? updatedRule : rule));
    } catch (error) {
        console.error('Error updating rule:', error);
    }
  };
  
  const handleDeleteRule = async (ruleId: string) => {
     try {
        const { error } = await supabase.from('rules').delete().eq('id', ruleId);
        if (error) throw error;
        setRules(rules.filter(rule => rule.id !== ruleId));
    } catch (error) {
        console.error('Error deleting rule:', error);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const AuthPage = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
            <div className="flex justify-center mb-6">
                <TrophyIcon className="h-12 w-12 text-blue-600"/>
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">Sistem Poin Siswa</h2>
            <p className="text-center text-gray-500 mb-8">Masuk atau daftar untuk melanjutkan</p>
            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google']}
                socialLayout="horizontal"
                theme="light"
            />
        </div>
    </div>
  );

  const SettingsPage = () => {
    const [appName, setAppName] = useState(profile?.app_name || '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    if (!session) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let logoUrl = profile?.logo_url;
            let faviconUrl = profile?.favicon_url;

            if (logoFile) {
                const logoPath = `${session.user.id}/logo_${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('branding').upload(logoPath, logoFile);
                if (uploadError) throw uploadError;
                logoUrl = supabase.storage.from('branding').getPublicUrl(logoPath).data.publicUrl;
            }
            if (faviconFile) {
                const faviconPath = `${session.user.id}/favicon_${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('branding').upload(faviconPath, faviconFile);
                if (uploadError) throw uploadError;
                faviconUrl = supabase.storage.from('branding').getPublicUrl(faviconPath).data.publicUrl;
            }

            const updatedProfile: Database['public']['Tables']['profiles']['Insert'] = { id: session.user.id, app_name: appName, logo_url: logoUrl || '', favicon_url: faviconUrl || '' };
            const { data, error } = await supabase.from('profiles').upsert(updatedProfile).select().single();
            if (error) throw error;
            
            const profileData = data ? {
                ...data,
                app_name: data.app_name || '',
                logo_url: data.logo_url || '',
                favicon_url: data.favicon_url || '',
            } : null;

            setProfile(profileData);
            alert('Pengaturan berhasil disimpan!');

        } catch (error: any) {
            alert('Gagal menyimpan pengaturan: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Aplikasi</h2>
            <form onSubmit={handleSave} className="space-y-6">
                 <div>
                    <label htmlFor="appName" className="block text-sm font-medium text-gray-700">Nama Aplikasi</label>
                    <input type="text" id="appName" value={appName} onChange={e => setAppName(e.target.value)} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logo Aplikasi</label>
                        <div className="mt-1 flex items-center space-x-4">
                            {profile?.logo_url && <img src={profile.logo_url} className="h-16 w-16 rounded-md object-cover" />}
                            <input type="file" onChange={e => setLogoFile(e.target.files?.[0] || null)} accept="image/png, image/jpeg" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Favicon</label>
                         <div className="mt-1 flex items-center space-x-4">
                            {profile?.favicon_url && <img src={profile.favicon_url} className="h-16 w-16 rounded-md object-cover" />}
                            <input type="file" onChange={e => setFaviconFile(e.target.files?.[0] || null)} accept="image/png, image/jpeg, image/x-icon" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </form>
        </div>
    );
  };
  
  const DataManagementPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importType, setImportType] = useState<'students' | 'rules' | null>(null);

    const handleExport = (type: 'students' | 'rules') => {
        const data = type === 'students' ? students : rules;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const triggerImport = (type: 'students' | 'rules') => {
        setImportType(type);
        fileInputRef.current?.click();
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!session || !importType) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        try {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) throw new Error("File JSON harus berisi array.");

            const dataWithUser = data.map(item => ({ ...item, user_id: session.user.id, id: undefined, created_at: undefined }));
            
            if (importType === 'students') {
                type StudentInsert = Database['public']['Tables']['students']['Insert'];
                const { error } = await supabase.from('students').upsert(dataWithUser as StudentInsert[], { onConflict: 'name,user_id' });
                if (error) throw error;
            } else if (importType === 'rules') {
                type RuleInsert = Database['public']['Tables']['rules']['Insert'];
                const { error } = await supabase.from('rules').upsert(dataWithUser as RuleInsert[], { onConflict: 'description,user_id' });
                if (error) throw error;
            }
            
            alert(`Data ${importType} berhasil diimpor!`);
            // Refresh data
             if (importType === 'students') {
                const { data } = await supabase.from('students').select('*').eq('user_id', session.user.id);
                setStudents((data || []).map(s => ({...s, photo_url: s.photo_url || ''})));
            } else {
                const { data } = await supabase.from('rules').select('*').eq('user_id', session.user.id);
                setRules(data || []);
            }
        } catch (error: any) {
             alert(`Gagal mengimpor data: ${error.message}`);
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ekspor Data</h2>
                <p className="text-gray-600 mb-4">Unduh data Anda sebagai file JSON untuk cadangan atau penggunaan eksternal.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => handleExport('students')} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"><DownloadIcon className="h-5 w-5 mr-2" /> Ekspor Data Siswa</button>
                    <button onClick={() => handleExport('rules')} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"><DownloadIcon className="h-5 w-5 mr-2" /> Ekspor Data Peraturan</button>
                </div>
            </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Impor Data</h2>
                <p className="text-gray-600 mb-4">Impor data dari file JSON. Catatan yang ada akan diperbarui jika ada nama yang cocok.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                     <button onClick={() => triggerImport('students')} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"><UploadCloudIcon className="h-5 w-5 mr-2" /> Impor Data Siswa</button>
                    <button onClick={() => triggerImport('rules')} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"><UploadCloudIcon className="h-5 w-5 mr-2" /> Impor Data Peraturan</button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </div>
            </div>
        </div>
    );
  };
  
  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (fetchError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full mx-auto p-8 bg-white shadow-2xl rounded-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left mb-6 gap-4 sm:gap-0">
              <ExclamationIcon className="h-10 w-10 text-red-500 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Koneksi Database Gagal</h2>
                <p className="text-gray-600">Aplikasi tidak dapat mengambil data Anda. Ini mungkin karena masalah konfigurasi.</p>
              </div>
            </div>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
              <p className="font-semibold text-red-800">Penyebab Umum: Keamanan Tingkat Baris (RLS) tidak aktif</p>
              <p className="text-red-700 text-sm mt-1">Aplikasi ini memerlukan autentikasi. Anda perlu mengaktifkan RLS dan membuat "Policies" di Supabase untuk mengizinkan pengguna yang masuk mengakses data mereka sendiri.</p>
            </div>
            {supabaseProjectRef && (<div className="text-center mb-6 mt-8">
                <a href={`https://app.supabase.com/project/${supabaseProjectRef}/auth/policies`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <ExternalLinkIcon className="h-5 w-5 mr-2" /> Buka Pengaturan Supabase Policies
                </a>
            </div>)}
            <details className="bg-gray-50 rounded-lg p-3 mt-8">
              <summary className="font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900">Lihat Detail Error Teknis</summary>
              <div className="mt-2 bg-gray-900 text-white p-4 rounded-md text-left text-xs font-mono whitespace-pre-wrap overflow-x-auto"><code>{fetchError}</code></div>
            </details>
          </div>
        </div>
      );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} profile={profile} />
      
      {currentView === 'students' && selectedStudentIds.size > 0 && (
          <div className="sticky top-[84px] sm:top-[68px] z-10 bg-blue-50 py-3 px-4 sm:px-6 lg:px-8 shadow-md border-b border-blue-200">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm font-medium text-blue-800 text-center sm:text-left">{selectedStudentIds.size} siswa terpilih</p>
                  <div className="flex items-center gap-2">
                      <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600 hover:text-blue-800">Pilih Semua</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={handleClearSelection} className="text-sm font-medium text-blue-600 hover:text-blue-800">Batalkan</button>
                      <button 
                        onClick={() => setIsGroupModalOpen(true)}
                        className="ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ubah Poin Grup
                      </button>
                  </div>
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'students' ? (
            <>
              <AddStudentForm onAddStudent={handleAddStudent} isAdding={isAddingStudent}/>
              <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="Cari nama siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortByType)} className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white" aria-label="Urutkan Siswa">
                    <option value="points-desc">Urutkan: Poin Tertinggi</option>
                    <option value="points-asc">Urutkan: Poin Terendah</option>
                    <option value="name-asc">Urutkan: Nama A-Z</option>
                    <option value="name-desc">Urutkan: Nama Z-A</option>
                </select>
              </div>
              {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredStudents.map(student => (
                        <StudentCard 
                            key={student.id} 
                            student={student} 
                            onOpenModal={handleOpenModal} 
                            isSelected={selectedStudentIds.has(student.id)}
                            onToggleSelection={handleToggleSelection}
                        />
                    ))}
                </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak Ada Siswa</h3>
                        <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian Anda.' : 'Mulai dengan menambahkan siswa baru di atas.'}</p>
                    </div>
                )
              }
            </>
          ) : currentView === 'rules' ? (
            <RuleManagement rules={rules} onAddRule={handleAddRule} onUpdateRule={handleUpdateRule} onDeleteRule={handleDeleteRule}/>
          ) : currentView === 'settings' ? (
            <SettingsPage />
          ) : (
            <DataManagementPage />
          )}
        </div>
      </main>
      {selectedStudent && (
        <PointModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmitPoints} student={selectedStudent} modalType={modalType} rules={rules}/>
       )}
       <GroupPointModal 
            isOpen={isGroupModalOpen}
            onClose={handleCloseGroupModal}
            onSubmit={handleSubmitGroupPoints}
            selectedCount={selectedStudentIds.size}
            rules={rules}
            isSubmitting={isSubmittingGroupPoints}
       />
    </div>
  );
};

export default App;