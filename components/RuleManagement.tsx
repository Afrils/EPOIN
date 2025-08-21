
import React, { useState, useMemo } from 'react';
import { Rule } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './icons';
import RuleFormModal from './RuleFormModal';

interface RuleManagementProps {
  rules: Rule[];
  onAddRule: (rule: Omit<Rule, 'id' | 'created_at' | 'user_id'>) => void;
  onUpdateRule: (rule: Rule) => void;
  onDeleteRule: (ruleId: string) => void;
}

const RuleList: React.FC<{
  title: string;
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  type: 'achievement' | 'violation';
}> = ({ title, rules, onEdit, onDelete, type }) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className={`p-4 border-b ${type === 'achievement' ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className={`text-lg font-semibold ${type === 'achievement' ? 'text-green-800' : 'text-red-800'}`}>{title}</h3>
        </div>
        <ul className="divide-y divide-gray-200">
            {rules.length > 0 ? rules.map(rule => (
                <li key={rule.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <span className="flex-1 text-gray-800">{rule.description}</span>
                    <span className={`font-bold w-24 text-center ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{rule.points} Poin</span>
                    <div className="flex space-x-2 ml-4">
                        <button onClick={() => onEdit(rule)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition">
                            <PencilIcon />
                        </button>
                        <button onClick={() => onDelete(rule.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition">
                            <TrashIcon />
                        </button>
                    </div>
                </li>
            )) : <li className="p-4 text-center text-gray-500">Belum ada peraturan.</li>}
        </ul>
    </div>
);


const RuleManagement: React.FC<RuleManagementProps> = ({ rules, onAddRule, onUpdateRule, onDeleteRule }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    const { achievements, violations } = useMemo(() => {
        const achievements = rules.filter(r => r.type === 'achievement').sort((a,b) => b.points - a.points);
        const violations = rules.filter(r => r.type === 'violation').sort((a,b) => a.points - b.points);
        return { achievements, violations };
    }, [rules]);

    const handleOpenAddModal = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (rule: Rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRule(null);
    };

    const handleDelete = (ruleId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus peraturan ini?')) {
            onDeleteRule(ruleId);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 text-center sm:text-left">Manajemen Peraturan</h2>
                <button
                    onClick={handleOpenAddModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Peraturan
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RuleList
                    title="Daftar Prestasi (Poin Positif)"
                    rules={achievements}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDelete}
                    type="achievement"
                />
                <RuleList
                    title="Daftar Pelanggaran (Poin Negatif)"
                    rules={violations}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDelete}
                    type="violation"
                />
            </div>
            
            <RuleFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={(rule) => { onAddRule(rule); handleCloseModal(); }}
                onUpdate={(rule) => { onUpdateRule(rule); handleCloseModal(); }}
                initialData={editingRule}
            />
        </div>
    );
}

export default RuleManagement;