const readline = require('readline');
const fs = require('fs')
const fileList = require('./fileList')
const statObject2 = require('./statObject')
const chalk = require('chalk');
const moment = require('moment');
const clone = require('clone');

// sett opp objekter og variable for å holde dataene som søkes opp. 
// Pga mutability problemer så lager vi ekstra objekter for å holde data som 
// vi siden knytter på hoveobjektet

// hovedobjektet der alle data blir lagret
let samlingsObj = {}
let statObject = {}
statObject = clone(statObject2) // deep clone av stat object

// variabler for å de 5 siste årene
    let thisYear = moment().format('YYYY')
    thisYear = parseInt(thisYear, 10); // gjør om thisYear til et tall
    const lastYear = thisYear - 1
    const twoYearsAgo = thisYear - 2
    const threeYearsAgo = thisYear - 3
    const fourYearsAgo = thisYear - 4


// objekter for mellomlagring av data, 
// vi bruker array av objekter da dette kan sortes senere
    let country = []
    let year = []
    let date = [
        {year: thisYear,  antall: 0},
        {year: lastYear,  antall: 0},
        {year: twoYearsAgo,  antall: 0},
        {year: threeYearsAgo,  antall: 0},
        {year: fourYearsAgo,  antall: 0},
    ]
    let collectionEvent = {
        date: {},
        collector: {}
    }
    let recordedBy = []
    let taxon = {}
    let order = []
    let family = []
    let genus = []
 
   let countryField = ""
// Teller antall ganger en key er i fila, f.eks. hvor mange ganger er land = Norge, 
// svaret er {key:value}, {Norge: 125}
// obj er et tomt obj for å lagre dataene,
// lineField er arrayLine[a], det feltet i linja som inneholder f.eks. land
const countOccurrences = (obj, lineField) => {
    if (typeof lineField === 'string') { // sjekk om feltet inneholder en string
        if (!( lineField in obj)) {
            obj[lineField] = 1;
        } else {
            obj[lineField]++;
        }
    }
    return obj
}
// gjør om objektene objektet til et array av objekter på formen [{country: 'Norway, antall: 232}]
// obj = objektet som skal transformeres på formen {{key:value}, {key:value}}
// name = keynavnet til value, skal være en string
const transformObject = (obj, name) => {
    obj = Object.entries(obj)
    let holder = []      
     for (let i = 0; i < obj.length; i++) {     
         if (!isNaN(obj[i][1])){     
             holder[i] = {
             [name]: obj[i][0],
             number: obj[i][1]
             }
         } else {
            //  console.log('transform fail');  
         }
     }
     // sorter lista fra flest til minst
     holder.sort((a, b) => (a.number < b.number) ? 1 : (a.number === b.number) ? ((a.name > b.name) ? 1 : -1) : -1 )
     return holder
   }
// funskjone for å ta ut data fra filene
// input: fileWithPath = filnavne med path som er en dump av databasen i Darwin Core format
// currentColl som er filnavn ut extention, eg. Vasular_o
async function processLineByLine(fileWithPath, currentColl) {   
    return new Promise((resolve, reject) => {
   const readInterface = readline.createInterface({
       input: fs.createReadStream(fileWithPath),
       console: false
   })

   // for å lagre databasestørrelsen
   let linesCount = 0
// går igennom fila for å finner ut hvilken kolonne de forskejllige temaene står i 

    readInterface.on('line', (line) => {    
        const  arrayLine = line.split("\t"); //lag en arry splittet på tab
        if (linesCount === 0) {
            countryField = arrayLine.indexOf('country')
            recordedByField = arrayLine.indexOf('recordedBy')
            orderField  = arrayLine.indexOf('order')
            familyField  = arrayLine.indexOf('family')
            genusField  = arrayLine.indexOf('genus')
            yearField = arrayLine.indexOf('eventDate')
            }
       if (linesCount !== 0) { // Hopp over tittellinja 
         
           if (arrayLine[yearField].includes(thisYear)) {
               date[0].antall++
           } else if (arrayLine[yearField].includes(lastYear)) {
               date[1].antall++
           }  else if (arrayLine[yearField].includes(twoYearsAgo)) {
               date[2].antall++
           }  else if (arrayLine[yearField].includes(threeYearsAgo)) {
               date[3].antall++
           }  else if (arrayLine[yearField].includes(fourYearsAgo)) {
               date[4].antall++
           } 

           //Year hent ut år fra en dato
           // hvis datoen er på dette formate 1899-07-15
           let modifiedDate
           if (arrayLine[yearField].includes('-')) {
                modifiedDate = arrayLine[yearField].substring(0,arrayLine[yearField].indexOf('-'))
                year = countOccurrences(year, modifiedDate)
            }
            // // hvis det bare er år
            //land
           country = countOccurrences(country,arrayLine[countryField])
           //innsamler
           recordedBy = countOccurrences(recordedBy,arrayLine[recordedByField])       
           //order
           order = countOccurrences(order, arrayLine[orderField])
           // family
           family = countOccurrences(family,arrayLine[familyField])
           // genus
           genus = countOccurrences(genus, arrayLine[genusField])
       }     
       linesCount++; // on each linebreak, add +1 to 'linesCount'    

    }).on('close', () => {
    //    await once(readInterface, 'close');

    console.log(chalk.blue('File processed.'));
          year = transformObject(year, 'year')
          country = transformObject(country, 'country')
          recordedBy = transformObject(recordedBy, 'recordedBy')
          order = transformObject(order, 'order')
          
          family = transformObject(family, 'family')
          genus = transformObject(genus, 'genus')
          taxon.order = order
          taxon.family = family
          taxon.genus = genus
          console.log(chalk.yellow(currentColl.name));
          
          console.log('databasestørrelse ' + linesCount);
          statObject[0].collectionEvent.date = date
          statObject[0].collectionEvent.year = year
          statObject[0].collectionEvent.collector = recordedBy
          statObject[1].geography.country = country
          statObject[3].collectionSize = linesCount
          statObject[4].taxon = taxon


           samlingsObj[currentColl.name] = statObject
           samlingsObj = JSON.parse(JSON.stringify(samlingsObj))
           samlingsObj = clone(samlingsObj)
           country.length = 0
           recordedBy.length = 0
           year.length = 0
           statObject.length = 0
           taxon.length = 0
           order.length = 0
           family.length = 0
           genus.length = 0
           
           statObject = clone(statObject2)

           // stringify JSON Object
            const jsonContent = JSON.stringify(samlingsObj);
            fs.writeFile("./src/data/renamed/statData.json", jsonContent, 'utf8', function (err) {
                if (err) {
                    console.log("An error occured while writing JSON Object to File.");
                    return console.log(err);
                }
            })
                console.log("JSON file has been saved.");
                resolve('finished');

    }).on('error', err => {
        reject(err);
    })
});
}


//hovedtall
const main = async function (file)  {
    // her skal den lese igjennom hver fila og returnere poster som er registrert siste 5 år og poster som samle inn siste 5 år
    // https://codepen.io/rustydev/pen/GBKGKG?editors=0010
    try {
    // for (i = 1, len = file.length; i < len; i++) {
        for (i = 1, len = 6; i < len; i++) {
                let currentColl = file[i]

                fileWithPath = "./src/data/renamed/" + file[i].name + "_occurrence.txt" 
                console.log(fileWithPath);
                
                if (file[i].source === 'corema') {
                    const result = await processLineByLine(fileWithPath, currentColl);
                    console.log(result)
            } else {
                console.log('musit kommer');
            }

        }
    } catch (e) {
        console.error(e);
    }
}

main(fileList)

// exportere funksjonen ut
module.exports = { 
    main
 } 