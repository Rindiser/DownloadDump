const fetch = require('node-fetch');

// let norwegianName = "fiskesluovvaraš"
let norwegianName = "fjellrev"
let latinName = ""
let artsObsNumber = ""

const transelateKeyMap = new Map();
transelateKeyMap.set('#Dummy1', 'Museum');
transelateKeyMap.set('#Dummy2', 'Løpenummer');
transelateKeyMap.set('#Dummy3', 'UUID');
transelateKeyMap.set('catalogNumber', 'Artsobservasjon nr.');
transelateKeyMap.set('#Dummy4', 'Navn_Usikkerhet');
transelateKeyMap.set('acceptedScientificName', 'Vitenskapelig navn');
transelateKeyMap.set('#Dummy5', 'Norsk navn');
transelateKeyMap.set('#Dummy6', 'Kommentar (bestemmelse)');
transelateKeyMap.set('municipality', 'Administrativt sted/kommune');
transelateKeyMap.set('locality', 'Lokalitet');
transelateKeyMap.set('geodeticDatum', 'Datum');
transelateKeyMap.set('latLongCoords', 'Koordinater');
transelateKeyMap.set('#Dummy7', 'Koordinat - usikker');
transelateKeyMap.set('#Dummy8', 'Koordinater bestemt i ettertid');
transelateKeyMap.set('coordinateUncertaintyInMeters', 'Koordinat-presisjon (m)');
transelateKeyMap.set('habitat', 'Økologi');
transelateKeyMap.set('#Dummy9', 'Kartblad');
transelateKeyMap.set('#Dummy10', 'Høyde over havet (m)');
transelateKeyMap.set('#Dummy11', '');
transelateKeyMap.set('recordedBy', 'Innsamlere');
transelateKeyMap.set('eventDate', 'Innsamlingsdato');
transelateKeyMap.set('#Dummy12', 'Høyde - usikker');
transelateKeyMap.set('feil', 'NEI');
/*
transelateKeyMap.set('', '');
transelateKeyMap.set('', '');
transelateKeyMap.set('', '');
transelateKeyMap.set('', '');
transelateKeyMap.set('', '');
transelateKeyMap.set('', '');
*/

function reverseCollectors(fullname) {

    var names = fullname.split(' ');
    if (names.length > 2) {
        output = names[names.length - 1] + ', ' + names[0] + ' ' + names.slice(1, -1).join(' ')
      }
      else if (names.length < 2) {
        output = names[0]
      }
      else {
        output = names[names.length - 1] + ', ' + names[0]
      }
      console.log(output);
return output
}
// console.log(reverseCollectors("Bjørn Løfall"))

async function getArtsObsData(artsObsNumber) {
    // 'https://api.gbif.org/v1/occurrence/search?dataset_Key=b124e1e0-4755-430f-9eab-894f25a9b59c&catalogNumber=21957795'
    let url = 'https://api.gbif.org/v1/occurrence/search?dataset_Key=b124e1e0-4755-430f-9eab-894f25a9b59c&catalogNumber=' + artsObsNumber; 
    let obj = null;
    let resultObj = null
    let resultString = ''
    let collArray = []
    let tempColl = ''
    let collString = ''
    try {
        obj = await (await fetch(url)).json();
        resultObj = obj.results[0]
        obj = null
        // console.log(resultObj);
        // fix ArtsObs entries
        let Koordinater = 'lat=' + resultObj.decimalLatitude + '&' + 'lon=' + resultObj.decimalLongitude
        resultObj.latLongCoords = Koordinater

        // fix dato, fjern alt etter T
        let fixedDate = resultObj.eventDate
        fixedDate = fixedDate.substring(0,fixedDate.search('T'))
        resultObj.eventDate = fixedDate
        // fix collector
        let fixedColl = resultObj.recordedBy
        if (fixedColl.indexOf('|')) {
            collArray = fixedColl.split('|')

        } else {
            collArray = [resultObj.recordedBy]
        }
        collArray.forEach((element) => {

            tempColl = reverseCollectors(element)
            if (collString){
            collString = collString + '; ' + tempColl
            } else {
                collString = tempColl
            }

            resultObj.recordedBy = collString
        })

        for (const [key] of transelateKeyMap) {
            if (key.includes('#D')) {
                resultString = resultString + '' + '\t'
            } else if (key in resultObj) {
                resultString = resultString + resultObj[key] + '\t'
            }
        }
    } catch(e) {
        console.log(e);
        console.log('feil feil');
    }
    // parse obj

console.log(resultString);
}



async function getLatinName(norwegianName) {
    let url = 'https://artsdatabanken.no/api/Resource/?Type=taxon&Name=' + norwegianName;
    let obj = null;
    
    try {
        obj = await (await fetch(url)).json();
    } catch(e) {
        console.log(e);
        console.log('feil feil');
    }
    if (Object.keys(obj).length < 2) {
        try {
        latinName = obj[0].AcceptedNameUsage.ScientificName
        console.log(latinName);
        } catch {
            console.log('prøv noe annet');
        }
    } else {
        for (const [key, value] of Object.entries(obj)) {
            console.log(`${key}: ${value.VernacularName}`);
          }
    }
}


const getRedlistStatus = async (latinName, redlistYear) => {
        try {
            redlistYear = 'Rødliste ' + redlistYear
           let obj = null
            const url = 'https://www.artsdatabanken.no/Api/Taxon/ScientificName?ScientificName=' + latinName
            obj = await (await fetch(url)).json();
            const redlistObj = {}
            const apiItems = ['RedlistVersion', 'Status', 'Area']
            const tempArray = []
            let n = 1
            if (Object.keys(obj).length < 2) {
                    for (let i = 0; i < Object.keys(obj[0].dynamicProperties).length; i++) {
                        if(obj[0].dynamicProperties[i].Name ===  'Kategori') {
                            
                            for (let j = 0; j < Object.keys(obj[0].dynamicProperties[i].Properties).length; j++) {
                                if(obj[0].dynamicProperties[i].Properties[j].Name  === 'Kontekst' && obj[0].dynamicProperties[i].Properties[j].Value === redlistYear){
                                    const redlistVersion = obj[0].dynamicProperties[i].Properties[j].Value
                                    const redlistCategory = obj[0].dynamicProperties[i].Value
                                    let redlistArea = ''

                                    for (let k = 0; k < Object.keys(obj[0].dynamicProperties[i].Properties).length; k++) {
                                        if(obj[0].dynamicProperties[i].Properties[k].Name  === 'Område'){
                                            redlistArea = obj[0].dynamicProperties[i].Properties[k].Value
                                        }
                                    }
                                    redlistObj[n] = {}
                                    redlistObj[n][apiItems[0]] = redlistVersion
                                    redlistObj[n][apiItems[1]] = redlistCategory
                                    redlistObj[n][apiItems[2]] = redlistArea
                                    n++
                                } 

                            }

                        }
                    }
            }
            console.log(redlistObj);
        } catch (error) {
           console.log(error);
        }
        
}


getArtsObsData(28215006) // 28215006 2213006
// getLatinName(norwegianName)
// getRedlistStatus('vulpes lagopus', '2015')