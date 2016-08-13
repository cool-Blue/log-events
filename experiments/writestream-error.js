/**
 * Created by cool.blue on 12-Aug-16.
 */
const fs = require('fs');

const outFile = './nonexistent/output/out-file.txt';
var outStream = fs.createWriteStream(outFile);
outStream.on('error', function(e) {
    console.log('emited:\n' + e)
});
// no cb on createWriteStream or WriteStream.open
// so no callback to write on error.
// the write method is inherited from stream.Writable
// which is unaware of the open behaviour
outStream.write("some text", "utf8", function(e) {
    console.log('write cb:\n' + e)
});
