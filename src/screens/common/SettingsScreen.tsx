import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';

// ─── Static content modal ────────────────────────────────────────────────────

type ContentSection = { heading?: string; body: string };

const ContentModal = ({
  visible,
  onClose,
  icon,
  iconColor,
  iconBg,
  title,
  sections,
  closeLabel = 'Close',
}: {
  visible: boolean;
  onClose: () => void;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  sections: ContentSection[];
  closeLabel?: string;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={cStyles.overlay}>
      <View style={cStyles.sheet}>
        {/* Drag handle */}
        <View style={cStyles.handle} />

        {/* Header */}
        <View style={cStyles.sheetHeader}>
          <View style={[cStyles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
          </View>
          <Text style={cStyles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={cStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cStyles.body}>
          {sections.map((s, i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              {s.heading ? <Text style={cStyles.heading}>{s.heading}</Text> : null}
              <Text style={cStyles.bodyText}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={cStyles.closeFullBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={cStyles.closeFullBtnText}>{closeLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const cStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paperBright,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingBottom: 8 },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  closeFullBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
});

// ─── Content data (English & Simplified Tagalog) ──────────────────────────────

const HELP_SECTIONS_EN: ContentSection[] = [
  {
    heading: '👋 Welcome to SIKAP Help Center',
    body: 'SIKAP connects local informal-sector workers with household and micro-business employers across all 14 municipalities and 1 city of Sorsogon. Here are answers to common questions about using the app.',
  },
  {
    heading: 'Getting Started & ID Verification',
    body: '1. Register with your email, phone number, birth date (15 years old and above), municipality, and barangay.\n2. Enter the 6-digit verification code (OTP) sent to your email.\n3. Upload your verification documents:\n• Workers: Front and back of a valid ID, plus a clear selfie holding your ID.\n• Employers: Representative valid ID and a business permit or proof of household/establishment.\n\nOur admin team reviews submissions to keep the community safe.',
  },
  {
    heading: 'Finding & Applying for Jobs',
    body: 'Browse local job posts in the Jobs tab. You can filter by skill category, municipality, barangay, pay rate, or urgent tags. Tap a job post to view full details and send an application with a short cover note. Track all your applications in the Applied tab.',
  },
  {
    heading: 'Hiring Process & Privacy Stages',
    body: 'SIKAP protects your contact details through a step-by-step hiring flow:\n\n1. Pending Application — You apply for a job. Only your basic profile, skills, barangay, and reputation score are visible.\n2. Job Request (Shortlisted) — The employer opens an in-app chat with you to discuss job scope and negotiate pay.\n3. Formal Offer (Confirmed) — The employer sets the final agreed pay rate and sends a formal job offer.\n4. Hired (Accepted) — Once you accept the offer, phone numbers and character references are unlocked so you can coordinate directly.\n5. Completed — After the work is finished, the job is marked complete and both sides can rate each other.',
  },
  {
    heading: 'In-App Messaging & Action Cards',
    body: 'Chat becomes available once an employer sends a Job Request to an applicant. Inside the chat, you will see interactive status cards for formal job offers, hire confirmations, and job completion.',
  },
  {
    heading: 'Ratings & Reviews',
    body: 'Once a job is marked Completed, both the worker and employer have 7 days to leave a 1-to-5 star rating and written review. Your overall rating uses a fair weighted average displayed on your profile.',
  },
  {
    heading: 'Switching Between Worker & Employer',
    body: 'Need to hire someone or look for work using the same account? Go to Settings and tap "Log in as Employer" or "Log in as Worker." Worker and Employer ratings are tracked separately.',
  },
  {
    heading: 'Reporting, Blocking & Support',
    body: 'You can report suspicious job posts or users, or block users you no longer wish to interact with (as long as you do not have an active hired contract together). For account help, go to Settings > Support Tickets to message our admin team.',
  },
];

const HELP_SECTIONS_TL: ContentSection[] = [
  {
    heading: '👋 Welcome sa SIKAP Help Center',
    body: 'Tinutulungan ng SIKAP na magkakilala at magkatrabaho ang mga lokal na manggagawa at employer sa lahat ng bayan at lungsod ng Sorsogon. Narito ang gabay kung paano gamitin ang app.',
  },
  {
    heading: 'Pagsisimula at Pag-verify ng ID',
    body: '1. Mag-register gamit ang iyong email, cellphone number, birthday (15 taong gulang pataas), bayan, at barangay.\n2. Ilagay ang 6-digit code (OTP) na ipapadala sa iyong email.\n3. Mag-upload ng malinaw na dokumento:\n• Para sa Worker: Harap at likod ng valid ID, at selfie habang hawak ang ID.\n• Para sa Employer: Valid ID ng kinatawan at Business Permit o patunay ng negosyo/sambahayan.\n\nSinusuri ito ng aming admin para siguradong ligtas at totoo ang mga gumagamit ng app.',
  },
  {
    heading: 'Paghahanap at Pag-apply sa Trabaho',
    body: 'Maghanap ng trabaho sa Jobs tab. Puwede kang gumamit ng filter ayon sa uri ng trabaho, bayan, barangay, bayad, o kung urgent ito. Pindutin ang trabaho para makita ang buong detalye at mag-apply. Makikita mo ang status ng iyong mga inaplayan sa Applied tab.',
  },
  {
    heading: 'Proseso sa Pagkuha sa Trabaho',
    body: 'Pinoprotektahan ng SIKAP ang iyong personal na impormasyon sa bawat hakbang:\n\n1. Nag-apply (Pending) — Nagpasa ka ng aplikasyon. Pangalan, barangay, skills, at rating pa lang ang makikita ng employer.\n2. Napili sa Chat (Job Request) — Binuksan ng employer ang chat para mapag-usapan ninyo ang detalye ng trabaho at bayad.\n3. Opisyal na Alok (Offer Sent) — Nagpadala na ang employer ng pinal na alok at napagkasunduang bayad.\n4. Tanggap na sa Trabaho (Hired) — Kapag tinanggap mo ang alok, makikita na ninyo ang cellphone number ng isa’t isa at ang iyong character references.\n5. Tapos na (Completed) — Kapag tapos na ang trabaho, mamarkahan na itong Completed at puwede na kayong magbigay ng rating at review.',
  },
  {
    heading: 'Pag-uusap sa Chat (Messages)',
    body: 'Makakapag-chat lamang kapag pinili (shortlisted) ng employer ang iyong aplikasyon. Sa loob ng chat, makikita rin ang mga notification card kapag may opisyal na alok sa trabaho o kapag tapos na ang gawain.',
  },
  {
    heading: 'Mga Rating at Review',
    body: 'Pagkatapos ng trabaho, may 7 araw ang worker at employer para bigyan ng 1 hanggang 5 star rating at review ang isa’t isa. Makikita ang iyong reputasyon sa iyong profile.',
  },
  {
    heading: 'Paglipat sa Worker o Employer Mode',
    body: 'Kung gusto mong mag-post ng trabaho o kaya ay maghanap ng mapapasukan gamit ang parehong account, pumunta lang sa Settings at pindutin ang "Gamitin ang Employer Account" o "Gamitin ang Worker Account." Magkahiwalay ang rating mo bilang worker at bilang employer.',
  },
  {
    heading: 'Pag-report, Pag-block, at Tulong',
    body: 'Puwede mong i-report ang kahina-hinalang user o job post, o i-block ang user kung wala kayong kasalukuyang kontrata sa trabaho. Kung kailangan mo ng tulong sa account, pumunta sa Settings > Mga Request sa Support.',
  },
];

const TERMS_SECTIONS_EN: ContentSection[] = [
  {
    heading: 'Terms of Service',
    body: 'Last updated: November 2026\n\nBy creating an account or using SIKAP, you agree to follow these Terms of Service. Please read them carefully.',
  },
  {
    heading: '1. Eligibility & Age Requirement',
    body: 'To use SIKAP, you must be at least 15 years old and reside or operate within the Province of Sorsogon. In accordance with Philippine labor laws (Republic Act No. 7658), users aged 15 to 17 may only engage in non-hazardous work with appropriate parent or guardian consent.',
  },
  {
    heading: '2. About SIKAP',
    body: 'SIKAP is a localized job-matching platform connecting informal-sector workers and employers in Sorsogon. SIKAP provides tools for job posting, application tracking, in-app negotiation, and identity verification, but is not an employment agency or direct employer.',
  },
  {
    heading: '3. Account Registration & Verification',
    body: 'You agree to provide truthful, accurate information when registering and to verify your email via OTP. To access full platform features, workers must submit a valid ID (front and back) and selfie, while employers must submit a representative ID and supporting permit/proof. Sharing accounts or using fake documents will result in permanent suspension.',
  },
  {
    heading: '4. Community Rules & Conduct',
    body: 'To keep SIKAP safe and respectful, you agree not to:\n• Post fake, illegal, or misleading job listings or profile information\n• Harass, abuse, or use profane language in chat, job posts, or reviews\n• Ask for application fees, deposits, or money transfers\n• Bypass the platform’s progressive contact disclosure rules\n\nSIKAP uses automated profanity filters and admin moderation. Violations may result in content removal, temporary suspension, or a permanent ban.',
  },
  {
    heading: '5. Job Offers, Wage Guidance & Payments',
    body: 'Employers and workers agree on the scope of work and compensation before confirming a hire. While SIKAP displays Region V (Bicol) DOLE minimum wage reference guides, final pay rates are agreed upon by both users. SIKAP does not process payments or collect commissions, and is not liable for offline payment disputes.',
  },
  {
    heading: '6. Dual-Role Usage',
    body: 'Users may switch between Worker and Employer modes within the same account. However, you may not apply to your own job postings or manipulate ratings and reviews.',
  },
  {
    heading: '7. Reviews & Reputation',
    body: 'Reviews must reflect genuine work experiences from completed jobs within the 7-day rating window. Dishonest, abusive, or retaliatory reviews may be moderated by administrators.',
  },
  {
    heading: '8. Account Deletion & Suspension',
    body: 'You may delete your account in Settings as long as you do not have active hired jobs in progress. SIKAP reserves the right to suspend or permanently ban accounts involved in fraud, harassment, or repeated policy violations.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'SIKAP is provided "as is" as a community matching tool. We do not guarantee job placement, worker performance, or workplace safety, and are not liable for any damages arising from offline work arrangements between users.',
  },
  {
    heading: '10. Governing Law & Contact',
    body: 'These Terms are governed by the laws of the Republic of the Philippines. If you have questions or concerns, please reach out via Settings > Support Tickets.',
  },
];

const TERMS_SECTIONS_TL: ContentSection[] = [
  {
    heading: 'Mga Tuntunin sa Paggamit',
    body: 'Huling na-update: Nobyembre 2026\n\nSa paggawa ng account at paggamit ng SIKAP, sumasang-ayon ka na susundin ang mga tuntuning ito. Pakibasa ito nang mabuti.',
  },
  {
    heading: '1. Sino ang Puwedeng Gumamit',
    body: 'Dapat ay hindi bababa sa 15 taong gulang ka at nakatira o naghahanapbuhay sa Probinsya ng Sorsogon para magamit ang SIKAP. Ayon sa batas sa paggawa ng Pilipinas (RA 7658), ang mga edad 15 hanggang 17 ay maaari lamang pumasok sa ligtas na trabaho na may pahintulot ng magulang o guardian.',
  },
  {
    heading: '2. Ano ang SIKAP',
    body: 'Ang SIKAP ay isang app na nag-uugnay sa mga lokal na manggagawa at employer sa Sorsogon. Tinutulungan namin kayong maghanap ng trabaho, mag-usap sa chat, at mag-verify ng pagkakakilanlan, ngunit ang SIKAP ay hindi agency at hindi direktang employer.',
  },
  {
    heading: '3. Paggawa ng Account at Pag-verify ng ID',
    body: 'Sumasang-ayon kang magbigay ng totoo at tamang impormasyon sa pag-register at i-verify ang iyong email gamit ang OTP. Para magamit nang buo ang app, kailangang magpasa ng valid ID at selfie (para sa Worker) o valid ID at permit/patunay (para sa Employer). Ang paggamit ng pekeng ID o pangalan ay magreresulta sa pagka-ban ng account.',
  },
  {
    heading: '4. Tamang Asal sa Paggamit ng App',
    body: 'Para manatiling ligtas at maayos ang komunidad ng SIKAP, bawal ang mga sumusunod:\n• Mag-post ng pekeng trabaho o maling impormasyon sa profile\n• Manloko, mang-away, o gumamit ng bastos na salita sa chat, job post, o review\n• Maningil ng placement fee o humingi ng pera bago magsimula ang trabaho\n• Pilitin ang ibang user na ibigay agad ang pribadong contact details bago magkasundo sa app\n\nMay automatic filter at admin team ang SIKAP na nagbabantay. Ang lalabag ay maaaring masuspinde o ma-ban nang permanente.',
  },
  {
    heading: '5. Kasunduan sa Trabaho at Bayad',
    body: 'Ang employer at manggagawa ang nagkakasundo sa gawain at halaga ng bayad bago magsimula ang trabaho. Nagpapakita ang SIKAP ng gabay sa minimum wage ng DOLE Region V, ngunit direktang binabayaran ng employer ang manggagawa. Hindi dumadaan sa SIKAP ang pera o sahod.',
  },
  {
    heading: '6. Paggamit Bilang Worker at Employer',
    body: 'Puwede kang lumipat sa Worker Mode at Employer Mode gamit ang iisang account. Gayunpaman, bawal mag-apply sa sarili mong job post o dayain ang mga rating at review.',
  },
  {
    heading: '7. Mga Rating at Review',
    body: 'Ang mga review ay dapat batay sa totoong karanasan sa natapos na trabaho sa loob ng 7 araw. Maaaring alisin ng admin ang mga mapanirang-puri o hindi totoong review.',
  },
  {
    heading: '8. Pagbura at Pagsuspinde ng Account',
    body: 'Puwede mong burahin ang iyong account anumang oras sa Settings basta wala kang kasalukuyang trabahong hindi pa tapos. May karapatan din ang SIKAP na isuspinde o i-ban ang mga account na lumalabag sa aming mga patakaran.',
  },
  {
    heading: '9. Limitasyon ng Pananagutan',
    body: 'Ang SIKAP ay tulay lamang sa pagitan ng employer at manggagawa. Hindi namin ginagarantiya na agad kang matatanggap sa trabaho, at hindi kami mananagot sa anumang hindi pagkakaunawaan sa labas ng app.',
  },
  {
    heading: '10. Batas na Sumasaklaw at Pakikipag-ugnayan',
    body: 'Ang mga tuntuning ito ay nasasaklaw ng mga batas ng Republika ng Pilipinas. Kung may tanong ka, magpadala lamang ng mensahe sa Settings > Mga Request sa Support.',
  },
];

const PRIVACY_SECTIONS_EN: ContentSection[] = [
  {
    heading: 'Privacy Policy',
    body: 'Last updated: November 2026\n\nSIKAP values your privacy and protects your personal data in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
  },
  {
    heading: '1. Information We Collect',
    body: 'When you use SIKAP, we collect:\n• Registration details: full name, email address, mobile number, birth date, municipality, and barangay in Sorsogon\n• Profile information: skills, work history, character references (up to 3), household/business details, and profile photo\n• Verification documents: government-issued IDs, selfies with ID, and business/household proof documents\n• App activity: job posts, applications, in-app chat messages, ratings, reviews, and support tickets\n• Device data: Expo push notification tokens for real-time updates',
  },
  {
    heading: '2. How We Use Your Data',
    body: 'We use your information strictly to:\n• Verify your identity and maintain a trusted local community\n• Match workers with nearby jobs in their barangay and municipality\n• Facilitate in-app messaging, job offers, and mutual ratings\n• Send important SMS, email (OTP), and push notifications about your applications or jobs\n• Generate anonymized, aggregate labor-market statistics (such as top skills and job demand per municipality)',
  },
  {
    heading: '3. Progressive Contact Disclosure (How Sharing Works)',
    body: 'SIKAP does not expose your full personal details to everyone. Information is shared step by step:\n• Public / Pending stage: Only your name, barangay/municipality, skills, work history, and rating score are shown.\n• Shortlisted / Offer stage: You can chat securely inside the app without revealing your phone number.\n• Hired stage: Your mobile number and character references are unlocked to the matched employer/worker only after the formal job offer is accepted.\n\nWe never sell or rent your personal data to advertisers or third parties.',
  },
  {
    heading: '4. Protection of ID Documents & Character References',
    body: 'Uploaded IDs, selfies, and permits are stored in private encrypted cloud storage and are viewed only by authorized SIKAP administrators via temporary secure links. They are never shown to other users. Character reference details are also encrypted and only disclosed when a worker is officially hired.',
  },
  {
    heading: '5. Data Retention & Account Deletion',
    body: 'We keep your data while your account remains active. If you delete your account in Settings, your profile and personal records are removed from active access, while necessary audit or moderation records are retained only as required for security and legal compliance.',
  },
  {
    heading: '6. Security Measures',
    body: 'We protect your account using HTTPS encryption, hashed passwords and OTPs, secure token storage on your device, and role-based access controls.',
  },
  {
    heading: '7. Your Data Privacy Rights',
    body: 'Under the Data Privacy Act of 2012 (RA 10173), you have the right to:\n• Be informed about how your data is processed\n• Access and update your profile information\n• Withdraw consent or delete your account\n• Report privacy concerns to our team via Settings > Support Tickets',
  },
  {
    heading: '8. Young Workers (Ages 15–17)',
    body: 'SIKAP permits registration only for users aged 15 and older. We do not collect data from children under 15. Users aged 15 to 17 are encouraged to review this Privacy Policy with their parent or legal guardian.',
  },
];

const PRIVACY_SECTIONS_TL: ContentSection[] = [
  {
    heading: 'Patakaran sa Privacy',
    body: 'Huling na-update: Nobyembre 2026\n\nPinapahalagahan ng SIKAP ang iyong privacy at pinoprotektahan ang iyong personal na impormasyon alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173).',
  },
  {
    heading: '1. Anong Impormasyon ang Kinokolekta Namin',
    body: 'Kapag ginagamit mo ang SIKAP, kinokolekta namin ang mga sumusunod:\n• Detalye ng Account: buong pangalan, email address, cellphone number, birthday, bayan, at barangay sa Sorsogon\n• Detalye sa Profile: mga kasanayan (skills), karanasan sa trabaho, hanggang 3 character reference, detalye ng negosyo o sambahayan, at litrato sa profile\n• Dokumento sa Pag-verify: larawan ng valid ID (harap at likod), selfie na hawak ang ID, at business permit o patunay ng sambahayan\n• Aktibidad sa App: mga job post, aplikasyon, usapan sa chat, rating, review, at support ticket\n• Impormasyon ng Device: notification token para makatanggap ka ng update sa iyong cellphone',
  },
  {
    heading: '2. Paano Namin Ginagamit ang Iyong Impormasyon',
    body: 'Ginagamit lamang namin ang iyong datos para:\n• Masuri at ma-verify kung totoo ang iyong account\n• Maipakita ang mga trabahong malapit sa iyong barangay at bayan\n• Makapag-usap nang ligtas ang worker at employer sa loob ng app\n• Mapadalhan ka ng OTP sa email, SMS, at notification tungkol sa iyong aplikasyon o trabaho\n• Makabuo ng pangkalahatang ulat tungkol sa mga trabaho sa Sorsogon (nang hindi inilalabas ang iyong pangalan o personal na detalye)',
  },
  {
    heading: '3. Kailan Makikita ng Iba ang Iyong Contact Details',
    body: 'Hindi basta-basta ipinapakita ng SIKAP ang iyong cellphone number sa publiko. Hakbang-hakbang ang pagbukas ng impormasyon:\n• Habang nag-a-apply pa lang: Pangalan, barangay/bayan, skills, karanasan sa trabaho, at rating lang ang makikita.\n• Habang nag-uusap sa Chat: Puwede kayong mag-usap sa loob ng app nang nakatago pa rin ang iyong cellphone number.\n• Kapag Tanggap na sa Trabaho (Hired): Makikita lamang ang iyong cellphone number at character references kapag tinanggap mo na ang opisyal na alok sa trabaho.\n\nHindi namin kailanman ibinebenta ang iyong personal na impormasyon sa ibang kumpanya.',
  },
  {
    heading: '4. Kaligtasan ng Iyong ID at Dokumento',
    body: 'Ang mga in-upload mong ID, selfie, at permit ay nakatago sa ligtas at pribadong storage. Tanging ang mga awtorisadong admin ng SIKAP lamang ang makakatingin nito para sa pag-verify, at hinding-hindi ito ipapakita sa mga employer o ibang user.',
  },
  {
    heading: '5. Pagpapanatili at Pagbura ng Datos',
    body: 'Pinapanatili namin ang iyong impormasyon habang aktibo ang iyong account. Kapag pinili mong burahin ang iyong account sa Settings, aalisin na sa publiko ang iyong profile at personal na detalye.',
  },
  {
    heading: '6. Seguridad ng Iyong Account',
    body: 'Gumagamit kami ng ligtas na koneksyon (HTTPS), naka-encrypt na password at impormasyon, at mahigpit na seguridad para maprotektahan ang iyong account.',
  },
  {
    heading: '7. Ang Iyong mga Karapatan',
    body: 'Sa ilalim ng Data Privacy Act of 2012, may karapatan kang:\n• Malaman kung paano ginagamit ang iyong impormasyon\n• Tingnan at baguhin ang detalye sa iyong profile\n• I-delete ang iyong account kung ayaw mo nang gamitin ang app\n• Magtanong o mag-report tungkol sa iyong privacy sa Settings > Mga Request sa Support',
  },
  {
    heading: '8. Para sa mga Edad 15–17',
    body: 'Ang SIKAP ay para lamang sa mga edad 15 pataas at hindi kumokolekta ng datos ng mga batang wala pang 15 taong gulang. Hinihikayat ang mga edad 15 hanggang 17 na basahin ang patakarang ito kasama ang kanilang magulang o guardian.',
  },
];

const DELETE_REASONS_EN = [
  'Found work / hired someone elsewhere',
  'Not using the app anymore',
  'Privacy or security concerns',
  'Technical difficulties or app bugs',
  'Other reason',
];

const DELETE_REASONS_TL = [
  'Nakahanap na ng trabaho o manggagawa sa iba',
  'Hindi ko na ginagamit ang app',
  'May alalahanin sa privacy o seguridad',
  'May problema o bug sa paggamit ng app',
  'Iba pang dahilan',
];

const SettingRow = ({
  icon,
  title,
  subtitle,
  type = 'nav',
  value,
  onToggle,
  onPress,
  isDestructive = false,
}: any) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={type === 'nav' ? onPress : undefined}
    disabled={type !== 'nav'}
  >
    <View style={styles.settingRowLeft}>
      <Ionicons name={icon} size={22} color={isDestructive ? colors.error : colors.ink} />
      <View>
        <Text style={[styles.settingRowTitle, isDestructive && { color: colors.error }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {type === 'nav' && <Ionicons name="chevron-forward" size={20} color={colors.inkLight} />}
    {type === 'toggle' && (
      <Switch
        trackColor={{ false: colors.inkFaint, true: colors.mint }}
        thumbColor={colors.paperBright}
        onValueChange={onToggle}
        value={value}
      />
    )}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { language, setLanguage, t } = useLanguage();

  const isTagalog = language === 'tl';
  const deleteReasons = isTagalog ? DELETE_REASONS_TL : DELETE_REASONS_EN;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(deleteReasons[0]);
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const { user, userRole, switchRole } = useAuth();

  const handleLogout = () => {
    showAlert(t('log_out'), t('confirm_logout_msg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('log_out'),
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_profile');
          queryClient.clear();
          notifyAuthChanged();
        },
      },
    ]);
  };

  const executeAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      const isOther = selectedReason === 'Other reason' || selectedReason === 'Iba pang dahilan';
      const fullReason =
        isOther && customReasonDetails.trim()
          ? `Other: ${customReasonDetails.trim()}`
          : customReasonDetails.trim()
            ? `${selectedReason} - ${customReasonDetails.trim()}`
            : selectedReason;

      await authApi.deleteAccount(fullReason);
      setShowDeleteModal(false);
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_profile');
      queryClient.clear();
      notifyAuthChanged();
    } catch (err: any) {
      setIsDeleting(false);
      showAlert(
        isTagalog ? 'Hindi Nabura ang Account' : 'Deletion Failed',
        err?.message || t('delete_account_failed'),
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const status = await authApi.getDeleteAccountStatus();
      if (!status.can_delete) {
        // Tier 1: Blocked
        showAlert(
          isTagalog ? 'Hindi Maaaring Burahin' : 'Cannot Delete Account',
          status.reason
            ? sanitizeErrorMessage(status.reason)
            : t('delete_account_blocked_active_jobs'),
        );
        return;
      }

      setDeleteWarning(
        status.has_warning && status.warning ? sanitizeErrorMessage(status.warning) : null,
      );
      setSelectedReason(deleteReasons[0]);
      setCustomReasonDetails('');
      setShowDeleteModal(true);
    } catch (err: any) {
      showAlert(
        'Error',
        err?.message ||
          (isTagalog
            ? 'Hindi ma-check ang status ng account. Pakitingnan ang iyong koneksyon.'
            : 'Unable to check account status. Please check your connection.'),
      );
    }
  };

  const handleSwitchRole = () => {
    const isTargetWorker = userRole === 'employer';
    const title = isTargetWorker ? t('switch_to_worker') : t('switch_to_employer');
    const message = isTargetWorker
      ? `${t('switch_worker_desc')}\n\n${t('switch_worker_skills_note')}`
      : t('switch_employer_desc');

    showAlert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('continue'),
        onPress: async () => {
          try {
            await switchRole();
          } catch (e: any) {
            showAlert('Error', e?.message || t('failed_switch_roles'));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('settings')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="person-outline"
              title={t('edit_profile')}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="mail-outline"
              title={t('email_address')}
              subtitle={user?.email || 'N/A'}
              type="text"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="swap-horizontal-outline"
              title={userRole === 'worker' ? t('login_as_employer') : t('login_as_worker')}
              onPress={handleSwitchRole}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="language-outline"
              title={t('language')}
              subtitle={language === 'tl' ? 'Tagalog (Filipino)' : 'English'}
              onPress={() => setShowLanguageModal(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="notifications-outline"
              title={t('push_notifications')}
              type="toggle"
              value={notificationsEnabled}
              onToggle={setNotificationsEnabled}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="location-outline"
              title={t('location_services')}
              type="toggle"
              value={locationEnabled}
              onToggle={setLocationEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="help-circle-outline"
              title={t('help_center')}
              onPress={() => setShowHelp(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubbles-outline"
              title={t('support_tickets')}
              onPress={() => navigation.navigate('SupportTickets' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text-outline"
              title={t('terms_of_service')}
              onPress={() => setShowTerms(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-closed-outline"
              title={t('privacy_policy')}
              onPress={() => setShowPrivacy(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow icon="log-out-outline" title={t('log_out')} onPress={handleLogout} />
            <View style={styles.divider} />
            <SettingRow
              icon="trash-outline"
              title={t('delete_account')}
              isDestructive={true}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        <Text style={styles.versionText}>SIKAP v1.0.0</Text>
      </ScrollView>

      {/* Help Center Modal */}
      <ContentModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        icon="help-circle-outline"
        iconColor={colors.primary}
        iconBg={colors.peach}
        title={t('help_center')}
        sections={isTagalog ? HELP_SECTIONS_TL : HELP_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Terms of Service Modal */}
      <ContentModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        icon="document-text-outline"
        iconColor="#6366F1"
        iconBg="#EEF2FF"
        title={t('terms_of_service')}
        sections={isTagalog ? TERMS_SECTIONS_TL : TERMS_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Privacy Policy Modal */}
      <ContentModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        icon="lock-closed-outline"
        iconColor={colors.mintDeep}
        iconBg={colors.mint}
        title={t('privacy_policy')}
        sections={isTagalog ? PRIVACY_SECTIONS_TL : PRIVACY_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={cStyles.overlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={cStyles.sheet}>
            <View style={cStyles.handle} />
            <View style={cStyles.sheetHeader}>
              <View style={[cStyles.iconCircle, { backgroundColor: colors.peach }]}>
                <Ionicons name="language-outline" size={22} color={colors.primary} />
              </View>
              <Text style={cStyles.sheetTitle}>
                {language === 'tl' ? 'Pumili ng Wika' : 'Select Language'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={cStyles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 14, gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  language === 'en' && {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(232, 116, 74, 0.08)',
                  },
                  { paddingVertical: 14 },
                ]}
                onPress={async () => {
                  await setLanguage('en');
                  setShowLanguageModal(false);
                }}
              >
                <Ionicons
                  name={language === 'en' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={language === 'en' ? colors.primary : colors.inkFaint}
                />
                <Text
                  style={[
                    styles.reasonOptionText,
                    language === 'en' && { fontFamily: fonts.bodyBold, color: colors.primary },
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  language === 'tl' && {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(232, 116, 74, 0.08)',
                  },
                  { paddingVertical: 14 },
                ]}
                onPress={async () => {
                  await setLanguage('tl');
                  setShowLanguageModal(false);
                }}
              >
                <Ionicons
                  name={language === 'tl' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={language === 'tl' ? colors.primary : colors.inkFaint}
                />
                <Text
                  style={[
                    styles.reasonOptionText,
                    language === 'tl' && { fontFamily: fonts.bodyBold, color: colors.primary },
                  ]}
                >
                  Tagalog (Filipino)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={cStyles.closeFullBtn}
              onPress={() => setShowLanguageModal(false)}
              activeOpacity={0.8}
            >
              <Text style={cStyles.closeFullBtnText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Reason Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>{t('delete_account')}</Text>
                <Text style={styles.modalSubtitle}>
                  {isTagalog
                    ? 'Sabihin sa amin kung bakit mo gustong burahin ang iyong account'
                    : 'Please tell us why you are leaving'}
                </Text>
              </View>
            </View>

            {deleteWarning && (
              <View style={styles.warningBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#B45309"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.warningBoxText}>{deleteWarning}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 220, marginVertical: 12 }}>
              <Text style={styles.inputLabel}>
                {isTagalog ? 'Pumili ng dahilan:' : 'Select a reason:'}
              </Text>
              {deleteReasons.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.error : colors.inkLight}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        isSelected && { fontFamily: fonts.bodyBold, color: colors.ink },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>
                {isTagalog ? 'Karagdagang komento (opsyonal):' : 'Additional feedback (optional):'}
              </Text>
              <TextInput
                style={styles.customReasonInput}
                placeholder={
                  isTagalog
                    ? 'Tulungan kaming mapaganda pa ang SIKAP...'
                    : 'Help us improve SIKAP...'
                }
                placeholderTextColor={colors.inkLight}
                value={customReasonDetails}
                onChangeText={setCustomReasonDetails}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>
                  {isTagalog ? 'Panatilihin ang Account' : 'Keep Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={executeAccountDeletion}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>{t('delete_account')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.paperBright,
  },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginLeft: 50 },
  versionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkLight,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    ...shadows.color,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  warningBoxText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paper,
    marginBottom: 6,
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  reasonOptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    flex: 1,
  },
  customReasonInput: {
    backgroundColor: colors.paper,
    borderColor: colors.inkFaint,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    minHeight: 64,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#fff',
  },
});

export default SettingsScreen;
