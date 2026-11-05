import { Language, translateForLanguage, getActiveLanguage } from '../contexts/LanguageContext';

export interface LocalizedNotificationResult {
  title: string;
  message: string;
  parsedData?: any;
}

/**
 * Formats a notification item (from `/notifications` or Pusher `notification.sent`)
 * into the user's selected language (`en` or `tl`).
 *
 * When `lang === 'en'`, it preserves the original English title/message.
 * When `lang === 'tl'`, it maps the notification type/pattern to the natural Filipino
 * localization while preserving all dynamic placeholders (`{workerName}`, `{employerName}`,
 * `{jobTitle}`, `{priceText}`, `{docType}`, `{reason}`, `{actionLabel}`).
 */
export const formatLocalizedNotification = (
  notifOrData: any,
  lang: Language = getActiveLanguage(),
): LocalizedNotificationResult => {
  let parsedData = notifOrData?.data !== undefined ? notifOrData.data : notifOrData;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (_) {
      parsedData = {};
    }
  }

  const rawTitle: string =
    parsedData?.title ||
    notifOrData?.title ||
    (typeof notifOrData?.type === 'string' ? notifOrData.type.replace('Notification', '') : '') ||
    'SIKAP';
  const rawMessage: string =
    parsedData?.message || notifOrData?.message || translateForLanguage(lang, 'new_notif_default');

  const getFormatted = (): { title: string; message: string } => {
    // If English is selected, keep original English notification strings
    if (lang === 'en') {
      return { title: rawTitle, message: rawMessage };
    }

    const notifType: string = parsedData?.type || '';

    // 1. New Application
    // EN: "{workerName} has applied for {jobTitle}."
    if (rawTitle === 'New Application' || notifType === 'new_application') {
      const match = rawMessage.match(/^(.*?) has applied for (.*)\.$/i);
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[1] || 'Worker';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_new_application_title'),
        message: translateForLanguage('tl', 'notif_new_application_msg', { workerName, jobTitle }),
      };
    }

    // 2. Application Shortlisted
    // EN: "SIKAP: {employerName} has shortlisted your application for [{jobTitle}]. Open the app to discuss details and negotiate terms."
    if (rawTitle === 'Application Shortlisted' || notifType === 'application_shortlisted') {
      const match = rawMessage.match(
        /^(?:SIKAP:\s*)?(.*?) has shortlisted your application for \[(.*?)\]/i,
      );
      const employerName =
        parsedData?.employer_name || parsedData?.employerName || match?.[1] || 'Employer';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_shortlisted_title'),
        message: translateForLanguage('tl', 'notif_shortlisted_msg', { employerName, jobTitle }),
      };
    }

    // 3. Hire Confirmed
    // EN: "Your hire for {jobTitle} has been confirmed. Please accept the offer."
    if (rawTitle === 'Hire Confirmed' || notifType === 'hire_confirmed') {
      const match = rawMessage.match(/^Your hire for (.*?) has been confirmed\./i);
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_hire_confirmed_title'),
        message: translateForLanguage('tl', 'notif_hire_confirmed_msg', { jobTitle }),
      };
    }

    // 4. Offer Accepted
    // EN: "{workerName} has accepted the offer for {jobTitle}."
    if (rawTitle === 'Offer Accepted' || notifType === 'offer_accepted') {
      const match = rawMessage.match(/^(.*?) has accepted the offer for (.*)\.$/i);
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[1] || 'Worker';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_offer_accepted_title'),
        message: translateForLanguage('tl', 'notif_offer_accepted_msg', { workerName, jobTitle }),
      };
    }

    // 5. Offer Rate Declined
    // EN: "SIKAP: Worker {workerName} declined the proposed rate{priceText} for [{jobTitle}]. You can renegotiate and send a new offer."
    if (rawTitle === 'Offer Rate Declined' || notifType === 'offer_rate_declined') {
      const match = rawMessage.match(
        /^(?:SIKAP:\s*)?Worker (.*?) declined the proposed rate(.*?) for \[(.*?)\]/i,
      );
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[1] || 'Worker';
      const rawPricePart = match?.[2] || '';
      const priceMatch = rawPricePart.match(/of\s+(.+)/i);
      const priceText = priceMatch ? ` na ${priceMatch[1]}` : rawPricePart;
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[3] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_rate_declined_title'),
        message: translateForLanguage('tl', 'notif_rate_declined_msg', {
          workerName,
          priceText,
          jobTitle,
        }),
      };
    }

    // 6. Hire Cancelled
    // EN: "SIKAP: Your hire for [{jobTitle}] has been cancelled by the employer."
    if (rawTitle === 'Hire Cancelled' || notifType === 'hire_cancelled') {
      const match = rawMessage.match(/^(?:SIKAP:\s*)?Your hire for \[(.*?)\] has been cancelled/i);
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_hire_cancelled_title'),
        message: translateForLanguage('tl', 'notif_hire_cancelled_msg', { jobTitle }),
      };
    }

    // 7. Application Declined / Application Update
    // EN: "Thank you for applying to {jobTitle}. Keep your spirits up!..."
    if (
      rawTitle === 'Application Update' ||
      notifType === 'application_declined' ||
      notifType === 'application_rejected'
    ) {
      const match = rawMessage.match(/^Thank you for applying to (.*?)\./i);
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_app_update_title'),
        message: translateForLanguage('tl', 'notif_app_declined_msg', { jobTitle }),
      };
    }

    // 8. Work Finished by Worker
    // EN: '"{workerName}" flagged "{jobTitle}" as finished. Please confirm and rate the worker.'
    if (rawTitle === 'Work Finished by Worker' || notifType === 'job_flagged_offline') {
      const match = rawMessage.match(/^"?(.*?)"? flagged "(.*?)" as finished\./i);
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[1] || 'Worker';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_worker_finished_title'),
        message: translateForLanguage('tl', 'notif_worker_finished_msg', { workerName, jobTitle }),
      };
    }

    // 9. Rate Your Employer (Immediate on completion)
    // EN: '"{jobTitle}" is marked complete! Please rate {employerName} to help the community.'
    if (rawTitle === 'Rate Your Employer') {
      const match = rawMessage.match(/^"(.*?)" is marked complete! Please rate (.*?) to help/i);
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      const employerName =
        parsedData?.employer_name || parsedData?.employerName || match?.[2] || 'Employer';
      return {
        title: translateForLanguage('tl', 'notif_rate_employer_title'),
        message: translateForLanguage('tl', 'notif_rate_employer_msg', { jobTitle, employerName }),
      };
    }

    // 10. Rate Your Worker (Immediate on completion)
    // EN: '"{jobTitle}" is complete. Please submit a review for {workerName}.'
    if (rawTitle === 'Rate Your Worker') {
      const match = rawMessage.match(/^"(.*?)" is complete\. Please submit a review for (.*?)\.$/i);
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[2] || 'Worker';
      return {
        title: translateForLanguage('tl', 'notif_rate_worker_title'),
        message: translateForLanguage('tl', 'notif_rate_worker_msg', { jobTitle, workerName }),
      };
    }

    // 11. Action Required: Confirm Your Hire (24h Hire Reminder)
    // EN: '{employerName} confirmed your hire for "{jobTitle}". Please confirm or decline your offer.'
    if (rawTitle === 'Action Required: Confirm Your Hire' || notifType === 'hire_offer_reminder') {
      const match = rawMessage.match(/^(.*?) confirmed your hire for "(.*?)"\./i);
      const employerName =
        parsedData?.employer_name || parsedData?.employerName || match?.[1] || 'Employer';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_hire_reminder_title'),
        message: translateForLanguage('tl', 'notif_hire_reminder_msg', { employerName, jobTitle }),
      };
    }

    // 12. Reminder: Rate Your Employer
    // EN: 'Don\'t forget to rate {employerName} for "{jobTitle}". Your feedback builds a trusted community.'
    if (
      rawTitle === 'Reminder: Rate Your Employer' ||
      (notifType === 'rate_employer_reminder' &&
        !parsedData?.is_final_warning &&
        rawTitle.startsWith('Reminder'))
    ) {
      const match = rawMessage.match(/^Don't forget to rate (.*?) for "(.*?)"\./i);
      const employerName =
        parsedData?.employer_name || parsedData?.employerName || match?.[1] || 'Employer';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_rate_employer_reminder_title'),
        message: translateForLanguage('tl', 'notif_rate_employer_reminder_msg', {
          employerName,
          jobTitle,
        }),
      };
    }

    // 13. Urgent: 24 Hours Left to Rate Employer
    // EN: 'The 7-day rating window for "{jobTitle}" closes in 24 hours. Rate {employerName} before it expires!'
    if (
      rawTitle === 'Urgent: 24 Hours Left to Rate Employer' ||
      (notifType === 'rate_employer_reminder' && parsedData?.is_final_warning)
    ) {
      const match = rawMessage.match(
        /^The 7-day rating window for "(.*?)" closes in 24 hours\. Rate (.*?) before it expires!/i,
      );
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      const employerName =
        parsedData?.employer_name || parsedData?.employerName || match?.[2] || 'Employer';
      return {
        title: translateForLanguage('tl', 'notif_rate_employer_urgent_title'),
        message: translateForLanguage('tl', 'notif_rate_employer_urgent_msg', {
          jobTitle,
          employerName,
        }),
      };
    }

    // 14. Reminder: Rate Your Worker
    // EN: 'Don\'t forget to submit a review for {workerName} for "{jobTitle}".'
    if (
      rawTitle === 'Reminder: Rate Your Worker' ||
      (notifType === 'rate_worker_reminder' &&
        !parsedData?.is_final_warning &&
        rawTitle.startsWith('Reminder'))
    ) {
      const match = rawMessage.match(/^Don't forget to submit a review for (.*?) for "(.*?)"\./i);
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[1] || 'Worker';
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[2] || 'Job';
      return {
        title: translateForLanguage('tl', 'notif_rate_worker_reminder_title'),
        message: translateForLanguage('tl', 'notif_rate_worker_reminder_msg', {
          workerName,
          jobTitle,
        }),
      };
    }

    // 15. Urgent: 24 Hours Left to Rate Worker
    // EN: 'The 7-day rating window for "{jobTitle}" closes in 24 hours. Submit your review for {workerName} before it expires!'
    if (
      rawTitle === 'Urgent: 24 Hours Left to Rate Worker' ||
      (notifType === 'rate_worker_reminder' && parsedData?.is_final_warning)
    ) {
      const match = rawMessage.match(
        /^The 7-day rating window for "(.*?)" closes in 24 hours\. Submit your review for (.*?) before it expires!/i,
      );
      const jobTitle = parsedData?.job_title || parsedData?.jobTitle || match?.[1] || 'Job';
      const workerName =
        parsedData?.worker_name || parsedData?.workerName || match?.[2] || 'Worker';
      return {
        title: translateForLanguage('tl', 'notif_rate_worker_urgent_title'),
        message: translateForLanguage('tl', 'notif_rate_worker_urgent_msg', {
          jobTitle,
          workerName,
        }),
      };
    }

    // 16. Verification Approved
    // EN: "SIKAP: Your {docType} and account have been approved! You can now use the platform."
    if (
      rawTitle === 'Verification Approved' ||
      rawTitle === 'Identity Verified' ||
      (notifType === 'verification_update' && parsedData?.status === 'approved') ||
      notifType === 'verification_approved'
    ) {
      const match = rawMessage.match(/^(?:SIKAP:\s*)?Your (.*?) and account have been approved/i);
      const docType = parsedData?.docType || match?.[1] || 'ID';
      return {
        title: translateForLanguage('tl', 'notif_verification_approved_title'),
        message: translateForLanguage('tl', 'notif_verification_approved_msg', { docType }),
      };
    }

    // 17. Verification Rejected
    // EN: "SIKAP: Your {docType} submission was rejected. Reason: {reason}"
    if (
      rawTitle === 'Verification Rejected' ||
      rawTitle === 'Identity Verification Needs Attention' ||
      (notifType === 'verification_update' && parsedData?.status === 'rejected') ||
      notifType === 'verification_rejected'
    ) {
      const match = rawMessage.match(
        /^(?:SIKAP:\s*)?Your (.*?) submission was rejected\.(?:\s*Reason:\s*(.*))?/i,
      );
      const docType = parsedData?.docType || match?.[1] || 'ID';
      const reason =
        parsedData?.reason ||
        parsedData?.rejection_reason ||
        match?.[2] ||
        'Pakitingnan ang detalye sa app at mag-upload ulit.';
      return {
        title: translateForLanguage('tl', 'notif_verification_rejected_title'),
        message: translateForLanguage('tl', 'notif_verification_rejected_msg', { docType, reason }),
      };
    }

    // 18. Verification Correction Needed
    // EN: "SIKAP: Your {docType} needs correction. Please re-upload in the app."
    if (
      rawTitle === 'Verification Correction Needed' ||
      (notifType === 'verification_update' && parsedData?.status === 'correction_needed')
    ) {
      const match = rawMessage.match(/^(?:SIKAP:\s*)?Your (.*?) needs correction\./i);
      const docType = parsedData?.docType || match?.[1] || 'ID';
      return {
        title: translateForLanguage('tl', 'notif_verification_correction_title'),
        message: translateForLanguage('tl', 'notif_verification_correction_msg', { docType }),
      };
    }

    // 19 & 20. Moderation Report Update (Job vs. Account)
    if (rawTitle === 'Moderation Report Update') {
      const jobMatch = rawMessage.match(
        /^The report on your job post '(.*?)' has been (.*?) by administrators\./i,
      );
      if (jobMatch) {
        return {
          title: translateForLanguage('tl', 'notif_mod_report_job_title'),
          message: translateForLanguage('tl', 'notif_mod_report_job_msg', {
            jobTitle: jobMatch[1],
            actionLabel: jobMatch[2],
          }),
        };
      }

      const accountMatch = rawMessage.match(
        /^The moderation inquiry regarding your account has been (.*?)\./i,
      );
      if (accountMatch) {
        return {
          title: translateForLanguage('tl', 'notif_mod_report_account_title'),
          message: translateForLanguage('tl', 'notif_mod_report_account_msg', {
            actionLabel: accountMatch[1],
          }),
        };
      }
    }

    // Account Suspended / Report Action Taken fallbacks
    if (rawTitle === 'Account Suspended') {
      return {
        title: translateForLanguage('tl', 'notif_account_suspended_title'),
        message: translateForLanguage('tl', 'notif_account_suspended_msg'),
      };
    }

    if (rawTitle === 'Report Action Taken') {
      return {
        title: translateForLanguage('tl', 'notif_report_action_title'),
        message: translateForLanguage('tl', 'notif_report_action_msg'),
      };
    }

    return { title: rawTitle, message: rawMessage };
  };

  return {
    ...getFormatted(),
    parsedData,
  };
};
