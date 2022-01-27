const fs = require('fs')
const mkdirp = require('mkdirp')
const chalk = require('chalk');
const folderPath =  'src/data/norskeKommuner/'

// making sure that folder exist, if not create it
const makeFolder = ()=> {
      made = mkdirp.sync('./src/data//norskeKommuner/')
      console.log(chalk.green(`made directory, ${made}`))
  }

// Lagre samlingsobjectet til fil
// input et object
// resultat_ en fil med navn statData.json på JSON format
async function saveObjectToFile(kommuneObj) {
    console.log(chalk.blue('vi lagrer....'));
    return new Promise((resolve, reject) => {
        // stringify JSON Object' 
        const jsonContent = JSON.stringify(kommuneObj);
        fs.writeFile("./src/data/norskeKommuner/kommuner.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log(chalk.red("An error occured while writing JSON Object to File."));
                return console.log(err);
            }
        })
            console.log("Kommune file has been saved.");
            resolve('finished');
    })
}
function getIndex(indexRow) {
    let indexArray = indexRow.split('\t')
    const headerObj = {}
    headerObj.fylke = indexArray.indexOf('FYLKE')
    headerObj.kommune = indexArray.indexOf('KOMMUNE')
    headerObj.stedType = indexArray.indexOf('STED_TYPE')
    headerObj.HierarchPlaceId = indexArray.indexOf('HIERARCH_PLACE_ID')
    
    return headerObj
}

// input er en tab separert txt fil
function readMUSITgeoFile (musitGeoFil) {
    let tilArray = []
    let tempKom = ''
    const kommuneObj = {}
    const tempObj = {}
    fraFil = folderPath + musitGeoFil + '.txt'
    if (!fs.existsSync(fraFil)) {
        console.log(chalk.red('fil finnes ikke'));
        return
    }
    let fraFilContent = fs.readFileSync(fraFil,'utf8');
    // fjern tomme linjer og whitespace
    fraFilContent = fraFilContent.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm,"")

    tilArray = fraFilContent.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/)
    fraFilContent = '' // tøm variabel
    const headerObj = getIndex(tilArray[0])
    console.log(headerObj);
    // fylker
    for (let index = 0; index < tilArray.length; index++) {
        if (index === 0) {
            continue
        }
        const element = tilArray[index].split('\t');
        if (element[headerObj.stedType].trim() === 'Fylke' && (element[headerObj.fylke].length > 3)){
            tempObj.fylke = element[headerObj.fylke]
            kommuneObj[tempObj.fylke] = {}
        }
    }

    for (let i = 0; i < tilArray.length; i++) {

        const element = tilArray[i].split('\t');
        if (element[headerObj.stedType].trim() === 'Kommune'){
            tempObj.fylke = element[headerObj.fylke]
            tempObj.kommune = element[headerObj.kommune]
            tempObj.stedType = element[headerObj.stedType] 
            tempObj.HierarchPlaceId = element[headerObj.HierarchPlaceId] 
            tempKom = tempObj.kommune
            kommuneObj[tempObj.fylke][tempKom] = Object.assign({}, tempObj); 
        }
    }
    saveObjectToFile(kommuneObj)
}

readMUSITgeoFile('geografi-Norge-v1')