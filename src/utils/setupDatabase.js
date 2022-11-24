const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const readline = require('readline')
const papa = require('papaparse')
const fileList = require('./../../../NHM-portaler/src/utils/fileListNhm')
const csvParser = require('csv-parser')
const languageEncoding = require('detect-file-encoding-and-language')
const { join } = require('path')


