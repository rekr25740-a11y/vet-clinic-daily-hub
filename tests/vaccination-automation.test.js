import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vaccinationSchedule} from '../src/vaccinationSchedule.js';
import {DEFAULT_VACCINATION_PRODUCTS,matchingVaccinationProducts,vaccinationProductChoices} from '../src/vaccinationProducts.js';
import {vaccinationProducts} from '../server/vaccinationProducts.js';
import {resolveAdministrationLot} from '../server/administrationLot.js';
const product=DEFAULT_VACCINATION_PRODUCTS.find(p=>p.id==='vanguard-plus-5');
const input={date:'2026-10-26',birth:'2026-08-31',species:'Dog',vaccine:'5-in-1',product};
test('vaccination recommendations calculate the juvenile series and actual next care date',()=>{
 const s=vaccinationSchedule(input);assert.equal(s.intervalDays,'28');assert.equal(s.nextDue,'2026-11-23');assert.equal(s.doseNo,'1');assert.equal(s.doseOf,'3');
 const history=[{id:'previous',vaccine:'DHPP',date:'2026-10-01',done:true,vetId:'vet',doseNo:1,doseOf:3}];
 const next=vaccinationSchedule({...input,history});assert.equal(next.doseNo,'2');assert.equal(next.doseOf,'3');
 const final=vaccinationSchedule({...input,birth:'2026-06-08',history:[{...history[0],doseNo:2}]});assert.equal(final.doseNo,'3');assert.equal(final.nextDue,'2026-12-07');
});
test('adult primary and maintenance protocols distinguish prior certified care from suggestions',()=>{
 const adult={...input,birth:'2020-01-01'};
 assert.equal(vaccinationSchedule(adult).intervalDays,'28');assert.equal(vaccinationSchedule(adult).doseOf,'2');
 const historical={vaccine:'5-in-1',date:'2025-10-26',done:true,vetId:'vet',doseNo:2,doseOf:2};
 assert.equal(vaccinationSchedule({...adult,history:[historical]}).intervalDays,'365');
 for(const patch of [{done:false},{vetId:''},{vaccine:'Anti-rabies'},{date:'2027-01-01'}])assert.equal(vaccinationSchedule({...adult,history:[{...historical,...patch}]}).doseOf,'2');
 const rabies={...adult,vaccine:'Anti-rabies',product:DEFAULT_VACCINATION_PRODUCTS[0]};
 assert.equal(vaccinationSchedule(rabies).nextDue,'2027-10-26');assert.equal(vaccinationSchedule(rabies).doseOf,'1');
});
test('vaccination never invents a recommendation for missing identity, mismatched products or starting ages',()=>{
 for(const patch of [{birth:''},{birth:'2026-02-30'},{date:'2026-02-30'},{species:'Rabbit'},{product:undefined},{vaccine:'Other'},{birth:'2026-10-01'}])assert.equal(vaccinationSchedule({...input,...patch}),null);
 assert.equal(vaccinationSchedule({...input,vaccine:'Anti-rabies',product:DEFAULT_VACCINATION_PRODUCTS[0],birth:'2026-10-02'}),null);
 assert.deepEqual(matchingVaccinationProducts(DEFAULT_VACCINATION_PRODUCTS,'5-in-1','Cat'),[]);
 assert.equal(vaccinationProductChoices({}),DEFAULT_VACCINATION_PRODUCTS);assert.deepEqual(vaccinationProductChoices({vaccinationProducts:[]}),[]);
});
test('configured vaccine lots canonicalize brand/manufacturer/serial without generating identifiers',()=>{
 const p={...DEFAULT_VACCINATION_PRODUCTS[0],manufacturer:'Synthetic maker',lots:[{batch:'EXPIRED',expiresOn:'2026-10-25'},{batch:'LATER',expiresOn:'2028-01-01'},{batch:'FIRST',expiresOn:'2027-01-01',serialNumber:'REAL-SERIAL'}]};
 const v={vaccine:'Anti-rabies',vaccinationProductId:p.id,brand:'Tampered name',batch:''};
 const s=resolveAdministrationLot(v,input.date,[p]);assert.equal(s.brand,p.name);assert.equal(s.batch,'FIRST');assert.equal(s.manufacturer,p.manufacturer);assert.equal(s.serialNumber,'REAL-SERIAL');assert.equal(v.batch,'');
 assert.equal(resolveAdministrationLot({...v,batch:'LATER'},input.date,[p]).serialNumber,'');
 for(const patch of [{batch:'EXPIRED'},{batch:'made-up'},{vaccine:'5-in-1'},{vaccinationProductId:'deleted'}])assert.throws(()=>resolveAdministrationLot({...v,...patch},input.date,[p]));
 const noStock=resolveAdministrationLot(v,input.date,[{...p,lots:[]}]);assert.equal(noStock.batch,'');
 const manual={vaccine:'Anti-rabies',brand:'Actual other brand',batch:'Actual lot'};assert.equal(resolveAdministrationLot(manual,input.date),manual);
});
test('vaccination product configuration retains real stock and rejects malformed metadata',()=>{
 const previous=process.env.CLINIC_VACCINATION_PRODUCTS_JSON;
 try{delete process.env.CLINIC_VACCINATION_PRODUCTS_JSON;assert.ok(vaccinationProducts().every(p=>p.lots.length===0));
 const product={...DEFAULT_VACCINATION_PRODUCTS[0],lots:[{batch:'SYNTHETIC',expiresOn:'2027-01-01'}]};
 process.env.CLINIC_VACCINATION_PRODUCTS_JSON=JSON.stringify([product]);assert.equal(vaccinationProducts()[0].lots[0].batch,'SYNTHETIC');
 for(const patch of [{boosterDays:0},{primaryDoses:0},{minAgeDays:-1},{lots:[{batch:'BAD',expiresOn:'2026-02-30'}]},{species:[]}]){process.env.CLINIC_VACCINATION_PRODUCTS_JSON=JSON.stringify([{...product,...patch}]);assert.throws(()=>vaccinationProducts());}
 }finally{if(previous===undefined)delete process.env.CLINIC_VACCINATION_PRODUCTS_JSON;else process.env.CLINIC_VACCINATION_PRODUCTS_JSON=previous;}
});
