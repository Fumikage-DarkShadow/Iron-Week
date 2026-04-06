import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// Today stack
import TodayScreen from '../screens/today/TodayScreen';
import ActiveWorkoutScreen from '../screens/today/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/today/WorkoutSummaryScreen';

// Program stack
import ProgramListScreen from '../screens/program/ProgramListScreen';
import CreateProgramScreen from '../screens/program/CreateProgramScreen';
import ExercisePickerScreen from '../screens/program/ExercisePickerScreen';
import WeeklyPlanScreen from '../screens/program/WeeklyPlanScreen';

// Exercise stack
import ExerciseLibraryScreen from '../screens/exercises/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/exercises/ExerciseDetailScreen';

// Stats stack
import StatsScreen from '../screens/stats/StatsScreen';
import ExerciseStatsScreen from '../screens/stats/ExerciseStatsScreen';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';
import MyWeightsScreen from '../screens/settings/MyWeightsScreen';

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();
const TodayStack = createNativeStackNavigator();
const ProgramStack = createNativeStackNavigator();
const ExerciseStack = createNativeStackNavigator();
const StatsStack = createNativeStackNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6, minWidth: 60 }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.bodyMedium,
          fontSize: 9,
          color: focused ? colors.accent : colors.muted,
          marginTop: 2,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.heading, fontSize: 22 },
  contentStyle: { backgroundColor: colors.bg },
};

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator screenOptions={screenOptions}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} options={{ title: "Aujourd'hui" }} />
      <TodayStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ title: 'Séance en cours' }} />
      <TodayStack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: 'Résumé', headerBackVisible: false }} />
    </TodayStack.Navigator>
  );
}

function ProgramStackNavigator() {
  return (
    <ProgramStack.Navigator screenOptions={screenOptions}>
      <ProgramStack.Screen name="ProgramList" component={ProgramListScreen} options={{ title: 'Programmes' }} />
      <ProgramStack.Screen name="CreateProgram" component={CreateProgramScreen} options={{ title: 'Créer Programme' }} />
      <ProgramStack.Screen name="ExercisePicker" component={ExercisePickerScreen} options={{ title: 'Choisir Exercices' }} />
      <ProgramStack.Screen name="WeeklyPlan" component={WeeklyPlanScreen} options={{ title: 'Planning Semaine' }} />
    </ProgramStack.Navigator>
  );
}

function ExerciseStackNavigator() {
  return (
    <ExerciseStack.Navigator screenOptions={screenOptions}>
      <ExerciseStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ title: 'Exercices' }} />
      <ExerciseStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Détail' }} />
    </ExerciseStack.Navigator>
  );
}

function StatsStackNavigator() {
  return (
    <StatsStack.Navigator screenOptions={screenOptions}>
      <StatsStack.Screen name="StatsHome" component={StatsScreen} options={{ title: 'Statistiques' }} />
      <StatsStack.Screen name="ExerciseStats" component={ExerciseStatsScreen} options={{ title: 'Progression' }} />
    </StatsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Réglages' }} />
      <SettingsStack.Screen name="MyWeights" component={MyWeightsScreen} options={{ title: 'Mes Charges' }} />
    </SettingsStack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🏋️" label="Aujourdhui" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Program"
          component={ProgramStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Programme" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Exercises"
          component={ExerciseStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📚" label="Exercices" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📈" label="Stats" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="Réglages" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
