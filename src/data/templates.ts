/**
 * Pre-configured program templates for the onboarding flow.
 * The user picks one and gets ready-to-go programs + a weekly plan.
 */

import { Program, WeeklyPlan, DayOfWeek } from '../types';
import { colors } from '../theme';

export interface ProgramTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  frequency: string;       // e.g. "3-4 séances/semaine"
  level: 'debutant' | 'intermediaire' | 'avance';
  programs: Omit<Program, 'createdAt' | 'updatedAt'>[];
  weeklyPlan: Partial<Record<DayOfWeek, string>>; // dayId → programId
}

const now = Date.now();

export const TEMPLATES: ProgramTemplate[] = [
  // ──────────────────────────────────────────────────────────────────
  // 1. PUSH / PULL / LEGS — 3 jours/semaine
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    emoji: '🔥',
    description: 'Pousser, tirer, jambes — le grand classique. Musculation séparée par mouvement.',
    frequency: '3 séances/semaine',
    level: 'intermediaire',
    programs: [
      {
        id: 'tpl_push',
        name: 'Push (Pecs/Épaules/Triceps)',
        color: colors.accent,
        isFavorite: true,
        exercises: [
          { exerciseId: 'pec_dc_barre', targetSets: 4, targetRepsRange: [6, 10], restSeconds: 150 },
          { exerciseId: 'pec_di_halteres', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'epaules_dm_halteres', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'epaules_elev_laterale', targetSets: 4, targetRepsRange: [12, 15], restSeconds: 60 },
          { exerciseId: 'triceps_extension_poulie', targetSets: 3, targetRepsRange: [10, 15], restSeconds: 75 },
          { exerciseId: 'triceps_dips', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 90 },
        ],
      },
      {
        id: 'tpl_pull',
        name: 'Pull (Dos/Biceps)',
        color: colors.blue,
        isFavorite: true,
        exercises: [
          { exerciseId: 'dos_traction_large', targetSets: 4, targetRepsRange: [6, 10], restSeconds: 150 },
          { exerciseId: 'dos_rowing_barre', targetSets: 4, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'dos_tirage_vertical_large', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'dos_face_pull', targetSets: 3, targetRepsRange: [12, 20], restSeconds: 60 },
          { exerciseId: 'biceps_curl_ez', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 75 },
          { exerciseId: 'biceps_hammer', targetSets: 3, targetRepsRange: [10, 15], restSeconds: 60 },
        ],
      },
      {
        id: 'tpl_legs',
        name: 'Legs (Jambes/Fessiers)',
        color: colors.green,
        isFavorite: true,
        exercises: [
          { exerciseId: 'quads_squat_barre', targetSets: 4, targetRepsRange: [6, 10], restSeconds: 180 },
          { exerciseId: 'ischio_sdt_roumain', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 150 },
          { exerciseId: 'quads_presse', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 120 },
          { exerciseId: 'ischio_leg_curl_couche', targetSets: 3, targetRepsRange: [10, 15], restSeconds: 75 },
          { exerciseId: 'mollets_debout_machine', targetSets: 4, targetRepsRange: [12, 20], restSeconds: 60 },
        ],
      },
    ],
    weeklyPlan: {
      lundi: 'tpl_push',
      mercredi: 'tpl_pull',
      vendredi: 'tpl_legs',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 2. UPPER / LOWER — 4 jours/semaine
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    emoji: '💪',
    description: 'Haut et bas du corps en alternance. Plus de fréquence par muscle.',
    frequency: '4 séances/semaine',
    level: 'intermediaire',
    programs: [
      {
        id: 'tpl_upper_a',
        name: 'Upper A (Force)',
        color: colors.accent,
        isFavorite: true,
        exercises: [
          { exerciseId: 'pec_dc_barre', targetSets: 4, targetRepsRange: [5, 8], restSeconds: 180 },
          { exerciseId: 'dos_rowing_barre', targetSets: 4, targetRepsRange: [6, 10], restSeconds: 150 },
          { exerciseId: 'epaules_dm_barre', targetSets: 3, targetRepsRange: [6, 10], restSeconds: 120 },
          { exerciseId: 'dos_traction_large', targetSets: 3, targetRepsRange: [6, 10], restSeconds: 120 },
          { exerciseId: 'biceps_curl_barre', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 75 },
        ],
      },
      {
        id: 'tpl_lower_a',
        name: 'Lower A (Force)',
        color: colors.green,
        isFavorite: true,
        exercises: [
          { exerciseId: 'quads_squat_barre', targetSets: 4, targetRepsRange: [5, 8], restSeconds: 180 },
          { exerciseId: 'ischio_sdt_roumain', targetSets: 3, targetRepsRange: [6, 10], restSeconds: 150 },
          { exerciseId: 'quads_presse', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 120 },
          { exerciseId: 'mollets_debout_machine', targetSets: 4, targetRepsRange: [10, 15], restSeconds: 60 },
        ],
      },
      {
        id: 'tpl_upper_b',
        name: 'Upper B (Volume)',
        color: colors.blue,
        isFavorite: true,
        exercises: [
          { exerciseId: 'pec_di_halteres', targetSets: 4, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'dos_tirage_vertical_large', targetSets: 4, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'epaules_elev_laterale', targetSets: 4, targetRepsRange: [12, 15], restSeconds: 60 },
          { exerciseId: 'pec_poulie_croisee', targetSets: 3, targetRepsRange: [12, 15], restSeconds: 60 },
          { exerciseId: 'triceps_extension_poulie', targetSets: 3, targetRepsRange: [12, 15], restSeconds: 60 },
          { exerciseId: 'biceps_curl_halteres', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 60 },
        ],
      },
      {
        id: 'tpl_lower_b',
        name: 'Lower B (Volume)',
        color: colors.purple,
        isFavorite: true,
        exercises: [
          { exerciseId: 'quads_fentes_marchees', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'quads_leg_extension', targetSets: 4, targetRepsRange: [12, 15], restSeconds: 75 },
          { exerciseId: 'ischio_leg_curl_assis', targetSets: 4, targetRepsRange: [10, 15], restSeconds: 75 },
          { exerciseId: 'ischio_hip_thrust', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'mollets_assis_machine', targetSets: 4, targetRepsRange: [15, 20], restSeconds: 45 },
        ],
      },
    ],
    weeklyPlan: {
      lundi: 'tpl_upper_a',
      mardi: 'tpl_lower_a',
      jeudi: 'tpl_upper_b',
      vendredi: 'tpl_lower_b',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 3. FULL BODY 3x/week
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'full_body',
    name: 'Full Body 3x',
    emoji: '⚡',
    description: 'Tout le corps à chaque séance. Idéal débutants et reprise.',
    frequency: '3 séances/semaine',
    level: 'debutant',
    programs: [
      {
        id: 'tpl_fb_a',
        name: 'Full Body A',
        color: colors.accent,
        isFavorite: true,
        exercises: [
          { exerciseId: 'quads_squat_barre', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'pec_dc_halteres', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'dos_rowing_halteres', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 90 },
          { exerciseId: 'epaules_dm_halteres', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'abdos_planche', targetSets: 3, targetRepsRange: [30, 60], restSeconds: 60 },
        ],
      },
      {
        id: 'tpl_fb_b',
        name: 'Full Body B',
        color: colors.blue,
        isFavorite: true,
        exercises: [
          { exerciseId: 'ischio_sdt_roumain', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'pec_di_halteres', targetSets: 3, targetRepsRange: [8, 12], restSeconds: 120 },
          { exerciseId: 'dos_traction_large', targetSets: 3, targetRepsRange: [6, 10], restSeconds: 120 },
          { exerciseId: 'quads_fentes_avant', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'biceps_curl_halteres', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 60 },
        ],
      },
      {
        id: 'tpl_fb_c',
        name: 'Full Body C',
        color: colors.green,
        isFavorite: true,
        exercises: [
          { exerciseId: 'quads_squat_goblet', targetSets: 3, targetRepsRange: [10, 15], restSeconds: 90 },
          { exerciseId: 'pec_dc_barre', targetSets: 3, targetRepsRange: [6, 10], restSeconds: 120 },
          { exerciseId: 'dos_tirage_vertical_large', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
          { exerciseId: 'epaules_elev_laterale', targetSets: 3, targetRepsRange: [12, 15], restSeconds: 60 },
          { exerciseId: 'triceps_extension_poulie', targetSets: 3, targetRepsRange: [10, 15], restSeconds: 60 },
        ],
      },
    ],
    weeklyPlan: {
      lundi: 'tpl_fb_a',
      mercredi: 'tpl_fb_b',
      vendredi: 'tpl_fb_c',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // 4. CUSTOM — vide
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'custom',
    name: 'Programme libre',
    emoji: '🎨',
    description: 'Crée tes propres programmes depuis zéro. Pour les utilisateurs expérimentés.',
    frequency: 'Flexible',
    level: 'avance',
    programs: [],
    weeklyPlan: {},
  },
];

export function getTemplate(id: string): ProgramTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
