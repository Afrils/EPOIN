
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { XIcon, UserGroupIcon } from './icons';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (student: Student, newPhoto: File | null) => void;
  student: Student | null;
  isUpdating: boolean;
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ isOpen, onClose, onUpdate, student, isUpdating }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setPhotoPreview(student.photo_url);
      setPhoto(null); // Reset file input on open
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(student.photo_url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate({ ...student, name: name.trim() }, photo);
    }
  };

  return (
    <div className="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Siswa</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  id="student-photo-edit"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label htmlFor="student-name-edit" className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                <input
                  type="text"
                  id="student-name-edit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} disabled={isUpdating} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Batal
                </button>
                <button type="submit" disabled={isUpdating} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
          <button onClick={onClose} disabled={isUpdating} className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEditModal;
