import {dewormingProducts} from './dewormingProducts.js';
import {vaccinationProducts} from './vaccinationProducts.js';
// An administration ID is a record reference, never a manufacturer lot.
export function resolveAdministrationLot(vaccination,date,products){
 if(!vaccination)return vaccination;
 const deworming=vaccination.vaccine==='Deworming';
 if(!deworming&&!vaccination.vaccinationProductId)return vaccination;
 products ??= deworming?dewormingProducts():vaccinationProducts();
 vaccination={...vaccination,batch:vaccination.batch ?? ''};
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 const productId=deworming?vaccination.dewormingProductId:vaccination.vaccinationProductId;
 const selected=products.find(p=>p.id===productId);
 if(productId && !selected)fail('The selected product is no longer available. Refresh the catalog.');
 if(!deworming&&!selected.vaccines.includes(vaccination.vaccine))fail('Select a product matching the administered vaccine.');
 if(typeof vaccination.batch!=='string' || vaccination.batch.length>60)fail('Enter a batch / lot of no more than 60 characters.');
 const lots=(selected?.lots || []).filter(l=>l.expiresOn>=date).sort((a,b)=>a.expiresOn.localeCompare(b.expiresOn)||a.batch.localeCompare(b.batch));
 const batch=vaccination.batch.trim();
 if(selected?.lots.some(l=>l.batch===batch && l.expiresOn<date))fail('The selected lot expired before the care date. Select a current lot.');
 if(lots.length && batch && !lots.some(l=>l.batch===batch))fail('Select an available lot for this product.');
 const savedBatch=batch || lots[0]?.batch || '';
 const lot=lots.find(l=>l.batch===savedBatch);
 return {...vaccination,brand:selected?.name || vaccination.brand,batch:savedBatch,...(!deworming?{manufacturer:selected.manufacturer || vaccination.manufacturer || '',serialNumber:lot?.serialNumber || vaccination.serialNumber || ''}:{})};
}
