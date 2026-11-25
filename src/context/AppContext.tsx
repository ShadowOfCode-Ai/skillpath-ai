/**
 * @file AppContext.tsx
 * Central application state for SkillPath AI.
 * Coordinates user auth, profile, resume extraction, assessment state,
 * verified skill profile derivation, saved items, and settings.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirestoreConnection } from '../lib/firebase';
import { SkillVerificationRecord, verifySkill } from '../engine/verifier';
import { DetectedSkill } from '../engine/skillExtractor';
import { CareerRecommendation, rankCareerRoles } from '../engine/careerRanker';
import { CAREER_ROLES } from '../data/roles';
import { SAMPLE_RESUME_TEXT, SAMPLE_CANDIDATE_NAME } from '../data/sampleResume';
import { extractSkillsFromText } from '../engine/skillExtractor';
import { detectSections, extractContactSignals, countWords } from '../engine/textTools';
import { StepProgressStatus } from '../engine/roadmapBuilder';

export interface UserProfileData {
  uid: string;
  name: string;
  email: string;
  education?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  targetRoleId: string;
  selfRatedLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLocations: string[];
  lookingFor: 'Internship' | 'Fresher Job' | 'Both';
  github?: string;
  linkedin?: string;
  portfolio?: string;
  consentTimestamp?: string;
}

export interface UserResumeData {
  fileName: string;
  fileType: string;
  sizeBytes: number;
  extractedText: string;
  wordCount: number;
  sectionsFound: { section: string; found: boolean }[];
  contactSignals: { email?: string; phone?: string; github?: string; linkedin?: string };
  detectedSkills: DetectedSkill[];
  uploadedAt: string;
}

export interface AppContextType {
  // Auth & Profile
  user: User | null;
  isDemoUser: boolean;
  isAdmin: boolean;
  profile: UserProfileData;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData>>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: () => void;
  loginAsAdminDemo: () => void;
  logout: () => Promise<void>;

  // Resume
  resume: UserResumeData | null;
  processResumeText: (text: string, fileName?: string) => Promise<void>;
  loadSampleResume: () => Promise<void>;
  addManualSkill: (skillId: string) => void;
  removeDetectedSkill: (skillId: string) => void;

  // Assessments
  assessmentHistory: Record<string, { percent: number; total: number; isAssessed: boolean; date: string }>;
  recordAssessmentResult: (perSkill: Record<string, { percent: number; total: number; isAssessed: boolean }>) => void;

  // Verified Derived State
  verifiedSkillsMap: Map<string, SkillVerificationRecord>;
  verifiedSkillsList: SkillVerificationRecord[];
  careerRecommendations: CareerRecommendation[];

  // Roadmap Progress
  roadmapProgress: Record<string, StepProgressStatus>;
  updateRoadmapStep: (stepId: string, status: StepProgressStatus) => void;

  // Saved Opportunities
  savedOpportunityIds: Set<string>;
  toggleSaveOpportunity: (id: string) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Admin Controls
  showSampleListings: boolean;
  setShowSampleListings: (val: boolean) => void;

  // Global Actions
  clearAllUserData: () => void;
  isInitialLoading: boolean;
}

const DEFAULT_PROFILE: UserProfileData = {
  uid: 'guest',
  name: 'Student Candidate',
  email: '',
  education: 'Engineering / Computing',
  degree: 'Bachelor of Technology',
  branch: 'Computer Science',
  graduationYear: '2026',
  targetRoleId: 'data_analyst',
  selfRatedLevel: 'Intermediate',
  lookingFor: 'Both',
  preferredLocations: ['Bengaluru', 'Remote', 'Hyderabad'],
  consentTimestamp: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [isAdminDemo, setIsAdminDemo] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_PROFILE);
  const [resume, setResume] = useState<UserResumeData | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<
    Record<string, { percent: number; total: number; isAssessed: boolean; date: string }>
  >({});
  const [roadmapProgress, setRoadmapProgress] = useState<Record<string, StepProgressStatus>>({});
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());
  const [showSampleListings, setShowSampleListings] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Theme management with localStorage persistence and system-setting fallback
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('skillpath_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Dark by default as required
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('skillpath_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Test Firestore Connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoUser(false);
        setProfile((prev) => ({
          ...prev,
          uid: currentUser.uid,
          name: currentUser.displayName || prev.name,
          email: currentUser.email || prev.email,
        }));
      } else if (!isDemoUser) {
        setUser(null);
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  // Determine admin status: Google email gootymahind@gmail.com OR active admin demo
  const isAdmin = useMemo(() => {
    if (isAdminDemo) return true;
    if (user && user.email === 'gootymahind@gmail.com') return true;
    return false;
  }, [user, isAdminDemo]);

  // Auth Functions
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Popup sign in not completed or blocked; providing simulated session', err);
      loginAsDemoUser();
    }
  };

  const loginAsDemoUser = () => {
    setIsDemoUser(true);
    setIsAdminDemo(false);
    setProfile({
      uid: 'demo-candidate-priya',
      name: SAMPLE_CANDIDATE_NAME,
      email: 'priya.sharma.sample@example.com',
      education: 'National Institute of Technology Karnataka (NITK)',
      degree: 'B.Tech in Computer Science',
      branch: 'Computer Science & Engineering',
      graduationYear: '2026',
      targetRoleId: 'data_scientist',
      selfRatedLevel: 'Intermediate',
      preferredLocations: ['Bengaluru', 'Remote'],
      lookingFor: 'Both',
      github: 'https://github.com/priyasharma-sample',
      linkedin: 'https://linkedin.com/in/priya-sharma-sample',
      consentTimestamp: new Date().toISOString(),
    });
    // Auto-load sample resume for instant golden path evaluation
    loadSampleResume();
  };

  const loginAsAdminDemo = () => {
    setIsDemoUser(true);
    setIsAdminDemo(true);
    setProfile({
      uid: 'admin-user-01',
      name: 'Gooty Mahindra (Admin)',
      email: 'gootymahind@gmail.com',
      education: 'SkillPath Administration',
      degree: 'System Engineer',
      branch: 'Systems',
      graduationYear: '2026',
      targetRoleId: 'data_analyst',
      selfRatedLevel: 'Advanced',
      preferredLocations: ['Bengaluru'],
      lookingFor: 'Both',
      consentTimestamp: new Date().toISOString(),
    });
  };

  const logout = async () => {
    setIsDemoUser(false);
    setIsAdminDemo(false);
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setResume(null);
    setAssessmentHistory({});
    setRoadmapProgress({});
    setSavedOpportunityIds(new Set());
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  };

  // Resume processing
  const processResumeText = async (text: string, fileName?: string) => {
    const detectedSkills = extractSkillsFromText(text);
    const sectionsFound = detectSections(text);
    const contactSignals = extractContactSignals(text);
    const wordCount = countWords(text);

    const newResume: UserResumeData = {
      fileName: fileName || 'Uploaded_Resume.txt',
      fileType: fileName?.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
      sizeBytes: text.length,
      extractedText: text.slice(0, 60000),
      wordCount,
      sectionsFound,
      contactSignals,
      detectedSkills,
      uploadedAt: new Date().toISOString(),
    };

    setResume(newResume);

    // Auto-fill profile contact info if blank
    setProfile((prev) => ({
      ...prev,
      github: prev.github || contactSignals.github,
      linkedin: prev.linkedin || contactSignals.linkedin,
    }));
  };

  const loadSampleResume = async () => {
    await processResumeText(SAMPLE_RESUME_TEXT, 'Priya_Sharma_Sample_Resume.txt');
  };

  const addManualSkill = (skillId: string) => {
    if (!resume) {
      setResume({
        fileName: 'Manual_Profile.txt',
        fileType: 'text/plain',
        sizeBytes: 0,
        extractedText: 'Manually declared skills',
        wordCount: 3,
        sectionsFound: [],
        contactSignals: {},
        detectedSkills: [{ skillId, mentions: 1, snippet: 'Manually added by you', source: 'manual' }],
        uploadedAt: new Date().toISOString(),
      });
      return;
    }

    setResume((prev) => {
      if (!prev) return prev;
      const exists = prev.detectedSkills.some((s) => s.skillId === skillId);
      if (exists) {
        return {
          ...prev,
          detectedSkills: prev.detectedSkills.map((s) =>
            s.skillId === skillId ? { ...s, removedByUser: false } : s
          ),
        };
      }
      return {
        ...prev,
        detectedSkills: [
          ...prev.detectedSkills,
          { skillId, mentions: 1, snippet: 'Manually added by you', source: 'manual' },
        ],
      };
    });
  };

  const removeDetectedSkill = (skillId: string) => {
    if (!resume) return;
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        detectedSkills: prev.detectedSkills.map((s) =>
          s.skillId === skillId ? { ...s, removedByUser: true } : s
        ),
      };
    });
  };

  const recordAssessmentResult = (
    perSkill: Record<string, { percent: number; total: number; isAssessed: boolean }>
  ) => {
    setAssessmentHistory((prev) => {
      const updated = { ...prev };
      const now = new Date().toISOString();
      for (const [skillId, stats] of Object.entries(perSkill)) {
        updated[skillId] = {
          percent: stats.percent,
          total: stats.total,
          isAssessed: stats.isAssessed,
          date: now,
        };
      }
      return updated;
    });
  };

  // Derive Verified Skills Map
  // Invariant: Never marked VERIFIED from resume alone; must have score >= 60%
  const verifiedSkillsMap = useMemo(() => {
    const map = new Map<string, SkillVerificationRecord>();

    // 1. Process skills present in resume
    if (resume) {
      for (const skill of resume.detectedSkills) {
        if (skill.removedByUser) continue;
        const claimedInResume = skill.source === 'resume';
        const manualClaim = skill.source === 'manual';
        const assessment = assessmentHistory[skill.skillId];

        const record = verifySkill(
          skill.skillId,
          claimedInResume,
          manualClaim,
          assessment,
          skill.snippet
        );
        map.set(skill.skillId, record);
      }
    }

    // 2. Process skills assessed but not on resume (Assessment-Only pathway)
    for (const [skillId, assessment] of Object.entries(assessmentHistory)) {
      if (!map.has(skillId)) {
        const record = verifySkill(skillId, false, false, assessment);
        map.set(skillId, record);
      }
    }

    return map;
  }, [resume, assessmentHistory]);

  const verifiedSkillsList = useMemo(() => {
    return Array.from(verifiedSkillsMap.values());
  }, [verifiedSkillsMap]);

  // Derive Career Recommendations live from pure rankCareerRoles engine
  const careerRecommendations = useMemo(() => {
    return rankCareerRoles(CAREER_ROLES, verifiedSkillsMap, profile.targetRoleId);
  }, [verifiedSkillsMap, profile.targetRoleId]);

  const updateRoadmapStep = (stepId: string, status: StepProgressStatus) => {
    setRoadmapProgress((prev) => ({
      ...prev,
      [stepId]: status,
    }));
  };

  const toggleSaveOpportunity = (id: string) => {
    setSavedOpportunityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearAllUserData = () => {
    localStorage.clear();
    setResume(null);
    setAssessmentHistory({});
    setRoadmapProgress({});
    setSavedOpportunityIds(new Set());
    setProfile(DEFAULT_PROFILE);
  };

  const value = {
    user,
    isDemoUser,
    isAdmin,
    profile,
    setProfile,
    loginWithGoogle,
    loginAsDemoUser,
    loginAsAdminDemo,
    logout,
    resume,
    processResumeText,
    loadSampleResume,
    addManualSkill,
    removeDetectedSkill,
    assessmentHistory,
    recordAssessmentResult,
    verifiedSkillsMap,
    verifiedSkillsList,
    careerRecommendations,
    roadmapProgress,
    updateRoadmapStep,
    savedOpportunityIds,
    toggleSaveOpportunity,
    theme,
    toggleTheme,
    showSampleListings,
    setShowSampleListings,
    clearAllUserData,
    isInitialLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
