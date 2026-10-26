import {today,nowHM,fmt12} from './booking.js';
import {appointmentMinutes,chronologicalAppointments} from './appointmentOrder.js';
export function arrivalPastDue(visit,date=today(),time=nowHM()){
 const saved=appointmentMinutes(visit.time),now=appointmentMinutes(time);
 return visit.status==='Scheduled'&&/^\d{4}-\d{2}-\d{2}$/.test(visit.date || '')&&Number.isFinite(Date.parse(visit.date))&&new Date(visit.date).toISOString().slice(0,10)===visit.date&&saved<1440&&now<1440&&(visit.date<date||visit.date===date&&saved<=now);
}
export function arrivalLists(visits,date=today(),time=nowHM()){
 const scheduled=visits.filter(v=>v.status==='Scheduled');
 const overdue=v=>v.date<date||arrivalPastDue(v,date,time);
 return {overdue:scheduled.filter(overdue).sort(chronologicalAppointments),upcoming:scheduled.filter(v=>v.date>=date&&!overdue(v)).sort(chronologicalAppointments)};
}

export const arrivalTimeLabel=time=>{const minutes=appointmentMinutes(time);return minutes<1440?fmt12(`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`):'Time not recorded';};
