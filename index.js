/**
 * Created by cool.blue on 24/07/2016.
 */

module.exports = listenAll;

var fs = require('fs');
var util = require('util');
var now = require('moment');
var stream = require('stream');

function listenAll (output) {
    var _pad        = require('left-pad'),
        _w = 0, _w2 = 0;
    var fd, _logStream;

    if(output) {
        _logStream = (output instanceof require("events") && typeof output.write === 'function')
            ? output
            : fs.createWriteStream(output);
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
                        var stamp = now(Date.now()).format("HH:mm:s:SSSS");
                        _log(`${stamp}\t${_pad(host.name, _w)} --> ${e}`)
                    })
            })
    }

    return {
        open: _listenAll,
        close: function() {
            if(!_logStream.ended) _logStream.end()
        }
    }
};
