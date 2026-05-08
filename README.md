# Iron Week Pro

App mobile de coaching musculation personnalise avec IA.

**Demo Web**: https://iron-week-pro.vercel.app

## Fonctionnalites

### Coaching IA
- Calcul de progression de charges base sur la formule d'Epley (1RM)
- Recommandations personnalisees apres chaque seance et entre chaque serie
- 5 regles de coaching : double progressive overload, consolidation, deload, stagnation, premiere seance
- Detection de fatigue et de desequilibres musculaires
- Auto-periodisation (accumulation / intensification / realisation / deload)

### Bibliotheque
- 117 exercices organises par groupe musculaire
- Schemas anatomiques SVG (face + dos)
- Conseils d'execution + exercices substituts

### Suivi de seance
- Saisie kg + reps avec validation
- Timer de repos avec sons (bips sur les 5 dernieres secondes)
- Conseils en temps reel pour la serie suivante
- RPE tracking
- Detection automatique de PR avec celebration
- Echauffement auto genere
- Supersets

### Programmes
- 6 programmes preconfigures (Haut force, Bas force, Tirage volume, etc.)
- Creation de programmes personnalises
- Planning hebdomadaire avec detection de conflits musculaires

### Stats
- Graphiques SVG par exercice (charge max, 1RM estime, volume)
- Streak, volume hebdo, frequence
- Ratios push/pull et quad/ischio
- Bilan musculaire visuel

### Sync & Export
- Sync GitHub (data.json sur repo prive)
- Export CSV de toutes les seances
- Notifications de rappel quotidiennes
- Mode offline complet

## Stack

- React Native + Expo SDK 54
- TypeScript
- Zustand (state) + AsyncStorage (persistance)
- React Navigation
- react-native-svg (graphiques + bonhomme musculaire)
- expo-av (sons), expo-notifications, expo-haptics
- expo-secure-store (token GitHub)

## Architecture

```
src/
├── types/          # Interfaces TypeScript
├── theme/          # Couleurs, polices, spacing
├── data/           # 117 exercices + 6 programmes seed
├── stores/         # Zustand (sessions, programmes, settings, sync, charges user)
├── utils/          # Coach engine, smart increment (Epley), set advisor
├── components/     # SetRow, RestTimer, CoachCard, BodyFigure, MuscleMap
├── screens/        # Aujourd'hui / Programme / Exercices / Stats / Reglages
└── navigation/     # Bottom tabs + stacks
```

## Lancer en local

```bash
npm install
npx expo start
```

Scanner le QR code avec **Expo Go** sur Android/iOS.

## Web build

```bash
npx expo export --platform web --output-dir dist
```

## Deploy

- **Vercel** : `vercel deploy --prod`
- **Expo Updates (OTA)** : `npx eas update --branch default`
