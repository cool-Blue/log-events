/**
 * Created by Admin on 26/07/2016.
 */
const fs = require('fs');
const path = require('path');
const baseDir = './test';
const inputDir = '/fixtures';
const outputDir = '/output';
var inStream = fs.createReadStream(path.join(baseDir, inputDir, 'input.txt'));
var outStream = fs.createWriteStream(path.join(baseDir, outputDir, 'output.txt'));
inStream.pipe(outStream);
