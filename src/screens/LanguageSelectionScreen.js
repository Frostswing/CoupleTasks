import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage, loadLanguagePreference } from '../localization/i18n';
import { handleError } from '../services/errorHandlingService';
import { useAppTheme } from '../context/ThemeContext';
import PremiumScreenShell from '../components/premium/PremiumScreenShell';
import PremiumCard from '../components/premium/PremiumCard';
import GradientButton from '../components/premium/GradientButton';
import PressableScale from '../components/premium/PressableScale';

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
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    }
  ];

  return (
    <PremiumScreenShell
      title={i18n.t("app.displayName")}
      subtitle="Choose your preferred language"
      heroStats={[
        { label: 'שפה', value: selectedLanguage === 'he' ? 'עב' : 'EN' },
      ]}
      contentStyle={styles.contentPad}
    >
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        בחר את השפה המועדפת עליך{'\n'}
        Choose your preferred language
      </Text>

      <View style={styles.languageList}>
        {languages.map((language) => {
          const active = selectedLanguage === language.code;
          return (
            <PressableScale key={language.code} onPress={() => handleLanguageSelect(language.code)}>
              <PremiumCard
                style={[
                  styles.languageOption,
                  active && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <View style={styles.languageContent}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <View style={styles.languageText}>
                    <Text style={[styles.languageName, { color: colors.text }]}>{language.nativeName}</Text>
                    <Text style={[styles.languageSubtext, { color: colors.textSecondary }]}>{language.name}</Text>
                  </View>
                </View>
                {active ? (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="check" size={18} color={COLORS.textInverse} />
                  </View>
                ) : null}
              </PremiumCard>
            </PressableScale>
          );
        })}
      </View>

      <GradientButton
        label={isLoading ? 'טוען... / Loading...' : 'המשך / Continue'}
        onPress={() => completeLanguageSelection()}
        disabled={isLoading}
        style={styles.continueBtn}
      />

      <Text style={[styles.footerText, { color: colors.textTertiary }]}>
        Made for couples who organize together
      </Text>
    </PremiumScreenShell>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
    contentPad: {
      paddingTop: SPACING.s,
    },
    description: {
      ...TYPOGRAPHY.body,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    languageList: {
      gap: SPACING.m,
      marginBottom: SPACING.xl,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    languageContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.m,
    },
    flag: {
      fontSize: 28,
    },
    languageText: {
      gap: 2,
    },
    languageName: {
      ...TYPOGRAPHY.h3,
    },
    languageSubtext: {
      ...TYPOGRAPHY.caption,
    },
    checkmark: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueBtn: {
      marginBottom: SPACING.xl,
    },
    footerText: {
      ...TYPOGRAPHY.caption,
      textAlign: 'center',
    },
  });
}

export default LanguageSelectionScreen;
