import {boosterDate} from './clinicalWorkflow.js';
import {vaccineFamily} from './vaccinationDue.js';
import {matchingVaccinationProducts} from './vaccinationProducts.js';
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
// Suggestions require a known patient and product; the veterinarian still approves.
export function vaccinationSchedule({date,birth,species,vaccine,product,history=[]}){
 if(!validDate(date)||!validDate(birth)||birth>date||!product||!matchingVaccinationProducts([product],vaccine,species).length)return null;
 const age=(Date.parse(date)-Date.parse(birth))/86400000;
 if(age<product.minAgeDays)return null;
 const core=['canine-core','feline-core'].includes(vaccineFamily(vaccine));
 const prior=history.filter(v=>v.done===true&&v.vetId&&v.date<=date&&vaccineFamily(v.vaccine)===vaccineFamily(vaccine))
  .sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt || '').localeCompare(String(a.createdAt || ''))||String(b.id).localeCompare(String(a.id)))[0];
 const continuing=prior&&Number.isInteger(prior.doseNo)&&Number.isInteger(prior.doseOf)&&prior.doseNo<prior.doseOf;
 const doseNo=continuing?prior.doseNo+1:1;
 const doseOf=continuing?prior.doseOf:core&&age<112?Math.max(product.primaryDoses,1+Math.ceil((112-age)/28)):!prior?product.primaryDoses:1;
 const primary=doseNo<doseOf;
 const intervalDays=core&&age<112?28:primary?product.primaryIntervalDays:core&&age<182?182-age:product.boosterDays;
 const nextDue=boosterDate(date,intervalDays);
 if(!nextDue)return null;
 return {intervalDays:String(intervalDays),nextDue,doseNo:String(doseNo),doseOf:String(doseOf),reason:core&&age<112?'Juvenile core series · repeat in 4 weeks':primary?'Product primary series · next administration':core&&age<182?'Core revaccination at 26 weeks of age':'Clinic product protocol · review label and local requirements'};
}
