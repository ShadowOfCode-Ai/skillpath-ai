/**
 * @file ProfilePage.tsx
 * Profile management with inline form validation, target role selection from taxonomy,
 * lookingFor preferences, and academic details.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import { CAREER_ROLES } from '../data/roles';
import { Check, Save, User, Briefcase, GraduationCap, MapPin, Link2 } from 'lucide-react';

export function ProfilePage() {
  const { profile, setProfile } = useApp();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: profile.name || '',
    email: profile.email || '',
    education: profile.education || '',
    degree: profile.degree || '',
    branch: profile.branch || '',
    graduationYear: profile.graduationYear || '2026',
    targetRoleId: profile.targetRoleId || 'data_scientist',
    selfRatedLevel: profile.selfRatedLevel || 'Intermediate',
    lookingFor: profile.lookingFor || 'Both',
    preferredLocations: (profile.preferredLocations || []).join(', '),
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    portfolio: profile.portfolio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.targetRoleId) errs.targetRoleId = 'Target career role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors in your profile form', 'error');
      return;
    }

    const locations = formData.preferredLocations
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setProfile((prev) => ({
      ...prev,
      name: formData.name.trim(),
      email: formData.email.trim(),
      education: formData.education.trim(),
      degree: formData.degree.trim(),
      branch: formData.branch.trim(),
      graduationYear: formData.graduationYear.trim(),
      targetRoleId: formData.targetRoleId,
      selfRatedLevel: formData.selfRatedLevel as 'Beginner' | 'Intermediate' | 'Advanced',
      lookingFor: formData.lookingFor as 'Internship' | 'Fresher Job' | 'Both',
      preferredLocations: locations.length > 0 ? locations : ['Bengaluru', 'Remote'],
      github: formData.github.trim(),
      linkedin: formData.linkedin.trim(),
      portfolio: formData.portfolio.trim(),
    }));

    setSaved(true);
    showToast('Profile and career preferences updated successfully!', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-main font-heading">Candidate Profile</h2>
          <p className="text-xs text-sub">Manage your education, target role, and career preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Identity */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-sm font-bold text-main border-b border-app pb-3">
            <User className="w-4 h-4 text-brand-accent" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="name" className="block font-semibold text-sub mb-1.5">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                  errors.name ? 'border-red-500' : 'border-app'
                }`}
                placeholder="e.g. Priya Sharma"
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block font-semibold text-sub mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                  errors.email ? 'border-red-500' : 'border-app'
                }`}
                placeholder="e.g. candidate@example.com"
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Card 2: Career Intent & Target Role */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-sm font-bold text-main border-b border-app pb-3">
            <Briefcase className="w-4 h-4 text-brand-accent" />
            <span>Target Role & Career Preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="targetRoleId" className="block font-semibold text-sub mb-1.5">
                Target Role *
              </label>
              <select
                id="targetRoleId"
                name="targetRoleId"
                value={formData.targetRoleId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {CAREER_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="selfRatedLevel" className="block font-semibold text-sub mb-1.5">
                Self-Rated Proficiency
              </label>
              <select
                id="selfRatedLevel"
                name="selfRatedLevel"
                value={formData.selfRatedLevel}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="Beginner">Beginner (&lt; 40%)</option>
                <option value="Intermediate">Intermediate (40% - 69%)</option>
                <option value="Advanced">Advanced (70%+)</option>
              </select>
            </div>

            <div>
              <label htmlFor="lookingFor" className="block font-semibold text-sub mb-1.5">
                Looking For
              </label>
              <select
                id="lookingFor"
                name="lookingFor"
                value={formData.lookingFor}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="Internship">Internship Only</option>
                <option value="Fresher Job">Fresher Job Only</option>
                <option value="Both">Both (Internship & Fresher Job)</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredLocations" className="block font-semibold text-sub mb-1.5">
                Preferred Locations (comma separated)
              </label>
              <input
                id="preferredLocations"
                name="preferredLocations"
                type="text"
                value={formData.preferredLocations}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Bengaluru, Remote, Hyderabad"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Academics & Links */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-sm font-bold text-main border-b border-app pb-3">
            <GraduationCap className="w-4 h-4 text-brand-accent" />
            <span>Education & Links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="education" className="block font-semibold text-sub mb-1.5">
                College / University
              </label>
              <input
                id="education"
                name="education"
                type="text"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="e.g. NIT Karnataka, Surathkal"
              />
            </div>

            <div>
              <label htmlFor="degree" className="block font-semibold text-sub mb-1.5">
                Degree & Branch
              </label>
              <input
                id="degree"
                name="degree"
                type="text"
                value={formData.degree}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>

            <div>
              <label htmlFor="graduationYear" className="block font-semibold text-sub mb-1.5">
                Graduation Year
              </label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="text"
                value={formData.graduationYear}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="2026"
              />
            </div>

            <div>
              <label htmlFor="github" className="block font-semibold text-sub mb-1.5">
                GitHub URL
              </label>
              <input
                id="github"
                name="github"
                type="url"
                value={formData.github}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-raised text-main text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted">
            {saved ? (
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Changes saved
              </span>
            ) : (
              'Remember to save after editing'
            )}
          </span>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
