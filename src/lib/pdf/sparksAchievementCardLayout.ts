import { SparksHandbook, JewelType } from '../../models/SparksHandbookProgress'
import type { JewelSection } from '../../models/SparksHandbookProgress'

export const SPARKS_TEMPLATE_PATH = 'templates/sparks-achievement-card.pdf'

export const sparksStudentLayout = {
  name: { x: 140, y: 767 },
  genderMale: { x: 253, y: 767 },
  genderFemale: { x: 284, y: 767 },
  birthDate: { x: 348, y: 767 },
  churchName: { x: 486, y: 767 },
  address: { x: 140, y: 751 },
  parentName: { x: 175, y: 736 },
  parentPhone: { x: 276, y: 721 },
  clubRegisteredDate: { x: 151, y: 706 },
}

export const sparksAttendanceLayout = {
  dateX: 91,
  statusX: 113,
  startY: 667,
  monthGap: 58.8,
  weekGap: 11.76,
}

export const sparksProgressLayout = {
  [SparksHandbook.HANG_GLIDER]: {
    [JewelType.RED]: { x: 181, y: 623 },
    [JewelType.GREEN]: { x: 380, y: 623 },
  },
  [SparksHandbook.WING_RUNNER]: {
    [JewelType.RED]: { x: 181, y: 423 },
    [JewelType.GREEN]: { x: 380, y: 423 },
  },
  [SparksHandbook.SKY_STORMER]: {
    [JewelType.RED]: { x: 181, y: 224 },
    [JewelType.GREEN]: { x: 380, y: 224 },
  },
}

export function getSparksSectionPosition(
  handbook: SparksHandbook,
  jewelType: JewelType,
  section: JewelSection
) {
  const origin = sparksProgressLayout[handbook][jewelType]

  return {
    x: origin.x + ((section.minor - 1) * 49.6),
    y: origin.y - ((section.major - 1) * 16),
  }
}
