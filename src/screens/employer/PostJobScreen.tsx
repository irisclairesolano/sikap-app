import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import CustomInput from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useCreateJob } from '../../hooks/useEmployerJobs';
import { useAlert } from '../../contexts/AlertContext';

export const PostJobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const createJobMutation = useCreateJob();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [pay, setPay] = useState('');
  const [slots, setSlots] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exactLocation, setExactLocation] = useState('');
  const [toolsRequired, setToolsRequired] = useState('');

  const handleSubmit = () => {
    if (!title || !category || !location || !pay || !slots || !description) {
      showAlert('Missing fields', 'Please fill in all the required fields before publishing.');
      return;
    }

    const locParts = location.split(',');
    const barangay = locParts[0]?.trim() || 'Zone 1';
    const municipality = locParts[1]?.trim() || 'Bulan';

    createJobMutation.mutate(
      {
        title,
        description,
        category,
        barangay,
        municipality,
        duration_type: duration.toLowerCase().includes('project') ? 'project-based' : 'daily',
        compensation: parseFloat(pay.replace(/[^0-9.]/g, '')),
        slots: parseInt(slots, 10),
        schedule_date: scheduleDate.toISOString().split('T')[0],
        exact_location: exactLocation,
        tools_required: toolsRequired,
      },
      {
        onSuccess: () => {
          showAlert('Job published!', 'Your job is now visible to workers.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          console.error('Job creation failed', err.response?.data || err);
          showAlert('Error', err.response?.data?.message || 'Failed to publish job.');
        },
      },
    );
  };

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            Post a{'\n'}
            <Text style={styles.titleAccent}>new job.</Text>
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
            />

            <CustomInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="E.g. Tinampo, Bulan"
              icon="location-outline"
            />

            <CustomInput
              label="Exact Location"
              value={exactLocation}
              onChangeText={setExactLocation}
              placeholder="E.g. 123 Main St near Plaza"
              icon="map-outline"
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label="Pay (PHP)"
                  value={pay}
                  onChangeText={setPay}
                  placeholder="600"
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
              placeholder="E.g. Daily or Project-based"
              icon="time-outline"
            />

            <View>
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 13,
                  color: colors.inkSoft,
                  marginBottom: 4,
                }}
              >
                Schedule Date
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.inkFaint,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.inkMuted} />
                <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
                  {scheduleDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setScheduleDate(selectedDate);
                  }}
                />
              )}
            </View>

            <CustomInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Need help installing..."
              multiline
              icon="create-outline"
            />

            <CustomInput
              label="Tools Required (Optional)"
              value={toolsRequired}
              onChangeText={setToolsRequired}
              placeholder="E.g. Hammer, nails, saw"
              icon="hammer-outline"
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
            loading={createJobMutation.isPending}
            onPress={handleSubmit}
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
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.8,
    paddingBottom: 4,
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
