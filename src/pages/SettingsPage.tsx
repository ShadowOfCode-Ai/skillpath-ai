/**
 * @file SettingsPage.tsx
 * Account settings, theme selector (Dark, Light), data export as JSON,
 * and permanent account deletion with confirmation modal.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import {
  Settings,
  Download,
  Trash2,
  Moon,
  Sun,
  ShieldAlert,
  AlertTriangle,
  User,
  Check,
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, resume, assessmentHistory, roadmapProgress, theme, toggleTheme, clearAllUserData, logout } =
    useApp();
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Export my data as JSON
  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile,
      resume,
      assessmentHistory,
      roadmapProgress,
      exportVersion: '2.0.0',
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillPath_UserData_${profile.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Your complete profile data has been exported as JSON', 'success');
  };

  // Permanently delete account and data
  const handleConfirmDelete = () => {
    if (deleteConfirmationInput !== 'DELETE') {
      showToast('Please type DELETE to confirm permanent deletion', 'error');
      return;
    }

    clearAllUserData();
    logout();
    setShowDeleteModal(false);
    navigate('/');
    showToast('Your account and stored data have been permanently deleted', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-main font-heading">Account & Privacy Settings</h2>
        <p className="text-xs text-sub">Manage your display theme, export your data, or permanently delete your account.</p>
      </div>

      {/* Theme Settings */}
      <div className="card-elevated p-6 bg-surface border-app space-y-4">
        <h3 className="text-sm font-bold text-main">Interface Theme</h3>
        <p className="text-xs text-sub leading-relaxed">
          SkillPath AI is dark-first by default. You can toggle between dark and light themes at any time.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors ${
              theme === 'dark'
                ? 'border-brand bg-brand/10 text-brand-accent ring-1 ring-brand/30'
                : 'border-app bg-raised text-sub hover:text-main'
            }`}
          >
            <Moon className="w-4 h-4 text-sky-400" />
            <span>Dark Theme (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors ${
              theme === 'light'
                ? 'border-brand bg-brand/10 text-brand-accent ring-1 ring-brand/30'
                : 'border-app bg-raised text-sub hover:text-main'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* Data Export (JSON) */}
      <div className="card-elevated p-6 bg-surface border-app space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-main">
          <Download className="w-4 h-4 text-brand-accent" />
          <span>Export Stored Data</span>
        </div>
        <p className="text-xs text-sub leading-relaxed">
          Download a complete, machine-readable JSON backup of your candidate profile, parsed resume metadata, assessment scores, and saved roadmaps.
        </p>
        <button
          type="button"
          onClick={handleExportData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app bg-raised hover:bg-surface text-main font-semibold text-xs hover:border-brand/40 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export My Data as JSON</span>
        </button>
      </div>

      {/* Permanent Account Deletion */}
      <div className="card-elevated p-6 bg-surface border-red-500/30 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-red-500">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone: Permanent Account Deletion</span>
        </div>
        <p className="text-xs text-sub leading-relaxed">
          Permanently delete your account, extracted resume text, assessment history, and roadmaps. This action is irreversible.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 font-semibold text-xs border border-red-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete My Account and Data</span>
        </button>
      </div>

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-surface border border-app rounded-2xl p-6 shadow-2xl space-y-4 z-10 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-main">Confirm Account Deletion</h3>
                <p className="text-xs text-sub">This will permanently wipe your profile, resume, and assessment history.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-sub">
              <p>Type <strong className="text-red-500">DELETE</strong> in capital letters to confirm:</p>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 rounded-xl border border-app bg-raised text-main font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-app text-xs font-semibold text-sub hover:bg-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETE'}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
