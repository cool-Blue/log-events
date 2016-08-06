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
        BOLD = 1,
        ITALIC = 3,
        UNDERLINE = 4,
        IMAGENEGATIVE = 7,
        FONTDEFAULT = 10,
        FONT2 = 11,
        FONT3 = 12,
        FONT4 = 13,
        FONT5 = 14,
        FONT6 = 15,
        IMAGEPOSITIVE = 27,
        BLACK = 30,
        RED = 31,
        GREEN = 32,
        YELLOW = 33,
        BLUE = 34,
        MAGENTA = 35,
        CYAN = 36,
        WHITE = 37,
        BG_BLACK = 40,
        BG_RED = 41,
        BG_GREEN = 42,
        BG_YELLOW = 43,
        BG_BLUE = 44,
        BG_MAGENTA = 45,
        BG_CYAN = 46,
        BG_WHITE = 47,
        CLEAR_SCREEN = `${ESC}2J`;

    var _fancy = true;

    var ansiStyles = {
        h1: (m) => `${ESC}${BOLD};${RED}m${m}${allOFF}`,
        h2: (m) => `${ESC}${BOLD};${BLUE}m${m}${allOFF}`,
        h3: (m) => `${ESC}${BOLD};${YELLOW}m${m}${allOFF}`,
        cls: () => `${CLEAR_SCREEN}`
    };

    var endFlag;

    function l(m){
        log(m);
        endFlag = false;
        return this
    }
    l.fancy = function(){
        _fancy = true;
        return this
    };
    l.plain = function(){
        _fancy = false;
        return this
    };

    return Object.keys(ansiStyles).reduce(
        function(res, k) {
            var isStart = /.*start/i;
            var isEnd = /.*end/i;
            res[k] = function(m) {
                m = m || "";
                var s = m.match(isStart);
                var e = m.match(isEnd);
                log(((s && !endFlag) ? "\n" : "")
                    + (_fancy ? ansiStyles[k](m) : m)
                    + (e ? "\n" : ""));
                endFlag = (s || e) ? e : endFlag;
                return this
            };
            return res
        }, l
    )

}
function LogEvents(output) {
    var _w = 0, _w2 = 0;
    var fd, _logStream;

    function _unShift(chunk) {
        if (chunk && this.unshift) this.unshift(chunk)
    }
    var _defaultActions = {
        data: _unShift,
        end: _unShift
    };

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
                    var a;
                    log.h3(`${stamp()}\t${_pad(host.name, _w)} --> ${type}`);
                    if(action)
                        action.apply(host, arguments);
                    else if(a = _defaultActions[type])
                        a.apply(host, arguments);
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
                if(!_excl || !_excl.find(t => t === type)) {

                    // If an incoming listener is already registered
                    // attempt to remove it.  It will be replaced
                    if(l_0 = reg[type])
                        host.removeListener(type, l_0);

                    // register and bind the incoming listener
                    reg[type] = listener;
                    host.on(type, listener)
                }
            })
    }

    /**
     * accepts an array of objects with event and function or null
     * if there is a function, it will be added to _defaultActions
     * if is null, will be deleted from _defaultActions
     * @param {[{type: {string}, action: {function}}]} events
     **/
    _listenAll.defaultActions = function(events){
        if (!events) return _defaultActions;
        events.forEach(function(e){
            var k = Object.keys(e)[0];
            if(e[k])
                _defaultActions[k] = e[k];
            else
                delete _defaultActions[k];
        });
        return this
    };

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
