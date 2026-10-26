import { TranslationKey } from './en';

export const tl: Record<TranslationKey, string> = {
  // 1-13: Settings & Sections
  settings: 'Mga Setting',
  account: 'Account',
  preferences: 'Mga Preference',
  language: 'Wika',
  language_current: 'Tagalog (Filipino)',
  push_notifications: 'Mga Push Notification',
  location_services: 'Mga Serbisyo sa Lokasyon',
  support: 'Tulong',
  help_center: 'Help Center',
  support_tickets: 'Mga Request sa Support',
  terms_of_service: 'Mga Tuntunin sa Paggamit',
  privacy_policy: 'Patakaran sa Privacy',
  log_out: 'Mag-log out',
  delete_account: 'Burahin ang Account',

  // 14-25: Account Actions & Info
  confirm_logout_msg: 'Sigurado ka bang gusto mong mag-log out?',
  edit_profile: 'I-edit ang Profile',
  full_name: 'Buong Pangalan',
  email_address: 'Email Address',
  phone_number: 'Numero ng Telepono',
  date_of_birth: 'Petsa ng Kapanganakan',
  municipality: 'Bayan',
  barangay: 'Barangay',
  login_as_employer: 'Gamitin ang Employer Account',
  login_as_worker: 'Gamitin ang Worker Account',
  switch_to_worker: 'Lumipat sa Worker Mode',
  switch_to_employer: 'Lumipat sa Employer Mode',

  // 26-39: Role Switch & Account Deletion Details
  switch_worker_desc:
    'Lilipat ka sa Worker Mode. Dito, puwede kang maghanap ng mga trabaho sa inyong lugar, mag-apply, at mag-save ng mga trabahong interesado ka.',
  switch_worker_skills_note:
    'Kung wala pang nakalagay na kasanayan sa iyong profile, tutulungan ka munang idagdag ang mga ito.',
  switch_employer_desc:
    'Lilipat ka sa Employer Mode. Dito, puwede kang mag-post ng trabaho, tumingin ng mga aplikante, at kumuha ng mga manggagawa.',
  failed_switch_roles: 'Hindi napalitan ang account mode mo. Pakisubukan ulit.',
  delete_account_warning:
    'Permanenteng mabubura ang iyong profile, kasaysayan ng trabaho, at iba pang datos ng account. Hindi na ito maibabalik kapag natuloy.',
  delete_account_blocked_active_jobs:
    'May mga trabaho ka pang ginagawa o aplikasyon na hindi pa tapos. Tapusin o kanselahin muna ang mga ito bago burahin ang account mo.',
  delete_account_warning_rating_window:
    'May natapos ka nang trabaho na maaari pang bigyan ng rating o review. Kapag binura mo ang account mo, hindi ka na makakapagbigay o makakatanggap ng review para sa mga trabahong iyon.',
  delete_reason_prompt: 'Pumili ng dahilan kung bakit mo gustong burahin ang account mo:',
  reason_found_job: 'Nakahanap na ako ng trabaho sa iba',
  reason_too_many_notifications: 'Sobrang daming notification',
  reason_not_using: 'Hindi ko na ginagamit ang app na ito',
  reason_privacy_concerns: 'May alalahanin ako tungkol sa privacy o seguridad',
  reason_other: 'Iba pang dahilan (pakitukoy)',
  delete_account_failed: 'Hindi nabura ang account mo. Pakisubukan ulit mamaya.',

  // 40-50: Main Navigation & Tabs
  find_jobs: 'Maghanap ng Trabaho',
  my_applications: 'Mga Aplikasyon Ko',
  my_jobs: 'Mga Trabaho Ko',
  post_a_job: 'Mag-post ng Trabaho',
  messages: 'Mga Mensahe',
  profile: 'Profile',
  notifications: 'Mga Notification',
  search_jobs_placeholder: 'Maghanap ng trabaho, kasanayan, o barangay...',
  all: 'Lahat',
  urgent: 'Agarang Kailangan',
  filter: 'Filter',

  // 51-71: Job Feed & Details
  no_jobs_found: 'Walang trabahong tumutugma sa hinahanap mo. Subukang baguhin ang mga filter.',
  compensation: 'Bayad',
  per_day: 'kada araw',
  per_hour: 'kada oras',
  fixed_per_project: 'takdang bayad / kada proyekto',
  slots_available: 'Bukas Pang Puwesto',
  filled_slots: 'Napunan nang Puwesto',
  location: 'Lokasyon',
  posted_by: 'Nag-post',
  date_posted: 'Petsa ng Pag-post',
  job_description: 'Paglalarawan ng Trabaho',
  requirements: 'Mga Kailangan',
  apply_now: 'Mag-apply',
  save_job: 'I-save ang Trabaho',
  saved_jobs: 'Mga Na-save na Trabaho',
  job_saved_bookmark: 'Na-save na ang trabahong ito.',
  job_removed_bookmark: 'Inalis na ang trabaho sa mga na-save mo.',
  already_applied: 'Nakapag-apply Ka Na',
  closed: 'Sarado na',
  in_progress: 'Kasalukuyang Ginagawa',
  job_already_filled:
    'May nakuha na para sa trabahong ito o hindi na ito tumatanggap ng mga aplikasyon.',

  // 72-90: Application Lifecycle
  submit_application: 'Isumite ang Aplikasyon',
  confirm_apply_prompt: 'Sigurado ka bang gusto mong mag-apply sa trabahong ito?',
  cover_note: 'Mensahe para sa Employer',
  why_fit_question: 'Bakit sa tingin mo ay bagay sa iyo ang trabahong ito?',
  cover_note_desc: 'Sabihin sa employer kung bakit ikaw ang angkop na tao para sa trabahong ito.',
  application_submitted_success:
    'Naipasa na ang aplikasyon mo! Titingnan ng employer ang iyong profile.',
  already_applied_notice:
    'Nakapag-apply ka na sa trabahong ito. Tingnan ang status nito sa Mga Aplikasyon Ko.',
  application_status: 'Status ng Aplikasyon',
  status_under_review: 'Sinusuri pa',
  status_shortlisted: 'Napili para sa susunod na hakbang',
  status_job_offer_received: 'May Natanggap na Alok sa Trabaho',
  status_hired: 'Natanggap sa Trabaho',
  status_completed: 'Tapos na',
  status_declined: 'Hindi Tinanggap',
  status_withdrawn: 'Binawi',
  confirm_withdraw_prompt:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  withdraw_application: 'Bawiin ang Aplikasyon',
  accept_offer: 'Tanggapin ang Alok',
  decline_offer: 'Tanggihan ang Alok',

  // 91-102: Shortlisting & Completion
  shortlisted_chat_notice:
    'Napili ng employer ang aplikasyon mo para sa susunod na hakbang. Maaari na kayong mag-usap sa chat.',
  offer_sent_notice:
    'Nagpadala ang employer ng opisyal na alok sa trabaho. Tingnan sa ibaba ang detalye ng bayad.',
  accept_terms_prompt: 'Tinatanggap mo ba ang alok na trabaho at ang mga kundisyong nakasaad dito?',
  congratulations_hired:
    'Congratulations! Tinanggap mo ang alok, kaya opisyal ka nang tanggap sa trabaho.',
  declined_offer_notice: 'Tinanggihan mo ang alok sa trabaho. Aabisuhan ang employer.',
  confirm_hire: 'Kumpirmahin ang Pagkuha sa Trabaho',
  confirm_hire_desc:
    'Kumpirmahin na kukunin mo na ang manggagawang ito. Siguraduhing nagkasundo kayo sa bayad.',
  cancel_hire: 'Kanselahin ang Pagkuha',
  confirm_cancel_hire_prompt:
    'Sigurado ka bang gusto mong kanselahin ang kasunduan sa pagkuha sa trabaho?',
  mark_as_completed: 'Markahang Tapos na',
  mark_completed_desc:
    'Markahang tapos na ang trabaho kapag natapos na ang lahat ng gawain at naibigay na ang bayad.',
  job_marked_completed_notice:
    'Namarkahan nang tapos ang trabaho. Mag-iwan ng rating at review para sa nakausap mong employer o manggagawa.',

  // 103-120: Profile & Verification Elements
  my_profile: 'Profile Ko',
  verified_member: 'Beripikadong Miyembro',
  verification_pending: 'Naghihintay ng Beripikasyon',
  unverified: 'Hindi Pa Beripikado',
  reputation_score: 'Rating ng Reputasyon',
  completed_jobs: 'Mga Natapos na Trabaho',
  reviews_ratings: 'Mga Review at Rating',
  member_since: 'Miyembro Mula Noong',
  skills: 'Mga Kasanayan',
  add_skills: 'Magdagdag ng mga Kasanayan',
  select_your_skills: 'Piliin ang mga kaya mong gawin',
  work_experience: 'Karanasan sa Trabaho',
  add_experience: 'Magdagdag ng Karanasan sa Trabaho',
  character_references: 'Mga Taong Maaaring Magbigay ng Rekomendasyon',
  add_reference: 'Magdagdag ng Reference',
  emergency_contact: 'Taong Tatawagan Kapag May Emergency',
  emergency_contact_name: 'Pangalan ng Taong Tatawagan',
  emergency_contact_phone: 'Numero ng Taong Tatawagan',

  // 121-130: Government ID & Verification Steps
  upload_gov_id: 'Mag-upload ng Government ID',
  upload_id_instructions:
    'Mag-upload ng malinaw na larawan ng valid mong government ID. Siguraduhing hindi putol ang anumang bahagi nito.',
  id_readability_warning:
    'Tiyaking malinaw na nababasa ang buong pangalan, larawan, petsa ng kapanganakan, at ID number mo.',
  front_of_id: 'Harap ng ID',
  back_of_id: 'Likod ng ID',
  take_selfie_id: 'Mag-selfie Habang Hawak ang ID',
  selfie_instructions: 'Kumuha ng malinaw na selfie habang hawak ang ID sa tabi ng mukha mo.',
  id_submitted_notice: 'Naipasa na ang government ID at selfie mo para masuri ng admin.',
  awaiting_approval_notice:
    'Naghihintay pa ng pag-apruba ng admin ang account mo. Makakatanggap ka ng notification kapag beripikado na ito.',
  id_rejected_notice:
    'Hindi tinanggap ang nauna mong ipinasa na ID. Basahin ang dahilan sa ibaba at magpasa ng mas malinaw na mga larawan.',

  // 131-143: Messaging & Direct Contact
  conversation: 'Usapan',
  type_message_placeholder: 'Mag-type ng mensahe...',
  typing: 'nagta-type...',
  online: 'Online',
  offline: 'Offline',
  phone_protected_notice:
    'Nakatago at protektado ang mga numero ng telepono at iba pang personal na detalye hanggang makumpirma ang pagkuha sa trabaho.',
  safety_warning_money:
    'Para sa kaligtasan mo, huwag ibahagi ang detalye ng bank account o password mo, at huwag magpadala ng pera kung walang kumpirmadong kasunduan.',
  matched_conversation_started:
    'Nagsimula na ang inyong pag-uusap matapos kayong maitugma. Maaari na ninyong pag-usapan ang mga gawain at kailangan sa trabaho.',
  contact_unlocked:
    "Makikita na ninyo ang contact details ng isa't isa. Maaari na kayong direktang magtawagan.",
  call_worker: 'Tawagan ang Manggagawa',
  call_employer: 'Tawagan ang Employer',
  send_formal_offer: 'Magpadala ng Opisyal na Alok sa Trabaho',
  no_messages_yet: 'Wala pang mensahe. Mag-hi para simulan ang usapan!',

  // 144-156: Reviews & Ratings
  leave_a_review: 'Mag-iwan ng Review',
  overall_rating: 'Pangkalahatang Rating',
  punctuality_reliability: 'Pagiging Nasa Oras at Maaasahan',
  quality_of_work: 'Kalidad ng Trabaho',
  communication: 'Pakikipag-usap',
  rate_overall_experience: 'Kumusta ang kabuuang karanasan mo sa pakikipagtrabaho sa user na ito?',
  rate_punctuality_prompt:
    'I-rate kung gaano siya kadalas dumating sa oras at kung gaano siya maaasahan sa trabaho.',
  rate_quality_prompt: 'I-rate ang kalidad ng ginawa niyang trabaho.',
  rate_communication_prompt: 'I-rate kung gaano siya kahusay at kagalang makipag-usap.',
  share_experience_placeholder: 'Ibahagi ang naging karanasan ninyo sa pagtatrabaho...',
  write_review_guide:
    'Sumulat ng review tungkol sa naging karanasan mo. Makakatulong ito sa ibang gumagamit ng SIKAP sa Sorsogon.',
  submit_review: 'Isumite ang Review',
  review_submitted_thanks:
    'Salamat! Naipasa na ang review mo at naidagdag ito sa rating ng reputasyon ng user.',

  // 157-161: Reports & Safety
  report_user: 'I-report ang User',
  report_job_post: 'I-report ang Job Post',
  reason_for_report: 'Dahilan ng Pag-report',
  report_describe_placeholder: 'Ipaliwanag kung bakit mo inire-report ang user o job post na ito.',
  report_investigate_notice:
    'Susuriin ng aming team ang report na ito. Salamat sa pagtulong na mapanatiling ligtas ang SIKAP.',

  // 162-180: Common Actions, Errors & Prompts
  save: 'I-save',
  cancel: 'Kanselahin',
  confirm: 'Kumpirmahin',
  back: 'Bumalik',
  next: 'Susunod',
  submit: 'Isumite',
  close: 'Isara',
  delete: 'Burahin',
  edit: 'I-edit',
  continue: 'Magpatuloy',
  loading: 'Naglo-load...',
  something_went_wrong: 'May nangyaring problema. Pakisubukan ulit.',
  no_internet: 'Walang koneksyon sa internet. Tingnan kung naka-on ang Wi-Fi o mobile data mo.',
  session_expired: 'Nag-expire na ang session mo. Mag-log in ulit para magpatuloy.',
  server_connection_error:
    'Hindi makakonekta sa server ng SIKAP. Pakisubukan ulit pagkalipas ng ilang sandali.',
  fill_required_fields: 'Punan muna ang lahat ng kailangang field bago magpatuloy.',
  password_min_length: 'Dapat ay may walong character o higit pa ang password.',
  passwords_dont_match: 'Hindi magkapareho ang mga password. Ilagay ulit ang password mo.',
  otp_sent_email: 'Nagpadala kami ng 6-digit na verification code sa email mo.',

  // Aliases & UI Helpers
  review_offer: 'Tingnan ang Alok',
  rate_review_partner: 'Mag-iwan ng Review',
  status_job_offer: 'May Natanggap na Alok sa Trabaho',
  job_offer_received: 'May Natanggap na Alok sa Trabaho',
  block_user: 'I-block ang User',
  unblock_user: 'I-unblock ang User',
  no_conversations_yet: 'Wala pang usapan',
  no_messages_here:
    'Kapag nag-apply ka o nagkaroon ng tugma sa trabaho, lalabas dito ang mga pag-uusap ninyo.',
  withdraw_confirm:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  job_closed_notice:
    'May nakuha na para sa trabahong ito o hindi na ito tumatanggap ng mga aplikasyon.',
  tell_employer_why_fit:
    'Sabihin sa employer kung bakit ikaw ang angkop na tao para sa trabahong ito.',
  employer_sent_offer_notice:
    'Nagpadala ang employer ng opisyal na alok sa trabaho. Tingnan sa ibaba ang detalye ng bayad.',
};
