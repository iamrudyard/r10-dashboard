export const SGLG_INDICATORS = [
  {
    key: 'fin',
    title: 'Financial Administration and Sustainability',
    shortTitle: 'Financial',
    statusKey: 'area_fin_status',
    fields: [
      { key: 'fin_coa_report', label: 'COA Process' },
      { key: 'fin_fdp_posting', label: 'FDP Process' },
      { key: 'fin_local_revenue', label: 'LRG Process' },
      { key: 'fin_nta', label: 'National Tax Allotment' },
      { key: 'fin_pcf_sglgif', label: 'PCF Process' },
      { key: 'fin_lgsf', label: 'LGSF Process' },
      { key: 'fin_prev_year_annual_budget', label: 'Annual Budget Process' },
    ],
  },
  {
    key: 'drrm',
    title: 'Disaster Preparedness',
    shortTitle: 'DRRM',
    statusKey: 'area_drrm_status',
    fields: [
      { key: 'drrm_gk_awardee', label: 'GK Awardee' },
      { key: 'drrm_council', label: 'DRRM Council' },
      { key: 'drrm_office', label: 'DRRM Office' },
      { key: 'drrm_pdpfp_clup', label: 'PDPFP/CLUP' },
      { key: 'drrm_ldrrm_plan', label: 'LDRRM Plan' },
      { key: 'drrm_climate_action_plan', label: 'LCCAP' },
      { key: 'drrm_contingency_plans', label: 'Contingency Plan' },
      { key: 'drrm_fund', label: 'LDRRM Fund' },
      { key: 'drrm_early_warning', label: 'Early Warning System' },
      { key: 'drrm_evacuation_mechanism', label: 'Evacuation Mechanism' },
      { key: 'drrm_evac_mgmt_sys', label: 'Evacuation Management System' },
      { key: 'drrm_op_center_sop', label: 'LDRRM Op Center' },
      { key: 'drrm_incident_command', label: 'Incident Command System' },
      { key: 'drrm_cbdrrm_plans_budget', label: 'CBDRRM Plans' },
      { key: 'drrm_gawad_kalasag_participation', label: 'GK Seal' },
    ],
  },
  {
    key: 'soc',
    title: 'Social Protection and Sensitivity',
    shortTitle: 'Social Protection',
    statusKey: 'area_soc_status',
    fields: [
      { key: 'soc_child_friendly', label: 'CFLGA' },
      { key: 'soc_gad_mechanism', label: 'GAD Mechanism' },
      { key: 'soc_vawc_mechanism', label: 'VAWC Mechanism' },
      { key: 'soc_local_code_children', label: 'Local Code for Children' },
      { key: 'soc_feeding_prog_c12', label: 'Feeding Program C1-C2' },
      { key: 'soc_accessibility_law', label: 'Accessibility Law' },
      { key: 'soc_pwd_office', label: 'PWD Office' },
      { key: 'soc_sign_language_interp', label: 'Sign Language Interpreter' },
      { key: 'soc_senior_citizen_center', label: 'Senior Citizen Center' },
      { key: 'soc_ip_representation', label: 'IP Representation' },
      { key: 'soc_absence_illegal_dwelling', label: 'No Illegal Dwelling' },
      { key: 'soc_funds_ppas', label: 'Funds for PPAs' },
      { key: 'soc_residential_care', label: 'Residential Care' },
      { key: 'soc_4ps', label: '4Ps' },
      { key: 'soc_swdo', label: 'LSWDO' },
      { key: 'soc_mainstreaming_protection', label: 'Protection Mainstreaming' },
      { key: 'soc_peso', label: 'PESO' },
      { key: 'soc_dev_council', label: 'Local Development Council' },
      { key: 'soc_pop_officer', label: 'Population Officer' },
      { key: 'soc_teen_center', label: 'Teen Center' },
    ],
  },
  {
    key: 'health',
    title: 'Health Compliance and Responsiveness',
    shortTitle: 'Health',
    statusKey: 'area_health_status',
    fields: [
      { key: 'health_investment_plan', label: 'Local Health Investment Plan' },
      { key: 'health_drinking_water', label: 'Drinking Water' },
      { key: 'health_sanitation', label: 'Sanitation' },
      { key: 'health_tb_notification', label: 'TB Notification' },
      { key: 'health_tb_treatment_success', label: 'TB Treatment Success' },
      { key: 'health_stunting_rate', label: 'Stunting Rate' },
      { key: 'health_fic', label: 'Fully Immunized Child' },
      { key: 'health_prenatal', label: 'Prenatal Care' },
      { key: 'health_board', label: 'Local Health Board' },
      { key: 'health_philpen_protocol', label: 'PhilPEN Protocol' },
      { key: 'health_konsulta_provider', label: 'Konsulta Provider' },
      { key: 'health_drrm_h_system', label: 'DRRM-H System' },
      { key: 'health_epi_surveillance', label: 'EPI Surveillance' },
    ],
  },
  {
    key: 'educ',
    title: 'Sustainable Education',
    shortTitle: 'Education',
    statusKey: 'area_educ_status',
    fields: [
      { key: 'educ_school_board', label: 'School Board' },
      { key: 'educ_sef_disbursement', label: 'SEF Disbursement' },
      { key: 'educ_inclusive_prog', label: 'Inclusive Program' },
      { key: 'educ_early_childhood', label: 'Early Childhood Care' },
      { key: 'educ_tesda_training', label: 'TESDA Training' },
    ],
  },
  {
    key: 'biz',
    title: 'Business Friendliness and Competitiveness',
    shortTitle: 'Business',
    statusKey: 'area_biz_status',
    fields: [
      { key: 'biz_pcci_finalist', label: 'PCCI Finalist' },
      { key: 'biz_competitiveness_rank', label: 'Competitiveness Rank' },
      { key: 'biz_investment_office', label: 'Investment Office' },
      { key: 'biz_citizens_charter', label: 'Citizens Charter' },
      { key: 'biz_streamlined_process', label: 'Streamlined Process' },
      { key: 'biz_economic_data', label: 'Economic Data' },
      { key: 'biz_investment_code', label: 'Investment Code' },
    ],
  },
  {
    key: 'peace',
    title: 'Safety, Peace and Order',
    shortTitle: 'Peace and Order',
    statusKey: 'area_peace_status',
    fields: [
      { key: 'peace_audit_report', label: 'Peace and Order Audit' },
      { key: 'peace_anti_drug_audit', label: 'Anti-Drug Audit' },
      { key: 'peace_pnp_logistical', label: 'PNP Logistical Support' },
      { key: 'peace_bpats_trained', label: 'BPATS Trained' },
      { key: 'peace_firecracker_reg', label: 'Firecracker Regulation' },
    ],
  },
  {
    key: 'env',
    title: 'Environmental Management',
    shortTitle: 'Environment',
    statusKey: 'area_env_status',
    fields: [
      { key: 'env_swm_board', label: 'SWM Board' },
      { key: 'env_no_open_dumpsite', label: 'No Open Dumpsite' },
      { key: 'env_swm_plan_10yr', label: '10-Year SWM Plan' },
      { key: 'env_mrf', label: 'MRF' },
      { key: 'env_sanitary_landfill', label: 'Sanitary Landfill' },
      { key: 'env_wetland_conservation', label: 'Wetland Conservation' },
      { key: 'env_water_quality', label: 'Water Quality' },
      { key: 'env_public_parks', label: 'Public Parks' },
    ],
  },
  {
    key: 'tour',
    title: 'Tourism, Heritage Development, Culture and Arts',
    shortTitle: 'Tourism',
    statusKey: 'area_tour_status',
    fields: [
      { key: 'tour_officer', label: 'Tourism Officer' },
      { key: 'tour_info_center', label: 'Information Center' },
      { key: 'tour_dev_plan', label: 'Tourism Development Plan' },
      { key: 'tour_stats_report', label: 'Statistics Report' },
      { key: 'tour_culture_council', label: 'Culture Council' },
      { key: 'tour_budget_impl', label: 'Budget Implementation' },
      { key: 'tour_property_inventory', label: 'Property Inventory' },
      { key: 'tour_narrative_published', label: 'Published Narrative' },
    ],
  },
  {
    key: 'youth',
    title: 'Youth Development',
    shortTitle: 'Youth',
    statusKey: 'area_youth_status',
    fields: [
      { key: 'youth_dev_council', label: 'Youth Development Council' },
      { key: 'youth_dev_office', label: 'Youth Development Office' },
      { key: 'youth_dev_plan', label: 'Youth Development Plan' },
      { key: 'youth_lgu_support', label: 'LGU Support' },
    ],
  },
]

export const SGLG_FIELD_KEYS = SGLG_INDICATORS.flatMap((indicator) => [
  indicator.statusKey,
  ...indicator.fields.map((field) => field.key),
])

const REQUIRED = 'required'
const POOL = 'pool'

const financialRequiredFields = [
  'fin_coa_report',
  'fin_fdp_posting',
  'fin_local_revenue',
  'fin_nta',
  'fin_pcf_sglgif',
  'fin_lgsf',
  'fin_prev_year_annual_budget',
]

const drrmProvinceRequiredFields = [
  'drrm_gk_awardee',
  'drrm_council',
  'drrm_office',
  'drrm_pdpfp_clup',
  'drrm_ldrrm_plan',
  'drrm_climate_action_plan',
  'drrm_contingency_plans',
  'drrm_fund',
  'drrm_early_warning',
  'drrm_evacuation_mechanism',
  'drrm_evac_mgmt_sys',
  'drrm_op_center_sop',
  'drrm_incident_command',
  'drrm_gawad_kalasag_participation',
]

const drrmCityMunicipalityRequiredFields = [
  ...drrmProvinceRequiredFields,
  'drrm_cbdrrm_plans_budget',
]

const socialHucCityRequiredFields = [
  'soc_child_friendly',
  'soc_gad_mechanism',
  'soc_vawc_mechanism',
  'soc_feeding_prog_c12',
  'soc_accessibility_law',
  'soc_pwd_office',
  'soc_sign_language_interp',
  'soc_senior_citizen_center',
  'soc_ip_representation',
  'soc_absence_illegal_dwelling',
  'soc_funds_ppas',
  'soc_residential_care',
  'soc_4ps',
  'soc_swdo',
  'soc_mainstreaming_protection',
  'soc_peso',
  'soc_dev_council',
  'soc_pop_officer',
  'soc_teen_center',
]

const socialMunicipalityUpperIncomeRequiredFields = [
  'soc_child_friendly',
  'soc_gad_mechanism',
  'soc_vawc_mechanism',
  'soc_feeding_prog_c12',
  'soc_accessibility_law',
  'soc_pwd_office',
  'soc_senior_citizen_center',
  'soc_ip_representation',
  'soc_4ps',
  'soc_swdo',
  'soc_mainstreaming_protection',
  'soc_peso',
  'soc_dev_council',
  'soc_pop_officer',
  'soc_teen_center',
]

const socialMunicipalityLowerIncomeRequiredFields = socialMunicipalityUpperIncomeRequiredFields.filter(
  (key) => key !== 'soc_teen_center',
)

const socialProvinceRequiredFields = [
  'soc_gad_mechanism',
  'soc_vawc_mechanism',
  'soc_local_code_children',
  'soc_accessibility_law',
  'soc_pwd_office',
  'soc_sign_language_interp',
  'soc_ip_representation',
  'soc_funds_ppas',
  'soc_residential_care',
  'soc_swdo',
  'soc_mainstreaming_protection',
  'soc_peso',
  'soc_dev_council',
  'soc_pop_officer',
]

const healthPoolFields = [
  'health_drinking_water',
  'health_sanitation',
  'health_tb_notification',
  'health_tb_treatment_success',
  'health_stunting_rate',
  'health_fic',
  'health_prenatal',
  'health_board',
  'health_philpen_protocol',
  'health_konsulta_provider',
  'health_drrm_h_system',
  'health_epi_surveillance',
]

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

function getGeo(row = {}) {
  return row.lib_geographic_units ?? row
}

function getLguProfile(row = {}) {
  const geo = getGeo(row)
  const lguType = normalizeText(geo.lgu_type)
  const incomeClass = normalizeText(geo.income_class)

  const isProvince = lguType.includes('province')
  const isHuc = lguType === 'huc' || lguType.includes('highly urbanized')
  const isComponentCity = !isHuc && lguType.includes('city')
  const isMunicipality =
    lguType.includes('municipality') ||
    lguType.includes('municipal') ||
    (!isProvince && !isHuc && !isComponentCity)

  const isUpperIncomeMunicipality =
    isMunicipality && /(^|\D)(1st|first|2nd|second|3rd|third|1|2|3)(\D|$)/.test(incomeClass)
  const isLowerIncomeMunicipality =
    isMunicipality && /(^|\D)(4th|fourth|5th|fifth|6th|sixth|4|5|6)(\D|$)/.test(incomeClass)

  return {
    isProvince,
    isHuc,
    isComponentCity,
    isMunicipality,
    isUpperIncomeMunicipality,
    isLowerIncomeMunicipality,
  }
}

function makeRequirement(kind, label, description) {
  return { kind, label, description }
}

function getSocialRequiredFields(profile) {
  if (profile.isProvince) {
    return socialProvinceRequiredFields
  }

  if (profile.isHuc || profile.isComponentCity) {
    return socialHucCityRequiredFields
  }

  if (profile.isLowerIncomeMunicipality) {
    return socialMunicipalityLowerIncomeRequiredFields
  }

  return socialMunicipalityUpperIncomeRequiredFields
}

export function getSGLGRequirementForField(row, areaKey, fieldKey) {
  const profile = getLguProfile(row)

  if (areaKey === 'fin' && financialRequiredFields.includes(fieldKey)) {
    return makeRequirement(REQUIRED, 'Required', 'Required for Financial Administration pass.')
  }

  if (areaKey === 'drrm') {
    const requiredFields = profile.isProvince
      ? drrmProvinceRequiredFields
      : drrmCityMunicipalityRequiredFields

    if (requiredFields.includes(fieldKey)) {
      return makeRequirement(REQUIRED, 'Required', 'Required for Disaster Preparedness pass.')
    }
  }

  if (areaKey === 'soc' && getSocialRequiredFields(profile).includes(fieldKey)) {
    return makeRequirement(REQUIRED, 'Required', 'Required for Social Protection pass.')
  }

  if (areaKey === 'health') {
    if (fieldKey === 'health_investment_plan') {
      return makeRequirement(REQUIRED, 'Required', 'Required for Health Compliance pass.')
    }

    if (healthPoolFields.includes(fieldKey)) {
      const threshold = profile.isProvince || profile.isHuc ? 6 : 4

      return makeRequirement(
        POOL,
        `Any ${threshold}`,
        `Part of the Health Compliance pool; pass at least ${threshold} of these items.`,
      )
    }
  }

  return null
}

export function getSGLGRequirementStats(rows, areaKey, fieldKey) {
  const requirements = rows
    .map((row) => getSGLGRequirementForField(row, areaKey, fieldKey))
    .filter(Boolean)

  if (!requirements.length) {
    return null
  }

  const labels = [...new Set(requirements.map((requirement) => requirement.label))]
  const descriptions = [...new Set(requirements.map((requirement) => requirement.description))]
  const kinds = [...new Set(requirements.map((requirement) => requirement.kind))]

  return {
    count: requirements.length,
    total: rows.length,
    kind: kinds.includes(REQUIRED) ? REQUIRED : POOL,
    label: labels.length === 1 ? labels[0] : labels.join('/'),
    description: descriptions.length === 1 ? descriptions[0] : descriptions.join(' '),
    isUniversal: requirements.length === rows.length,
  }
}
