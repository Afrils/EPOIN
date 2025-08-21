import React, { useState, useEffect } from 'react';
import { Rule } from '../types';
import { XIcon, PlusIcon, MinusIcon } from './icons';

interface GroupPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (points: number, reason: string, type: 'add' | 'subtract') => void;
  selectedCount: number;
  rules: Rule[];
  isSubmitting: boolean;
}

const GroupPointModal: React.FC<GroupPointModalProps> = ({ isOpen, onClose, onSubmit, selectedCount, rules, isSubmitting }) => {
    const [points, setPoints] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [isManual, setIsManual] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [modalType, setModalType] = useState<'add' | 'subtract'>('add');

    const resetForm = () => {
        setPoints('');
        setReason('');
        setIsManual(false);
        setSelectedRuleId('');
    };
    
    useEffect(() => {
        if(isOpen) {
            resetForm();
            setModalType('add');
        }
    }, [isOpen]);
    
    useEffect(() => {
        resetForm();
    }, [modalType]);

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
    
    if (!isOpen || selectedCount === 0) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (points !== '' && reason.trim() && !isSubmitting) {
            onSubmit(Number(points), reason.trim(), modalType);
        }
    };
    
    const relevantRules = rules.filter(rule => {
        if (modalType === 'add') return rule.type === 'achievement';
        if (modalType === 'subtract') return rule.type === 'violation';
        return false;
    });

    const typeButtonClasses = (type: 'add' | 'subtract') =>
        `w-full flex items-center justify-center py-2 px-4 rounded-lg font-medium transition ${
        modalType === type
            ? type === 'add' ? 'bg-green-600 text-white shadow' : 'bg-red-600 text-white shadow'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`;

    return (
        <div className="fixed z-20 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={isSubmitting ? undefined : onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Ubah Poin untuk {selectedCount} Siswa
                            </h3>
                            
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button onClick={() => setModalType('add')} className={typeButtonClasses('add')} disabled={isSubmitting}>
                                    <PlusIcon className="h-5 w-5 mr-2" /> Tambah Poin
                                </button>
                                <button onClick={() => setModalType('subtract')} className={typeButtonClasses('subtract')} disabled={isSubmitting}>
                                    <MinusIcon className="h-5 w-5 mr-2" /> Kurangi Poin
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                <div className="flex items-center justify-end">
                                    <label htmlFor="manual-toggle-group" className="mr-2 text-sm font-medium text-gray-700">Input Manual</label>
                                    <input
                                        id="manual-toggle-group"
                                        type="checkbox"
                                        checked={isManual}
                                        onChange={() => setIsManual(!isManual)}
                                        disabled={isSubmitting}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>

                                {isManual ? (
                                    <>
                                        <div>
                                            <label htmlFor="points-group" className="block text-sm font-medium text-gray-700">Jumlah Poin</label>
                                            <input type="number" id="points-group" value={points} onChange={(e) => setPoints(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" required disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                                        </div>
                                        <div>
                                            <label htmlFor="reason-group" className="block text-sm font-medium text-gray-700">Alasan</label>
                                            <textarea id="reason-group" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label htmlFor="rule-group" className="block text-sm font-medium text-gray-700">Pilih Peraturan</label>
                                            <select id="rule-group" value={selectedRuleId} onChange={handleRuleChange} disabled={isSubmitting} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                                <option value="">-- Pilih {modalType === 'add' ? 'Prestasi' : 'Pelanggaran'} --</option>
                                                {relevantRules.map(rule => (<option key={rule.id} value={rule.id}>{rule.description} ({rule.points} Poin)</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="reason-display-group" className="block text-sm font-medium text-gray-700">Keterangan</label>
                                            <textarea id="reason-display-group" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={isSubmitting} placeholder="Deskripsi dari peraturan yang dipilih. Bisa diubah jika perlu." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100">Batal</button>
                                    <button type="submit" disabled={points === '' || reason.trim() === '' || isSubmitting} className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${modalType === 'add' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed`}>
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                     <button onClick={onClose} disabled={isSubmitting} className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600 disabled:text-gray-200">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupPointModal;
