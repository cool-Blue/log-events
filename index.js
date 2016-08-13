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
var EE = require('events');

function stamp() {
    var t    = process.hrtime()[1].toString(),
        T    = now(Date.now()).format("HH:mm:ss"),
        msec = t.slice(0, 3),
        usec = t.slice(3, 6),
        nsec = t.slice(6, 9),
        pad  = '000';
    usec = pad.substring(0, pad.length - usec.length) + usec;
    nsec = pad.substring(0, pad.length - nsec.length) + nsec;
    var ret = T + ":" + msec + ":" + usec + ":" + nsec;
    return ret
}
/**
 * Builds a $.logger complex based on default state
 * Usage
 * var colourLog = new ColourLogger({
 *      $.logger,
 *      ansiStyles
 * }).build()
 *
 * @typedef {{
 *  logger: (Writestream|undefined),
 *  ansiStyles: {object}
 *  }} loggerState
 * @constructor
 * @returns a customisable, $.logger complex including customisation methods
 * @param {loggerState} $ - scope object with build state
 * @param {[function]} _cb   callback after write
 * */
function ColourLogger($, cb) {

    const DEF_ENC = null;

    if(!(this instanceof ColourLogger))
        return new ColourLogger($, cb);

    /**
     * Listeners are registered so that error events can be suppressed in
     * favour of callbacks
     * @type {EventEmitter}
     * @private
     */
    var _emitter   = new EE(),
        _cb        = cb,
        _listeners = {};
    _listeners.push = function(event, listener) {
        if(this[event])
            this[event].push(listener);
        else
            this[event] = [listener];
    };

    /**
     * The logger when switched on
     * Provides an async (CPS) wrapper for the write operation of the stream
     * and emits events to subscribers of this log object
     * @private {function}
     */
    var _baseLogger;

    if($.logger) {
        // need to trap errors that are other than write errors e.g. open
        $.logger.on('error', function(e) {
            // node will exit if the error event is emitted with no listeners
            if(_listeners.error || !_cb)
                process.nextTick(() => _emitter.emit('error', e));
            // todo callback should be removed after firing?
            if(_cb) {
                process.nextTick(_cb.bind($.logger), e)
            }
        });
        /**
         * Write to a stream
         * @param m - the message to log
         * @param cb - callback on $.logger
         * Events should be bound to $.logger by the listener API on l
         * @event error - emitted if $.logger.write calls back with error
         * @event finish = emitted if $.logger.write calls back clean
         * @private
         */
        _baseLogger = function(m, cb) {
            $.logger.write(m + '\n', DEF_ENC,
                /**
                 * Pass on the call back and emit synthetic events
                 */
                function() {
                    process.nextTick(() => _emitter.emit('finish'));
                    if(cb) {
                        process.nextTick(cb.bind($.logger))
                    }
                })
        }
    } else {
        /**
         * Write to stdio
         * @param m
         * @param cb
         * @private
         */
        _baseLogger = function(m, cb) {
            console.log(m);
            process.nextTick(() => _emitter.emit('finish'));
            if(cb) {
                process.nextTick(cb.bind(null))
            }
        }
    }

    var _logger = _baseLogger;

    var _fancy    = true,
        transform = x => x;

    var endFlag;    // for tracking start end sequence

    // todo encapsulate this
    function l(m, cb) {
        // todo separate callbacks for stream and logger?
        _cb = cb || _cb;
        _logger(transform(m), cb);
        endFlag = false;
        return this
    }

    l.fancy = function() {
        _fancy = true;
        return this
    };
    l.plain = function() {
        _fancy = false;
        return this
    };
    l.transform = function(t) {
        if(typeof t === 'undefined')
            return transform;
        transform = t;
        return this
    };
    l.off = function() {
        _logger = function() {};
        return this
    };
    l.on = function() {
        _logger = _baseLogger;
        return this
    };
    l.onfinish = function(listener) {
        _emitter.on('finish', listener.bind($.logger || null));
        _listeners.push('finish', listener);
        return this
    };
    l.onerror = function(listener) {
        _emitter.on('error', listener.bind($.logger || null));
        _listeners.push('error', listener);
        return this
    };
    l.$ = function() {
        return $
    };

    this.build = function() {
        return Object.keys($.ansiStyles).reduce(
            function(res, k) {
                var isStart = /.*start/i;
                var isEnd = /.*end/i;
                res[k] = function(m) {
                    m = transform(typeof m === 'undefined' ? "" : m);
                    var s = m.match(isStart);
                    var e = m.match(isEnd);
                    _logger(((s && !endFlag) ? "\n" : "")
                        + (_fancy ? $.ansiStyles[k](m) : m)
                        + (e ? "\n" : ""));
                    endFlag = (s || e) ? e : endFlag;
                    return this
                };
                return res
            }, l
        )
    }
}

/**
 * Builds a logger complex with a pre-defined set of styles
 * @function
 * @returns a customisable, logger complex including customisation methods
 * @param {[WriteStream]} logger
 * */
function colourLog(logger, cb) {

    var ESC = '\x1b[', gEND = "m", allOFF = `${ESC}0m`, BOLD = 1, ITALIC = 3, UNDERLINE = 4, IMAGENEGATIVE = 7, FONTDEFAULT = 10, FONT2 = 11, FONT3 = 12, FONT4 = 13, FONT5 = 14, FONT6 = 15, IMAGEPOSITIVE = 27, BLACK = 30, RED = 31, GREEN = 32, YELLOW = 33, BLUE = 34, MAGENTA = 35, CYAN = 36, WHITE = 37, BG_BLACK = 40, BG_RED = 41, BG_GREEN = 42, BG_YELLOW = 43, BG_BLUE = 44, BG_MAGENTA = 45, BG_CYAN = 46, BG_WHITE = 47, CLEAR_SCREEN = `${ESC}2J`;

    var ansiStyles = {
        h1: (m) => `${ESC}${BOLD};${RED}m${m}${allOFF}`,
        h2: (m) => `${ESC}${BOLD};${BLUE}m${m}${allOFF}`,
        h3: (m) => `${ESC}${BOLD};${YELLOW}m${m}${allOFF}`,
        cls: () => `${CLEAR_SCREEN}`
    };

    return new ColourLogger({
        logger,
        ansiStyles
    }, cb).build()

}
function arrayicate(x) {
    return x ? Array.isArray(x) ? x : [x] : x;
}
function LogEvents(output) {
    var _w = 0, _w2 = 0;
    var fd;
    var _host;

    function _unShift(chunk) {
        if(chunk && this.unshift) this.unshift(chunk)
    }

    var _defaultActions = {
        data: _unShift,
        end: _unShift
    };

    var _log;

    function _listenAll(host, events, excl) {
        _w = Math.max(_w, host.name ? host.name.length : 0);
        var _excl = arrayicate(excl);
        var _events = arrayicate(events);

        var reg = host.__logEvents = host.__logEvents ? host.__logEvents : {};

        _events
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
                    _log.h3(`${stamp()}\t${_pad(host.name, _w)} --> ${type}`);
                    if(action)
                        action.apply(host, arguments);
                    else if(a = _defaultActions[type])
                        a.apply(host, arguments);
                }

                if(add_remove === null) {
                    if(!reg[type]) {
                        console.warn('trying to delete non-existent event');
                        return host
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
            });
        return _host = host;
    }

    /**
     * accepts an array of objects with event and function or null
     * if there is a function, it will be added to _defaultActions
     * if is null, will be deleted from _defaultActions
     * @param {[{type: {string}, action: {function}}]} events
     **/
    _listenAll.defaultActions = function(events) {
        if(!events) return _defaultActions;
        events.forEach(function(e) {
            var k = Object.keys(e)[0];
            if(e[k])
                _defaultActions[k] = e[k];
            else
                delete _defaultActions[k];
        });
        return this
    };
    _listenAll.fancy = function() {
        _log = _log.fancy();
        return this
    };
    _listenAll.plain = function() {
        _log = _log.plain();
        return this
    };
    _listenAll.on = function() {
        _log.on();
        return this
    };
    _listenAll.off = function() {
        _log.off();
        return this
    };
    _listenAll.output = function(output) {
        var _logStream;
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

        _log = colourLog(_logStream);

        return this;
    };

    _listenAll.output(output);

    _listenAll.log = function() {
        return _log
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
