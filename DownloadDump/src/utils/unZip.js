// https://www.npmjs.com/package/adm-zip

const AdmZip = require('adm-zip');

// reading archives
   const zip = new AdmZip('./src/data/algae_o.zip');
//    // extracts everything
   zip.extractAllTo("./src/data/unzip/", true)

   