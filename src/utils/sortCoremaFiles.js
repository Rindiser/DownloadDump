const fs = require('fs');

const coremaFile = 'src/data/test/resourcerelationship.txt'



const sortBYUUID = (coremaFile) => {
    
    const writeStream = fs.createWriteStream(coremaFile);
    const pathName = writeStream.path;

    // coremaFileContent = det som skal sorteres, 
    let coremaFileContent = fs.readFileSync(coremaFile,'utf8');
    let arrayOfContent = coremaFileContent.split('\n')
    coremaFileContent = '' // tøm variabel

    // Overskriftsraden puttes i en egen array
    const headerArray = arrayOfContent.slice(0,1)
    
    // Fjern tomme felter i array
    arrayOfContent = arrayOfContent.filter(Boolean)
    // sorts lines alphabethic as string
    arrayOfContent.sort();
    // add header to the top
    arrayOfContent.unshift(headerArray)
    arrayOfContent = arrayOfContent.flat() // for å unngå arrays inni arrays

    // write each value of the array on the file breaking line
        arrayOfContent.forEach(value => writeStream.write(`${value}\n`));
        // the finish event is emitted when all data has been flushed from the stream
        writeStream.on('finish', () => {
        console.log(`wrote all the array data to file ${pathName}`);
        });

        // handle the errors on the write process
        writeStream.on('error', (err) => {
            console.error(`There is an error writing the file ${pathName} => ${err}`)
        });

        // close the stream
        writeStream.end();
}

//  coremaFile = fila som resultatene skal skrives til
sortBYUUID(coremaFile)