/**
 * Created by cool.blue on 14-Aug-16.
 */
var EE = require('events');

/**
 * Builds a logger complex based on default state
 * Usage
 * var colourLog = new StyleLogger(
 *      logStream,
 *      styles
 * ).build()
 *
 * @constructor
 * @returns a customisable, logger complex including customisation methods
 * @param {Writestream|undefined} logStream - stream to log to
 * @param {object} styles - scope object with build state
 * Events should be bound to logStream by the listener API on _l
 * @event error - emitted if logStream.write calls back with error
 * @event finish = emitted if logStream.write calls back clean
 * */
module.exports = function styleLogger(logStream, styles) {

        const DEF_ENC = null;

        // private state
        var _fancy = true,
            _transform = x => x,
            _emitter = new EE(),
            _logger,
            _baseLogger,
            _cb,
            _endFlag;

        var _l = (function() {
            // todo implement proper code sharing
            // probably not possible because this object needs lexical
            // access to the private, instance state so will also be
            // contained in the instance execution context.
            function l(m, cb) {
                _cb = cb;
                _logger(_transform(m), cb);
                _endFlag = false;
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
                    return _transform;
                _transform = t;
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
                _emitter.on('finish', listener.bind(logStream || null));
                return this
            };
            l.onerror = function(listener) {
                _emitter.on('error', listener.bind(logStream || null));
                return this
            };

            return l
        })();

        // constructor
        function StyleLogger() {

            if(!(this instanceof StyleLogger))
                return new StyleLogger();

            if(logStream) {
                logStream.on('error', function(e) {
                    // node will exit if the error event is emitted with no listeners
                    if(_emitter.listeners('error').length || !_cb)
                        process.nextTick(() => _emitter.emit('error', e));
                    // todo callback should be removed after firing?
                    if(_cb) {
                        process.nextTick(_cb.bind(logStream), e)
                    }
                });
                _baseLogger = function(m, cb) {
                    logStream.write(m + '\n', DEF_ENC,
                        /**
                         * Pass on the call back and emit synthetic events
                         */
                        function() {
                            process.nextTick(() => _emitter.emit('finish'));
                            if(cb) {
                                process.nextTick(cb.bind(logStream))
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

            _logger = _baseLogger;

            // subclass the default logger _l by binding the styles
            return Object.keys(styles).reduce(
                function(res, k) {
                    var isStart = /.*start/i;
                    var isEnd = /.*end/i;
                    res[k] = function(m) {
                        m = _transform(typeof m === 'undefined' ? "" : m);
                        var s = m.match(isStart);
                        var e = m.match(isEnd);
                        _logger(((s && !_endFlag) ? "\n" : "")
                            + (_fancy ? styles[k](m) : m)
                            + (e ? "\n" : ""));
                        _endFlag = (s || e) ? e : _endFlag;
                        return this
                    };
                    return res
                }, _l
            )
        }

        // public static members

        return StyleLogger()
    }
