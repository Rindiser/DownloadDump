const readline = require('readline');
const fs = require('fs');
const fetch = require('node-fetch');
const turfBoolean = require('@turf/boolean-point-in-polygon')
const turfDistance = require('@turf/point-to-line-distance')
const turf = require('@turf/turf')
const path = require('path');
const mkdirp = require('mkdirp')

const fileListNhm = require('../fileList');
const fileListTmu = require('../fileListTmu');
const fileListUm = require('../fileListUm');
const fileListNbh = require('../fileListNbh');
const pathToData = 'src/data/renamed/'
const chalk = require('chalk');
let kommunePolygoner = {}
const errorArray = []
const polygonfil = 'src/utils/checkCoords/polygonNorskeKommuner.json'
const testFile = 'src/utils/checkCoords/testOcc.txt'

// makingsure that renamed folder exist, if not create it
const makeFolders = ()=> {
    const museum = ['nhm','tmu','um', 'nbh']
    let made = mkdirp.sync('./src/data//renamed')
    for (let index = 0; index < museum.length; index++) {
      made = mkdirp.sync('./src/data//renamed/' + museum[index] + '/geoError/')
      console.log(chalk.green(`made directories, starting with ${made}`))
    }
  }



const getMunicipalityList = async () => {
    return new Promise((resolve, reject) => {
        const url = 'https://ws.geonorge.no/kommuneinfo/v1/kommuner'
        const norskeKommuner = []
        let options = ''
        fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
          })
          .then(response => response.json())
          .then(data => {
              for (let i = 0; i < data.length; i++) {
                  norskeKommuner.push(data[i].kommunenavnNorsk)
              }
              norskeKommuner.sort()
              for (let j = 0; j < norskeKommuner.length; j++) {
                options += '<option value="' +norskeKommuner[j] + '" />' 
              }
                  resolve(data)
          })
          .catch((error) => {
            console.error('Error:', error);
            reject(error)
          });
    })
}

const getNeighbors = async (kommuneNummer) => {
    return new Promise((resolve, reject) => {
 
    const url = 'https://ws.geonorge.no/kommuneinfo/v1/kommuner/' + kommuneNummer + '/nabokommuner'
    const naboKommuner = []
    fetch(url, {
        headers: {
            'Accept': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
            for (let j = 0; j < data.length; j++) {
                naboKommuner.push(data[j].kommunenavnNorsk)
                
            }
        resolve(naboKommuner)
      })
      .catch((error) => {
        console.error('Error:', error);
        reject(error)
      });
})
}

const getPolygonMunicipality = async (kommuneNummer) => {
    return new Promise((resolve, reject) => {
        const url = 'https://ws.geonorge.no/kommuneinfo/v1/kommuner/'+ kommuneNummer +'/omrade'

        let kommuneNavn = ''
        let options = ''
        fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
          })
          .then(response => response.json())
          .then(data => {
              kommunePolygoner[data.kommunenavn] = data
              kommuneNavn = data.kommunenavn
          })
          .then( () => {
            const neighbors = getNeighbors(kommuneNummer)
            return neighbors
          })
          .then((neighbors) =>{
            kommunePolygoner[kommuneNavn].naboer = neighbors
            resolve(kommunePolygoner)
          })
        .catch((error) => {
            console.error('Error:', error);
            reject(error)
          });
    })
  
}


const readOccuranceFile = async (occuranceFile) => {
return new Promise(function(resolve, reject) {
  try {
    console.log(chalk.green('starting:  readOccuranceFile :' + occuranceFile));
    let occuranceHeaders = []
    let errorString = ''
        // 1. let igjennom occurnceFile linje for linje, plukk ut kommuner og koordinater
        const readInterface = readline.createInterface({
            input: fs.createReadStream(occuranceFile),
            console: false
        })
        let count = 0 
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                // header row 
                occuranceHeaders = line.split('\t')
                indexOfLand = occuranceHeaders.indexOf('country')
                indexOfKommune = occuranceHeaders.indexOf('county')
                indexOfLat = occuranceHeaders.indexOf('decimalLatitude')
                indexOfLong = occuranceHeaders.indexOf('decimalLongitude')
                occuranceHeaders.push('errorDistance')
            } else {
                let item = line.split('\t')
                const conditionsArray = [
                    item[indexOfLand] === 'Norway', 
                    item[indexOfLat],
                    item[indexOfLong],
                    typeof kommunePolygoner[item[indexOfKommune]] !== 'undefined'

                ]
                if( conditionsArray.indexOf(false) === -1 ) {
                    try {
                            
                        
                        // console.log(chalk.bgRedBright('start poly'));
                        const currentPolygon = kommunePolygoner[item[indexOfKommune]].omrade.coordinates
                        let point = turf.point([ item[indexOfLong], item[indexOfLat] ])
                        let poly = turf.polygon(
                            currentPolygon[0]
                        )

                        // hvis punktet er utenfor kommunen
                        if(!turf.booleanPointInPolygon(point, poly)) {
                            const line = turf.polygonToLine(poly);
                            const distance = turf.pointToLineDistance(point, line, {units: 'kilometers'});
                            item.push(distance)
                            errorString = item.join('\t')
                            errorArray.push(errorString)
                        }
                    }
                    catch (error) {
                        // console.log(error);
                    }

                } else {
                    // console.log('nei');
                }
            }
        })
        .on('close', function () {

            let cleanArray = []

            cleanArray = errorArray.join('\n')
            // remove trailing linebreaks
            cleanArray = cleanArray.replace(/\n*$/, "");
            cleanArray = cleanArray.trim()
            
     
            const errorOutFile = path.dirname(occuranceFile) + '/' + '/geoError/' + 'KoordinatError_' + path.win32.basename(occuranceFile)

            const data = occuranceHeaders + '\n' + cleanArray
            fs.writeFileSync(errorOutFile, data)
            console.log(chalk.blue('done:  readOccuranceFile :' + occuranceFile));
            occuranceHeaders.length = 0
            cleanArray.length = 0
            errorArray.length = 0
            resolve(errorOutFile)
        })
  } catch (error) {
    reject(new Error(error)); 
  }
})
}

const makekommunePolygonfile = async () => {
    let kommuneListe = ''
    try {
    await getMunicipalityList().then((data) => kommuneListe = data)
    // await getPolygonMunicipality(5029)
    // console.log(kommuneListe);
    for (let i = 0; i < kommuneListe.length; i++) {
        await getPolygonMunicipality(kommuneListe[i].kommunenummer)
    }
    
    fs.writeFileSync(polygonfil, JSON.stringify(kommunePolygoner))
    console.log(kommunePolygoner);
    // await readOccuranceFile()
    } catch (error) {
            console.log(error);
    }
}


const loopFiles = async () => {
    const museumArray =[
        fileListNhm,
        fileListTmu,
        fileListUm,
        fileListNbh
    ]
    // console.log(museumArray);
    for (let i = 0; i < museumArray.length; i++) {
        const currentMuseum = museumArray[i];
        console.log(chalk.blue(currentMuseum[0].filMetadata.museum));
        for (let i = 1; i < currentMuseum.length; i++) {
            const collection = currentMuseum[i].name;
            console.log(collection);
            const currentFile = pathToData + currentMuseum[0].filMetadata.museum + '/' + collection + '_occurrence.txt'
            console.log(currentFile);
            await readOccuranceFile(currentFile)
            
        }    
        
    }
 
}
const main = async () => {
    try {
        let tempPolygon = fs.readFileSync(polygonfil,'utf8');
        kommunePolygoner = JSON.parse(tempPolygon)
        console.log(chalk.yellow('Polygonfil finnes'));
        makeFolders()
        await loopFiles()

    } catch (error) {
        console.log('ingen fil vi kjører makekommunePolygonfile');
        // makekommunePolygonfile()
    }

}

main()

// readOccuranceFile(testFile)