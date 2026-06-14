import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import CustomInput from '../../components/common/Input';
import Button from '../../components/common/Button';

export const PostJobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [pay, setPay] = useState('');
  const [slots, setSlots] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.appBarBadge}>
            <Text style={styles.appBarBadgeText}>New post</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            Post a{'\n'}<Text style={styles.titleAccent}>new job.</Text>
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              label="Job title"
              value={title}
              onChangeText={setTitle}
              placeholder="E.g. Carpenter wanted"
            />
            
            {/* Using CustomInput for selects for now, ideally should be a picker component */}
            <CustomInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="Construction"
              icon="construct-outline"
              rightIcon={{ name: 'chevron-down', type: 'ionicon', onPress: () => {} }}
            />
            
            <CustomInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Tinampo, Bulan"
              icon="location-outline"
              rightIcon={{ name: 'chevron-down', type: 'ionicon', onPress: () => {} }}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label="Pay per day"
                  value={pay}
                  onChangeText={setPay}
                  placeholder="₱600"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label="Slots"
                  value={slots}
                  onChangeText={setSlots}
                  placeholder="2"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <CustomInput
              label="Duration"
              value={duration}
              onChangeText={setDuration}
              placeholder="2-3 days"
              icon="time-outline"
              rightIcon={{ name: 'chevron-down', type: 'ionicon', onPress: () => {} }}
            />

            <CustomInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Need help installing..."
              multiline
              icon="create-outline"
            />

            {/* Urgent Toggle */}
            <View style={styles.urgentCard}>
              <Ionicons name="flame" size={22} color={colors.primary} />
              <View style={styles.urgentTextContainer}>
                <Text style={styles.urgentTitle}>Mark as urgent</Text>
                <Text style={styles.urgentSubtitle}>Appears at the top of worker feeds</Text>
              </View>
              <Switch
                trackColor={{ false: colors.inkFaint, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.inkFaint}
                onValueChange={setIsUrgent}
                value={isUrgent}
              />
            </View>

          </View>

          <Button 
            label="Publish job" 
            size="lg"
            fullWidth 
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 24 }}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  appBarBadge: {
    backgroundColor: colors.paperBright,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  appBarBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.8,
  },
  titleAccent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  formContainer: {
    marginTop: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  urgentCard: {
    backgroundColor: colors.butter,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgentTextContainer: {
    flex: 1,
  },
  urgentTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  urgentSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
});

export default PostJobScreen;
