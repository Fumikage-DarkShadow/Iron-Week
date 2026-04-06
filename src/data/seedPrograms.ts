import { Program } from '../types';

export const seedPrograms: Program[] = [
  // ═══════════════════════════════════════
  // 1. HAUT DU CORPS FORCE
  // ═══════════════════════════════════════
  {
    id: 'prog_haut_force',
    name: 'Haut du Corps Force',
    color: '#ff4d1c',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'pec_dc_barre', targetSets: 4, targetRepsRange: [6, 8], restSeconds: 180 },
      { exerciseId: 'dos_rowing_barre', targetSets: 4, targetRepsRange: [6, 8], restSeconds: 180 },
      { exerciseId: 'epaules_dm_halteres', targetSets: 3, targetRepsRange: [8, 10], restSeconds: 120 },
      { exerciseId: 'dos_traction_large', targetSets: 3, targetRepsRange: [6, 8], restSeconds: 150 },
      { exerciseId: 'abdos_crunch', targetSets: 3, targetRepsRange: [15, 20], restSeconds: 60 },
    ],
  },

  // ═══════════════════════════════════════
  // 2. BAS DU CORPS FORCE
  // ═══════════════════════════════════════
  {
    id: 'prog_bas_force',
    name: 'Bas du Corps Force',
    color: '#22c55e',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'ischio_sdt_roumain', targetSets: 4, targetRepsRange: [6, 8], restSeconds: 180 },
      { exerciseId: 'quads_presse', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 120 },
      { exerciseId: 'ischio_leg_curl_assis', targetSets: 4, targetRepsRange: [10, 12], restSeconds: 90 },
      { exerciseId: 'mollets_debout_machine', targetSets: 4, targetRepsRange: [15, 15], restSeconds: 60 },
      { exerciseId: 'abdos_crunch', targetSets: 3, targetRepsRange: [15, 20], restSeconds: 60 },
    ],
  },

  // ═══════════════════════════════════════
  // 3. TIRAGE VOLUME
  // ═══════════════════════════════════════
  {
    id: 'prog_tirage_vol',
    name: 'Tirage Volume',
    color: '#60a5fa',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'dos_tirage_vertical_large', targetSets: 4, targetRepsRange: [10, 12], restSeconds: 120 },
      { exerciseId: 'dos_tirage_vertical_uni', targetSets: 3, targetRepsRange: [12, 15], restSeconds: 90 },
      { exerciseId: 'dos_rowing_poulie', targetSets: 3, targetRepsRange: [12, 12], restSeconds: 90 },
      { exerciseId: 'biceps_curl_ez', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 120 },
      { exerciseId: 'biceps_hammer', targetSets: 3, targetRepsRange: [12, 15], restSeconds: 90 },
      { exerciseId: 'epaules_oiseau_poulies', targetSets: 4, targetRepsRange: [15, 20], restSeconds: 60 },
      { exerciseId: 'abdos_crunch', targetSets: 3, targetRepsRange: [15, 20], restSeconds: 60 },
    ],
  },

  // ═══════════════════════════════════════
  // 4. CARDIO & RÉCUP
  // ═══════════════════════════════════════
  {
    id: 'prog_cardio_recup',
    name: 'Cardio & Récup',
    color: '#f5c542',
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'cardio_marche_inclinee', targetSets: 1, targetRepsRange: [30, 35], restSeconds: 0 },
      { exerciseId: 'lombaires_hyperextension', targetSets: 3, targetRepsRange: [15, 15], restSeconds: 60 },
    ],
  },

  // ═══════════════════════════════════════
  // 5. POUSSÉE VOLUME
  // ═══════════════════════════════════════
  {
    id: 'prog_poussee_vol',
    name: 'Poussée Volume',
    color: '#c084fc',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'pec_dc_halteres', targetSets: 4, targetRepsRange: [10, 12], restSeconds: 120 },
      { exerciseId: 'pec_di_smith', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
      { exerciseId: 'pec_poulie_croisee', targetSets: 3, targetRepsRange: [15, 15], restSeconds: 90 },
      { exerciseId: 'epaules_elev_laterale', targetSets: 4, targetRepsRange: [10, 10], restSeconds: 90 },
      { exerciseId: 'triceps_barre_front', targetSets: 3, targetRepsRange: [12, 12], restSeconds: 120 },
      { exerciseId: 'triceps_extension_poulie', targetSets: 3, targetRepsRange: [15, 15], restSeconds: 90 },
      { exerciseId: 'abdos_crunch', targetSets: 3, targetRepsRange: [15, 20], restSeconds: 60 },
    ],
  },

  // ═══════════════════════════════════════
  // 6. JAMBES VOLUME
  // ═══════════════════════════════════════
  {
    id: 'prog_jambes_vol',
    name: 'Jambes Volume',
    color: '#14b8a6',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
      { exerciseId: 'quads_squat_barre', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 120 },
      { exerciseId: 'quads_presse', targetSets: 3, targetRepsRange: [10, 12], restSeconds: 90 },
      { exerciseId: 'quads_leg_extension', targetSets: 4, targetRepsRange: [15, 20], restSeconds: 90 },
      { exerciseId: 'quads_fentes_marchees', targetSets: 3, targetRepsRange: [12, 12], restSeconds: 90 },
      { exerciseId: 'ischio_leg_curl_couche', targetSets: 4, targetRepsRange: [12, 15], restSeconds: 90 },
      { exerciseId: 'mollets_assis_machine', targetSets: 4, targetRepsRange: [15, 20], restSeconds: 60 },
    ],
  },
];
