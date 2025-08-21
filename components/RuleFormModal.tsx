import React, { useState, useEffect } from 'react';
import { Rule } from '../types';
import { XIcon } from './icons';

interface RuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: Omit<Rule, 'id' | 'created_at' | 'user_id'>) => void;
  onUpdate: (rule: Rule) => void;
  initialData: Rule | null;
}

const RuleFormModal: React.FC<RuleFormModalProps> = ({ isOpen, onClose, onSubmit, onUpdate, initialData }) => {
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number | ''>('');
  const [type, setType] = useState<'achievement' | 'violation'>('violation');

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setDescription(initialData.description);
            setPoints(Math.abs(initialData.points));
            setType(initialData.type);
        } else {
            setDescription('');
            setPoints('');
            setType('violation');
        }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && points !== '') {
        const pointValue = type === 'violation' ? -Math.abs(Number(points)) : Math.abs(Number(points));
        if (initialData) {
            onUpdate({
                ...initialData,
                description,
                points: pointValue,
                type,
            });
        } else {
            onSubmit({
                description,
                points: pointValue,
                type,
            });
        }
    }
  };

  const modalTitle = initialData ? 'Edit Peraturan' : 'Tambah Peraturan Baru';

  return (
    <div className="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{modalTitle}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Jenis Peraturan</label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as 'achievement' | 'violation')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="violation">Pelanggaran (Poin Negatif)</option>
                        <option value="achievement">Prestasi (Poin Positif)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
                    <input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">Jumlah Poin (input angka positif)</label>
                    <input
                        type="number"
                        id="points"
                        value={points}
                        onChange={(e) => setPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                        min="1"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Batal
                    </button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Simpan
                    </button>
                </div>
            </form>
          </div>
           <button onClick={onClose} className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleFormModal;