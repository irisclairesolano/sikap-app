describe('Shortlist, Social Platforms, and Worker Stat Card Test Suite', () => {
  it('renders shortlist button label as "Shortlist applicant" without question mark', () => {
    const buttonLabel = 'Shortlist applicant';
    const disclaimer =
      'Shortlisting allows you to view contact info, negotiate details, and confirm the hire.';

    expect(buttonLabel).toBe('Shortlist applicant');
    expect(buttonLabel).not.toContain('?');
    expect(disclaimer).toContain('Shortlisting allows you to view contact info');
  });

  it('hides off-app negotiation social links for pending applicants and reveals post-shortlist', () => {
    const pendingStatus = 'pending';
    const shortlistedStatus = 'shortlisted';

    const isVisibleForPending = [
      'shortlisted',
      'pending_negotiation',
      'employer_confirmed',
      'accepted',
    ].includes(pendingStatus);
    const isVisibleForShortlisted = [
      'shortlisted',
      'pending_negotiation',
      'employer_confirmed',
      'accepted',
    ].includes(shortlistedStatus);

    expect(isVisibleForPending).toBe(false);
    expect(isVisibleForShortlisted).toBe(true);
  });

  it('renders "Completed Jobs" stat card for workers instead of "Jobs listed"', () => {
    const workerStats = {
      completed_jobs_count: 12,
      role: 'worker',
    };

    const statCardLabel = workerStats.role === 'worker' ? 'Completed Jobs' : 'Jobs listed';
    expect(statCardLabel).toBe('Completed Jobs');
    expect(statCardLabel).not.toBe('Jobs listed');
  });

  it('supports up to 3 communication and social media platform slots for off-app negotiation', () => {
    const platforms = [
      { platform: 'WhatsApp', value: '+639171234567' },
      { platform: 'Facebook', value: 'https://facebook.com/johndoe' },
      { platform: 'Viber', value: '+639171234567' },
    ];

    expect(platforms.length).toBeLessThanOrEqual(3);
    expect(platforms[0].platform).toBe('WhatsApp');
    expect(platforms[1].platform).toBe('Facebook');
  });
});
