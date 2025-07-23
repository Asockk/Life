// utils/hapticFeedback.js
// Haptic Feedback Utility für iOS und Android

const HapticFeedback = {
  // Überprüfe ob Vibration API verfügbar ist
  isSupported: () => {
    return 'vibrate' in navigator || 'mozVibrate' in navigator;
  },

  // Verschiedene Feedback-Typen
  patterns: {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 100, 20, 100, 30],
    warning: [50, 100, 50],
    error: [100, 50, 100, 50, 100],
    selection: 5,
    // iOS-ähnliche Patterns
    impactLight: 10,
    impactMedium: 20,
    impactHeavy: 40,
    notificationSuccess: [10, 50, 10],
    notificationWarning: [20, 40, 20],
    notificationError: [30, 30, 30, 30, 30],
  },

  // Trigger Haptic Feedback
  trigger: (pattern = 'light') => {
    if (!HapticFeedback.isSupported()) return;

    try {
      const vibrationPattern = HapticFeedback.patterns[pattern] || pattern;
      
      if (navigator.vibrate) {
        navigator.vibrate(vibrationPattern);
      } else if (navigator.mozVibrate) {
        navigator.mozVibrate(vibrationPattern);
      }

      // iOS Taptic Engine über WebKit (wenn verfügbar)
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptic) {
        window.webkit.messageHandlers.haptic.postMessage(pattern);
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  },

  // Spezialisierte Methoden für verschiedene Aktionen
  impact: (style = 'medium') => {
    const impactMap = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy'
    };
    HapticFeedback.trigger(impactMap[style] || 'medium');
  },

  notification: (type = 'success') => {
    const notificationMap = {
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError'
    };
    HapticFeedback.trigger(notificationMap[type] || 'light');
  },

  selection: () => {
    HapticFeedback.trigger('selection');
  },

  // Für Swipe-Gesten
  swipe: () => {
    HapticFeedback.trigger('light');
  },

  // Für Button-Klicks
  buttonPress: () => {
    HapticFeedback.trigger('medium');
  },

  // Für Speichern-Aktionen
  save: () => {
    HapticFeedback.trigger('success');
  },

  // Für Fehler
  error: () => {
    HapticFeedback.trigger('error');
  },

  // Für Warnungen
  warning: () => {
    HapticFeedback.trigger('warning');
  }
};

export default HapticFeedback;