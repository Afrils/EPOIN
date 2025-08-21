
import React from 'react';
import { Student } from '../types';
import { PlusIcon, MinusIcon, HistoryIcon, UserGroupIcon, CheckIcon } from './icons';

interface StudentCardProps {
  student: Student;
  onOpenModal: (student: Student, type: 'add' | 'subtract' | 'history') => void;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

const getPointColor = (points: number) => {
  if (points >= 85) return 'text-green-500';
  if (points < 50) return 'text-red-600';
  if (points < 70) return 'text-yellow-600';
  return 'text-gray-800';
};

const StudentCard: React.FC<StudentCardProps> = ({ student, onOpenModal, isSelected, onToggleSelection }) => {
  const pointColor = getPointColor(student.points);
  
  const handleButtonClick = (e: React.MouseEvent, type: 'add' | 'subtract' | 'history') => {
    e.stopPropagation();
    onOpenModal(student, type);
  };


  return (
    <div 
        onClick={() => onToggleSelection(student.id)}
        className={`relative bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 scale-105' : 'ring-0'}`}
    >
       {isSelected && (
        <div className="absolute top-3 right-3 bg-blue-600 rounded-full h-6 w-6 flex items-center justify-center text-white z-10">
          <CheckIcon className="h-4 w-4" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {student.photo_url ? (
            <img className="h-16 w-16 rounded-full object-cover ring-4 ring-gray-200" src={student.photo_url} alt={student.name} />
          ) : (
            <div className="h-16 w-16 rounded-full object-cover ring-4 ring-gray-200 bg-gray-100 flex items-center justify-center">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{student.name}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${pointColor}`}>{student.points} <span className="text-base sm:text-lg font-medium text-gray-500">Poin</span></p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm font-medium">
          <button
            onClick={(e) => handleButtonClick(e, 'add')}
            className="flex items-center justify-center py-2 px-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
          >
            <PlusIcon className="h-5 w-5 mr-1" /> Tambah
          </button>
          <button
            onClick={(e) => handleButtonClick(e, 'subtract')}
            className="flex items-center justify-center py-2 px-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
          >
            <MinusIcon className="h-5 w-5 mr-1" /> Kurang
          </button>
          <button
            onClick={(e) => handleButtonClick(e, 'history')}
            className="flex items-center justify-center py-2 px-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
          >
            <HistoryIcon className="h-5 w-5 mr-1" /> Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;