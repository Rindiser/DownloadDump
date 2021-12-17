const fetch = require('node-fetch');

// let norwegianName = "fiskesluovvaraš"
let norwegianName = "fjellrev"
let latinName = ""

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



// getLatinName(norwegianName)
getRedlistStatus('vulpes lagopus', '2015')