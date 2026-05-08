<div align="center">

<img src="assets/icon.png" alt="Iron Week Pro" width="120" height="120" />

# Iron Week Pro

**Coaching musculation IA — programmation, suivi, recommandations intelligentes.**

[![Demo Web](https://img.shields.io/badge/Demo-Web-ff4d1c?style=for-the-badge&logo=vercel&logoColor=white)](https://iron-week-pro.vercel.app)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/accounts/fumikage/projects/iron-week-pro)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

---

## Aperçu

Une app de musculation qui pense pour toi. Tu choisis un programme, tu fais ta séance, et le coach IA te dit exactement quelle charge utiliser à la prochaine série en se basant sur tes performances réelles (formule d'Epley, RPE, fatigue accumulée).

> **Disponible en 1 clic** sur https://iron-week-pro.vercel.app — installable sur l'écran d'accueil iOS/Android (PWA).

<div align="center">

|                                          |                                            |                                                |
| :--------------------------------------: | :----------------------------------------: | :--------------------------------------------: |
| ![Onboarding](docs/screenshots/01-onboarding.png) | ![Aujourd'hui](docs/screenshots/02-today.png) | ![Programmes](docs/screenshots/03-programmes.png) |
|     **Onboarding — choisis un template**     |       **Aujourd'hui — séance du jour**       |        **Programmes — gérer tes séances**         |

|                                              |                                              |                                            |                                            |
| :------------------------------------------: | :------------------------------------------: | :----------------------------------------: | :----------------------------------------: |
| ![Édition](docs/screenshots/04-program-edit.png) | ![Bibliothèque](docs/screenshots/05-exercises.png) |  ![Stats](docs/screenshots/07-stats.png)   | ![Réglages](docs/screenshots/08-settings.png) |
|       **Création/édition de programme**       |     **117 exercices, filtre par muscle**      |    **Stats, fatigue, périodisation**     |   **Réglages — profil, données, sync**    |

</div>

---

## Fonctionnalités clés

### 🧠 Coach IA basé sur la formule d'Epley
Le coach calcule ton 1RM estimé en temps réel (`1RM = poids × (1 + reps/30)`) et propose la charge optimale pour la série suivante, pas un `+2.5kg` fixe.

**Exemple** : tu fais 12 reps à 80kg sur un exercice qui vise 8-10 reps.
- 1RM estimé : 80 × (1 + 12/30) = 112kg
- Charge cible pour 9 reps : 112 / (1 + 9/30) = **86kg → suggestion +5kg**

### 📊 5 règles de progression
1. **Double progressive overload** — atteint le max 2 séances de suite ? Monte la charge.
2. **Consolidation** — toutes les séries pas dans la cible ? Maintiens.
3. **Deload automatique** — chute de 20%+ vs ta meilleure ? Récupère.
4. **Stagnation** — 3 séances identiques ? Variation technique (rest-pause, myo-reps, tempo).
5. **Première séance** — pas d'historique ? Conseils qualitatifs, pas de chiffre inventé.

### ⏱️ Timer de repos qui sonne même téléphone verrouillé
Notification locale planifiée à `now + restSeconds`. Le téléphone vibre et sonne même si l'app est fermée.

### 💪 117 exercices + 4 templates
Push/Pull/Legs · Upper/Lower · Full Body 3x · Programme libre. Schémas anatomiques SVG, fiches détaillées, exercices substituts.

### 🔗 Supersets, RPE, échauffement auto, partage de séance
- Lier 2 exercices en superset (un seul timer entre les deux)
- Tracker l'effort ressenti (RPE 6-10) après chaque série
- Génération automatique de séries d'échauffement (50% × 10, 70% × 5, 85% × 3)
- Partage du résumé de séance en image (Instagram, WhatsApp, etc.)

### 📈 Stats & analytics
- Streak, volume hebdomadaire, fréquence sur 8 semaines
- Détection de fatigue / progression / stagnation
- Périodisation auto (Accumulation → Intensification → Réalisation → Deload)
- Ratios push/pull et quad/ischio
- Graphiques SVG par exercice (charge max, 1RM estimé, volume)

### ☁️ Sync GitHub + export CSV
Sauvegarde de toutes tes séances dans un repo GitHub privé (`data.json`). Export CSV pour analyse externe.

---

## Stack

| Catégorie       | Tech                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | React Native + Expo SDK 54                                                   |
| Langage         | TypeScript                                                                   |
| State           | Zustand + AsyncStorage (persistance), Expo SecureStore (tokens)              |
| Navigation      | React Navigation v7 (bottom tabs + stack)                                    |
| UI              | react-native-svg pour graphiques + bonhomme musculaire, Victory non utilisé  |
| Sons & Notifs   | expo-av, expo-notifications, expo-haptics                                    |
| Web             | Build statique Expo + post-build script (script tag → `type="module"`)       |
| Déploiement     | Vercel (web), EAS (mobile OTA), GitHub                                       |

---

## Lancer en local

```bash
git clone https://github.com/Fumikage-DarkShadow/iron-week-pro.git
cd iron-week-pro
npm install
npx expo start --tunnel
```

Scanner le QR code avec **Expo Go** (App Store / Play Store).

### Build web
```bash
npx expo export --platform web --output-dir dist
node scripts/post-build.js
# Servir le dossier dist/ avec n'importe quel static server
```

### Tests
```bash
npx tsc --noEmit  # type check
```

---

## Architecture

```
src/
├── components/    # SetRow, RestTimer, CoachCard, BodyFigure, MuscleMap...
├── data/          # 117 exercices + 4 templates + 6 seed programs
├── navigation/    # Bottom tabs + stack par tab
├── screens/
│   ├── today/     # Aujourd'hui, séance active, résumé post-séance
│   ├── program/   # Liste, création, planning hebdo
│   ├── exercises/ # Bibliothèque + détail
│   ├── stats/     # Dashboard + stats par exercice
│   └── settings/  # Profil, mes charges, sync, données
├── stores/        # Zustand (sessions, programs, settings, sync, userWeights)
├── theme/         # Couleurs, polices, spacing
├── types/         # Interfaces TypeScript
└── utils/
    ├── coachEngine.ts       # 5 règles + recommandations
    ├── smartIncrement.ts    # Calcul Epley pour next set/session
    ├── setAdvisor.ts        # Messages clairs entre séries
    ├── warmupGenerator.ts   # Échauffement auto
    ├── webStorage.ts        # SecureStore shim pour le web
    └── notifications.ts     # Rappels + timer en background
```

---

## Roadmap / idées

- [ ] Mode "guidage" pendant la séance (un seul exercice à la fois en plein écran)
- [ ] Saisie kg/reps via clavier numérique géant pour la salle
- [ ] Mode circuit / WOD avec timer rounds
- [ ] Recherche d'exercices fuzzy + filtre par équipement
- [ ] Confetti animé sur PR battu (déjà présent, à amplifier)
- [ ] Apple Health / Google Fit sync

---

## 🐛 Tu rencontres un bug ou tu as une idée ?

> ### **Remonte-moi les problèmes ou tes recommandations**
>
> **🐛 Bug** ou **💡 Suggestion** : ouvre une issue sur GitHub → [Iron Week Issues](https://github.com/Fumikage-DarkShadow/iron-week-pro/issues/new)
>
> Tu peux aussi me ping directement : [@Fumikage-DarkShadow](https://github.com/Fumikage-DarkShadow) · ilyessadadou@gmail.com
>
> Toute remontée est précieuse pour améliorer l'app — capture d'écran, étapes pour reproduire, ou simplement *« ce serait cool si... »*. Je corrige et je publie l'update OTA dans la foulée.

---

<div align="center">

**Made with ❤️ in Paris** · [iron-week-pro.vercel.app](https://iron-week-pro.vercel.app)

</div>
