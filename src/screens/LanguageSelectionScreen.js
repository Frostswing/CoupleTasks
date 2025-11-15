import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage, loadLanguagePreference } from '../localization/i18n';
import { handleError } from '../services/errorHandlingService';

const { width } = Dimensions.get('window');

const LanguageSelectionScreen = ({ onComplete }) => {
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
      
      // Check if we need to reload the app for RTL changes
      const wasRTL = I18nManager.isRTL;
      const shouldBeRTL = languageCode === 'he';
      
      if (wasRTL !== shouldBeRTL) {
        // Force RTL settings
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        
        // Complete language selection first
        await completeLanguageSelection();
        
        // Show alert asking user to restart app for RTL changes
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
        // No RTL change needed, just complete
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
      // Mark that user has completed language selection
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      
      // Call the completion callback if provided
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appIcon}>💜</Text>
        <Text style={styles.appName}>CoupleTasks</Text>
        <Text style={styles.subtitle}>Together we organize</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>בחר שפה / Select Language</Text>
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
          Made with 💜 for couples
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  appIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  languageList: {
    gap: 16,
    marginBottom: 40,
  },
  languageOption: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLanguage: {
    borderColor: '#14B8A6',
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedLanguageText: {
    color: '#14B8A6',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedLanguageSubtext: {
    color: '#14B8A6',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default LanguageSelectionScreen; 