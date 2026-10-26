import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrivalPastDue,arrivalLists,arrivalTimeLabel} from '../src/arrivalTiming.js';
const visit={id:'past',status:'Scheduled',date:'2026-10-26',time:'10:00'};
test('arrival flag switches at saved Manila time and does not mutate the clinical status',()=>{
 assert.equal(arrivalPastDue(visit,'2026-10-26','09:59'),false);assert.equal(arrivalPastDue(visit,'2026-10-26','10:00'),true);assert.equal(arrivalPastDue(visit,'2026-10-27','08:00'),true);assert.equal(visit.status,'Scheduled');assert.equal(arrivalTimeLabel('10:00 AM'),'10:00 AM');assert.equal(arrivalTimeLabel('12:00 AM'),'12:00 AM');assert.equal(arrivalTimeLabel('invalid'),'Time not recorded');assert.equal(arrivalPastDue({...visit,date:'2026-02-30'},'2026-10-26','10:00'),false);
 assert.equal(arrivalPastDue({...visit,time:'10:00 AM'},'2026-10-26','10:00'),true);
 for(const status of ['Pending Approval','Checked-in','In consultation','Completed','Cancelled','No-show'])assert.equal(arrivalPastDue({...visit,status},'2026-10-27','10:00'),false);
 for(const time of ['', 'not a time','25:00'])assert.equal(arrivalPastDue({...visit,time},'2026-10-27','10:00'),false);
});
test('older unarrived visits stay actionable separately from future reservations',()=>{
 const old={...visit,id:'older',date:'2026-10-25'},next={...visit,id:'next',time:'11:00'},future={...visit,id:'future',date:'2026-10-27'};
 const rows=[future,next,visit,old,{...old,id:'done',status:'Completed'}];const result=arrivalLists(rows,'2026-10-26','10:01');
 assert.deepEqual(result.overdue,[old,visit]);assert.deepEqual(result.upcoming,[next,future]);assert.equal(rows[0],future);
});

test('older visits with missing times remain visible for correction without enabling no-show',()=>{const v={...visit,date:'2026-10-25',time:''};assert.deepEqual(arrivalLists([v],'2026-10-26','10:00').overdue,[v]);assert.equal(arrivalPastDue(v,'2026-10-26','10:00'),false);});
