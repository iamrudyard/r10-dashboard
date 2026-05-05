export const LTRPP_FIELDS = [
  {
    key: 'planning_team',
    label: 'Planning Team',
    fullLabel: 'Planning Team Organized',
  },
  {
    key: 'draft_plan',
    label: 'Draft Plan',
    fullLabel: 'Preparation of the Draft Plan',
  },
  {
    key: 'submission_of_plan',
    label: 'LTFRB Review',
    fullLabel: 'Submission of the Draft Plan To LTFRB for Review',
  },
  {
    key: 'certification_issuance',
    label: 'Certification',
    fullLabel: 'Issuance Of Certification',
  },
]

export const LTRPP_MAX_SCORE = LTRPP_FIELDS.length

export const isLTRPPCompliantValue = (key, value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''

  if (key === 'certification_issuance') {
    return normalized === 'notice of compliance' || normalized === 'compliance'
  }

  return normalized === 'compliance'
}

export const getLTRPPScore = (record) =>
  LTRPP_FIELDS.filter((field) => isLTRPPCompliantValue(field.key, record?.[field.key])).length

export const getLTRPPStatus = (record) => {
  const certification = record?.certification_issuance
  const normalizedCertification =
    typeof certification === 'string' ? certification.trim().toLowerCase() : ''

  if (normalizedCertification === 'notice of compliance' || normalizedCertification === 'compliance') {
    return 'Compliance'
  }

  if (
    normalizedCertification === 'notice of non compliance' ||
    normalizedCertification === 'non compliance'
  ) {
    return 'Non Compliance'
  }

  if (!record) {
    return 'No Status'
  }

  const hasAnyValue = LTRPP_FIELDS.some((field) => record[field.key])

  if (!hasAnyValue) {
    return 'No Status'
  }

  return getLTRPPScore(record) === LTRPP_MAX_SCORE ? 'Compliance' : 'Non Compliance'
}
