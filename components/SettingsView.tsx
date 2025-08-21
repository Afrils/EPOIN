
import React, { useState, useRef } from 'react';
import { Profile, Database } from '../types';
import { supabase, supabaseProjectRef } from '../supabase/client';
import { UploadCloudIcon, TrophyIcon } from './icons';

interface SettingsViewProps {
  profile: Profile | null;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ profile, onProfileUpdate }) => {
  const [appName, setAppName] = useState(profile?.app_name || 'Sistem Poin Siswa');
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || null);
  const [faviconUrl, setFaviconUrl] = useState(profile?.favicon_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon'): Promise<string | null> => {
    if (!profile) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('app-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Gagal mengunggah ${type}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('app-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let newLogoUrl = logoUrl;
      let newFaviconUrl = faviconUrl;
      
      const logoFile = logoInputRef.current?.files?.[0];
      if (logoFile) {
        newLogoUrl = await handleImageUpload(logoFile, 'logo');
      }

      const faviconFile = faviconInputRef.current?.files?.[0];
      if (faviconFile) {
        newFaviconUrl = await handleImageUpload(faviconFile, 'favicon');
      }

      const updates: Database['public']['Tables']['profiles']['Update'] = {
        app_name: appName,
        logo_url: newLogoUrl,
        favicon_url: newFaviconUrl,
      };

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      if (data) {
        onProfileUpdate(data);
      }
      setSuccess('Pengaturan berhasil disimpan!');
      
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (faviconInputRef.current) faviconInputRef.current.value = "";

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const ImageInput: React.FC<{
    label: string;
    currentUrl: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    id: string;
  }> = ({ label, currentUrl, inputRef, id }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="h-16 w-16 rounded-lg object-cover bg-gray-100" />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
            <TrophyIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <label htmlFor={id} className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
            <div className="flex items-center">
              <UploadCloudIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span>Ganti Gambar</span>
            </div>
            <input ref={inputRef} id={id} name={id} type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml, image/x-icon" />
          </label>
           <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG, atau ICO.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Aplikasi</h2>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <div>
                <label htmlFor="app-name" className="block text-sm font-medium text-gray-700">Nama Aplikasi</label>
                <input
                    type="text"
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            
            <ImageInput label="Logo Aplikasi" currentUrl={logoUrl} inputRef={logoInputRef} id="logo-upload" />
            <ImageInput label="Favicon Aplikasi" currentUrl={faviconUrl} inputRef={faviconInputRef} id="favicon-upload" />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default SettingsView;