import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage, loadLanguagePreference } from '../localization/i18n';
import { handleError } from '../services/errorHandlingService';
import { useAppTheme } from '../context/ThemeContext';
import { screenBackgroundStyle } from '../constants/theme';

const LanguageSelectionScreen = ({ onComplete }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedLanguage, setSelectedLanguage] = useState('he');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentLanguage();
  }, []);

  const loadCurrentLanguage = async () => {
    const currentLang = await loadLanguagePreference();
    setSelectedLanguage(currentLang);
  };

  const handleLanguageSelect = async (languageCode) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setSelectedLanguage(languageCode);
    
    try {
      await changeLanguage(languageCode);
      
      const wasRTL = I18nManager.isRTL;
      const shouldBeRTL = languageCode === 'he';
      
      if (wasRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        
        await completeLanguageSelection();
        
        Alert.alert(
          i18n.t('language.languageChanged'),
          languageCode === 'he' 
            ? 'השפה שונתה בהצלחה. אנא סגרו ופתחו את האפליקציה מחדש כדי לשנות את כיוון הטקסט.'
            : 'Language changed successfully. Please close and reopen the app to change text direction.',
          [
            {
              text: i18n.t('common.done'),
              onPress: () => {}
            }
          ]
        );
      } else {
        await completeLanguageSelection();
        Alert.alert(
          i18n.t('language.languageChanged'),
          '',
          [
            {
              text: i18n.t('common.done'),
              onPress: () => {}
            }
          ]
        );
      }
    } catch (error) {
      handleError(error, 'changeLanguage');
    } finally {
      setIsLoading(false);
    }
  };

  const completeLanguageSelection = async () => {
    try {
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing language selection:', error);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const languages = [
    {
      code: 'he',
      name: 'עברית',
      nativeName: 'עברית',
      flag: '🇮🇱',
      direction: 'rtl'
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, screenBackgroundStyle(colors)]} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <MaterialIcons name="favorite" size={32} color={colors.primary} />
        </View>
        <Text style={styles.appName}>CoupleTasks</Text>
        <Text style={styles.subtitle}>Together we organize</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          בחר את השפה המועדפת עליך{'\n'}
          Choose your preferred language
        </Text>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                selectedLanguage === language.code && styles.selectedLanguage
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              disabled={isLoading}
            >
              <View style={styles.languageContent}>
                <Text style={styles.flag}>{language.flag}</Text>
                <View style={styles.languageText}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === language.code && styles.selectedLanguageText
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageSubtext,
                    selectedLanguage === language.code && styles.selectedLanguageSubtext
                  ]}>
                    {language.name}
                  </Text>
                </View>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.disabledButton]}
          onPress={() => completeLanguageSelection()}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'טוען... / Loading...' : 'המשך / Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made for couples who organize together
        </Text>
      </View>
    </SafeAreaView>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      paddingTop: 80,
      paddingBottom: 40,
    },
    logoBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    appName: {
      ...TYPOGRAPHY.h1,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    description: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    languageList: {
      gap: 16,
      marginBottom: 40,
    },
    languageOption: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedLanguage: {
      borderColor: colors.primary,
      backgroundColor: colors.borderLight,
    },
    languageContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flag: {
      fontSize: 32,
      marginRight: 16,
    },
    languageText: {
      flex: 1,
    },
    languageName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    selectedLanguageText: {
      color: colors.primary,
    },
    languageSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    selectedLanguageSubtext: {
      color: colors.primary,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: {
      color: COLORS.textInverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    continueButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    continueButtonText: {
      color: COLORS.textInverse,
      fontSize: 18,
      fontWeight: 'bold',
    },
    footer: {
      alignItems: 'center',
      paddingBottom: 40,
    },
    footerText: {
      fontSize: 14,
      color: colors.textTertiary,
      fontStyle: 'italic',
    },
  });
}

export default LanguageSelectionScreen;
