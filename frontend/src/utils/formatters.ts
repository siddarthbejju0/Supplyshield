export const formatCurrency = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-GB').format(val);
};

export const formatPercent = (val?: number | null, decimals = 1): string => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(decimals)}%`;
};

export const formatDays = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(1)} days`;
};
