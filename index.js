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
    }

    var log = (function Fmt(log) {
        var ESC    = '\x1b[',
            gEND   = "m",
            allOFF = `${ESC}0m`,
            BOLD   = '1',
            WHITE  = '37',
            RED  = '31',
            GREEN  = '32',
            YELLOW = '33',
            BLUE   = '34';
        var options = {
            h1: m => `\n${ESC}${BOLD};${RED}m${stamp()}${m}${allOFF}`,
            h2: m => `${ESC}${BOLD};${BLUE}m${stamp()}${m}${allOFF}`,
            event: (h, w, e) => `${ESC}${BOLD};${YELLOW}m${stamp()}\t${_pad(h, w)} --> ${e}${ESC}m`
        };
        var endFlag;

        function l(m){
            log(`${stamp()}${m}`);
            endFlag = false;
        }

        return Object.keys(options).reduce(
            function(res, k) {
                var isStart = /.*start:/;
                var isEnd = /.*end:/;
                res[k] = function(m) {
                    var s = m.match(isStart);
                    var e = m.match(isEnd);
                    log(((s && !endFlag) ? "\n" : "")
                        + options[k].apply(this, arguments) + (e ? "\n" : ""));
                    endFlag = (s || e) ? e : endFlag;
                };
                return res
            }, l
        )

    })(
        (() => _logStream ? m => _logStream.write(m + '\n') : console.log.bind(console))()
    );

    function _listenAll(host, events, excl) {
        _w = Math.max(_w, host.name ? host.name.length : 0);
        var _excl = excl ? Array.isArray(excl) ? excl : [excl] : excl;

        function CallBack (type, action) {

            if(!(this instanceof CallBack))
                return new CallBack(type, action);

            this.listener = function callBack() {
                log.event(host.name, _w, type);
                if(action) action.apply(host, arguments)
            };
        }

        events
            .forEach(function(x) {

                var type, action, add_remove;

                if(typeof x === 'object') {
                    type = x.type;
                    action = x.action;
                    add_remove = x.add_remove
                } else {
                    type = x
                }

                var cb = CallBack(type, action);

                if(add_remove === false)
                    return host.removeListener(type, cb.listener);

                _w2 = Math.max(type.length, _w2);
                if(!_excl || !_excl.find(t => t === type))
                    host.on(type, cb.listener)
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
