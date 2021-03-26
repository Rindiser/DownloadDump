const readline = require('readline');
const fs = require('fs');
const fileList = require('./fileList');
const path = 'src/data/renamed/nhm/'
console.log('vi starter');
let OutFile = 'Person&ID'




const getNamesID = (path,occuranceFile) => {
    occuranceFile = path + occuranceFile + '_occurrence.txt'
    console.log(occuranceFile);
    if (fs.existsSync(occuranceFile)) {
        // 1. let igjennom resourcerelationship og plukk ut alle MUSI Tnr. og alle UUIDer
        const readInterface = readline.createInterface({
            input: fs.createReadStream(occuranceFile),
            console: false
        })
        
        let count = 0  
        let currentLine = []
        let nameArray = []
        let tempLine = ''
        let exstraNames = []
        let tempName = {}
        let uniqueNames = ''

        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                // header row 
    
                let Header = line.split('\t')
                indexOfRecordedBy = Header.indexOf('recordedBy')
                indexOfRecordedByID = Header.indexOf('recordedById')
                indexOfIdentifiedBy = Header.indexOf('identifiedBy')
                indexOfIdentifiedByID = Header.indexOf('identifiedById')

            } else {
                currentLine = line.split('\t')
                if (currentLine[indexOfRecordedBy].includes(',') || currentLine[indexOfIdentifiedBy].includes(',') ){
                    // exstraNames = urrentLine[indexOfRecordedBy].split(',')
                    // console.log(currentLine[indexOfRecordedBy]);
                //    tempLine = exstraNames[]
                } else {
                    if(currentLine[indexOfRecordedByID]){
                        // legg til i objektet
                        tempName[currentLine[indexOfRecordedByID]] = currentLine[indexOfRecordedBy]
                    }
                    if (currentLine[indexOfIdentifiedByID]){
                         // legg til i objektet
                        tempName[currentLine[indexOfIdentifiedByID]] = currentLine[indexOfIdentifiedBy]
                    }
                }
            

            }
        }).on('close', function () {
            for (const property in tempName) {
                uniqueNames = uniqueNames + property + '\t' + tempName[property] + '\n'
              }


            OutFile = path + OutFile + '.txt'
            const writeStream = fs.createWriteStream(OutFile);
            const pathName = writeStream.path;
            writeStream.write(uniqueNames)
            writeStream.end()
            
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                tsvItems = ''
                });
        
                // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });
        })
    }
}

getNamesID(path, fileList[3].name, OutFile)
