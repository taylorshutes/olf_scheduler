import type { NewSchool, School } from "../../api/client"

export const EMPTY_SCHOOL_FORM: NewSchool = {
  name: "",
  arrival_time: "09:00",
  departure_time: "15:00",
}

export const schoolToForm = (s: School): NewSchool => ({
  name: s.name,
  arrival_time: s.arrival_time,
  departure_time: s.departure_time,
})
