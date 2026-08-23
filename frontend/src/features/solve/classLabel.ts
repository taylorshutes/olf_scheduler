import type { School, SchoolClass } from "../../api/client"

// Shared by SolvePage and MasterScheduleGrid (and anywhere else that needs
// to turn a schedule's class id back into a readable "School — Class" label).
export const makeClassLabel = (
  classId: string,
  classes: SchoolClass[],
  schools: School[],
  unknownLabel: (id: string) => string,
) => {
  const c = classes.find((c) => c.id === Number(classId))
  if (!c) return unknownLabel(classId)
  const school = schools.find((s) => s.id === c.school_id)
  return `${school ? school.name + " — " : ""}${c.name}`
}
