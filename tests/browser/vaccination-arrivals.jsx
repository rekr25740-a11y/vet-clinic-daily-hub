// Synthetic application boundaries. No customer, provider or medical-record writes.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import SoapConsultationModal from '../../src/roles/SoapConsultationModal.jsx';
import FrontDeskApprovals from '../../src/roles/FrontDeskApprovals.jsx';
import ClinicCalendar from '../../src/roles/ClinicCalendar.jsx';
import {changeAppointmentStatus} from '../../src/appointmentStatus.js';
import {DEFAULT_VACCINATION_PRODUCTS} from '../../src/vaccinationProducts.js';
import {api} from '../../src/api.js';
import {today,plus} from '../../src/booking.js';
import {boosterDate} from '../../src/clinicalWorkflow.js';
import {soapDraftKey} from '../../src/soapDraft.js';
import {emptyClinicState} from '../../src/clinicState.js';
import '../../src/styles.css';
const root=createRoot(document.getElementById('interaction-tests')),frame=()=>new Promise(r=>requestAnimationFrame(r));
const assert=(ok,message)=>{if(!ok)throw Error(message);},field=name=>document.querySelector(`[name="${name}"]`);
const me={id:'fixture-vet',role:'vet',name:'Synthetic vet'},pet={id:'fixture-pet',ownerId:'fixture-owner',name:'Synthetic patient',species:'Dog',birth:'2020-01-01'};
const appt={id:'fixture-vaccine',petId:pet.id,vetId:me.id,date:today(),time:'09:00',service:'vaccination',reason:'Vaccination: Anti-rabies',status:'In consultation',intakeVitals:{temp:38,weight:5}};
const base={...emptyClinicState(),pets:[pet],owners:[{id:pet.ownerId,name:'Synthetic owner'}],appts:[appt],vets:[{id:me.id,name:me.name}]};
const key=soapDraftKey(me.id,appt.id,pet.id);let count=0,network=0,calendar=null;
async function edit(name,value){const el=field(name);assert(el,`Missing ${name}`);const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;flushSync(()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});if(el instanceof HTMLSelectElement)flushSync(()=>el.dispatchEvent(new Event('change',{bubbles:true})));await frame();}
async function click(el){assert(el,'Missing button');flushSync(()=>el.click());await frame();}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
async function mount({young=false,clear=true}={}){if(clear)localStorage.removeItem(key);const patient=young?{...pet,birth:plus(-24)}:pet;flushSync(()=>root.render(<SoapConsultationModal key={++count} appt={appt} pet={patient} db={{...base,pets:[patient]}} me={me} setDb={()=>{}} onClose={()=>{}}/>));await frame();await frame();}
function Arrivals(){const [db,setDb]=useState({...base,appts:[{...appt,id:'past',date:plus(-1),status:'Scheduled'},{...appt,id:'future',date:plus(1),status:'Scheduled'},{...appt,id:'arrived',date:plus(-1),status:'Checked-in'}]});return <FrontDeskApprovals db={db} confirming={{}} onReviewPet={()=>{}} onOpenCard={()=>{}} onCalendar={v=>{calendar=v;}} onNoShow={v=>changeAppointmentStatus(setDb,v.id,'No-show',message=>{throw Error(message);},v,async(method,path,body)=>{network++;assert(body.expectedVisit.id==='past','No-show must retain saved visit snapshot');return {success:true,appointment:{...v,status:'No-show'}};})}/>;}
async function run(){const originalGet=api.get,originalPost=api.post,originalFetch=window.fetch,oldDraft=localStorage.getItem(key);
 const rabies={...DEFAULT_VACCINATION_PRODUCTS[0],manufacturer:'Synthetic maker',lots:[{batch:'SYNTHETIC-EXPIRED',expiresOn:'2000-01-01'},{batch:'SYNTHETIC-EARLY',expiresOn:'2090-01-01',serialNumber:'ACTUAL-SYNTHETIC-SERIAL'},{batch:'SYNTHETIC-LATER',expiresOn:'2099-01-01'}]};
 api.get=async path=>path==='/api/services/prices'?{catalog:[],vaccinationProducts:[rabies,DEFAULT_VACCINATION_PRODUCTS[1]]}:path==='/api/clinical/note-options'?{options:{diagnosis:[],treatment:[]}}:{visits:[]};
 api.post=async()=>{throw Error('Fixture cannot save clinical data');};
 window.fetch=async()=>new Response(JSON.stringify({success:true,slots:[],visits:[]}),{status:200,headers:{'Content-Type':'application/json'}});
 try{
  await mount();await click(field('giveVaccine'));flushSync(()=>document.querySelector('form').requestSubmit());await frame();
  assert(field('brand').getAttribute('aria-invalid')==='true','Missing vaccine product should validate inline');
  for(let i=0;i<3;i++){await edit('brand','defensor-3');assert(field('brand').value==='defensor-3','Product must remain selected after native input/change and validation');await edit('brand','other');await edit('otherBrand','Actual other product');}
  await edit('brand','defensor-3');assert(field('batch').value==='SYNTHETIC-EARLY','Earliest actual unexpired lot should autofill');assert(!field('batch').textContent.includes('EXPIRED'),'Expired lots must stay excluded');
  assert(field('manufacturer').value==='Synthetic maker'&&field('serialNumber').value==='ACTUAL-SYNTHETIC-SERIAL','Configured optional metadata should autofill');
  assert(field('intervalDays').value==='365'&&document.getElementById('booster-due').value===boosterDate(today(),365),'Product interval and next due must calculate');
  assert(field('doseNo').value==='1'&&field('doseOf').value==='1','Rabies should default to one recorded administration');
  await click(field('scheduleApproved'));assert(field('scheduleApproved').checked,'Automatic schedule still requires and accepts vet approval');
  await edit('batch','SYNTHETIC-LATER');assert(!field('scheduleApproved').checked,'Changing actual lot must invalidate approval');assert(field('serialNumber').value==='','Changing lot must clear old serial');
  await click(field('vaccinationManual'));await edit('intervalDays','21');assert(document.getElementById('booster-due').value===boosterDate(today(),21),'Custom interval must recalculate');
  await edit('intervalDays','0');assert(field('intervalDays').getAttribute('aria-invalid')==='true','Invalid interval should validate inline');await edit('intervalDays','21');assert(field('intervalDays').getAttribute('aria-invalid')==='false','Correction should clear interval error');
  await mount({clear:false});await click(field('giveVaccine'));await click(field('giveVaccine'));assert(field('brand').value==='defensor-3'&&field('intervalDays').value==='21','Draft must preserve product and custom interval');
  await edit('vaccine','5-in-1');assert(field('brand').value==='','Changing vaccine must clear incompatible product');assert(![...field('brand').options].some(o=>o.value==='defensor-3'),'Wrong family product should be excluded');
  await mount({young:true});await click(field('giveVaccine'));await edit('brand','defensor-3');assert(document.body.textContent.includes('below this product protocol’s starting age'),'Young patient warning must appear');assert(field('intervalDays').value==='','Underage patient must not receive routine schedule');
  flushSync(()=>root.render(<Arrivals/>));await frame();assert(document.querySelector('[aria-label="Overdue arrivals"]').textContent.includes('Awaiting arrival'),'Older scheduled visit remains visible');
  assert(document.querySelectorAll('[aria-label="Overdue arrivals"] article').length===1,'Checked-in visits must not be flagged as absent');
  await click(button('Reschedule'));assert(calendar.id==='past','Reschedule must target the exact saved visit');
  await click(button('Mark no-show'));assert(network===0&&!!document.querySelector('dialog[open]'),'No-show must require review');await click(button('Back to edit'));assert(network===0,'Cancelling review must preserve status');
  await click(button('Mark no-show'));await click(button('Confirm no-show'));await frame();assert(network===1&&!document.querySelector('[aria-label="Overdue arrivals"]'),'Confirmed server response must remove no-show from arrivals');
  const navigation={action:'reschedule',apptId:calendar.id};flushSync(()=>root.render(<ClinicCalendar db={{...base,appts:[calendar]}} setDb={()=>{}} me={{role:'assistant',id:'fixture-assistant'}} navigation={navigation} onNavigationHandled={()=>{}}/>));await frame();await frame();assert(document.body.textContent.includes('Reschedule appointment'),'Calendar navigation must open editing, not create a second booking');
  return {passed:true,checks:['native product selection after validation','matching vaccine family','real lot/metadata autofill','expired lots excluded','automatic interval and due date','one administration','approval invalidation','custom interval validation','draft recovery','young-patient warning','past arrivals retained','arrived visits excluded','targeted reschedule','reviewed no-show and server acknowledgement','calendar reschedule editing']};
 }finally{flushSync(()=>root.unmount());api.get=originalGet;api.post=originalPost;window.fetch=originalFetch;if(oldDraft===null)localStorage.removeItem(key);else localStorage.setItem(key,oldDraft);}
}
window.vaccinationArrivalsResult=run().then(result=>{document.getElementById('results').textContent=JSON.stringify(result,null,2);return result;}).catch(error=>{document.getElementById('results').textContent=error.stack;throw error;});
