import { getWorkers, getAttendance } from '@/lib/actions/trabajadores'
import TrabajadoresView from '@/components/hotel/trabajadores/trabajadores-view'

export default async function TrabajadoresPage() {
  const [workers, attendance] = await Promise.all([
    getWorkers(),
    getAttendance(),
  ])

  return (
    <TrabajadoresView
      initialWorkers={Array.isArray(workers) ? workers : []}
      initialAttendance={Array.isArray(attendance) ? attendance : []}
    />
  )
}
