//https://www.npmjs.com/package/node-fetch

const fetch = require('node-fetch');
const fs = require('fs')
const fileList = require('./utils/fileList')
const AbortController = require('abort-controller')
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)



const controller = new AbortController();
const timeout = setTimeout(
  () => { controller.abort(); },
  150,
);
 

function checkStatus(res) {
    if (res.ok) { // res.status >= 200 && res.status < 300
       return res;
    } else {
        throw MyCustomError(res.statusText);
    }
}


 for (i = 0, len = fileList.length; i < len; i++) {
    let fileName = './src/data/' + fileList[i].name + '.zip'

fetch(fileList[i].file) //, { signal: controller.signal })
fetch(fileList[i].file)
.then(checkStatus)
.then(res => {
    const dest = fs.createWriteStream(fileName);
    res.body.pipe(dest);
})
.catch((e) => {
    if (error.code === 20) { // abort occurred
        console.log('aborted');
        // Do something after abort occurred
    }
})

// async function download () {
//     const response = await fetch(fileList[i].file, { signal: controller.signal })
//     if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
//     await streamPipeline(response.body, fs.createWriteStream(fileName))
//   }
// download ()
  
  // 
}
