import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';

type MyJobsNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'MyJobs'>;

export const MyJobsScreen: React.FC = () => {
  const navigation = useNavigation<MyJobsNavigationProp>();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');

  // Dummy data for Iteration 1
  const dummyJobs = [
    {
      id: 1,
      title: 'Carpenter wanted',
      status: 'active',
      applicantsCount: 3,
      postedAt: '2 days ago',
      category: 'Construction',
    },
    {
      id: 2,
      title: 'House painter',
      status: 'active',
      applicantsCount: 1,
      postedAt: '5 days ago',
      category: 'Construction',
    },
    {
      id: 3,
      title: 'Plumbing repair',
      status: 'past',
      applicantsCount: 4,
      postedAt: '1 month ago',
      category: 'Maintenance',
    }
  ];

  const filteredJobs = dummyJobs.filter(job => 
    activeTab === 'Active' ? job.status === 'active' : job.status === 'past'
  );

  const renderJobCard = ({ item }: { item: typeof dummyJobs[0] }) => (
    <TouchableOpacity 
      style={styles.jobCard} 
      onPress={() => navigation.navigate('JobDetails', { id: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobCategory}>{item.category}</Text>
        <Text style={styles.jobTime}>{item.postedAt}</Text>
      </View>
      <Text style={styles.jobTitle}>{item.title}</Text>
      
      <View style={styles.jobFooter}>
        <View style={styles.applicantsBadge}>
          <Ionicons name="people" size={14} color={colors.primary} />
          <Text style={styles.applicantsText}>{item.applicantsCount} applicants</Text>
        </View>
        <TouchableOpacity 
          style={styles.manageBtn}
          onPress={() => navigation.navigate('ViewApplicants', { id: item.id })}
        >
          <Text style={styles.manageBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.iconBtn} />
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>My Posts</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('PostJob')}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.tabTextActive]}>Active ({dummyJobs.filter(j => j.status === 'active').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'Past' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.tabTextActive]}>Past ({dummyJobs.filter(j => j.status === 'past').length})</Text>
        </TouchableOpacity>
      </View>

      {filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={colors.inkFaint} />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} jobs</Text>
          <Text style={styles.emptyBody}>You don't have any {activeTab.toLowerCase()} job postings right now.</Text>
          {activeTab === 'Active' && (
            <Button 
              title="Post a job" 
              onPress={() => navigation.navigate('PostJob')} 
              style={{ marginTop: 20 }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: { backgroundColor: colors.paperBright, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.inkFaint },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  tabTextActive: { color: colors.primary },
  listContent: { padding: 20, paddingBottom: 40, gap: 14 },
  jobCard: { backgroundColor: colors.paperBright, borderRadius: 16, padding: 16, ...shadows.sm },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobCategory: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  jobTime: { fontFamily: fonts.body, fontSize: 11, color: colors.inkLight },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink, marginBottom: 16 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.inkFaint },
  applicantsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.peach, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, gap: 6 },
  applicantsText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDark },
  manageBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primary },
  manageBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.paperBright },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink, marginTop: 16, marginBottom: 8 },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
});

export default MyJobsScreen;
