const fetch = require('node-fetch');

let norwegianName = "fiskesluovvaraš"
let latinName = ""

async function load() {
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

load()