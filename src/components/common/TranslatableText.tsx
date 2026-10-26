import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { translateContent } from '../../api/translation';
import { triggerHaptic } from '../../utils/haptics';

interface TranslatableTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const TranslatableText: React.FC<TranslatableTextProps> = ({
  text,
  style,
  numberOfLines,
  containerStyle,
  buttonStyle,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [isTranslated, setIsTranslated] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const cleanText = text?.trim();
  if (!cleanText) {
    return <Text style={style}>{text}</Text>;
  }

  // Determine target language:
  // If app is currently in Tagalog, user wants to translate to Tagalog ('tl')
  // If app is in English, user can translate to Tagalog ('tl') or toggle back
  const targetLang = language === 'tl' ? 'tl' : 'tl';

  const handleToggleTranslation = async () => {
    triggerHaptic('light');

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateContent(cleanText, targetLang);
      setTranslatedText(result);
      setIsTranslated(true);
    } catch (e) {
      console.warn('Failed to translate content:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isTranslated) {
      return language === 'tl' ? 'Ipakita ang orihinal' : 'Show original';
    }
    return language === 'tl' ? 'Tingnan ang salin (Tagalog)' : 'See translation';
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={style} numberOfLines={isTranslated ? undefined : numberOfLines}>
        {isTranslated && translatedText ? translatedText : text}
      </Text>

      <TouchableOpacity
        onPress={handleToggleTranslation}
        disabled={isLoading}
        style={[styles.translateButton, compact && styles.compactButton, buttonStyle]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={getButtonLabel()}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.buttonText}>
              {language === 'tl' ? 'Isinasalin...' : 'Translating...'}
            </Text>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <Ionicons name="language-outline" size={13} color={colors.primary} />
            <Text style={styles.buttonText}>{getButtonLabel()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  translateButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.paperCream,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  compactButton: {
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
  },
});

export default TranslatableText;
