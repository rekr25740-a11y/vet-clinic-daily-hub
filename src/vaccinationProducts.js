// Existing clinic protocol brands. Lots are supplied by the clinic, never generated.
export const VACCINATION_REFERENCE='https://wsava.org/wp-content/uploads/2024/04/WSAVA-Vaccination-guidelines-2024.pdf';
export const DEFAULT_VACCINATION_PRODUCTS=[
 {id:'defensor-3',name:'Defensor 3',vaccines:['Anti-rabies'],species:['Canine','Feline'],manufacturer:'',minAgeDays:84,boosterDays:365,primaryDoses:1,primaryIntervalDays:28,lots:[]},
 {id:'vanguard-plus-5',name:'Vanguard Plus 5',vaccines:['5-in-1'],species:['Canine'],manufacturer:'',minAgeDays:42,boosterDays:365,primaryDoses:2,primaryIntervalDays:28,lots:[]},
 {id:'felocell-4',name:'Felocell 4',vaccines:['Feline 4-in-1'],species:['Feline'],manufacturer:'',minAgeDays:84,boosterDays:365,primaryDoses:2,primaryIntervalDays:28,lots:[]},
 {id:'bronchi-shield-oral',name:'Bronchi-Shield Oral',vaccines:['Kennel cough'],species:['Canine'],manufacturer:'',minAgeDays:56,boosterDays:365,primaryDoses:1,primaryIntervalDays:28,lots:[]},
];
export const vaccinationProductChoices=response=>Array.isArray(response.vaccinationProducts)?response.vaccinationProducts:DEFAULT_VACCINATION_PRODUCTS;
export const patientSpecies=species=>/^(dog|canine)$/i.test(species || '')?'Canine':/^(cat|feline)$/i.test(species || '')?'Feline':species;
export const matchingVaccinationProducts=(products,vaccine,species)=>products.filter(p=>p.vaccines.includes(vaccine)&&p.species.includes(patientSpecies(species)));
