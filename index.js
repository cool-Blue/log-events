/**
 * Created by cool.blue on 24/07/2016.
 */

module.exports = LogEvents;

const outputError = new TypeError('log-events un-supported output type');
const collisionError = new ReferenceError('');

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
function colourLog(log) {
    log = log || console.log;

    var ESC    = '\x1b[',
        gEND   = "m",
        allOFF = `${ESC}0m`,
        BOLD   = '1',
        WHITE  = '37',
        RED  = '31',
        GREEN  = '32',
        YELLOW = '33',
        BLUE   = '34',
        CLEAR_SCREEN = `${ESC}2J`;
    var _prefix = true;
    var _fancy = true;
    var options = {
        h1: function(m){return `\n${ESC}${BOLD};${RED}m${prefix()}${m}${allOFF}`},
        h2: (m) => `${ESC}${BOLD};${BLUE}m${prefix()}${m}${allOFF}`,
        event: (h, w, e) => `${ESC}${BOLD};${YELLOW}m${prefix()}\t${_pad(h, w)} --> ${e}${allOFF}`,
        cls: () => `${CLEAR_SCREEN}`
    };
    var endFlag;

    function prefix() {
        return _prefix  ? stamp() : ""
    }

    function l(m){
        log(`${stamp()}${m}`);
        endFlag = false;
    }
    l.prefix = function(noStamp_stamp){
        _prefix = !noStamp_stamp;
        return this
    };
    l.color = function(noColor_color){
        _fancy = !noColor_color;
        return this
    };

    return Object.keys(_fancy ? options : []).reduce(
        function(res, k) {
            var isStart = /.*start:/;
            var isEnd = /.*end:/;
            res[k] = function(m) {
                m = m || "";
                var s = m.match(isStart);
                var e = m.match(isEnd);
                log(((s && !endFlag) ? "\n" : "")
                    + options[k].apply(this, arguments) + (e ? "\n" : ""));
                endFlag = (s || e) ? e : endFlag;
            };
            return res
        }, l
    )

}
function LogEvents(output) {
    var _w = 0, _w2 = 0;
    var fd, _logStream;

    // figure out if the output can be logged with console.log or writeStream
    if(_logStream = output) {
        if(!(output instanceof require("events") && typeof output.write === 'function')) {
            // not a write stream
            if(typeof output === 'string')
                _logStream = fs.createWriteStream(output);
            else
                throw outputError;
        }
    }

    var log = colourLog(
        _logStream ? m => _logStream.write(m + '\n') : console.log.bind(console)
    );

    function _listenAll(host, events, excl) {
        _w = Math.max(_w, host.name ? host.name.length : 0);
        var _excl = excl ? Array.isArray(excl) ? excl : [excl] : excl;

        var reg = host.__logEvents = host.__logEvents ? host.__logEvents : {};

        events
            /**
             * the events can be names or objects
             * the object structure is
             *  @member {string} type
             *  @member {function} action - primarily for pushing chunks back for data events
             *  @member {boolean} add_remove - add if truthy, otherwise remove
             **/
            .forEach(function(x) {

                var l_0;

                // manage arguments
                var type, action, add_remove;

                if(typeof x === 'object') {
                    type = x.type;
                    action = x.action;
                    add_remove = x.add_remove
                } else {
                    type = x
                }

                function listener() {
                    log.event(host.name, _w, type);
                    if(action) action.apply(host, arguments)
                }

                if(add_remove === false) {
                    if(!reg[type]) {
                        console.warn('trying to delete non-existent event');
                        return
                    }

                    host.removeListener(type, reg[type]);
                    delete reg[type];
                    return host
                }

                _w2 = Math.max(type.length, _w2);
                if(!_excl || !_excl.find(t => t === type)){

                    // If an incoming listener is already registered
                    // attempt to remove it.  It will be replaced
                    if(l_0 = reg[type])
                        host.removeListener(type, l_0);

                    // register and bind the incoming listener
                    reg[type] = listener;
                    host.on(type, listener)
}            })
    }

    return {
        open: _listenAll,
        close: function() {
            if(!_logStream.ended) _logStream.end()
        },
        stamp: stamp,
        logger: colourLog
    }
}

if(process.env.NODE_ENV === 'test') {
    module.exports.errors = {outputError: outputError};
}
