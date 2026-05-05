export const SKFPD_DOCUMENT_FIELDS = [
  {
    key: 'cbydp',
    label: 'CBYDP',
    fullLabel: 'Comprehensive Barangay Youth Development Plan',
  },
  {
    key: 'abyip',
    label: 'ABYIP',
    fullLabel: 'Annual Barangay Youth Investment Program',
  },
  {
    key: 'annual_budget',
    label: 'Annual Budget',
    fullLabel: 'Annual Budget',
  },
  {
    key: 'rcb',
    label: 'RCB',
    fullLabel: 'Register of Cash in Bank & Other Related Financial Transactions',
  },
  {
    key: 'month_1st',
    label: '1st Month',
    fullLabel: 'First Month Posting',
  },
  {
    key: 'month_2nd',
    label: '2nd Month',
    fullLabel: 'Second Month Posting',
  },
  {
    key: 'month_3rd',
    label: '3rd Month',
    fullLabel: 'Third Month Posting',
  },
]

export const SKFPD_POLICY_BOARD_FIELD = {
  key: 'skfpd_pb',
  label: 'SKFPD PB',
  fullLabel: 'SKFPD Policy Board',
}

export const SKFPD_TABLE_FIELDS = [
  ...SKFPD_DOCUMENT_FIELDS,
  SKFPD_POLICY_BOARD_FIELD,
]

export const SKFPD_MAX_SCORE = 7
