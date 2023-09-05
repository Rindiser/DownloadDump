// to-do
// automatic for all classes in a phylum - done
// legg inn "Species" i header på fil
// transfer all files
// automatic for all phyla: test
// send to Ann-Helén and Lutz
// check against dump


const xlsxReader = require('xlsx')
const fs = require('fs')
const csvParser = require('csv-parser')
const readline = require('readline')
const papa = require('papaparse')

function makeListOfFolders (motherFolder) {
    let array = []
    fs.readdirSync(motherFolder).forEach(file => {
        if (!file.includes('.csv') && !file.includes('.xlsx'))
        array.push(file)
    })
    return array
}


// lists of classes in each phylum
// go through class-list and make csv-file
async function loopThroughPhyla(phyla) {
    return new Promise(function (resolve, reject) {
        try {
            // phyla.forEach(phylumEl => {
                // const classFolder = `./../../../../../BGE_files/${phylumEl}`
                const classFolder = `./../../../../../BGE_files/other-krepsdyr-phyla`
                classes = makeListOfFolders(classFolder)
                console.log(classes)
                classes.forEach(el => {
                    // const folder = `./../../../../../BGE_files/${phylumEl}/${el}`
                    const folder = `./../../../../../BGE_files/other-krepsdyr-phyla/${el}`
                    const arrayOfFolders = []

                    
                    ////make list of files in a folder
                    fs.readdirSync(folder).forEach(file => {
                        if (!file.includes('.csv') && !file.includes('.xlsx'))
                        arrayOfFolders.push(file)
                    })
                    
                    // const toCsvFile = `./../../../../../BGE_files/${phylumEl}/${el}/BGE_gapSpecies_${el}.csv`
                    const toCsvFile = `./../../../../../BGE_files/other-krepsdyr-phyla/BGE_gapSpecies_other-krepsdyr-phyla.csv`
                    fs.writeFileSync(toCsvFile,'')
                    // make a list of files from all folders
                    const arrayOfFiles = []
                    console.log(arrayOfFolders)
                    arrayOfFolders.forEach(MFolder => {
                        
                        // fs.readdirSync(`./../../../../../BGE_files/${phylumEl}/${el}`).forEach(file => {
                        fs.readdirSync(`./../../../../../BGE_files/other-krepsdyr-phyla/${el}/${MFolder}`).forEach(file => {
                            arrayOfFiles.push(`${MFolder}/${file}`)
                        })
                    })
                    console.log(arrayOfFiles)
                    let fileCount = 0
                    let logger = fs.createWriteStream(toCsvFile, {
                        flags: 'a' // means append
                    })
                   
                    arrayOfFiles.forEach(file => {
                        const localFile = xlsxReader.readFile(`./../../../../../BGE_files/other-krepsdyr-phyla/${el}/${file}`)
                        let data = []
                    // convert to json
                        const temp = xlsxReader.utils.sheet_to_json( 
                            localFile.Sheets[localFile.SheetNames[0]]) // skal det stå "file" her?
                        let count = 0
                        temp.forEach((res) => {
                            if (count > 1) {
                                data.push(res)
                            }
                            count++
                        })
                        // write headers into csv-file
                        // if (fileCount === 0) {
                        //     xlsxReader.utils.sheet_add_aoa(localFile.Sheets[localFile.SheetNames[0]],[[data]],{origin: -1})
                        //     csv = xlsxReader.utils.sheet_to_csv(localFile.Sheets[localFile.SheetNames[0]])
                        //     let arr = csv.split('\n')
                        //     // arr[3].replace('Family,,','Family,Species')
                        //     logger.write(arr[3].replace(',','').replace('Family,,','Family,Species,'))
                            
                        //     logger.write('\n')
                        // }
                        if(data.length > 0) {
                            // Add data from an array of arrays to an existing worksheet
                            xlsxReader.utils.sheet_add_aoa(localFile.Sheets[localFile.SheetNames[0]],[[data]],{origin: -1})
                            csv = xlsxReader.utils.sheet_to_csv(localFile.Sheets[localFile.SheetNames[0]])
                            let arr = csv.split('\n') // an array with each file as an element
                            
                            for (i=4;i<arr.length;i++) {
                                if (!arr[i].includes("Object")) {
                                    logger.write(arr[i].replace(',','')+'\n')
                                    // logger.write('\n')
                                }
                            }
                        }
                        fileCount++
                    })
                    
                })
            // })
            resolve('success')
        } catch (error) {
            reject(new Error(error))
            console.log(error)
        }
    })
    
}

const pathToCoremaDumpsForPortal = './../../../../coremaDumper_forPortal/'
const pathToMusitDumps = './../../../../musitDumps/'
const pathToStitched = './../../../../test/src/data/nhm/'

async function searchDump(dumpFile,species) {
// async function searchDump(dumpFile,species,callback) {

    return new Promise(function (resolve, reject) {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(dumpFile),
            console: false
        })
        let count = 0
        let resultCount = 0
        let termsArray = [species]
        headerTerms = ['scientificName','recordedBy','eventDate','country','stateProvince','county','locality','recordNumber','typeStatus','associatedMedia']
        let headers = []
        console.log(species)
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                results = line
                headers = line.split('\t')
            } else {
                let lineArray = line.split('\t')
                // for entomology: name
                // let name = lineArray[25] + ' ' + lineArray[26]
                // console.log(name)
                
                    // if(name.toLowerCase() === 'Tegenaria atrica') 
                if (lineArray[2].toLowerCase().indexOf(String(termsArray[0]).toLowerCase()) !== -1) {
                    // if (lineArray[2].toLowerCase() === species.toLowerCase()) {
                        // console.log('linje 130 ' +line)
                        if (species === "Ixodes ricinus") {console.log(line)}
                        results =  results +  '\n' + line
                        resultCount++  
                    // }
                    // console.log('hit')
                }
                
            }
        }).on('close', function () {
            // const resulstAndLine = {results, count }
            // console.log(results)
            // callback(undefined,results)
            if (results.length > 2194) {
                resolve (results)
            } else {
                resolve('no data')
            }

            
        })
    })
}

const getArray = async (csvFile,speciesArray,dumpFile,outfile) => {
    return new Promise(function (resolve, reject) {
            fs.createReadStream(csvFile)
                // .pipe(csvParser({ "separator": "," }))
                .pipe(csvParser({ "separator": ";" }))
                
                .on('data', (row) => {
                    speciesArray.push(row.Species)
                }).on('end', () => {
                    resolve(speciesArray)
                    // for await (const el of speciesArray) {
                    //     searchDump(dumpFile,String(el),(error, results) => {
                    //         fs.writeFileSync(outfile, results)
                    //     })
                    // }
                    
                    // resolve('success')
                })
    })
}
// check against dump
async function checkAgainstDump(group,csvFile,dumpFile) {
    // turn csv into array of objects, one object for each species
    // return new Promise(function (resolve, reject) {
        try {
            outfile = `./outfile_${group}.txt`
            let speciesArray = []
            speciesArray = await getArray (csvFile,speciesArray,dumpFile,outfile)
            console.log(speciesArray)
             for (let i=0; i<speciesArray.length; i++) {
                // console.log(speciesArray[i])
                const result = await searchDump(dumpFile,String(speciesArray[i]))
                if (result != "no data") {
                    fs.writeFileSync(`./outfile_${group}_${speciesArray[i]}.txt`, result)
                } 
                // else {
                //     fs.writeFileSync(`./outfile_${group}_${speciesArray[i]}.txt`, 'appearantly no data')
                // }
                    // await searchDump(dumpFile,String(speciesArray[i]),(error, results) => {
                    //             fs.writeFileSync(outfile, results)
                    //         })
            }
            // speciesArray.forEach(el => {
            //     // result = new Promise(resolve => {
            //         searchDump(dumpFile,String(el),(error, results) => {
            //             fs.writeFileSync(outfile, results)
            //         })
            //         // , resolve
            //     // })
            // })
        } catch (error) {
            // reject(new Error(error))
            console.log(error)
        }
    // })
}

async function mainBGE() {
    // make list of phyla
    const phylaFolder = './../../../../../BGE_files'
    // const phyla = makeListOfFolders(phylaFolder)
    // await loopThroughPhyla("other-krepsdyr-phyla")
    // await loopThroughPhyla(phyla)
    // await checkAgainstDump(`${phylaFolder}/Chordata/Aves/BGE_gapSpecies_Aves.csv`,`./../../../../test/src/data/nhm/birds_stitched.txt`)
    // await checkAgainstDump('Mammalia',`${phylaFolder}/Chordata/Mammalia/BGE_gapSpecies_Mammalia.csv`,`./../../../../test/src/data/nhm/mammals_stitched.txt`)
    // await checkAgainstDump('Insecta',`${phylaFolder}/Arthropoda/Insecta/BGE_gapSpecies_Insecta.csv`,`./../../../../test/src/data/nhm/entomology_stitched.txt`)
    // await checkAgainstDump('Branchiopoda',`${phylaFolder}/Arthropoda/Branchiopoda/BGE_gapSpecies_Branchiopoda.csv`,`./../../../../test/src/data/nhm/entomology_stitched.txt`)
    // await checkAgainstDump('Krepsdyr',`${phylaFolder}/Krepsdyr-lister/BGE_gapSpecies_krepsdyr.csv`,`./../../../../test/src/data/nhm/krepsdyr_fra_aase.txt`)
    await checkAgainstDump('non-insect-arthropods',`${phylaFolder}/non-insect-arthropods/BGE_gapSpecies_non-insect-arthropods.csv`,`./../../../../test/src/data/nhm/entomology_stitched.txt`)
    // await checkAgainstDump('other-krepsdyr-phyla',`${phylaFolder}/other-krepsdyr-phyla/BGE_gapSpecies_other-krepsdyr-phyla.csv`,`./../../../../test/src/data/nhm/krepsdyr_fra_aase.txt`)
}

mainBGE()



