import React, { useState } from 'react';
import { UserAddIcon } from './icons';

interface AddStudentFormProps {
  onAddStudent: (name: string, photo: File | null) => void;
  isAdding: boolean;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onAddStudent, isAdding }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
        setPhotoPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddStudent(name.trim(), photo);
      setName('');
      setPhoto(null);
      setPhotoPreview(null);
      // Reset file input
      const fileInput = document.getElementById('student-photo') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-shrink-0">
            {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover"/>
            ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserAddIcon className="h-8 w-8 text-gray-400" />
                </div>
            )}
        </div>
        <div className="relative flex-grow w-full">
            <input
            type="text"
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan Nama Siswa Baru..."
            className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            required
            />
        </div>
         <input
            type="file"
            id="student-photo"
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="w-full sm:w-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Menambahkan...' : 'Tambah Siswa'}
        </button>
      </form>
    </div>
  );
};

export default AddStudentForm;