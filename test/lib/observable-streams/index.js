/**
 * Created by cool.blue on 07-Aug-16.
 */

const fs          = require('fs'),
      WriteStream = fs.WriteStream,
      ReadStream  = fs.ReadStream,
      readAll     = require('../readstream'),
      util        = require('util');

var log = function(m){ };
['h1', 'h2', 'h3'].reduce(function(res, s){
    return (res[s] = log, res)
}, log);

util.inherits(ObservableWriteStream, WriteStream);

exports.ObservableWriteStream = ObservableWriteStream;

function ObservableWriteStream(path, options) {

    if(!(this instanceof ObservableWriteStream))
        return new ObservableWriteStream(path, options);

    WriteStream.call(this, path, options);

    this.name = "";

}

ObservableWriteStream.prototype.readAll = function owsReadAll(next) {

    var self = this;

    if(this.path) {
        // add a method onto the stream to read back the temp file once

        log(arguments.callee.name + ':\tthis.readBackStream is '
            + (this.readBackStream ? '' : 'not ') + 'set');

        readAll.bind(this.readBackStream || (this.readBackStream = this.readBack('readBack')))(next);

        process.nextTick(function() {
            log('next tick: readAll' + '\t' + 'ended:\t'
                + self.readBackStream._readableState.ended
                + '\n');
        })

    }
    else {
        // need to pipe stdout to a file in the command line and check the result
    }

    return this

};

ObservableWriteStream.prototype.readBack = function(name) {
    var s = fs.createReadStream(this.path);
    log("readBack:\tcreated");
    s.name = name;
    ghookEvents(s, gevents);
    return this.readBackStream = s
};

util.inherits(ManagedReadStream, ReadStream);

exports.ManagedReadStream = ManagedReadStream;

function ManagedReadStream(path, options) {

    if(!(this instanceof ManagedReadStream))
        return new ManagedReadStream(path, options);

    ReadStream.call(this, path, options);

    this.name = "";
}

ManagedReadStream.prototype.readAll = readAll;
