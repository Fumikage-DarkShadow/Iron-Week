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

## ⚠️ Important — Sauvegarde des données

L'app est **100% locale** (pas de serveur, pas de compte). Tes séances sont stockées sur ton appareil. Selon comment tu utilises l'app, la sauvegarde se comporte différemment :

| Tu utilises l'app via... | Sauvegarde | Risque |
| --- | --- | --- |
| **Expo Go ou build natif** (mobile) | AsyncStorage (SQLite) | Aucun — persiste jusqu'à désinstall |
| **PWA installée sur l'écran d'accueil** ✅ | `localStorage` (contexte standalone) | Aucun — persiste comme une vraie app |
| **Onglet navigateur classique sur iOS Safari** ⚠️ | `localStorage` | **iOS supprime les données après 7 jours d'inactivité** (politique ITP d'Apple) |
| **Onglet navigateur Android Chrome / desktop** | `localStorage` | Effacé si tu vides le cache du navigateur |
| **Mode privé / navigation privée** | Volatile | Tout disparaît à la fermeture |

### 👉 Ce que tu dois faire

Pour ne **jamais perdre tes données** sur web, **installe l'app sur l'écran d'accueil** :

- **iOS Safari** : bouton « Partager » → « Sur l'écran d'accueil »
- **Android Chrome** : menu ⋮ → « Ajouter à l'écran d'accueil » (ou bandeau d'install qui apparaît automatiquement)

Une fois installée, l'app tourne en mode standalone (sans la barre d'adresse) et ses données sont protégées des nettoyages automatiques du navigateur.

### Multi-appareils

Il n'y a **pas de compte utilisateur ni de cloud auto** — chaque appareil est un silo isolé par défaut. Pour synchroniser tes données entre ton téléphone et le web (ou plusieurs appareils), configure **GitHub Sync** dans `Réglages → Sync GitHub` :

1. Crée un [token GitHub personnel](https://github.com/settings/tokens) (scope `repo`)
2. Crée un repo **privé vide** (ex: `my-iron-week-data`)
3. Colle le token + nom du repo (`username/my-iron-week-data`) dans l'app
4. Tap « Synchroniser » → toutes tes séances vont dans `data.json` sur le repo
5. Sur l'autre appareil, configure les mêmes credentials et fais Pull

C'est ta sauvegarde cloud, gratuite, privée, et que tu contrôles 100%.

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
> Tu peux aussi me ping directement : [@Fumikage-DarkShadow](https://github.com/Fumikage-DarkShadow) 
>
> Toute remontée est précieuse pour améliorer l'app (capture d'écran, étapes pour reproduire, ou simplement t'es idées ;)


