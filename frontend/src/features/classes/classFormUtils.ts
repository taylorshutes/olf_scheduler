import type { NewSchoolClass, SchoolClass } from "../../api/client"

export const NEW_SCHOOL = "__new__"

export const EMPTY_CLASS_FORM = {
  school_id: NEW_SCHOOL as string,
  new_school_name: "",
  new_school_arrival: "09:00",
  new_school_departure: "15:00",
  name: "",
  capacity: "25",
  age_group: "",
  target_workshops: "1",
}

export type ClassFormState = typeof EMPTY_CLASS_FORM

export const parseAges = (text: string): number[] =>
  text
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a !== "")
    .map(Number)

export const formToClass = (form: ClassFormState, schoolId: number): NewSchoolClass => ({
  school_id: schoolId,
  name: form.name,
  capacity: Number(form.capacity),
  age_group: parseAges(form.age_group),
  target_workshops: Number(form.target_workshops),
})

export const classToForm = (c: SchoolClass): ClassFormState => ({
  school_id: String(c.school_id),
  new_school_name: "",
  new_school_arrival: "09:00",
  new_school_departure: "15:00",
  name: c.name,
  capacity: String(c.capacity),
  age_group: c.age_group.join(", "),
  target_workshops: String(c.target_workshops),
})
