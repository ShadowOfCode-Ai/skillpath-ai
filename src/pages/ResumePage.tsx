/**
 * @file ResumePage.tsx
 * In-browser and server-assisted resume extraction, client text parsing,
 * scanned document fallback, sample resume loader, completeness checklist,
 * and category-grouped skill review with removal and addition controls.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import { SkillChip } from '../components/common/SharedComponents';
import { SKILLS_TAXONOMY, SkillCategory } from '../data/skills';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Sparkles,
  Shield,
  X,
  FileCheck,
} from 'lucide-react';
import { MAX_FILE_MB, MAX_RESUME_CHARS } from '../config/scoring';

export function ResumePage() {
  const {
    resume,
    processResumeText,
    loadSampleResume,
    addManualSkill,
    removeDetectedSkill,
  } = useApp();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullTextModal, setShowFullTextModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  // Process chosen file
  const handleFileSelected = async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`File size exceeds maximum limit of ${MAX_FILE_MB}MB`, 'error');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'pdf', 'docx'].includes(ext || '')) {
      showToast('Supported formats: TXT, PDF, DOCX (up to 5MB)', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      if (ext === 'txt') {
        const text = await file.text();
        await handleParsedText(text, file.name);
      } else if (ext === 'pdf') {
        // Attempt browser-side PDF extraction via pdfjs-dist
        try {
          // Dynamic import of pdfjs-dist for performance
          const pdfjs = await import('pdfjs-dist');
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str || '')
              .join(' ');
            fullText += pageText + '\n';
          }

          if (!fullText.trim() || fullText.trim().length < 50) {
            // PDF has no extractable text (likely scanned image)
            showToast('This PDF looks scanned or image-based with no extractable text. Please paste text instead.', 'info');
            setShowPasteModal(true);
            return;
          }

          await handleParsedText(fullText, file.name);
        } catch (pdfErr) {
          console.warn('PDF extraction failed; opening text paste fallback', pdfErr);
          showToast('Could not extract text from this PDF. Please paste your resume text.', 'info');
          setShowPasteModal(true);
        }
      } else {
        // DOCX or fallback
        showToast('Please paste your resume text for immediate processing.', 'info');
        setShowPasteModal(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error reading file. Please paste text directly.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsedText = async (text: string, fileName?: string) => {
    const trimmed = text.slice(0, MAX_RESUME_CHARS);
    await processResumeText(trimmed, fileName);
    showToast('Resume processed and skills extracted!', 'success');
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      showToast('Please enter your resume text', 'error');
      return;
    }
    await handleParsedText(pastedText, 'Pasted_Resume.txt');
    setShowPasteModal(false);
    setPastedText('');
  };

  // Group detected skills by category
  const skillsByCategory = React.useMemo(() => {
    if (!resume) return {};

    const groups: Partial<Record<SkillCategory, any[]>> = {};

    for (const item of resume.detectedSkills) {
      if (item.removedByUser) continue;
      const def = SKILLS_TAXONOMY.find((s) => s.id === item.skillId);
      const category: SkillCategory = def?.category || 'Programming';
      if (!groups[category]) groups[category] = [];
      groups[category]!.push({
        ...item,
        name: def?.name || item.skillId,
      });
    }

    return groups;
  }, [resume]);

  // Handle adding manual skill from taxonomy
  const handleAddManualSkill = () => {
    if (!selectedSkillToAdd) return;
    addManualSkill(selectedSkillToAdd);
    setSelectedSkillToAdd('');
    showToast('Skill added to your claimed profile!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-main font-heading">Resume & Skill Extraction</h2>
          <p className="text-xs text-sub">
            Skills are parsed strictly via dictionary token boundaries without sending files to external ML services.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleResume}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-app bg-surface text-brand-accent hover:bg-raised text-xs font-semibold transition-colors shrink-0 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
          <span>Try the sample resume</span>
        </button>
      </div>

      {/* Dropzone with Drag State */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card-elevated p-8 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-2 ring-brand/30'
            : 'border-app hover:border-brand/40 bg-surface'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelected(e.target.files[0]);
            }
          }}
        />
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-raised border border-app text-brand-accent flex items-center justify-center mx-auto shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-main">
              {isProcessing ? 'Processing extracted text...' : 'Drop your resume file here, or click to browse'}
            </h3>
            <p className="text-xs text-muted mt-1">
              Supports PDF, DOCX, and TXT up to 5 MB. Original files never leave your device.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPasteModal(true);
              }}
              className="text-xs text-brand-accent hover:underline font-semibold"
            >
              Paste your resume text instead
            </button>
          </div>
        </div>
      </div>

      {/* Extracted File & Text Preview */}
      {resume && (
        <div className="card-elevated p-6 bg-surface border-app space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-app gap-2">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <span className="text-sm font-bold text-main">{resume.fileName}</span>
                <span className="text-xs text-muted ml-2">
                  ({resume.wordCount} words • {resume.detectedSkills.filter((s) => !s.removedByUser).length} skills found)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFullTextModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:underline font-semibold"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show full text</span>
            </button>
          </div>

          {/* 600-character snippet preview */}
          <div className="p-3.5 rounded-xl bg-raised border border-app text-xs text-sub font-mono leading-relaxed max-h-32 overflow-hidden relative">
            <p className="line-clamp-4 whitespace-pre-wrap">{resume.extractedText.slice(0, 600)}...</p>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-raised to-transparent pointer-events-none" />
          </div>

          {/* Completeness Checklist */}
          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
              Resume Completeness Signals
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {resume.sectionsFound.map((sec) => (
                <div
                  key={sec.section}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                    sec.found
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium'
                      : 'bg-raised text-muted border-app'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{sec.section}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Detected Skills */}
      {resume && (
        <div className="card-elevated p-6 bg-surface border-app space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-main font-heading">Review Detected Skills</h3>
              <span className="text-xs text-muted">
                {resume.detectedSkills.filter((s) => !s.removedByUser).length} active skills
              </span>
            </div>
            <p className="text-xs text-sub leading-relaxed">
              Skills were identified from your resume using SkillPath’s skill dictionary and text matching. Review them: remove anything incorrect and add anything we missed.
            </p>
          </div>

          {/* Skills grouped by category */}
          <div className="space-y-4">
            {Object.keys(skillsByCategory).length > 0 ? (
              Object.entries(skillsByCategory).map(([category, skills]) => (
                <div key={category} className="space-y-2">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider">{category}</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((item) => (
                      <SkillChip
                        key={item.skillId}
                        name={item.name}
                        status="UNVERIFIED"
                        reason={item.source === 'manual' ? 'Added by you' : `Found in resume: "${item.snippet}"`}
                        onRemove={() => removeDetectedSkill(item.skillId)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted py-4 text-center">
                Zero skills detected. You can add skills manually below or try the sample resume.
              </div>
            )}
          </div>

          {/* Add skill from taxonomy dropdown */}
          <div className="pt-4 border-t border-app flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedSkillToAdd}
              onChange={(e) => setSelectedSkillToAdd(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Select a skill to add from taxonomy...</option>
              {SKILLS_TAXONOMY.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.category})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedSkillToAdd}
              onClick={handleAddManualSkill}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Text Modal */}
      {showFullTextModal && resume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFullTextModal(false)} />
          <div className="relative w-full max-w-2xl bg-surface border border-app rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh] z-10 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-app mb-4">
              <h3 className="text-base font-bold text-main">{resume.fileName} (Full Text)</h3>
              <button
                type="button"
                onClick={() => setShowFullTextModal(false)}
                className="p-1 rounded-lg text-sub hover:text-main focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs text-sub leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-raised border border-app">
              {resume.extractedText}
            </div>
          </div>
        </div>
      )}

      {/* Paste Resume Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasteModal(false)} />
          <div className="relative w-full max-w-xl bg-surface border border-app rounded-2xl p-6 shadow-2xl space-y-4 z-10 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-app">
              <h3 className="text-base font-bold text-main">Paste Resume Text</h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg text-sub hover:text-main focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-sub">
              Paste the plain text of your resume below. Skills and contact signals will be extracted automatically.
            </p>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-3 rounded-xl border border-app bg-raised text-main text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Paste your education, skills, experience, and project descriptions here..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl border border-app text-xs font-semibold text-sub hover:bg-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-sm"
              >
                Extract Skills
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
