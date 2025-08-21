import React, { useState, useEffect } from 'react';
import { Student, PointTransaction, ModalType, Rule } from '../types';
import { XIcon, PlusIcon, MinusIcon } from './icons';
import { supabase } from '../supabase/client';

interface PointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (points: number, reason: string) => void;
  student: Student | null;
  modalType: ModalType | null;
  rules: Rule[];
}

const ModalTitle: React.FC<{ type: ModalType | null; studentName: string }> = ({ type, studentName }) => {
    switch (type) {
        case 'add':
            return <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><PlusIcon className="h-6 w-6 text-green-500 mr-2"/>Tambah Poin untuk {studentName}</h3>;
        case 'subtract':
            return <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><MinusIcon className="h-6 w-6 text-red-500 mr-2"/>Kurangi Poin untuk {studentName}</h3>;
        case 'history':
            return <h3 className="text-lg leading-6 font-medium text-gray-900">Riwayat Poin: {studentName}</h3>;
        default:
            return null;
    }
};

const PointModal: React.FC<PointModalProps> = ({ isOpen, onClose, onSubmit, student, modalType, rules }) => {
  const [points, setPoints] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const resetForm = () => {
    setPoints('');
    setReason('');
    setIsManual(false);
    setSelectedRuleId('');
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (modalType === 'history' && student) {
        fetchHistory(student.id);
      }
    }
  }, [isOpen, modalType, student]);
  
  const fetchHistory = async (studentId: string) => {
    setIsHistoryLoading(true);
    setHistory([]);
    try {
        const { data, error } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
    } catch (error) {
        console.error('Error fetching history:', error);
        // You might want to show an error message to the user
    } finally {
        setIsHistoryLoading(false);
    }
  };
  
  const handleRuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const ruleId = e.target.value;
      setSelectedRuleId(ruleId);
      if (ruleId) {
          const selectedRule = rules.find(r => r.id === ruleId);
          if (selectedRule) {
              setPoints(Math.abs(selectedRule.points));
              setReason(selectedRule.description);
          }
      } else {
          setPoints('');
          setReason('');
      }
  };


  if (!isOpen || !student || !modalType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && points !== '' && reason.trim()) {
      onSubmit(Number(points), reason.trim());
    }
  };

  const relevantRules = rules.filter(rule => {
      if (modalType === 'add') return rule.type === 'achievement';
      if (modalType === 'subtract') return rule.type === 'violation';
      return false;
  });
  
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex items-center justify-end">
            <label htmlFor="manual-toggle" className="mr-2 text-sm font-medium text-gray-700">Input Manual</label>
            <input
                id="manual-toggle"
                type="checkbox"
                checked={isManual}
                onChange={() => {
                    setIsManual(!isManual);
                    resetForm();
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
        </div>

        {isManual ? (
            <>
                <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">Jumlah Poin</label>
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
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Alasan</label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </>
        ) : (
            <>
                <div>
                    <label htmlFor="rule" className="block text-sm font-medium text-gray-700">Pilih Peraturan</label>
                    <select
                        id="rule"
                        value={selectedRuleId}
                        onChange={handleRuleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="">-- Pilih {modalType === 'add' ? 'Prestasi' : 'Pelanggaran'} --</option>
                        {relevantRules.map(rule => (
                            <option key={rule.id} value={rule.id}>
                                {rule.description} ({rule.points} Poin)
                            </option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="reason-display" className="block text-sm font-medium text-gray-700">Keterangan</label>
                    <textarea
                        id="reason-display"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Deskripsi dari peraturan yang dipilih. Bisa diubah jika perlu."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </>
        )}

        <div className="pt-4 flex justify-end">
            <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Batal
            </button>
            <button
                type="submit"
                disabled={points === '' || reason.trim() === ''}
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${modalType === 'add' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
                Simpan
            </button>
        </div>
    </form>
  );

  const renderHistory = () => (
    <div className="mt-4 max-h-96 overflow-y-auto">
        {isHistoryLoading ? (
             <p className="text-gray-500 text-center py-4">Memuat riwayat...</p>
        ) : history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada riwayat poin.</p>
        ) : (
            <ul className="divide-y divide-gray-200">
                {history.map((tx: PointTransaction) => (
                    <li key={tx.id} className="py-4 flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{tx.reason}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <p className={`text-lg font-bold ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </p>
                    </li>
                ))}
            </ul>
        )}
        <div className="pt-4 flex justify-end">
             <button
                type="button"
                onClick={onClose}
                className="bg-blue-600 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Tutup
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <ModalTitle type={modalType} studentName={student.name}/>
                {modalType === 'history' ? renderHistory() : renderForm()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointModal;