import presetsData from './certificationPresets.json';
import { CertificationDomain } from '../types';

export interface CertificationPreset {
  id: string;
  name: string;
  code?: string;
  version?: string;
  color: string;
  icon: string;
  examDurationMinutes: number;
  accommodationMinutes: number;
  questionCount?: number;
  passingScore?: string;
  description: string;
  exportIntroQuestions?: string;
  exportIntroTranscripts?: string;
  exportIntroChat?: string;
  domains: CertificationDomain[];
}

export const CERTIFICATION_PRESETS: CertificationPreset[] = presetsData as CertificationPreset[];

export function getPresetById(id: string): CertificationPreset | undefined {
  return CERTIFICATION_PRESETS.find((p) => p.id === id);
}

export function getPresetByCode(code: string): CertificationPreset | undefined {
  return CERTIFICATION_PRESETS.find((p) => p.code?.toLowerCase() === code.toLowerCase());
}
