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
    'Kung wala pang nakalagay na kasanayan sa iyong profile, tutulungan ka munang magdagdag ng mga ito.',
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
  find_jobs: 'Trabaho',
  my_applications: 'Aplikasyon',
  my_jobs: 'Trabaho Ko',
  post_a_job: 'Mag-post ng Trabaho',
  messages: 'Mensahe',
  profile: 'Profile',
  notifications: 'Abiso',
  search_jobs_placeholder: 'Maghanap ng trabaho...',
  all: 'Lahat',
  urgent: 'Agarang Kailangan',
  filter: 'Filter',

  // 51-71: Job Feed & Details
  no_jobs_found: 'Walang trabahong tumutugma sa hinahanap mo. Subukang baguhin ang mga filter.',
  compensation: 'Bayad',
  per_day: 'kada araw',
  per_hour: 'kada oras',
  fixed_per_project: 'kada proyekto',
  slots_available: 'Bakante',
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
  already_applied: 'Nakapag-apply',
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
  status_shortlisted: 'Shortlisted',
  status_job_offer_received: 'May Alok na Trabaho',
  status_hired: 'Tinanggap',
  status_completed: 'Tapos na',
  status_declined: 'Hindi Tinanggap',
  status_withdrawn: 'Binawi',
  confirm_withdraw_prompt:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  withdraw_application: 'Bawiin ang Aplikasyon',
  withdraw_confirm_btn: 'Oo, Bawiin ang Aplikasyon',
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
  confirm_hire: 'Kumpirmahin ang Pagkuha',
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
  reputation_score: 'Reputation Score',
  completed_jobs: 'Natapos na Trabaho',
  reviews_ratings: 'Mga Review',
  member_since: 'Miyembro Mula',
  skills: 'Mga Kasanayan',
  add_skills: 'Magdagdag ng Kasanayan',
  select_your_skills: 'Piliin ang mga kaya mong gawin',
  work_experience: 'Karanasan sa Trabaho',
  add_experience: 'Magdagdag ng Karanasan',
  character_references: 'Mga Character Reference',
  add_reference: 'Magdagdag ng Reference',
  emergency_contact: 'Emergency Contact',
  emergency_contact_name: 'Pangalan ng Tatawagan',
  emergency_contact_phone: 'Numero ng Tatawagan',

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
  share_experience_placeholder: 'Ibahagi ang inyong karanasan sa trabaho...',
  write_review_guide:
    'Sumulat ng review tungkol sa naging karanasan mo. Makakatulong ito sa ibang gumagamit ng SIKAP sa Sorsogon.',
  submit_review: 'Isumite ang Review',
  review_submitted_thanks:
    'Salamat! Naipasa na ang review mo at naidagdag ito sa rating ng reputasyon ng user.',

  // 157-161: Reports & Safety
  report_user: 'I-report ang User',
  report_job_post: 'I-report ang Job Post',
  reason_for_report: 'Dahilan ng Pag-report',
  report_describe_placeholder: 'Ipaliwanag kung bakit mo inire-report...',
  report_investigate_notice:
    'Susuriin ng aming team ang report na ito. Salamat sa pagtulong na mapanatiling ligtas ang SIKAP.',

  // 162-180: Common Actions, Errors & Prompts
  save: 'I-save',
  cancel: 'Kanselahin',
  done: 'Tapos na',
  decline: 'Tanggihan',
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
  status_job_offer: 'May Alok na Trabaho',
  job_offer_received: 'May Alok na Trabaho',
  block_user: 'I-block ang User',
  unblock_user: 'I-unblock ang User',
  no_conversations_yet: 'Wala pang usapan',
  no_messages_here:
    'Kapag nag-apply ka o nagkaroon ng tugma sa trabaho, lalabas dito ang mga pag-uusap ninyo.',
  withdraw_confirm:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  job_closed_notice:
    'May nakuha na para sa trabahong ito o hindi na ito tumatanggap ng mga aplikasyon.',
  tell_employer_why_fit: 'Sabihin kung bakit ikaw ang angkop sa trabaho...',
  employer_sent_offer_notice:
    'Nagpadala ang employer ng opisyal na alok sa trabaho. Tingnan sa ibaba ang detalye ng bayad.',

  // Group 1: Worker Previewing Employer Profile
  employer_profile: 'Profile ng Nag-aalok ng Trabaho',
  about_the_employer: 'Tungkol sa Nag-aalok ng Trabaho',
  tap_view_employer_profile: 'I-tap para makita ang profile at mga dokumento ng employer →',
  verified_employer: 'Beripikadong Employer',
  unverified_employer: 'Hindi Pa Beripikadong Employer',
  employer_reputation: 'Reputasyon ng Employer',
  overall_employer_rating: 'Kabuuang Rating ng Employer',
  no_ratings_yet: 'Wala pang rating (0 review)',
  verification_and_documents: 'Beripikasyon at mga Dokumento',
  business_doc_verified: 'Beripikado ang Dokumento ng Negosyo',
  id_verified: 'Beripikado ang Government ID',
  documents_under_review: 'Sinusuri pa ang mga Dokumento',
  business_doc_not_verified: 'Hindi Beripikado ang Dokumento ng Negosyo',
  employer_doc_verified_desc:
    'Nakumpleto na ng employer na ito ang beripikasyon ng mga dokumento ng negosyo sa SIKAP.',
  employer_id_verified_desc:
    'Beripikado ang pagkakakilanlan ng employer na ito gamit ang valid government ID. Opsyonal ang mga dokumento ng negosyo para sa mga indibidwal o sambahayang employer.',
  employer_doc_under_review_desc:
    'Naipasa na ang mga dokumento ng negosyo at kasalukuyang sinusuri ng mga admin ng SIKAP.',
  employer_doc_not_verified_desc:
    'Hindi pa nakukumpleto ng employer na ito ang beripikasyon ng mga dokumento ng negosyo sa SIKAP.',
  attached_business_docs: 'Mga Kalakip na Dokumento ng Negosyo:',
  pdf_view: 'PDF',
  reviews_feedback: 'Mga Review at Komento',
  loading_reviews: 'Kinukuha ang mga review...',
  no_reviews_yet: 'Wala pang review',
  no_reviews_employer_desc:
    'Lalabas dito ang mga review ng mga manggagawang nakatapos na ng trabaho para kay {employerName} kapag naisumite na ang mga ito.',
  verified_worker: 'Beripikadong Manggagawa',
  unverified_worker: 'Hindi Beripikadong Manggagawa',
  worker_profile: 'Profile ng Manggagawa',
  worker_reputation: 'Reputasyon ng Manggagawa',
  overall_worker_rating: 'Pangkalahatang Rating ng Manggagawa',
  view_application_btn: 'Tingnan ang Aplikasyon',
  message_worker_btn: 'I-message ang Manggagawa',
  completed_job: 'Natapos na Trabaho',

  // Group 2: Reporting Module & Sheets
  submit_a_report: 'Magsumite ng Ulat',
  whats_the_issue: 'Ano ang problema?',
  report_anonymous_notice:
    'Hindi makikita kung sino ang nag-report. Sinusuri namin ang lahat ng ulat para mapanatiling ligtas ang komunidad.',
  reason_inappropriate_behavior: 'Hindi Angkop na Pag-uugali',
  reason_scam_fraud: 'Panloloko o Pekeng Trabaho',
  reason_fake_scam_job: 'Panloloko o Pekeng Trabaho',
  reason_harassment: 'Pangha-harass',
  reason_spam: 'Spam',
  reason_inappropriate_content: 'Hindi Angkop na Nilalaman',
  reason_other_report: 'Iba pa',
  provide_more_details: 'Magbigay pa ng detalye',
  describe_what_happened: 'Ikuwento kung ano ang nangyari...',
  describe_why_reporting_job: 'Sabihin kung bakit mo inire-report ito...',
  attach_evidence: 'Maglakip ng Ebidensya',
  screenshots_help_review:
    'Makakatulong ang mga screenshot para mas mabilis naming masuri at maaksyunan ang report.',
  add_photo: 'Magdagdag ng Larawan',
  submit_report: 'Isumite ang Report',
  upload_limit_screenshots: 'Maaari kang mag-upload ng hanggang 5 screenshot sa bawat report.',
  photo_library_permission_required:
    'Payagan ang app na i-access ang mga larawan sa iyong phone para makapagdagdag ka ng mga screenshot.',
  please_select_report_reason: 'Pumili muna ng dahilan ng pag-report.',
  report_submitted_title: 'Naipasa na ang Report',
  report_submitted_desc:
    'Salamat sa pagtulong na mapanatiling ligtas ang ating komunidad. Susuriin namin ang iyong report sa lalong madaling panahon.',
  already_reported_item:
    'Nakapag-report ka na tungkol dito. Kasalukuyan na itong sinusuri ng aming team.',

  // Group 3: Jobs, Details, Applications
  duration: 'Tagal',
  flexible: 'Maaaring Pag-usapan',
  tools_required: 'Mga Kagamitang Kailangan',
  attachments_media: 'Mga Kalakip at Media',
  play_video: 'I-play ang Video',
  all_filled: 'Wala nang Bakante',
  slots_left: 'bakante pa',
  needs_action: 'May Aksyon',
  active_hired: 'Aktibo',
  in_review: 'Sinusuri',
  history: 'Kasaysayan',
  all_caught_up: 'Wala ka nang kailangang asikasuhin!',
  no_pending_offers_reviews:
    'Wala kang nakabinbing alok sa trabaho o review na kailangan mong sagutin.',
  no_active_jobs_title: 'Wala ka pang kasalukuyang trabaho',
  no_active_jobs_desc:
    'Kapag kinumpirma ng employer na ikaw ang kukunin, lalabas dito ang trabaho mo.',
  no_applications_under_review_title: 'Wala kang application na sinusuri',
  no_applications_under_review_desc:
    'Wala kang application na kasalukuyang sinusuri. Maghanap ng trabaho at mag-apply.',
  no_applications_yet_title: 'Wala ka pang ina-applyang trabaho',
  no_applications_yet_desc: 'Tingnan ang mga trabahong available at mag-apply sa ilang tap lang.',
  browse_available_jobs: 'Tingnan ang mga Trabaho',
  jobs_nearby: 'trabaho sa malapit.',
  location_anywhere: 'Kahit Saan',
  location_same_barangay: 'Sa Barangay Ko',
  location_same_municipality: 'Sa Bayan Ko',
  reset_filters: 'I-reset ang mga Filter',
  your_own_job_posting: 'Ikaw ang nag-post ng trabahong ito.',
  cannot_apply_own_job: 'Hindi ka puwedeng mag-apply sa trabahong ikaw mismo ang nag-post.',
  already_applied_job: 'Nag-apply ka na sa trabahong ito.',
  click_to_manage_app: 'I-tap dito para pamahalaan ang application mo →',

  // Group 4: Need Help & Support / Support Tickets
  need_help_or_support: 'Kailangan mo ba ng Tulong?',
  help_and_support: 'Tulong at Suporta',
  my_tickets: 'Mga Request Ko',
  new_ticket: 'Bagong Request',
  ticket_number: 'Request #{id}',
  status_in_review: 'Sinusuri',
  status_resolved: 'Nalutas',
  status_open: 'Bukas',
  sikap_admin_team: 'Admin Team ng SIKAP',
  response_available: 'May Sagot na',
  in_review_by_admin: 'Sinusuri ito ng admin ng SIKAP. Dito lalabas ang sagot.',
  tap_to_expand: 'I-tap para makita ang buong detalye',
  tap_to_collapse: 'I-tap para itago ang detalye',
  no_support_tickets_yet: 'Wala Ka Pang Support Request',
  support_tickets_empty_desc:
    'May tanong ka ba tungkol sa job post, beripikasyon, o account mo? Magpadala ng support request at sasagot ang admin team dito mismo sa app.',
  submit_support_ticket: 'Magpadala ng Support Request',
  support_in_app_notice:
    'Dito mismo sa SIKAP inaasikaso ang mga support request. Makikita ang sagot ng admin sa tab na “Mga Request Ko.”',
  subject: 'Paksa',
  subject_placeholder: 'Hal. Tanong tungkol sa trabaho, ID, account...',
  issue_description: 'Paglalarawan ng Problema',
  issue_description_placeholder: 'Ilarawan kung ano ang kailangan mo ng tulong...',
  submit_ticket_btn: 'Ipadala ang Request',
  ticket_submitted_title: 'Naipadala na ang Request',
  ticket_submitted_desc:
    'Natanggap na namin ang iyong support request. Susuriin ito ng admin team at sasagot dito mismo sa app.',
  contact_support_title: 'Tulong at Suporta',
  contact_support_desc:
    'May problema ka ba? Magpadala ng mensahe at susuriin ng admin support team ang request mo dito mismo sa app.',

  // Group 5: Messages & Chat Features
  search_messages_placeholder: 'Maghanap ng mensahe...',
  concluded: 'Tapos na',
  no_conversations_matching: 'Walang usapang tumutugma sa “{searchQuery}”',
  action_required: 'Kailangan ng Aksyon',
  deleted_account_notice:
    'Nabura na ang account ng taong ito. Makikita mo pa rin ang mga dati ninyong mensahe.',
  chat_locked_concluded: 'Naka-lock ang chat nang matapos ang trabaho.',
  reopen_pending_employer:
    'Naghihintay ng pag-apruba ng employer ang request na buksan muli ang chat.',
  request_to_reopen: 'Humiling na Buksan Muli',
  unlock_chat: 'Buksan ang Chat',
  user_blocked_by_me: 'Naka-block ang user na ito sa iyo.',
  cannot_message_user: 'Hindi mo maaaring padalhan ng mensahe ang user na ito.',
  employer_will_send_first_msg:
    'Ang employer ang unang magpapadala ng mensahe o alok sa trabaho para masimulan ang usapan.',
  messaging_disabled_deleted_account:
    'Hindi na puwedeng magpadala ng mensahe dahil wala na ang account na ito.',
  slots_full_messaging_disabled:
    'Wala nang bakante para sa trabahong ito, kaya hindi na puwedeng magpadala ng mensahe tungkol dito.',
  slots_full_no_negotiation:
    'Wala nang bakante, kaya hindi na puwedeng makipag-usap para sa ibang kasunduan.',
  chat_is_open_notice:
    'Bukas ang chat · Maaari ninyong pag-usapan ng employer ang mga detalye ng trabaho.',
  send_message_before_hire_notice:
    'Magpadala muna ng mensahe sa manggagawa bago magpasya kung kukunin siya.',
  hire_decision: 'Desisyon sa Pagkuha',
  hire_decision_prompt:
    'Gusto mo bang kunin ang aplikanteng ito o tanggihan ang kanyang application?',
  hire_worker: 'I-hire',
  decline_applicant: 'Tanggihan',
  set_final_price_confirm_hire: 'I-set ang Bayad at I-hire',
  set_final_agreed_price: 'Itakda ang Napagkasunduang Bayad',
  enter_agreed_price_placeholder: 'Ilagay ang bayad (₱)...',
  shortlisted_application: 'Napiling Application',
  stage_2: 'Yugto 2',
  next_steps: 'Mga Susunod na Hakbang',
  hire_offer_sent: 'Naipadala na ang Alok sa Trabaho',
  waiting_worker_response:
    'Hinihintay ang sagot ni {workerName} kung tatanggapin o tatanggihan niya ang alok.',
  job_offer_declined: 'Tinanggihan ang Alok sa Trabaho',
  job_offer_accepted: 'Tinanggap ang Alok sa Trabaho',
  position_filled: 'May Napili Nang Manggagawa',
  hiring_cancelled: 'Kinansela ang Pagkuha',
  cancel_hire_before_accept:
    'Maaari mong kanselahin ang pagkuha bago tanggapin ng manggagawa ang alok.',
  employer_contact: 'Contact ng Employer',
  worker_contact: 'Contact ng Manggagawa',
  job_marked_complete: 'Minarkahang Tapos na ang Trabaho',
  work_completed_verified: 'Natapos na at nakumpirma ang pagkakagawa ng trabaho.',
  rate_employer: 'I-rate ang Employer',
  rate_worker: 'I-rate ang Manggagawa',
  mark_complete_subtitle: 'I-tap kapag ganap nang tapos ang trabaho.',
  quick_replies: 'Mabilisang Sagot',
  qr_worker_available_label: 'Available bukas',
  qr_worker_available_text: 'Available ako bukas.',
  qr_worker_location_label: 'Eksaktong lugar?',
  qr_worker_location_text: 'Ano ang eksaktong address o malapit na palatandaan ng lugar?',
  qr_worker_tools_label: 'May sariling gamit 🔨',
  qr_worker_tools_text: 'May sarili akong mga kagamitan para sa trabaho.',
  qr_worker_call_label: 'Puwede tumawag?',
  qr_worker_call_text: 'Puwede ba kitang tawagan para mapag-usapan ang mga detalye?',
  qr_worker_agreed_label: 'Sang-ayon! 👍',
  qr_worker_agreed_text: 'Sumasang-ayon ako sa napag-usapang bayad at iskedyul. Salamat!',
  qr_employer_start_label: 'Kailan makakapagsimula?',
  qr_employer_start_text: 'Kailan ka pinakamaagang makakapagsimula?',
  qr_employer_nearby_label: 'Malapit ka lang ba?',
  qr_employer_nearby_text: 'Malapit ka lang ba o nasa katabing barangay?',
  qr_employer_tools_label: 'May kagamitan ka ba?',
  qr_employer_tools_text: 'May sarili ka bang mga kagamitan para sa trabahong ito?',
  qr_employer_offer_label: 'Tingnan ang alok',
  qr_employer_offer_text: 'Pakitingnan ang opisyal na alok sa trabaho sa card sa itaas.',
  qr_employer_thanks_label: 'Salamat!',
  qr_employer_thanks_text: 'Salamat sa mabilis mong pagsagot!',

  // Dashboard Stats
  active_jobs: 'Aktibong Trabaho',
  total_hires: 'Kabuuang Hire',
  total_paid: 'Kabuuang Bayad',

  // Group 6: My Jobs Empty States
  no_active_jobs: 'Walang aktibong trabaho',
  no_active_posted_jobs_desc:
    'Wala ka pang naka-post na trabaho. Mag-post na para makahanap ng mga manggagawa sa malapit!',
  no_archived_jobs: 'Walang naka-archive na trabaho',
  no_archived_jobs_desc: 'Wala kang naka-archive na trabaho sa ngayon.',
  no_past_jobs: 'Walang nakaraang trabaho',
  no_past_jobs_desc: 'Wala ka pang mga nakaraang job post.',

  // Group 7: Post & Edit Job Screen
  new_post_badge: 'Bagong Post',
  edit_post_badge: 'I-edit ang Post',
  post_a_new_job_title: 'Mag-post ng bagong trabaho.',
  edit_your_job_post_title: 'I-update ang iyong job post.',
  post_a_prefix: 'Mag-post ng',
  new_job_accent: 'bagong trabaho.',
  edit_your_prefix: 'I-update ang',
  job_post_accent: 'iyong job post.',
  job_title_label: 'Pamagat ng Trabaho *',
  job_title_placeholder: 'Hal. Kailangan ng karpintero...',
  exact_location_label: 'Eksaktong Lokasyon',
  exact_location_placeholder: 'Hal. 123 Main St., malapit sa Munisipyo...',
  job_description_label: 'Paglalarawan ng Trabaho *',
  job_description_placeholder: 'Ilarawan ang mga gagawin at kailangan...',
  tools_required_label: 'Mga Kailangang Gamit (Opsyonal)',
  tools_required_placeholder: 'Hal. Martilyo, pako, lagari...',

  // Categories & Suggestion Chips
  categories_label: 'Mga Kategorya *',
  categories_placeholder: 'Mag-type o pumili ng kategorya...',
  add_category_suggestion: 'Magdagdag ng "{category}"',
  cat_construction: 'Konstruksyon',
  cat_domestic: 'Gawaing Pantahanan',
  cat_agriculture: 'Agrikultura',
  cat_skilled_trade: 'Skilled Trade',
  cat_transport: 'Transportasyon',
  cat_craft: 'Gawang-Kamay',

  // Compensation & Rate Basis
  pay_amount_label: 'Halaga ng Bayad (PHP) *',
  rate_basis_label: 'Batayan ng Bayad *',
  rate_per_day: 'Kada Araw',
  rate_per_hour: 'Kada Oras',
  rate_per_project: 'Buong Proyekto',
  rate_per_piece: 'Kada Piraso',
  sublabel_daily: 'Kada Araw',
  sublabel_hourly: 'Kada Oras',
  sublabel_project: 'Proyekto',
  sublabel_piece_rate: 'Kada Piraso',

  // DOLE Region V Wage Advisory & Calculation
  standard_daily_rate_note: 'Karaniwang sahod kada araw',
  wage_eq_hourly_basis: '≈ ₱{amount} kada oras (batay sa 8 oras na trabaho)',
  wage_eq_daily_workday: '≈ ₱{amount} para sa 8 oras na trabaho',
  wage_eq_project_duration: '≈ ₱{amount} kada oras sa loob ng {duration} {unit}',
  wage_eq_fixed_payout: 'Kabuuang bayad para sa buong proyekto.',
  wage_eq_piece_payout: '₱{amount} kada piraso o yunit na magagawa.',
  wage_warn_unusually_low_hourly: '⚠️ Masyadong mababa ang bayad kada oras para sa Bicol/Sorsogon.',
  wage_warn_dole_below_minimum:
    '⚠️ Ang ₱{amount} ay mas mababa sa minimum wage ng DOLE Region V sa Sorsogon (mga ₱455/araw). Kung ang ibig mong sabihin ay ₱{amount} kada oras, piliin ang "Kada Oras" sa itaas.',
  wage_warn_project_unusually_low:
    '⚠️ Masyadong mababa ang katumbas na bayad kada oras para sa tagal ng proyektong ito.',

  // Slots, Schedule, Duration & Media
  slots_workers_needed_label: 'Bilang ng Manggagawang Kailangan *',
  schedule_date_label: 'Petsa ng Trabaho *',
  duration_label: 'Tagal ng Trabaho',
  duration_unit_label: 'Yunit ng Tagal',
  unit_none: 'Wala',
  unit_hours: 'Oras',
  unit_days: 'Araw',
  unit_weeks: 'Linggo',
  unit_months: 'Buwan',
  photos_video_optional: 'Mga Larawan at Video (Opsyonal)',
  add_photos_btn: 'Magdagdag ng mga Larawan',
  add_video_btn: 'Magdagdag ng Video',
  change_video_btn: 'Palitan ang Video',
  uploading_photos_progress: 'Ina-upload ang mga larawan: {progress}%',
  uploading_video_progress: 'Ina-upload ang video: {progress}%',
  compressing_video: 'Inihahanda ang video...',
  video_upload_failed: 'Hindi na-upload ang video. Alisin ito at subukang i-upload muli.',
  processing_label: 'Pinoproseso',
  retry_label: 'Subukang Muli',
  mark_as_urgent: 'Markahang Apurahan',
  urgent_desc: 'Lalabas ang post mo sa unahan ng listahan ng mga trabaho.',

  // Form Submission, Validation & Modals
  publish_job_btn: 'I-post ang Trabaho',
  save_changes_btn: 'I-save ang mga Pagbabago',
  publishing_job_modal: 'Ipinapaskil ang trabaho...',
  updating_job_modal: 'Sine-save ang mga pagbabago...',
  saving_changes_modal: 'Sine-save ang mga pagbabago...',
  please_wait_moment: 'Sandali lang.',
  wait_media_upload_desc:
    'Hintaying matapos ang pag-upload ng lahat ng napiling larawan at video bago i-post ang trabaho.',
  alert_profanity_detected: 'May Hindi Angkop na Salita',
  alert_profanity_desc: 'Hindi maaaring gumamit ng hindi angkop na salita sa mga kategorya.',
  alert_duplicate_tag: 'Nadoble ang Kategorya',
  alert_duplicate_tag_desc: 'Naidagdag na ang kategoryang ito.',
  alert_limit_reached: 'Naabot na ang Limitasyon',
  alert_limit_photos_desc: 'Hanggang 5 larawan lang ang puwedeng i-upload.',
  alert_missing_fields: 'May Kulang na Impormasyon',
  alert_missing_fields_desc: 'Punan ang lahat ng kinakailangang field: {fields}',
  err_pay_min_1: 'Dapat hindi bababa sa ₱1 ang bayad.',
  err_slots_min_1: 'Dapat may kahit isang manggagawa.',
  alert_upload_in_progress: 'May Ina-upload Pa',
  alert_upload_in_progress_desc:
    'Hintaying matapos ang pag-upload ng lahat ng larawan at video bago i-post ang trabaho.',
  alert_upload_error: 'Nagkaproblema sa Pag-upload',
  alert_upload_error_desc:
    'Alisin o subukang i-upload muli ang mga file na hindi na-upload bago magpatuloy.',
  alert_job_updated: 'Na-update na ang Trabaho!',
  alert_changes_saved: 'Na-save na ang mga pagbabago mo.',

  // Success Screen
  success_first_job_title: 'Live na ang una mong job post!',
  success_job_live_title: 'Live na ang job post mo!',
  success_first_job_msg:
    'Congratulations! Ito ang una mong job post sa SIKAP. Aabisuhan ang mga manggagawa at puwede na silang mag-apply.',
  success_job_live_msg:
    'Makikita na ng mga manggagawa ang post mo at puwede na silang mag-apply. Aabisuhan ka namin kapag may nag-apply.',
  view_my_jobs_btn: 'Tingnan ang Mga Trabaho Ko',
  post_another_job_btn: 'Mag-post Pa ng Trabaho',

  // Group 8: Notifications Screen & Cards
  notif_section_today: 'Ngayon',
  notif_section_yesterday: 'Kahapon',
  notif_section_older: 'Mga Nakaraan',
  mark_all_read: 'Markahang nabasa lahat',
  marking_read: 'Minamarkahang nabasa...',
  no_notifs_today: 'Wala kang bagong abiso ngayon.',
  no_notifs_yet: 'Wala ka pang notifications.',
  new_notif_default: 'May bago kang notification.',
  notif_new_application_title: 'May Nag-apply sa Job Post Mo',
  notif_new_application_msg: 'Nag-apply si {workerName} sa trabahong {jobTitle}.',
  notif_shortlisted_title: 'Napili ang Application Mo',
  notif_shortlisted_msg:
    'Napili ng employer na si {employerName} ang application mo para sa trabahong [{jobTitle}]. Buksan ang app para mapag-usapan ninyo ang detalye at bayad sa trabaho.',
  notif_hire_confirmed_title: 'Kumpirmado na ang Pagkuha sa Iyo',
  notif_hire_confirmed_msg:
    'Kumpirmado na ang pagkuha sa iyo para sa trabahong {jobTitle}. Pakitingnan ang alok at piliin kung tatanggapin mo ito.',
  notif_offer_accepted_title: 'Tinanggap ang Alok Mo',
  notif_offer_accepted_msg: 'Tinanggap ni {workerName} ang alok para sa trabahong {jobTitle}.',
  notif_rate_declined_title: 'Hindi Tinanggap ang Inalok na Bayad',
  notif_rate_declined_msg:
    'Hindi tinanggap ni {workerName} ang inialok na bayad{priceText} para sa trabahong [{jobTitle}]. Puwede pa kayong mag-usap tungkol sa bayad at magpadala ng panibagong alok.',
  notif_hire_cancelled_title: 'Nakansela ang Pagkuha sa Iyo',
  notif_hire_cancelled_msg:
    'Kinansela ng employer ang pagkuha sa iyo para sa trabahong [{jobTitle}].',
  notif_app_update_title: 'Update sa Application Mo',
  notif_app_declined_msg:
    'Salamat sa pag-apply sa trabahong {jobTitle}. Okay lang kung hindi ka napili sa pagkakataong ito. May mga bagong trabaho sa Sorsogon araw-araw, kaya bisitahin ulit ang SIKAP para makita ang iba pang puwede mong applyan.',
  notif_rate_employer_title: 'I-rate ang Employer Mo',
  notif_rate_employer_msg:
    'Tapos na ang trabahong "{jobTitle}"! Bigyan ng rating si {employerName} para makatulong sa ibang users ng SIKAP.',
  notif_rate_worker_title: 'I-rate ang Worker Mo',
  notif_rate_worker_msg:
    'Tapos na ang trabahong "{jobTitle}". Mag-iwan ng review para kay {workerName}.',
  notif_worker_finished_title: 'Minarkahang Tapos na ang Trabaho',
  notif_worker_finished_msg:
    'Minarkahan ni {workerName} na tapos na ang trabahong "{jobTitle}". Pakikumpirma kung tapos na talaga ang trabaho at bigyan ng rating ang worker.',
  notif_hire_reminder_title: 'Kailangan Mong Sagutin ang Alok sa Trabaho',
  notif_hire_reminder_msg:
    'Kumpirmado na ni {employerName} ang pagkuha sa iyo para sa trabahong "{jobTitle}". Pakikumpirma kung tatanggapin mo ang alok o hindi.',
  notif_rate_employer_reminder_title: 'Paalala: I-rate ang Employer Mo',
  notif_rate_employer_reminder_msg:
    'Huwag kalimutang i-rate si {employerName} para sa trabahong "{jobTitle}". Makakatulong ang feedback mo sa ibang users ng SIKAP.',
  notif_rate_employer_urgent_title: '24 Oras na Lang para I-rate ang Employer Mo',
  notif_rate_employer_urgent_msg:
    '24 oras na lang bago matapos ang 7 araw na palugit para i-rate ang employer mo sa trabahong "{jobTitle}". I-rate na si {employerName} habang may oras pa.',
  notif_rate_worker_reminder_title: 'Paalala: I-rate ang Worker Mo',
  notif_rate_worker_reminder_msg:
    'Huwag kalimutang mag-iwan ng review para kay {workerName} sa trabahong "{jobTitle}".',
  notif_rate_worker_urgent_title: '24 Oras na Lang para I-rate ang Worker',
  notif_rate_worker_urgent_msg:
    '24 oras na lang bago matapos ang 7 araw na palugit para i-rate ang worker sa trabahong "{jobTitle}". Mag-iwan na ng review para kay {workerName} habang may oras pa.',
  notif_verification_approved_title: 'Aprubado na ang Account Mo',
  notif_verification_approved_msg:
    'Aprubado na ang ipinasa mong {docType} at ang account mo! Puwede mo nang gamitin ang SIKAP.',
  notif_verification_rejected_title: 'Hindi Naaprubahan ang ID Mo',
  notif_verification_rejected_msg:
    'Hindi naaprubahan ang ipinasa mong {docType}. Dahilan: {reason}',
  notif_verification_correction_title: 'May Kailangang Ayusin sa ID Mo',
  notif_verification_correction_msg:
    'May kailangang ayusin sa ipinasa mong {docType}. Pakitingnan ang detalye at i-upload ulit ang dokumento sa app.',
  notif_mod_report_job_title: 'Update sa Report Mo',
  notif_mod_report_job_msg:
    "{actionLabel} na ng admin ang report tungkol sa job post mong '{jobTitle}'.",
  notif_mod_report_account_title: 'Update sa Report Tungkol sa Account Mo',
  notif_mod_report_account_msg: '{actionLabel} na ng admin ang pagsusuri tungkol sa account mo.',
  notif_new_message_title: 'Bagong Message mula kay {senderName}',
  notif_new_message_msg: '{preview}',
  notif_new_message_image_preview: 'Nagpadala ng picture',
  notif_identity_verified_title: 'Aprubado na ang Account Mo',
  notif_identity_verified_msg:
    'Aprubado na ang mga dokumento mo sa SIKAP! Puwede ka nang mag-apply, mag-post ng trabaho, at makipag-ugnayan sa mga manggagawa.',
  notif_identity_attention_title: 'May Kailangang Ayusin sa ID Mo',
  notif_identity_attention_msg:
    'Hindi naaprubahan ang ipinasa mong dokumento sa SIKAP. Dahilan: {reason}',
  notif_account_suspended_title: 'Nasuspinde ang Account Mo',
  notif_account_suspended_msg:
    'Nasuspinde ang account mo dahil sa paglabag sa mga alituntunin ng komunidad ng SIKAP.',
  notif_report_action_title: 'Update sa Report Mo',
  notif_report_action_msg: 'Nasuri na ang report mo at nagawa na ang kinakailangang aksyon.',

  // Group 9: Onboarding Tutorial
  tutorial_next: 'Susunod',
  tutorial_prev: 'Nakaraan',
  tutorial_skip: 'Laktawan',
  tutorial_done: 'Simulan Na!',
  tutorial_step_of: 'Hakbang {current} ng {total}',
  replay_tutorial: 'Ulitin ang Gabay sa App',
  replay_tutorial_subtitle: 'Balikan kung paano gamitin ang SIKAP',

  // Worker Tutorial Steps
  tutorial_worker_step1_title: 'Maghanap ng Trabaho',
  tutorial_worker_step1_desc:
    'Maghanap ayon sa kasanayan o i-filter ang mga trabaho sa sarili mong barangay at bayan.',
  tutorial_worker_step2_title: 'Itugma sa Iyong Kasanayan',
  tutorial_worker_step2_desc:
    'Pindutin ang mga skill tag para sa akmang trabaho, o i-bookmark ang trabahong nagustuhan mo.',
  tutorial_worker_step3_title: 'Subaybayan ang Aplikasyon',
  tutorial_worker_step3_desc:
    'Tingnan dito ang status ng iyong mga inaplayan mula sa pagsusuri hanggang matanggap.',
  tutorial_worker_step4_title: 'Chat at Alok sa Trabaho',
  tutorial_worker_step4_desc:
    'Kapag napili ng employer, dito kayo mag-uusap sa bayad at tatanggap ng opisyal na alok.',
  tutorial_worker_step5_title: 'Mga Agarang Abiso',
  tutorial_worker_step5_desc:
    'Makatanggap agad ng abiso kapag may job request, alok sa trabaho, o bagong review.',
  tutorial_worker_step6_title: 'Profile at Mga Setting',
  tutorial_worker_step6_desc:
    'I-update ang iyong skills at karanasan, tingnan ang rating mo, o lumipat sa Employer Mode.',

  // Employer Tutorial Steps
  tutorial_employer_step1_title: 'Buod ng Pag-hire',
  tutorial_employer_step1_desc:
    'Tingnan agad ang iyong aktibong trabaho, kabuuang na-hire, nabayaran, at rating.',
  tutorial_employer_step2_title: 'Mag-post ng Trabaho',
  tutorial_employer_step2_desc:
    'Pindutin ito para gumawa ng job post na may malinaw na bayad at bilang ng kailangang worker.',
  tutorial_employer_step3_title: 'Mga Kailangang Aksyunan',
  tutorial_employer_step3_desc:
    'Suriin agad ang mga bagong aplikante, kumpirmahin ang natapos na gawain, at mag-rate ng worker.',
  tutorial_employer_step4_title: 'Pamahalaan ang Mga Trabaho',
  tutorial_employer_step4_desc:
    'Tingnan ang iyong Active, Past, at Archived job posts at suriin ang mga nag-apply.',
  tutorial_employer_step5_title: 'Makipag-usap sa Chat',
  tutorial_employer_step5_desc:
    'Magpadala ng Job Request, magkasundo sa bayad, at mag-hire gamit ang Action Cards sa chat.',
  tutorial_employer_step6_title: 'Profile at Mga Setting',
  tutorial_employer_step6_desc:
    'I-update ang iyong profile, tingnan ang mga review, o ulitin ang gabay na ito sa Settings.',

  // 5-Stage Hiring Lifecycle & Progressive Disclosure
  // Stage 1
  hiring_stage1_sent_title: 'Naipadala na ang iyong application.',
  hiring_stage1_sent_desc:
    'Nag-apply ka sa {jobTitle}. Tinitingnan na ni {employerName} ang iyong profile.',
  hiring_privacy_shield_on: 'Naka-on ang Privacy Shield.',
  hiring_privacy_shield_public_only: 'Pampublikong impormasyon lang ang makikita.',
  hiring_shortlist_action: 'Piliin',
  hiring_shortlist_footer_hint:
    'Kapag napili mo ang aplikante, makikita mo na ang kanyang contact details. Maaari na rin kayong mag-usap tungkol sa trabaho at mapagkasunduan ang bayad.',
  hiring_shortlist_prompt: 'Gusto mo bang piliin si {applicantName} para sa trabahong {jobTitle}?',
  hiring_shortlist_info:
    'Kapag pinili mo ang aplikanteng ito, maaari na kayong mag-usap tungkol sa trabaho. Makikita mo na rin ang kanyang contact details at mga taong maaaring magbigay ng rekomendasyon tungkol sa kanya. Makakatulong ito para mas makilala mo ang aplikante bago kayo magkasundo sa trabaho.',
  hiring_shortlist_success_msg:
    'Napili mo na si {applicantName}! Makikita mo na ngayon ang kanyang contact details at mga taong maaaring magbigay ng rekomendasyon tungkol sa kanya.',

  // Stage 2
  hiring_stage2_wants_to_talk: 'Gustong makipag-usap sa iyo ni {employerName}.',
  hiring_stage2_shortlisted_desc:
    'Napili ka para sa trabahong {jobTitle}. Maaaring kontakin ka ng employer para pag-usapan ang trabaho at bayad.',
  hiring_contact_disclosed_title:
    'Naibahagi na sa employer ang iyong contact details at mga character reference.',
  hiring_mobile_number_chip: 'Numero ng cellphone',
  hiring_character_references_chip: 'Mga character reference',
  hiring_chat_advice_footnote:
    'Maaari kayong mag-chat para pag-usapan ang oras ng trabaho, mga kailangan, at ang bayad.',
  hiring_chat_required_title: 'Mag-chat Muna',
  hiring_chat_required_body:
    'Mag-message muna sa manggagawa para mapag-usapan ninyo ang mga detalye at mapagkasunduan ang bayad bago magpadala ng alok.',
  hiring_chat_first_btn: 'Mag-chat para Pag-usapan ang Bayad',
  hiring_send_offer_btn: 'Ipadala ang Alok',

  // Stage 3
  hiring_confirm_hire_title: 'Kumpirmahin ang Pagkuha at Ipadala ang Alok',
  hiring_final_agreed_price_label: 'Napagkasunduang Bayad (₱)',
  hiring_offer_sent_title: 'Naipadala na ang alok.',
  hiring_offer_sent_message:
    'Naabisuhan na si {applicantName}. Aabisuhan ka namin kapag sumagot na siya.',
  hiring_waiting_for_worker: 'Naghihintay ng sagot ng manggagawa...',
  hiring_final_agreed_price_eyebrow: 'Napagkasunduang Bayad',
  hiring_slot_locked_guarantee:
    'Kumpirmado na ang trabaho! Hindi na magbabago ang napagkasunduang bayad.',
  hiring_offer_active_status: 'Naghihintay ng sagot • Aktibo ang alok',
  hiring_accept_offer_btn: 'Tanggapin ang Alok',
  hiring_decline_offer_btn: 'Tanggihan ang Alok',

  // Stage 4
  hiring_stage4_milestone_title: '🎉 Tanggap ka na sa trabaho!',
  hiring_stage4_milestone_msg:
    'Congratulations! Tinanggap mo na ang alok para sa trabahong "{jobTitle}". Mag-chat kay {employerName} para mapag-usapan ang mga susunod na detalye.',
  hiring_active_contract_eyebrow: 'Aktibo ang Kontrata • Kumpirmado na ang bayad.',
  hiring_stage4_guidance:
    'Tanggap ka na! Pumunta sa lugar ng trabaho sa napag-usapan ninyong petsa.',
  hiring_job_in_progress_btn: 'Ginagawa na ang trabaho',

  // Stage 5 & Receipt
  hiring_mark_complete_prompt: 'Tapos na ba ang trabahong {jobTitle}?',
  hiring_mark_complete_explainer:
    'Kapag kinumpirma mong tapos na ang trabaho, matatapos na rin ang kasunduan para sa lahat ng manggagawang kinuha mo. Maaari ka nang magbigay ng rating at review sa mga manggagawa.',
  hiring_mark_complete_confirm_btn: 'Oo, Tapos Na ang Trabaho',
  hiring_not_yet_btn: 'Hindi Pa',
  hiring_receipt_official_header: 'OPISYAL NA RESIBO NG TRABAHO – SIKAP',
  hiring_receipt_ref_no: 'Reference No.',
  hiring_receipt_date_completed: 'Petsa ng Pagkumpleto',
  hiring_receipt_final_compensation: 'Napagkasunduang Bayad',
  hiring_receipt_worker_label: 'Manggagawa',
  hiring_receipt_employer_label: 'Employer',
  hiring_receipt_saved_msg: 'Nasa gallery na ng cellphone mo ang kopya ng opisyal na resibo.',
  hiring_mutual_review_prompt:
    'Kumusta ang naging karanasan mo? Mag-iwan ng review para makatulong sa iba pang miyembro ng SIKAP.',

  // Cancel Hire
  hiring_cancel_hire_title: 'Kanselahin ang Pagkuha',
  hiring_cancel_hire_warning:
    'Babala: Hindi na mababawi ang pagkanselang ito. Aabisuhan ang aplikante na hindi na siya kukunin, at matatanggihan na rin ang kanyang application.',
  hiring_cancel_hire_confirm_btn: 'Oo, Kanselahin',
  hiring_cancel_hire_back_btn: 'Bumalik',

  // Common UI & Navigation
  chat: 'Makipag-chat',
  open_chat: 'Buksan ang Chat',
  application_tracking: 'Status ng Aplikasyon',

  // Profile Onboarding (RoleOnboardingScreen)
  onboarding_header_pill: 'Malapit na!',
  onboarding_worker_title: 'Mga Kaya Mong Gawin',
  onboarding_worker_subtitle:
    'Anong mga trabaho ang kaya mong gawin? Piliin ang mga skills na alam mo at may karanasan ka.',
  onboarding_employer_title: 'Pag-verify ng Account',
  onboarding_employer_subtitle:
    'Mag-upload ng dokumento ng negosyo para ma-verify namin ang iyong employer account.',
  onboarding_custom_skill_header: 'Magdagdag ng Ibang Skill',
  onboarding_custom_skill_placeholder: 'Hal. Pag-uukit ng kahoy, Hilot...',
  onboarding_add_skill_btn: '+ Magdagdag',
  onboarding_skill_required_title: 'Pumili Muna',
  onboarding_skill_required_msg: 'Pumili muna ng kahit isang skill bago magpatuloy.',
  onboarding_upload_doc_title: 'Mag-upload ng Dokumento ng Negosyo (Optional)',
  onboarding_upload_doc_subtitle: 'DTI / SEC / TIN documents (Hanggang 3 files, PDF o larawan)',
  onboarding_docs_selected: '✓ {count} file ang napili',
  onboarding_tap_to_change_docs: 'I-tap para magpalit o magdagdag ng files.',
  onboarding_too_many_files_title: 'Sobra ang Files',
  onboarding_too_many_files_msg: 'Hanggang 3 documents lang ang puwede mong i-upload.',
  onboarding_file_too_large_title: 'Masyadong Malaki ang File',
  onboarding_file_too_large_msg: 'May file na lampas sa 5MB limit.',
  onboarding_complete_setup_btn: 'Tapos na',
  onboarding_skip_for_now_btn: 'Skip Muna',
  onboarding_saving_skills_loading: 'Sine-save ang mga skills mo...',
  onboarding_uploading_docs_loading: 'Ina-upload ang mga documents mo...',
  onboarding_completing_loading: 'Inaayos na ang account mo...',
  onboarding_cancel_setup_title: 'Itigil ang Setup?',
  onboarding_cancel_setup_msg:
    'Sigurado ka bang gusto mong itigil ang setup? Babalik sa {previousRole} Mode ang account mo.',
  onboarding_yes_switch_back_btn: 'Oo, Bumalik',
  onboarding_skip_doc_upload_title: 'Skip Muna ang Pag-upload?',
  onboarding_skip_doc_upload_msg:
    'Puwede ka namang mag-upload ng business documents sa profile mo kahit kailan. Kahit i-skip mo ito, puwede ka pa ring mag-post ng trabaho at gumamit ng account mo.',
  onboarding_skip_and_continue_btn: 'Skip at Magpatuloy',

  // Work History (AddWorkHistoryScreen)
  work_history_title_add: 'Magdagdag ng Dating Trabaho',
  work_history_title_edit: 'I-edit ang Trabaho',
  work_history_title_list: 'Mga Trabaho Mo Noon',
  work_history_subtitle_add: 'Puwede ka pang magdagdag ng iba sa susunod.',
  work_history_subtitle_edit: 'Baguhin ang mga detalye ng dati mong trabaho.',
  work_history_subtitle_count: 'May {count} ka nang nailagay na trabaho.',
  work_history_form_header_add: 'Magdagdag ng Trabaho',
  work_history_form_header_edit: 'I-edit ang Trabaho',
  work_history_job_title_label: 'Anong Trabaho ang Ginawa Mo?',
  work_history_job_title_placeholder: 'Hal. Mason, Karpintero...',
  work_history_employer_label: 'Saan Ka Nagtrabaho?',
  work_history_employer_placeholder: 'Hal. Bahay ni Mang Reyes...',
  work_history_duration_label: 'Gaano Ka Katagal Nagtrabaho?',
  work_history_duration_placeholder: 'Hal. 3',
  work_history_unit_label: 'Tagal ng Trabaho',
  work_history_unit_days: 'Araw',
  work_history_unit_weeks: 'Linggo',
  work_history_unit_months: 'Buwan',
  work_history_unit_years: 'Taon',
  work_history_desc_label: 'Iba Pang Detalye (Optional)',
  work_history_desc_placeholder: 'Ikuwento ang mga ginawa mo sa trabaho...',
  work_history_added_jobs_header: 'Mga Naidagdag na Trabaho ({count})',
  work_history_action_edit: 'I-edit',
  work_history_action_delete: 'Alisin',
  work_history_btn_add_another: '+ Magdagdag Pa',
  work_history_btn_save_job: 'I-save ang Trabaho',
  work_history_btn_save_changes: 'I-save ang Mga Pagbabago',
  work_history_btn_saving: 'Sine-save...',
  work_history_btn_done: 'Tapos Na',
  work_history_btn_cancel: 'Huwag Ituloy',
  work_history_err_job_title_req: 'Ilagay kung anong trabaho ang ginawa mo.',
  work_history_err_employer_req: 'Ilagay kung saan o para kanino ka nagtrabaho.',
  work_history_err_duration_req: 'Ilagay kung gaano ka katagal nagtrabaho.',
  work_history_err_duration_num: 'Maglagay ng wastong bilang. Dapat higit sa zero.',
  work_history_start_date_label: 'Petsa ng Pagsimula',
  work_history_start_date_placeholder: 'Buwan at taon...',
  work_history_end_date_label: 'Petsa ng Pagtatapos',
  work_history_end_date_placeholder: 'Buwan at taon...',
  work_history_current_job_label: 'Kasalukuyan pa akong nagtatrabaho rito',
  work_history_present: 'Kasalukuyan',
  work_history_err_start_date_req: 'Piliin ang buwan at taon kung kailan ka nagsimula.',
  work_history_err_end_date_req: 'Piliin ang buwan at taon kung kailan ka natapos.',
  work_history_err_dates_order:
    'Hindi puwedeng mas maaga ang petsa ng pagtatapos kaysa sa pagsimula.',
  work_history_delete_title: 'Alisin ang Trabaho?',
  work_history_delete_msg: 'Gusto mo bang alisin ang trabahong ito sa listahan mo?',
  work_history_err_save_failed: 'Hindi na-save ang trabaho mo. Pakisubukan ulit.',
  work_history_err_delete_failed: 'Hindi naalis ang trabaho. Pakisubukan ulit.',

  // Skills (AddSkillsScreen)
  skills_screen_badge: 'Mga Kaya Mong Gawin',
  skills_screen_title: 'Ipakita kung anong mga trabaho ang kaya mong gawin.',
  skills_screen_subtitle: 'Piliin lahat ng trabahong kaya mong gawin.',
  skills_selected_header: 'Napili ({count})',
  skills_custom_tag: 'Iba',
  skills_empty_selected:
    'Wala ka pang napipili. Pumili ng trabaho sa ibaba o magdagdag ng sarili mong skill.',
  skills_custom_section_header: 'Magdagdag ng Ibang Skill',
  skills_custom_input_placeholder: 'Hal. Pagmamason, pagkukumpuni...',
  skills_add_btn: '+ Magdagdag',
  skills_suggested_matches: 'Mga Posibleng Tugma',
  skills_err_already_selected: 'Napili mo na ang skill na ito.',
  skills_err_already_in_custom: 'Naidagdag mo na ang skill na ito.',
  skills_available_catalog: 'Mga Trabahong Puwede Mong Piliin',
  skills_btn_save: 'I-save',
  skills_btn_saving: 'Sine-save...',
  skills_err_select_at_least_one: 'Pumili o magdagdag muna ng kahit isang skill bago magpatuloy.',
  skills_err_save_failed: 'Hindi na-save ang mga pinili mo. Subukan ulit.',

  // Character References (AddCharacterReferencesScreen)
  char_ref_badge: 'Mga Character Reference',
  char_ref_title: 'Tatlong Taong Puwedeng Magrekomenda sa Iyo',
  char_ref_subtitle:
    'Magdagdag ng hanggang 3 taong makakapagbigay ng rekomendasyon tungkol sa ugali mo sa trabaho at mga kakayahan mo. Puwede itong dating employer, mentor, o katrabaho.',
  char_ref_privacy_title: 'Nakatago ang contact details ng iyong mga reference',
  char_ref_privacy_desc:
    'Makikita lang ito ng employer kapag na-shortlist ka na. Ligtas at kumpidensyal ang mga impormasyong ito.',
  char_ref_add_another_btn: 'Magdagdag Pa ng Reference',
  char_ref_slots_three: 'May 3 slot ka pang puwede idagdag',
  char_ref_slots_two: 'May 2 slot ka pang puwede idagdag',
  char_ref_slots_one: 'May 1 slot ka pang puwede idagdag',
  char_ref_list_header: 'Mga Reference · {count} sa 3',
  char_ref_modal_title_add: 'Magdagdag ng Reference',
  char_ref_modal_title_edit: 'I-edit ang Reference',
  char_ref_name_label: 'Buong Pangalan',
  char_ref_name_placeholder: 'Hal. Juan Reyes...',
  char_ref_relationship_label: 'Ano ang Relasyon Mo sa Kanya?',
  char_ref_relationship_placeholder: 'Hal. Dating employer...',
  char_ref_phone_label: 'Cellphone Number',
  char_ref_phone_placeholder: 'Hal. 09123456789',
  char_ref_btn_done: 'Tapos Na',
  char_ref_btn_cancel: 'Huwag Ituloy',
  char_ref_btn_delete: 'Alisin',
  char_ref_btn_save_ref: 'I-save ang Reference',
  char_ref_btn_save_changes: 'I-save ang Mga Pagbabago',
  char_ref_btn_saving: 'Sine-save...',
  char_ref_err_name_req: 'Ilagay ang buong pangalan.',
  char_ref_err_relationship_req: 'Ilagay kung ano ang relasyon mo sa kanya.',
  char_ref_err_phone_req: 'Ilagay ang cellphone number.',
  char_ref_err_phone_prefix: 'Dapat magsimula sa 09 ang cellphone number.',
  char_ref_err_phone_digits: 'Dapat eksaktong 11 digits ang cellphone number.',
  char_ref_err_phone_own: 'Hindi puwedeng sarili mong cellphone number ang ilagay.',
  char_ref_err_phone_duplicate:
    'Nagamit mo na ang cellphone number na ito para sa ibang reference.',
  char_ref_delete_title: 'Alisin ang Reference?',
  char_ref_delete_msg: 'Sigurado ka bang gusto mong alisin ang character reference na ito?',
  char_ref_err_save_failed: 'Hindi na-save ang reference. Pakisubukan ulit.',
  char_ref_err_delete_failed: 'Hindi naalis ang reference. Pakisubukan ulit.',

  // Employer Dashboard (EmployerDashboardScreen)
  employer_dash_greeting: 'Kumusta,',
  employer_dash_stat_active_jobs: 'Aktibong Trabaho',
  employer_dash_stat_total_hires: 'Kabuuang Hire',
  employer_dash_stat_total_paid: 'Kabuuang Bayad',
  employer_dash_stat_reputation: 'Reputation Score',
  employer_dash_post_job_btn: 'Mag-post ng Trabaho',
  employer_dash_action_header: 'Kailangang Asikasuhin',
  employer_dash_all_caught_up_title: 'Wala Ka Nang Kailangang Asikasuhin!',
  employer_dash_all_caught_up_desc: 'Wala ka pang kailangang gawin sa ngayon.',
  employer_dash_action_review_title: 'Suriin ang Application',
  employer_dash_action_review_desc: 'Nag-apply si {name} sa job post mong {job}',
  employer_dash_action_negotiate_title: 'Pag-usapan ang Bayad at Kunin',
  employer_dash_action_negotiate_desc: 'Na-shortlist mo si {name} para sa {job}',
  employer_dash_action_offer_title: 'Naghihintay ng Sagot sa Alok',
  employer_dash_action_offer_desc: 'Nagpadala ka ng alok kay {name} para sa {job}',
  employer_dash_action_progress_title: 'May Ginagawang Trabaho',
  employer_dash_action_progress_desc: 'Ginagawa na ni {name} ang {job}',
  employer_dash_action_rate_title: 'Magbigay ng Rating at Review',
  employer_dash_action_rate_desc: 'Natapos na ni {name} ang {job}. Magbigay ng rating at review.',
  employer_dash_action_completed_title: 'Tapos Na ang Trabaho',
  employer_dash_action_rated_title: 'Nabigyan Mo Na ng Rating ang Manggagawa',
  employer_dash_stage_1: 'Stage 1 · Suriin ang Application',
  employer_dash_stage_2: 'Stage 2 · Pag-usapan ang Kasunduan',
  employer_dash_stage_3: 'Stage 3 · Naipadala ang Alok',
  employer_dash_stage_4: 'Stage 4 · Ginagawa na ang Trabaho',
  employer_dash_stage_rate: 'Kailangan · Magbigay ng Rating',
  employer_dash_stage_rated: 'Tapos Na · May Rating Na',
  employer_dash_stage_done: 'Tapos Na',
  employer_dash_pagination_prev: 'Nakaraan',
  employer_dash_pagination_next: 'Susunod',
  employer_dash_pagination_page: 'Page {page} ng {total}',
  employer_dash_recent_applicants_header: 'Mga Bagong Nag-apply',
  employer_dash_no_applicants_title: 'Wala Pang Nag-a-apply',
  employer_dash_no_applicants_desc: 'Dito lalabas ang mga worker na mag-a-apply sa job posts mo.',
  employer_dash_applied_for: 'Nag-apply sa {job}',
  employer_dash_no_ratings_yet: 'Wala Pang Rating',

  // Digital Job Receipt (CompletedJobOverview)
  receipt_official_header: 'Resibo ng Trabaho',
  receipt_official_subtitle: 'Digital na Talaan ng Natapos na Trabaho • Lalawigan ng Sorsogon',
  receipt_ref_label: 'Reference No.',
  receipt_status_completed: 'TAPOS NA',
  receipt_total_compensation: 'KABUUANG BAYAD',
  receipt_final_compensation: 'PINAL NA BAYAD',
  receipt_worker_label: 'Manggagawa',
  receipt_employer_label: 'Employer',
  receipt_verified_member: 'Beripikadong Miyembro ng SIKAP',
  receipt_ledger_header: 'MGA DETALYE NG TRABAHO',
  receipt_ledger_location: 'Lugar ng Trabaho',
  receipt_ledger_scheduled_date: 'Petsa ng Trabaho',
  receipt_ledger_category: 'Uri ng Trabaho',
  receipt_ledger_work_scope: 'Mga Gawain at Iba Pang Detalye',
  receipt_attached_photos: 'MGA LARAWAN NG NATAPOS NA TRABAHO ({count})',
  receipt_feedback_submitted: 'Naipasa na ang Rating at Review',
  receipt_feedback_thank_you:
    'Salamat sa pagbibigay ng rating at review para sa natapos na trabahong ito sa SIKAP.',
  receipt_window_closed_title: 'Tapos Na ang 7-Day Rating Period',
  receipt_window_closed_desc:
    'Lampas na sa itinakdang panahon ang pagbibigay ng rating at review para sa trabahong ito.',
  receipt_window_open_title: 'Bukas ang 7-Day Rating Period',
  receipt_window_open_desc:
    'May 7 araw mula nang matapos ang trabaho para makapagbigay ng rating ang dalawang panig.',
  receipt_rate_worker_btn: 'I-rate ang Manggagawa',
  receipt_rate_employer_btn: 'I-rate ang Employer',
  receipt_footer_verified: 'Beripikadong Digital na Resibo • SIKAP Sorsogon Portal',
  receipt_btn_download: 'I-save ang Resibo bilang Larawan',
  receipt_btn_chat_history: 'Tingnan ang Chat History',
  receipt_btn_view_job_post: 'Tingnan ang Job Post',
  view_completion_receipt: 'Tingnan ang Resibo ng Pagtatapos',
  job_completed_notice: 'Tapos na ang trabahong ito.',
  receipt_saved_alert_title: 'Na-save na ang Resibo',
  receipt_saved_alert_msg: 'Nasa photo gallery na ng cellphone mo ang opisyal na resibo.',
  receipt_err_save_title: 'Hindi Ma-save ang Resibo',
  receipt_err_save_msg: 'Pakisubukan ulit.',

  // Archiving & Managing Job Posts
  alert_archive_job_title: 'I-archive ang job post?',
  alert_archive_job_msg:
    'Gusto mo bang ilipat sa archive ang "{jobTitle}"? Puwede mo pa itong ibalik anumang oras sa Archived tab.',
  alert_archive_job_btn_cancel: 'Huwag Ituloy',
  alert_archive_job_btn_confirm: 'I-archive',
  alert_archive_success_title: 'Nailipat na sa Archive',
  alert_archive_success_msg: 'Nasa archive na ang job post mo.',
  alert_archive_error_msg: 'Hindi na-archive ang job post. Pakisubukang muli.',
  alert_restore_job_success_title: 'Naibalik na ang Job Post',
  alert_restore_job_success_msg: 'Naibalik na sa listahan ng mga job post mo.',
  alert_restore_job_error_msg: 'Hindi naibalik ang job post. Pakisubukang muli.',
  alert_cancel_job_title: 'Kanselahin ang job post?',
  alert_cancel_job_msg:
    'Sigurado ka bang gusto mong kanselahin ang job post na ito? Aabisuhan ang lahat ng nag-apply at mga natanggap mo na sa trabaho.',
  alert_cancel_job_btn_no: 'Huwag Ituloy',
  alert_cancel_job_btn_yes: 'Oo, Kanselahin',
  alert_cancel_job_success_title: 'Nakansela na ang Job Post',
  alert_cancel_job_success_msg: 'Nakansela na ang job post mo.',

  error_title: 'May Mali',
  applicants: 'mga aplikante',

  // Hiring, Offers & Negotiation
  alert_chat_required_title: 'Mag-chat Muna',
  alert_chat_required_msg:
    'Mag-chat muna kayo ng aplikante para mapag-usapan ang mga detalye ng trabaho bago mo siya kumpirmahin bilang kukunin.',
  alert_chat_required_btn_chat: 'Buksan ang Chat',
  alert_chat_required_btn_cancel: 'Huwag Muna',
  alert_cancel_hire_title: 'Kanselahin ang Pagkuha?',
  alert_cancel_hire_prompt:
    'Sigurado ka bang hindi mo na itutuloy ang pagkuha kay {applicantName} para sa trabahong "{jobTitle}"?',
  alert_cancel_hire_warning: 'Kapag itinuloy mo ito, babawiin ang alok at aabisuhan ang aplikante.',
  alert_cancel_hire_confirm_btn: 'Oo, Kanselahin',
  alert_cancel_hire_success_msg: 'Nakansela na ang pagkuha kay {applicantName}.',
  alert_cancel_hire_error_msg: 'Hindi nakansela ang pagkuha. Pakisubukang muli.',
  alert_cancel_hire_err_msg: 'Hindi nakansela ang pagkuha. Subukan ulit.',
  alert_decline_offer_title: 'Tanggihan ang Alok?',
  alert_decline_offer_prompt: 'Sigurado ka bang tatanggihan mo ang alok para sa "{jobTitle}"?',
  alert_decline_offer_msg: 'Sigurado ka bang gusto mong tanggihan ang alok para sa "{jobTitle}"?',
  alert_decline_offer_btn_cancel: 'Huwag Ituloy',
  alert_decline_offer_btn_confirm: 'Oo, Tanggihan',
  alert_decline_offer_success_msg: 'Tinanggihan mo na ang alok para sa "{jobTitle}".',
  alert_decline_offer_err_msg: 'Hindi naituloy ang pagtanggi sa alok. Subukan ulit.',
  alert_accept_offer_error_msg: 'Hindi matanggap ang alok. Pakisubukang muli.',
  alert_mark_complete_error_msg: 'Hindi namarkahang tapos na ang trabaho. Pakisubukang muli.',

  // Application Lifecycle Alerts
  alert_withdraw_title: 'Bawiin ang Application?',
  alert_withdraw_prompt:
    'Sigurado ka bang gusto mong bawiin ang application mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  alert_withdraw_msg:
    'Sigurado ka bang gusto mong bawiin ang iyong application? Hindi na ito maibabalik.',
  alert_withdraw_btn_keep: 'Huwag Ituloy',
  alert_withdraw_btn_cancel: 'Huwag Muna',
  alert_withdraw_btn_confirm: 'Oo, Bawiin',
  alert_withdraw_error_msg: 'Hindi nabawi ang application mo. Pakisubukang muli.',
  alert_withdraw_err_msg: 'Hindi nabawi ang application. Subukan ulit.',

  // Chat, Safety & Moderation
  alert_block_user_title: 'I-block ang User?',
  alert_block_user_prompt:
    'Sigurado ka bang gusto mong i-block si {targetName}? Hindi ka na niya puwedeng i-message, padalhan ng job offer, o makita ang mga job post mo.',
  alert_block_user_msg:
    'Sigurado ka bang gusto mong i-block si {name}? Hindi ka na niya maaaring padalhan ng mensahe, mag-alok ng trabaho, o makita ang iyong mga post.',
  alert_block_user_btn_cancel: 'Huwag Ituloy',
  alert_block_user_btn_confirm: 'I-block',
  alert_block_user_success_title: 'Naka-block na',
  alert_block_user_success_msg: 'Naka-block na si {targetName}.',
  alert_block_user_error_title: 'Hindi Ma-block',
  alert_block_user_err_title: 'Hindi Na-block',
  alert_block_user_error_msg: 'Hindi ma-block ang user na ito. Pakisubukang muli.',
  alert_block_user_err_msg: 'Hindi na-block ang user na ito. Pakisubukan muli.',
  alert_unblock_user_title: 'I-unblock ang User?',
  alert_unblock_user_prompt: 'Sigurado ka bang gusto mong i-unblock si {targetName}?',
  alert_unblock_user_msg: 'Sigurado ka bang gusto mong i-unblock si {name}?',
  alert_unblock_user_btn_cancel: 'Huwag Muna',
  alert_unblock_user_btn_confirm: 'I-unblock',
  alert_unblock_user_success_title: 'Na-unblock na',
  alert_unblock_user_success_msg: 'Na-unblock mo na si {targetName}.',
  alert_unblock_user_error_title: 'Hindi Na-unblock',
  alert_unblock_user_err_title: 'Hindi Na-unblock',
  alert_unblock_user_error_msg: 'Hindi na-unblock ang user na ito. Pakisubukang muli.',
  alert_unblock_user_err_msg: 'Hindi na-unblock ang user na ito. Pakisubukan muli.',
  alert_chat_send_failed_title: 'Hindi Naipadala',
  alert_chat_send_err_title: 'Hindi Naipadala',
  alert_chat_send_failed_msg: 'Hindi naipadala ang mensahe. Pakisubukang muli.',
  alert_chat_send_err_msg: 'Hindi naipadala ang mensahe. Pakisubukan muli.',
  alert_chat_send_image_failed_title: 'Hindi Naipadala ang Larawan',
  alert_chat_send_image_failed_msg: 'Hindi naipadala ang larawan. Pakisubukang muli.',
  alert_chat_prohibited_language: 'May mga salitang hindi puwedeng gamitin sa mensahe mo.',

  // Profile & File Upload Alerts
  alert_profile_saved_title: 'Na-save na ang Profile',
  alert_profile_saved_msg: 'Na-save na ang mga pagbabago mo.',
  alert_profile_save_failed_title: 'Hindi Na-save',
  alert_profile_avatar_failed_msg: 'Hindi ma-upload ang profile picture mo. Pakisubukang muli.',
  alert_profile_invalid_age_title: 'Hindi Pasok sa Age Requirement',
  alert_profile_invalid_age_msg: 'Dapat 18 taong gulang ka pataas.',
  alert_docs_limit_reached_title: 'Naabot Mo na ang Limit',
  alert_docs_limit_reached_msg:
    'Hanggang 3 business documents lang ang puwede mong i-upload. Alisin muna ang isa sa mga na-upload mo kung gusto mong magdagdag.',
  alert_docs_too_many_title: 'Sobra ang Bilang ng Files',
  alert_docs_limit_title: 'Sobra ang Files',
  alert_docs_too_many_msg:
    '{count} na lang na document ang puwede mong idagdag. Hanggang 3 lang ang puwedeng i-upload.',
  alert_docs_limit_msg:
    'Maaari ka na lamang magdagdag ng {remaining} pang dokumento (hanggang 3 files lamang).',
  alert_docs_file_too_large_title: 'Masyadong Malaki ang File',
  alert_docs_file_too_large_msg:
    'May isa o higit pang file na lampas sa 5MB limit. Pumili ng mas maliit na file.',

  // Dashboard, Profile, Empty State & Application Stage Localization
  dashboard_no_pending_actions: 'Walang kailangang aksyon sa ngayon',
  dashboard_review_applicant_count: 'Suriin ang {count} bagong {noun}',
  dashboard_applicant_singular: 'aplikante',
  dashboard_applicant_plural: 'aplikante',
  dashboard_stage_review: 'Suriin',
  dashboard_awaiting_offer_acceptance: 'Naghihintay ng pagtanggap sa alok',
  dashboard_stage_pending: 'Nakabinbin',
  dashboard_job_in_progress: 'Kasalukuyang ginagawa ang trabaho',
  dashboard_stage_active: 'Aktibo',
  dashboard_leave_review_for: 'Mag-iwan ng review para kay {name}',
  dashboard_stage_rate: 'I-rate',
  dashboard_no_applicants_yet: 'Wala pang aplikante',
  dashboard_no_applicants_sub: 'Lalabas dito ang mga mag-a-apply sa iyong mga aktibong job post.',
  dashboard_prev: 'Nakaraan',
  dashboard_next: 'Susunod',
  dashboard_page_of: 'Pahina {page} ng {total}',

  home_empty_welcome: 'Maligayang pagdating sa SIKAP',
  home_empty_headline_prefix: 'Maghanap ng trabaho',
  home_empty_headline_accent: 'malapit sa iyo',
  home_empty_subtext:
    'Kumpletuhin ang profile at barangay mo para makita ang mga trabahong swak sa lugar mo.',
  home_empty_add_skills_btn: 'Magdagdag ng Kasanayan',
  home_empty_Step_1_title: 'Magdagdag ng iyong kasanayan',
  home_empty_Step_1_desc: 'Sabihin sa amin kung anong trabaho ang kaya mong gawin',
  home_empty_Step_2_title: 'Itakda ang iyong barangay',
  home_empty_Step_2_desc: 'Para maipakita namin ang mga trabahong malapit sa iyo',
  home_empty_Step_3_title: 'Magsimulang mag-apply',
  home_empty_Step_3_desc: 'Isang pindot lang para mag-apply, makipag-chat agad sa employer',
  home_empty_greeting_hi: 'Kumusta,',
  home_empty_welcome_upper: 'MALIGAYANG PAGDATING SA SIKAP',
  home_empty_profile_is: 'Ang iyong profile ay',
  home_empty_percent_complete: '{percent}% kumpleto.',
  home_empty_account_verified: 'Beripikado na ang account',
  home_empty_just_now: 'Kakagawa lang',
  home_empty_tell_employers: 'Ipaalam sa mga employer ang kaya mong gawin',
  home_empty_add_work_history: 'Magdagdag ng karanasan sa trabaho',
  home_empty_optional_recommended: 'Opsyonal ngunit inirerekomenda',
  home_empty_add_char_refs: 'Magdagdag ng character references',
  home_empty_up_to_3_vouch: 'Hanggang 3 taong makakapagpatunay sa iyo',
  home_empty_skip_to_jobs: 'Laktawan at Tingnan ang mga Trabaho',

  profile_finish_setup: 'Tapusin ang pag-setup',
  profile_missing_details_sub:
    'May kulang pang detalye sa iyong profile. Pindutin para kumpletuhin.',
  profile_score_travels_short: 'Dala mo ang iyong score saan ka man magtrabaho.',
  profile_verified_employer: 'Beripikadong Employer',
  profile_hires_label: 'Nakuha',
  profile_about_title: 'Tungkol sa Negosyo',
  profile_about_me_title: 'Tungkol sa Akin',
  profile_no_ratings_yet: 'Wala pang rating',
  profile_score_travels_employer:
    'Dala mo ang iyong score. Kumpletuhin ang mga trabaho at mag-iwan ng review para makabuo ng tiwala.',
  profile_score_travels_worker:
    'Dala mo ang iyong score. Tapusin ang mga trabaho para mapataas ang iyong reputasyon.',
  profile_recent_review: 'Pinakabagong review',
  profile_view_all_arrow: 'Tingnan lahat →',
  profile_add_btn: 'Magdagdag',
  profile_no_work_history: 'Wala pang nailagay na karanasan sa trabaho.',
  profile_no_skills_added: 'Wala pang nailagay na kasanayan.',
  profile_no_references_added: 'Wala pang nailagay na reference.',
  profile_help_support_sub: 'Mag-submit at mag-track ng support ticket sa app',
  profile_Complete_btn: 'Kumpletuhin',

  my_jobs_tab_active: 'Aktibo',
  my_jobs_tab_past: 'Nakaraan',
  my_jobs_tab_archived: 'Archive',
  my_jobs_no_past_title: 'Walang nakaraang trabaho',
  my_jobs_no_archived_title: 'Walang naka-archive na trabaho',
  my_jobs_no_past_sub: 'Lalabas dito ang mga natapos o isinarang trabaho.',
  my_jobs_no_archived_sub: 'Dito mapupunta ang mga trabahong i-a-archive mo.',

  my_apps_search_placeholder: 'Maghanap ng aplikasyon...',
  my_apps_sort_newest: 'Pinakabago',
  my_apps_sort_pay: 'Sahod',
  my_apps_sort_oldest: 'Pinakauna',
  my_apps_stage_applied: 'Nag-apply',
  my_apps_stage_shortlisted: 'Shortlisted',
  my_apps_stage_hired: 'Tinanggap',
  my_apps_stage_Offer_Received: 'May Alok na Trabaho',
  my_apps_stage_completed: 'Tapos Na',
  my_apps_stage_not_selected: 'Hindi Napili',
  my_apps_stage_withdrawn: 'Binawi',
  my_apps_next_waiting_review: 'Naghihintay ng pagsusuri ng employer',
  my_apps_next_under_consideration: 'Kasama ka sa pinagpipilian!',
  my_apps_next_job_in_progress: 'Kasalukuyang ginagawa ang trabaho — galingan mo!',
  my_apps_next_accept_or_decline: 'Tanggapin o tanggihan ang alok na trabahong ito',
  my_apps_next_leave_review: 'Mag-iwan ng review para makatulong sa komunidad',
  my_apps_next_reviewed_all: 'Nasuri na ng employer ang lahat ng aplikante',
  my_apps_next_withdrawn: 'Binawi mo ang application na ito',

  saved_jobs_subtitle: 'Mga trabahong na-save mo para balikan.',
  saved_jobs_load_error: 'Hindi ma-load ang mga na-save na trabaho.',
  saved_jobs_empty_title: 'Wala pang na-save na trabaho',
  saved_jobs_empty_sub:
    'Wala ka pang na-save na trabaho. Maghanap sa job feed para mag-save ng mga trabahong gusto mo.',
  saved_jobs_browse_btn: 'Maghanap ng Trabaho',

  // 5-Stage Stepper
  stepper_applied: 'Nag-apply',
  stepper_shortlisted: 'Shortlist',
  stepper_offer: 'Alok',
  stepper_hired: 'Tanggap',
  stepper_done: 'Tapos',

  // Employer Navigator
  nav_dashboard: 'Dashboard',

  // Chat Guide & Action Card Statuses
  guide_step_count: '3 hakbang',
  guide_show: 'Ipakita',
  guide_minimize: 'Itago',
  guide_worker_step1_title: 'Pag-usapan sa Chat',
  guide_worker_step1_desc:
    'Magtanong tungkol sa lokasyon, kailangang gamit, at makipagkasundo sa bayad kung kailangan.',
  guide_worker_step2_title: 'Hintayin ang Pinal na Alok',
  guide_worker_step2_desc:
    'Magpapadala ang employer ng opisyal na alok kasama ang napagkasunduang bayad.',
  guide_worker_step3_title: 'Suriin at Tanggapin',
  guide_worker_step3_desc: 'Tanggapin ang alok sa ibaba upang opisyal na masimulan ang trabaho.',
  guide_employer_step1_title: 'Pag-usapan sa Chat',
  guide_employer_step1_desc:
    'Linawin ang oras, lokasyon, kagamitan, at bayad kasama si {workerName}.',
  guide_employer_step2_title: 'Magkasundo sa Kasunduan',
  guide_employer_step2_desc:
    'Magkasundo sa saklaw ng trabaho at bayad bago kumpirmahin ang pagkuha.',
  guide_employer_step3_title: 'I-set ang Bayad at I-hire',
  guide_employer_step3_desc:
    'Kapag nagkasundo na, itakda ang pinal na bayad sa ibaba. Tatanggapin ito ni {workerName} para opisyal na magsimula.',

  card_status_confirmed: 'Kumpirmado',
  card_status_accepted: 'Tinanggap',
  card_status_declined: 'Tinanggihan',
  card_status_pending: 'Nakabinbin',
  card_status_pending_confirmation: 'Naghihintay ng Kumpirmasyon',
  card_status_reopen_declined: 'Tinanggihang Buksan Muli',

  // My Jobs Action Sheet & Badges
  my_jobs_manage_pipeline: 'Pamahalaan ang mga Aplikante',
  my_jobs_manage_pipeline_sub: 'Suriin ang mga kandidato, negosasyon, at progreso ng yugto',
  my_jobs_view_receipt: 'Tingnan ang Resibo ng Pagtatapos',
  my_jobs_view_receipt_sub: 'Suriin ang digital na resibo, buod ng bayad, at mga rating',
  my_jobs_view_post: 'Tingnan ang Job Post',
  my_jobs_view_post_sub: 'Suriin ang pampublikong job post kasama ang lahat ng detalye',
  my_jobs_edit_post: 'I-edit ang Job Post',
  my_jobs_edit_post_sub: 'I-update ang mga kailangan, bayad, o iskedyul',
  my_jobs_restore_post: 'Ibalik ang Job Post',
  my_jobs_restore_post_sub: 'Muling i-activate ang trabahong ito sa iyong mga aktibong post',
  my_jobs_archive_post: 'I-archive ang Job Post',
  my_jobs_archive_post_sub:
    'Alisin ang trabahong ito sa listahan at i-archive ang kasaysayan ng aplikante',
  my_jobs_badge_open: 'BUKAS',
  my_jobs_badge_in_progress: 'KASALUKUYAN',
  my_jobs_badge_completed: 'TAPOS NA',
  my_jobs_badge_archived: 'NA-ARCHIVE',
  my_jobs_badge_cancelled: 'KINANSELA',

  // Rate Screens
  rate_employer_pill: 'I-rate ang employer',
  rate_clarity: 'Gaano kalinaw ang job description',
  rate_fairness: 'Pagiging patas ng sahod',
  rate_respect: 'Paggalang',
  rate_reliability: 'Maaasahan',
  rate_review_feedback: 'Feedback sa Review',
  rate_review_placeholder: 'Isulat ang review mo (at least 5 characters)...',
  rate_submit_btn: 'I-submit ang rating',
  rate_already_reviewed_title: 'Na-review mo na',
  rate_already_reviewed_employer_msg: 'Nag-review ka na sa employer na ito.',
  rate_already_reviewed_worker_msg: 'Nag-review ka na sa worker na ito.',
  rate_review_sent_title: 'Naipadala na ang review',
  rate_employer_success_msg:
    'Salamat! Malaking tulong ang rating mo para malaman ng ibang workers kung ano ang aasahan.',
  rate_employer_success_msg_warn:
    'Salamat! Malaking tulong ang rating mo para malaman ng ibang workers kung ano ang aasahan. Paalala: may mga salita sa review mo na baka i-check para sa community standards.',
  rate_worker_success_msg:
    'Salamat! Dahil sa rating mo, nagiging mapagkakatiwalaan ang community at mas maraming magagaling na worker ang napapansin at nahihire.',
  rate_worker_success_msg_warn:
    'Salamat! Dahil sa rating mo, nagiging mapagkakatiwalaan ang community at mas maraming magagaling na worker ang napapansin at nahihire. Paalala: may mga salita sa review mo na baka i-check para sa community standards.',
  rate_label_employer: 'Employer',
  rate_label_worker: 'Worker',
  rate_label_job: 'Trabaho',
  rate_label_your_rating: 'Rating mo',
  rate_btn_view_job_summary: 'Tingnan ang job summary',
  rate_btn_back_to_workers: 'Balik sa mga worker',
  rate_btn_done: 'Tapos na',
  rate_submit_error: 'Hindi naipadala ang review.',
  rate_worker_pill: 'I-rate ang worker',
  rate_quality: 'Kalidad ng trabaho',
  rate_punctuality: 'Pagiging on time',
  rate_communication: 'Komunikasyon',
  rate_behavior: 'Ugali',

  // Job Status & Pipeline Management
  job_status_screen_title: 'Status ng Trabaho',
  job_status_completed_title: 'Natapos na Trabaho',
  job_status_manage_title: 'I-manage ang Status ng Trabaho',
  job_status_record_unavailable: 'Walang Job Record',
  job_status_not_found_desc: 'Hindi mahanap ang trabahong ito o baka natanggal na.',
  job_status_back_my_jobs: 'Balik sa Mga Trabaho Ko',
  job_status_retry_btn: 'Subukan ulit',
  status_badge_active_open: 'Aktibo / Bukas',
  status_badge_in_progress: 'Ginagawa pa',
  status_badge_completed: 'Natapos',
  status_badge_cancelled: 'Na-cancel',
  pipeline_section_title: 'Hiring Pipeline',
  pipeline_stage_applied: 'Nag-apply',
  pipeline_stage_shortlist: 'Shortlist',
  pipeline_stage_offer: 'Offer',
  pipeline_stage_hired: 'Na-hire',
  pipeline_stage_done: 'Tapos na',
  pipeline_stage_rejected: 'Na-reject',
  pipeline_current_stage_badge: 'KASALUKUYANG STAGE',
  pipeline_stage_2_shortlisted: 'Stage 2: Shortlisted at Negosasyon',
  pipeline_stage_3_offer: 'Stage 3: Naipadala na ang Offer',
  pipeline_stage_4_hired: 'Stage 4: Na-hire na ang Worker',
  pipeline_stage_active_default: 'Kasalukuyang Stage',
  pipeline_active_candidates_header: 'Mga Aktibong Kandidato ({count})',
  pipeline_single_candidate_header: 'Aktibong Kandidato',
  pipeline_other_applicants_header: 'Iba Pang Nag-apply ({count})',
  pipeline_no_other_applicants: 'Wala nang ibang nag-apply para sa trabahong ito.',
  pipeline_slot_summary: '{filled} sa {total} slots ang napunan',
  pipeline_worker_applicant_default: 'Worker na Nag-apply',
  pipeline_action_proceed_confirm: 'Ituloy sa Pag-confirm ng Hire →',
  pipeline_action_view_offer: 'Tingnan ang Detalye ng Offer →',
  pipeline_action_manage_active: 'I-manage ang Aktibong Trabaho →',
  pipeline_action_view_details: 'Tingnan ang Detalye →',
  job_meta_slots_hired: '{hired} sa {total} slots ang na-hire na',
  job_meta_interested_count: '{count} ang interesado',
  job_section_description: 'Description',
  job_section_tools_required: 'Mga Kailangang Gamit',
  job_section_attachments: 'Mga Attachment at Media ({count})',
  job_play_video_btn: 'I-play ang Video',
  job_applicants_header: 'Mga Nag-apply ({count})',
  job_no_applicants_text: 'Wala pang nag-apply sa job post na ito.',
  job_btn_view_job_post: 'Tingnan ang Job Post',
  job_btn_rate_remaining: 'I-rate ang Natitirang Workers ({count})',
  job_btn_archive_post: 'I-archive ang Job Post',
  job_btn_edit_post: 'I-edit ang Job Post',
  job_btn_cancel_archive: 'I-cancel / I-archive ang Trabaho',
  job_btn_mark_completed: 'Markahang Tapos na',
  job_btn_cancel_job: 'I-cancel ang Trabaho',
  job_btn_delete_post: 'I-delete ang Job Post',

  // Progressive Disclosure in ApplicantDetailScreen
  view_worker_profile: 'Tingnan ang Buong Profile',
  view_worker_profile_sub: 'Suriin ang mga kasanayan, rating, at kasaysayan ng trabaho',
  collapse_worker_profile: 'Itago ang Profile ng Manggagawa',
  contact_locked_phone_sub: 'Naka-lock ang numero ng telepono',
  contact_locked_stage1_desc:
    'I-shortlist ang manggagawa para ma-unlock ang character references at in-app chat.',
  contact_locked_stage2_desc:
    'Maa-unlock ang direktang numero at emergency contact kapag tinanggap na ang alok sa trabaho.',
  about_worker: 'Tungkol sa Manggagawa',
  work_history: 'Kasaysayan ng Trabaho',
  privacy_shield_title: 'Protektado ng SIKAP Privacy Shield',
  privacy_shield_desc:
    'Maa-unlock ang mga character reference at detalye ng pakikipag-ugnayan habang umuusad ka sa proseso ng pagkuha.',

  // Discard & Navigation
  discard_job_title: 'Umalis sa Pag-post ng Trabaho?',
  discard_job_msg: 'Nai-save ang iyong progreso bilang draft. Nais mo bang umalis?',
  discard_application_title: 'I-discard ang Aplikasyon?',
  discard_application_msg:
    'Hindi mase-save ang iyong cover note. Sigurado ka bang nais mong umalis?',
  keep_editing: 'Ipagpatuloy ang Pag-edit',
  leave: 'Umalis',
  view_pipeline_btn: 'Tingnan ang Pipeline',
};
