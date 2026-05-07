export const ROAD_SAFETY_FIELDS = [
  {
    key: 'speed_limit_ordinance',
    label: 'Speed Ordinance',
    fullLabel: 'Speed Limit Ordinance',
  },
  {
    key: 'submitted_to_dotr',
    label: 'DOTR Submitted',
    fullLabel: 'Submitted to DOTR',
  },
  {
    key: 'crowded_streets',
    label: 'Crowded Streets',
    fullLabel: 'Crowded Streets Identified',
  },
  {
    key: 'signs_cm_brgy_road',
    label: 'CM/Brgy Signs',
    fullLabel: 'Traffic Signs on City/Municipal/Barangay Roads',
  },
  {
    key: 'signs_provincial_road',
    label: 'Provincial Signs',
    fullLabel: 'Traffic Signs on Provincial Roads',
  },
  {
    key: 'signs_national_road',
    label: 'National Signs',
    fullLabel: 'Traffic Signs on National Roads',
  },
  {
    key: 'inventory_of_roads',
    label: 'Road Inventory',
    fullLabel: 'Inventory of Roads',
  },
  {
    key: 'data_collected_road_crash',
    label: 'Crash Data',
    fullLabel: 'Road Crash Data Collected',
  },
  {
    key: 'data_submission_driver',
    label: 'Driver Data',
    fullLabel: 'Driver Data Submitted',
  },
]

export const ROAD_SAFETY_MAX_SCORE = ROAD_SAFETY_FIELDS.length

export const isRoadSafetyCompliantValue = (value) => Number(value) === 1

export function getRoadSafetyScore(record = {}) {
  return ROAD_SAFETY_FIELDS.reduce(
    (score, field) => score + (isRoadSafetyCompliantValue(record[field.key]) ? 1 : 0),
    0,
  )
}

export function getRoadSafetyStatus(record = {}) {
  return getRoadSafetyScore(record) === ROAD_SAFETY_MAX_SCORE ? 'Compliance' : 'Non Compliance'
}
