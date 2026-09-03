/**
 * Utility to format and validate Philippine mobile numbers.
 * Supported standard outputs: "0912 345 6789" or "+63 912 345 6789"
 */

export const cleanPhoneNumber = (raw: string): string => {
  if (!raw) return '';
  return raw.replace(/[^0-9+]/g, '');
};

export const formatPhilippinePhone = (raw: string): string => {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');

  // Convert 639XXXXXXXXX -> 09XXXXXXXXX for local display
  if (digits.startsWith('63') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  }

  // Format 09XXXXXXXXX into 09XX XXX XXXX
  if (digits.startsWith('09') && digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  // Format 9XXXXXXXXX into 09XX XXX XXXX
  if (digits.startsWith('9') && digits.length === 10) {
    const local = '0' + digits;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }

  return raw.trim();
};

export const isValidPhilippineMobile = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, '');
  return (
    (digits.startsWith('09') && digits.length === 11) ||
    (digits.startsWith('639') && digits.length === 12) ||
    (digits.startsWith('9') && digits.length === 10)
  );
};
