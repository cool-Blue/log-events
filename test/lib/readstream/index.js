/**
 * Created by cool.blue on 8/1/2016.
 */
const fs      = require('fs'),
      path    = require('path'),
      util    = require('util');

function log(m){ }

module.exports = readAll;

function readAll(next) {
    var stream = this;
    var body = "";

    if(!stream.path) {

    }

    function readChunk(fromreadit) {
        var chunk;
        chunk = stream.read();
        body += chunk;
        log(arguments.callee.name
            + ':\tended:\t' + stream._readableState.ended
            + ':\tchunk:\t' + chunk)
    }

    function onClose(fromreadit) {
        log(arguments.callee.name)
        stream.removeListener('readable', readChunk);
        stream.removeListener('close', onClose);

        next.bind(stream)(body)
    }

    stream
        .on('readable', ((onreadable) => {
            return readChunk
        })())
        .on('close', ((onclose) => {
            return onClose
        })());
    log(arguments.callee.name + ':\treadable and close bound' + ':\tended:\t' + stream._readableState.ended)

    return stream;
}