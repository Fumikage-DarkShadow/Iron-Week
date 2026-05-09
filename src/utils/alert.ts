/**
 * Cross-platform alert/confirm shim.
 *
 * React Native's Alert.alert() does NOT support multi-button callbacks on web
 * (react-native-web maps it to window.alert which is single-button only).
 * This shim:
 *  - on native: delegates to Alert.alert()
 *  - on web: uses window.confirm() / window.alert() and routes the callback to
 *    the right button based on style ('cancel' or 'destructive' is treated as
 *    the negative button).
 */

import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  // Native: use the real Alert
  if (Platform.OS !== 'web') {
    if (!buttons) {
      Alert.alert(title, message);
    } else {
      Alert.alert(
        title,
        message,
        buttons.map((b) => ({
          text: b.text,
          style: b.style,
          onPress: b.onPress,
        })),
      );
    }
    return;
  }

  // Web fallback
  const composed = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    if (typeof window !== 'undefined') window.alert(composed);
    return;
  }

  // 1 button → just alert and run onPress
  if (buttons.length === 1) {
    if (typeof window !== 'undefined') window.alert(composed);
    buttons[0].onPress?.();
    return;
  }

  // 2+ buttons → use confirm()
  // Identify the "positive" (non-cancel) button — the one we run on OK
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const positiveBtn = buttons.find((b) => b.style !== 'cancel');

  if (typeof window === 'undefined') return;
  const ok = window.confirm(composed);

  if (ok && positiveBtn) {
    positiveBtn.onPress?.();
  } else if (!ok && cancelBtn) {
    cancelBtn.onPress?.();
  }
}
