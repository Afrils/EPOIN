

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
import StudentEditModal from './components/StudentEditModal';
import SettingsView from './components/SettingsView';
import DataManagementView from './components/DataManagementView';

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
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSubmittingGroupPoints, setIsSubmittingGroupPoints] = useState(false);

  // State for student edit modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(!session) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setStudents([]);
      setRules([]);
      setProfile(null);
      setFetchError(null);
      setCurrentView('students');
      return;
    };
    
    const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            // Fetch core data first. If these fail, we can't proceed.
            const [studentsResponse, rulesResponse] = await Promise.all([
                supabase.from('students').select('*'),
                supabase.from('rules').select('*'),
            ]);

            if (studentsResponse.error) throw studentsResponse.error;
            setStudents(studentsResponse.data || []);
            
            if (rulesResponse.error) throw rulesResponse.error;
            setRules(rulesResponse.data || []);
            
            // Attempt to fetch profile, but gracefully handle its absence.
            let userProfile: Profile | null = null;
            const profileResponse = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

            if (profileResponse.error) {
                if (profileResponse.error.code === 'PGRST116') {
                    // No profile row exists, try to create one.
                    try {
                        const newProfileData: Database['public']['Tables']['profiles']['Insert'] = { id: session.user.id, role: 'teacher', app_name: 'Sistem Poin Siswa' };
                        const { data: newProfile, error: insertError } = await supabase
                            .from('profiles')
                            .insert(newProfileData)
                            .select()
                            .single();
                        if (insertError) throw insertError; // If this fails, we'll fall back to default.
                        userProfile = newProfile;
                    } catch (creationError: any) {
                        console.warn(`Failed to create profile, possibly because the table is missing. Error: ${creationError.message}`);
                    }
                } else {
                    // A different error occurred, likely the table is missing or an RLS issue.
                    console.warn(`Could not fetch profile, falling back to default. Error: ${profileResponse.error.message}`);
                }
            } else {
                userProfile = profileResponse.data;
            }

            // If userProfile is still null, it means fetching and creation failed.
            // We create a default local profile object to allow the app to run in a degraded mode.
            if (!userProfile) {
                userProfile = {
                    id: session.user.id,
                    app_name: 'Sistem Poin Siswa',
                    logo_url: null,
                    favicon_url: null,
                    role: 'teacher' // Default to 'teacher' role for safety
                };
            }

            setProfile(userProfile);
            updateAppAppearance(userProfile);

        } catch (error: any) {
            // This will catch critical errors from students/rules fetching.
            setFetchError(`Gagal memuat data inti: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [session]);
  
  const updateAppAppearance = (profileData: Profile | null) => {
      if (!profileData) return;
      document.title = profileData.app_name || 'Sistem Poin Siswa';
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon && profileData.favicon_url) {
          favicon.href = profileData.favicon_url;
      }
  };
  
  // CRUD Handlers for Rules
  const handleAddRule = async (ruleData: Omit<Rule, 'id' | 'created_at' | 'user_id'>) => {
      if (!session) return;
      const newRule: Database['public']['Tables']['rules']['Insert'] = { ...ruleData, user_id: session.user.id };
      const { data, error } = await supabase
        .from('rules')
        .insert(newRule)
        .select()
        .single();
      if (error) {
          console.error('Error adding rule:', error);
      } else if (data) {
          setRules([...rules, data]);
      }
  };

  const handleUpdateRule = async (ruleData: Rule) => {
      const updatePayload: Database['public']['Tables']['rules']['Update'] = {
        description: ruleData.description,
        points: ruleData.points,
        type: ruleData.type,
      };
      const { data, error } = await supabase
        .from('rules')
        .update(updatePayload)
        .eq('id', ruleData.id)
        .select()
        .single();
      if (error) {
          console.error('Error updating rule:', error);
      } else if (data) {
          setRules(rules.map(r => r.id === data.id ? data : r));
      }
  };

  const handleDeleteRule = async (ruleId: string) => {
      const { error } = await supabase.from('rules').delete().eq('id', ruleId);
      if (error) {
          console.error('Error deleting rule:', error);
      } else {
          setRules(rules.filter(r => r.id !== ruleId));
      }
  };

  // Student CRUD handlers
  const handleAddStudent = async (name: string, photo: File | null) => {
    if (!session) return;
    setIsAddingStudent(true);
    let photoUrl: string | null = null;

    try {
        if (photo) {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;
            let { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, photo);
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('student-photos').getPublicUrl(filePath);
            photoUrl = publicUrlData.publicUrl;
        }

        const newStudent: Database['public']['Tables']['students']['Insert'] = { name, photo_url: photoUrl };
        const { data, error } = await supabase
            .from('students')
            .insert(newStudent)
            .select()
            .single();

        if (error) throw error;
        if (data) {
            setStudents([data, ...students]);
        }

    } catch (error: any) {
        console.error('Error adding student:', error.message);
        alert('Gagal menambahkan siswa: ' + error.message);
    } finally {
        setIsAddingStudent(false);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (updatedStudent: Student, newPhoto: File | null) => {
      if (!session) return;
      setIsUpdatingStudent(true);
      
      let studentToUpdate = { ...updatedStudent };

      try {
          if (newPhoto) {
              const fileExt = newPhoto.name.split('.').pop();
              const fileName = `${Date.now()}.${fileExt}`;
              const filePath = `${session.user.id}/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('student-photos')
                  .upload(filePath, newPhoto, { upsert: true });
              if (uploadError) throw uploadError;
              
              const { data: publicUrlData } = supabase.storage.from('student-photos').getPublicUrl(filePath);
              studentToUpdate.photo_url = publicUrlData.publicUrl;
          }

          const studentUpdate: Database['public']['Tables']['students']['Update'] = { name: studentToUpdate.name, photo_url: studentToUpdate.photo_url };
          const { data, error } = await supabase
              .from('students')
              .update(studentUpdate)
              .eq('id', studentToUpdate.id)
              .select()
              .single();

          if (error) throw error;
          
          if(data) {
            setStudents(students.map(s => s.id === data.id ? data : s));
            setIsEditModalOpen(false);
            setEditingStudent(null);
          }
      } catch (error: any) {
          console.error('Error updating student:', error);
          alert('Gagal memperbarui siswa: ' + error.message);
      } finally {
          setIsUpdatingStudent(false);
      }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat diurungkan.')) return;
    
    try {
        const studentToDelete = students.find(s => s.id === studentId);
        if (studentToDelete?.photo_url) {
            const path = new URL(studentToDelete.photo_url).pathname.split('/student-photos/')[1];
            await supabase.storage.from('student-photos').remove([path]);
        }
        
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) throw error;
        
        setStudents(students.filter(s => s.id !== studentId));
    } catch (error: any) {
        console.error('Error deleting student:', error);
        alert('Gagal menghapus siswa: ' + error.message);
    }
  };

  // Points handlers
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

  const handlePointSubmit = async (points: number, reason: string) => {
    if (!selectedStudent || !session) return;

    const pointChange = modalType === 'subtract' ? -Math.abs(points) : Math.abs(points);
    const newTotal = selectedStudent.points + pointChange;
    
    const studentUpdate: Database['public']['Tables']['students']['Update'] = { points: newTotal };
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update(studentUpdate)
      .eq('id', selectedStudent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating points:', updateError);
      return;
    }

    if (updatedStudent) {
      const newTransaction: Database['public']['Tables']['point_transactions']['Insert'] = { student_id: selectedStudent.id, points: pointChange, reason, user_id: session.user.id };
      const { error: txError } = await supabase
        .from('point_transactions')
        .insert(newTransaction);
        
      if (txError) {
        console.error('Error logging transaction:', txError);
      }

      setStudents(students.map(s => (s.id === selectedStudent.id ? updatedStudent : s)));
      handleCloseModal();
    }
  };

  // Group points handlers
  const handleToggleSelection = (id: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStudentIds(newSelection);
  };

  const handleGroupPointSubmit = async (points: number, reason: string, type: 'add' | 'subtract') => {
      if (selectedStudentIds.size === 0 || !session) return;
      setIsSubmittingGroupPoints(true);
      const pointChange = type === 'subtract' ? -Math.abs(points) : Math.abs(points);

      const updates = Array.from(selectedStudentIds).map(id => {
          const student = students.find(s => s.id === id);
          if (!student) return null;
          const studentUpdate: Database['public']['Tables']['students']['Update'] = { points: student.points + pointChange };
          return supabase
              .from('students')
              .update(studentUpdate)
              .eq('id', id)
      }).filter(Boolean);

      const transactions: Database['public']['Tables']['point_transactions']['Insert'][] = Array.from(selectedStudentIds).map(id => ({
          student_id: id,
          points: pointChange,
          reason: `${reason} (Grup)`,
          user_id: session.user.id
      }));

      try {
          await Promise.all(updates);
          await supabase.from('point_transactions').insert(transactions);
          
          // Refetch all students to ensure data consistency
          const { data, error } = await supabase.from('students').select('*');
          if (error) throw error;
          setStudents(data || []);

      } catch (error) {
          console.error("Error updating group points:", error);
      } finally {
          setIsSubmittingGroupPoints(false);
          setIsGroupModalOpen(false);
          setSelectedStudentIds(new Set());
      }
  };
  
  // Profile update handler
  const handleProfileUpdate = (updatedProfile: Profile) => {
      setProfile(updatedProfile);
      updateAppAppearance(updatedProfile);
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      switch (sortBy) {
        case 'points-desc': return b.points - a.points;
        case 'points-asc': return a.points - b.points;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [students, sortBy]);
  
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedStudents, searchTerm]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  }
  
  if (!session) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <div className="flex justify-center mb-6">
                    <TrophyIcon className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Sistem E-Poin Siswa</h2>
                <Auth 
                    supabaseClient={supabase} 
                    appearance={{ theme: ThemeSupa }} 
                    providers={['google']}
                    theme="light"
                />
            </div>
        </div>
    );
  }

  const renderContent = () => {
      if (isLoading) {
        return <div className="text-center py-10">Memuat data...</div>;
      }
      if (fetchError) {
        return <div className="text-center py-10 text-red-500">{fetchError}</div>;
      }

      switch(currentView) {
        case 'students':
          return (
            <>
              {profile?.role === 'admin' && (
                  <AddStudentForm onAddStudent={handleAddStudent} isAdding={isAddingStudent} />
              )}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortByType)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="points-desc">Poin Tertinggi</option>
                    <option value="points-asc">Poin Terendah</option>
                    <option value="name-asc">Nama (A-Z)</option>
                    <option value="name-desc">Nama (Z-A)</option>
                  </select>
                </div>
                {selectedStudentIds.size > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">{selectedStudentIds.size} siswa terpilih.</p>
                        <div>
                             <button onClick={() => setIsGroupModalOpen(true)} className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Ubah Poin Grup</button>
                             <button onClick={() => setSelectedStudentIds(new Set())} className="ml-2 px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Batalkan Pilihan</button>
                        </div>
                    </div>
                )}
              </div>
              {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStudents.map(student => (
                    <StudentCard 
                        key={student.id} 
                        student={student} 
                        onOpenModal={handleOpenModal}
                        isSelected={selectedStudentIds.has(student.id)}
                        onToggleSelection={handleToggleSelection}
                        userRole={profile?.role}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteStudent}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada siswa</h3>
                  <p className="mt-1 text-sm text-gray-500">{searchTerm ? "Tidak ada siswa yang cocok dengan pencarian Anda." : "Mulai dengan menambahkan siswa baru."}</p>
                </div>
              )}
            </>
          );
        case 'rules':
            return <RuleManagement rules={rules} onAddRule={handleAddRule} onUpdateRule={handleUpdateRule} onDeleteRule={handleDeleteRule} />;
        case 'settings':
            return <SettingsView profile={profile} onProfileUpdate={handleProfileUpdate} />;
        case 'data':
            return <DataManagementView students={students} rules={rules} />;
        default:
          return null;
      }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        profile={profile}
      />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
      <PointModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handlePointSubmit}
        student={selectedStudent}
        modalType={modalType}
        rules={rules}
      />
      <GroupPointModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleGroupPointSubmit}
        selectedCount={selectedStudentIds.size}
        rules={rules}
        isSubmitting={isSubmittingGroupPoints}
      />
      <StudentEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingStudent(null); }}
        onUpdate={handleUpdateStudent}
        student={editingStudent}
        isUpdating={isUpdatingStudent}
      />
    </div>
  );
};

export default App;