/**
 * Created by cool.blue on 24/07/2016.
 */

module.exports = LogEvents;

const outputError = new TypeError('log-events un-supported output type');
const collisionError = new ReferenceError('');

const fs = require('fs');
const path = require('path');
const util = require('util');
const now = require('moment');
const _pad = require('left-pad');
const stream = require('stream');
// const StyleLogger = require('style-logger');
const StyleLogger = require('style-logger');
const builtinModules = require('builtin-modules');

function stamp(f) {
    var t    = process.hrtime()[1].toString(),
        T    = now(Date.now()).format("HH:mm:ss"),
        msec = t.slice(0, 3),
        usec = t.slice(3, 6),
        nsec = t.slice(6, 9),
        pad  = '000';
    usec = pad.substring(0, pad.length - usec.length) + usec;
    nsec = pad.substring(0, pad.length - nsec.length) + nsec;
    stamp.ret = T + ":" + msec + ":" + usec + ":" + nsec;
    return stamp
}
stamp.trace = function getTrace(belowFn) {
    /*
     Copyright (c) 2011 Felix Geisendörfer (felix@debuggable.com)

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of the following software above the END Copyright line below and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.
     */
    var oldLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = Infinity;

    var dummyObject = {};

    var v8Handler = Error.prepareStackTrace;
    Error.prepareStackTrace = function(dummyObject, v8StackTrace) {
        return v8StackTrace;
    };
    Error.captureStackTrace(dummyObject, belowFn || getTrace);

    var v8StackTrace = dummyObject.stack;
    Error.prepareStackTrace = v8Handler;
    Error.stackTraceLimit = oldLimit;
    /*
    * END Copyright
    * */
    var stackStruct = v8StackTrace.map(function(t) {
            return {
                calledOn: t.getThis(),
                method: t.getMethodName(),
                functionName: t.getFunctionName(),
                fileName: path.relative(process.cwd(), t.getFileName()),
                line: t.getLineNumber(),
                column: t.getColumnNumber(),
            }
        }),
        appSites = stackStruct.filter(function(s) {
            var fileName = s.fileName, name = fileName.match(/([^\\]+?)\.js$/)[1];
            return !(fileName.search(/(?=(node_modules))|(?=(^native))/) > -1
                || builtinModules.indexOf(name) > -1);
        }),
        top = appSites[0];
    return this.ret + "\t" + path.relative(process.cwd(), top.fileName)
        + "#" + top.line+ "#" + top.column
};


/**
 * Builds a logger complex with a pre-defined set of styles
 * @function
 * @returns a customisable, logger complex including customisation methods
 * @param {[WriteStream]} logger
 * */
function colourLog(logStream) {

    var ESC = '\x1b[', gEND = "m", allOFF = `${ESC}0m`, BOLD = 1, ITALIC = 3, UNDERLINE = 4, IMAGENEGATIVE = 7, FONTDEFAULT = 10, FONT2 = 11, FONT3 = 12, FONT4 = 13, FONT5 = 14, FONT6 = 15, IMAGEPOSITIVE = 27, BLACK = 30, RED = 31, GREEN = 32, YELLOW = 33, BLUE = 34, MAGENTA = 35, CYAN = 36, WHITE = 37, BG_BLACK = 40, BG_RED = 41, BG_GREEN = 42, BG_YELLOW = 43, BG_BLUE = 44, BG_MAGENTA = 45, BG_CYAN = 46, BG_WHITE = 47, CLEAR_SCREEN = `${ESC}2J`;

    var ansiStyles = {
        h1: (m, s, e) => `${ESC}${BOLD};${RED}m${m}${allOFF}`,
        h2: (m, s, e) => `${ESC}${BOLD};${BLUE}m${m}${allOFF}`,
        h3: (m, s, e) => `${ESC}${BOLD};${YELLOW}m${m}${allOFF}`,
        crazy: (m) => m
    };
    var cssRed = '#c04848', cssBlue = '#07c', cssYellow = '#ead10e';
    var cssStyles = {
        h1: (m) => [`%c${m}`, `font-weight: bold; color: ${cssRed}`],
        h2: (m) => [`%c${m}`, `font-weight: bold; color: ${cssBlue}`],
        h3: (m) => [`%c${m}`, `font-weight: bold; color: ${cssYellow}`],
        crazy: (m) => [`%c${m}`, cssCrazy]
    };

    return StyleLogger(
        logStream,
        typeof window !== 'undefined' ? cssStyles : ansiStyles,
        {
            isStart: /(?=(before))|(?=(after))/i,
            isEnd: /(?=(before))|(?=(after))/i
        }
    )

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
                    _log.h3(`${stamp().trace(listener)}\t${_pad(host.name, _w)} --> ${type}`);
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
