/**
 * Created by cool.blue on 24/07/2016.
 */

module.exports = listenAll;

const outputError = new TypeError('log-events un-supported output type');
var fs = require('fs');
var util = require('util');
var now = require('moment');
var _pad = require('left-pad');
var stream = require('stream');
var ESC    = '\x1b[',
    gEND   = "m",
    allOFF = `${ESC}0m`,
    BOLD   = '1',
    WHITE  = '37',
    GREEN  = '32',
    YELLOW = '33',
    BLUE   = '34';

function stamp() {
    var t    = process.hrtime()[1].toString(),
        T = now(Date.now()).format("HH:mm:ss"),
        msec = t.slice(0, 3),
        usec = t.slice(3, 6),
        nsec = t.slice(6, 9),
        pad  = '000';
    usec = pad.substring(0, pad.length - usec.length) + usec;
    var ret = T + ":" +  msec + ":" + usec + ":" + nsec;
    return ret
}
function listenAll(output) {
    var _w = 0, _w2 = 0;
    var fd, _logStream;

    if(_logStream = output) {
        if(!(output instanceof require("events") && typeof output.write === 'function')) {
            // not a write stream
            if(typeof output === 'string')
                _logStream = fs.createWriteStream(output);
            else
                throw outputError;
        }
        _logStream.on('finish', function() {
            console.log('file has been written');
        });
    }
    var _log = (() => _logStream ? m => _logStream.write(m + '\n') : console.log.bind(console))();

    function _listenAll(host, events, excl) {
        _w = Math.max(_w, host.name ? host.name.length : 0);
        var _excl = excl ? Array.isArray(excl) ? excl : [excl] : excl;
        events
            .forEach(function(e) {
                _w2 = Math.max(e.length, _w2);
                if(!_excl || !_excl.find(x => x === e))
                    host.on(e, function(evt) {
                        _log(`${ESC}${BOLD};${YELLOW}m${stamp()}\t${_pad(host.name, _w)} --> ${e}${ESC}m`)
                    })
            })
    }

    return {
        open: _listenAll,
        close: function() {
            if(!_logStream.ended) _logStream.end()
        },
        stamp: stamp
    }
}

if(process.env.NODE_ENV === 'test') {
    module.exports.errors = {outputError: outputError};
}
