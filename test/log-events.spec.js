/**
 * Created by cool.blue on 25/07/2016.
 */
'use strict';

/**
 * SUT
 * */
delete require.cache[require.resolve('..')];
const LogEvents = require('..');
/**
 * dependencies
 * */
const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const path = require('path');
const glob = require('glob');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const HOOKstdout = require('intercept-stdout');
const random = require('random-js')();
const EventEmitter = require('events');

const ManagedReadStream = require('./lib/observable-streams')
    .ManagedReadStream;

const n = 10;
const range = Array.apply(null, Array(n)).map((x, i) => i);
const events = range.map((x, i) => `event_${i}`);
var testEmitter;

const hook = LogEvents().open;
const log = LogEvents().logger();

describe('behaviour', function() {

    log.h1('Start');

    it('exports the right behaviour', function() {
        expect(LogEvents().open).to.be.a('function')
        expect(LogEvents().open.defaultActions).to.be.a('function')
        expect(LogEvents().close).to.be.a('function')
        expect(LogEvents().stamp).to.be.a('function')
        expect(LogEvents().logger).to.be.a('function')
        expect(LogEvents().logger().fancy).to.be.a('function')
        expect(LogEvents().logger().plain).to.be.a('function')
    });
    it('should be chainable', function() {
        var h   = new EventEmitter(),
            log = LogEvents().logger();

        h.name = 'host';

        expect(LogEvents().open(h, events)).to.equal(h);
        expect(LogEvents().open(h, {type: "nonexistent", add_remove: null})).to.equal(h);
        expect(log.fancy()).to.equal(log);
        expect(log.plain()).to.equal(log);
    });
    it('should format the time stamp', function() {
        var l = LogEvents().stamp();
        log(l);
        expect(l).to.match(/^\d{2}:\d{2}:\d{2}:\d{3}:\d{3}/)
    });
    it('should manage default behaviour', function() {
        var _open                                               = LogEvents().open,
            d, p = 'testType', f = function() { return this}, o = {};
        o[p] = f;

        // check that the default objects is returned when no arguments
        expect(d = _open.defaultActions()).to.be.an('object');

        // add a type to the default behaviour
        // (it doesn't check to see if there is a matching event
        _open.defaultActions([o]);
        expect(_open.defaultActions()[p])
            .to.equal(f);

        // remove a type from the default behaviour
        o[p] = null;
        _open.defaultActions([o]);
        expect(_open.defaultActions()[p])
            .to.be.an("undefined");

        // check that the default behaviour is executed when the event is logged
        testEmitter = new EventEmitter();
        testEmitter.name = 'testEmitter';
        // mock a stream
        testEmitter.unshift = function(chunk) {this[chunk] = chunk};

        // add the test events to the emitter
        var defEvents = ['data', 'end'];
        _open(testEmitter, defEvents);
        log.h1('should have unshift added and the default events');
        log(util.inspect(testEmitter));

        // emit the events and check that the default behaviour was done
        defEvents.forEach(function(e) {
            testEmitter.emit(e, e);
        });
        log.h1(`should have ${defEvents.join(" & ")} members added`);
        log(util.inspect(testEmitter));

        defEvents.forEach(function(e) {
            expect(testEmitter[e]).to.equal(e);
        })
    })
});
describe('colourLog', function() {
    const content = "this is a test y89dpencjk";

    describe('signalling', function(done) {
        var CB = function(context, argtypes, done) {
            return function cb() {
                var self = this,
                    _args = [].slice.call(arguments);
                argtypes = Array.isArray(argtypes);
                if (argtypes === ['undefined'])
                    expect(arguments.length).to.equal(0);
                else
                    expect(_args).to.eql(argtypes);
                expect(self).to.equal(context);
                done()
            }
        }
        describe('when logging to stdout, should signal with null context', function() {
            it('calls back after logging is complete with no args', function(done) {
                const testLog = LogEvents().logger();

                function cb(e) {
                    var self = this;
                    expect(e).to.be.an("undefined");
                    expect(self).to.equal(null);
                    done()
                }

                testLog(content, cb);
            });
            it('calls asynchronously emits finish after logging is complete', function(done) {
                const testLog = LogEvents().logger();
                // var cb = new CB(null,null, done)
                var count = 1;

                testLog(content);

                function cb(e) {
                    var self = this;
                    expect(e).to.be.an('undefined');
                    expect(self).to.equal(null);
                    if(!count--)
                        done()
                }

                testLog.onfinish(cb);

                testLog(content);

            });
            it.skip('calls asynchronously emits finish after logging is complete', function(done) {
                const testLog = LogEvents().logger();
                var cb = sinon.spy(completed);
                var count = 1;

                testLog(content);

                testLog.onfinish(cb);

                testLog(content);

                function completed() {

                    expect(cb).to.have.been.calledTwice;
                    expect(cb).to.have.been.calledOn(null);
                    expect(cb).to.have.been.calledWithExactly();

                    if(!count--)
                        done()
                }
            });
        })
    })
    it('asynchronously emits finish after logging is complete', function(done){
        const EE = require('events');
        const testEmitter = new EE();

        var cb = sinon.spy(completed);

        process.nextTick(() => testEmitter.emit('finish'));

        testEmitter.on('finish', cb.bind(null));

        process.nextTick(() => testEmitter.emit('finish'));

        function completed() {

            if(cb.callCount < 2)
                return;

            expect(cb).to.have.been.calledTwice;
            expect(cb).to.have.been.calledOn(null);
            expect(cb).to.have.been.calledWithExactly();

            done()
        }

    });
    it('logs to stdout if no stream provided', function(done) {
        const testLog = LogEvents().logger();
        var _stdout = Hook_stdout();
        testLog(content);
        _stdout.unHook();
        expect(_stdout.logOut).to.contain(content);
        done()
    });
    it('logs to a stream if provided', function(done) {
        const outFile   = './test/output/out-file.txt',
              outStream = fs.createWriteStream(outFile),
              testLog   = LogEvents().logger(outStream);
        testLog(content);
        testLog.onfinish(function() {
            var s = new ManagedReadStream(outFile);
            s.readAll(function(body) {
                log.h1(body);
                expect(body, "file contents").to.contain(testLog);
            });
            done()
        })
    });
    it('logs to a stream if provided', function() {

    })

});
describe('log-events', function() {
    const baseDir = './test';
    const inputDir = '/fixtures';
    const outputDir = '/output';

    beforeEach(function() {
        testEmitter = new EventEmitter();
        testEmitter.name = 'testEmitter'
    });

    describe('when binding with an array of types', function() {

        it('should add a listener to all events in the events array', function(done) {
            hook(testEmitter, events);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            done();
        });
        it('should use a unique execution context for each listener and handle [] for excludes', function(done) {
            hook(testEmitter, events, []);
            expect(events
                .map(ex => testEmitter.listeners(ex)[0])
                .every((x, i, a) => x === a[0])).to.equal(false);

            done();
        });
        it('should use the same source code for all listeners and handle undefined for excludes', function(done) {
            hook(testEmitter, events, undefined);
            expect(events
                .map(ex => testEmitter.listeners(ex)[0])
                .every((x, i, a) => x.toString() === a[0].toString())).to.equal(true);

            done();
        });
        it('should ignore any excluded single events passed as a string', function() {
            expect(events.reduce(function(res, e) {
                testEmitter = new EventEmitter();
                hook(testEmitter, events, e);
                return (
                    res
                    && testEmitter._eventsCount == events.length - 1
                    && !Object.keys(testEmitter._events).find(x => x === e)
                )
            }, true)).to.equal(true);
        });
        it('should ignore 0 or more excluded events passed as an array', function() {
            expect(events.reduce(function(res, e, i, a) {
                var m       = _.random(a.length),
                    exclude = _.sampleSize(a, m);
                // log(exclude);
                testEmitter = new EventEmitter();
                hook(testEmitter, a, exclude);
                return (
                    res && testEmitter._eventsCount == a.length - m
                    && exclude.reduce(
                        (res, excl) => res && !Object.keys(testEmitter._events).find(x => x === excl),
                        true)
                )
            }, true)).to.equal(true);
        })

    });

    describe('when binding with an array of descriptor objects', function() {
        var objEvents = events.map(function(e) {
            return {
                type: e,
                action: function() { log(this.name) }
            }
        });
        const m = 4;
        const sampleSet = random.sample(range, m);
        var sampleEvents = sampleSet.map(x => events[x]);

        it('should add a listener to all events with add_remove missing', function(done) {
            hook(testEmitter, objEvents);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            log(util.inspect(testEmitter));
            done();
        });
        it('should remove listeners with add_remove === null', function(done) {
            const objSampleEvents = sampleEvents.map(function(e) {
                return {
                    type: e,
                    action: function() { log(this.name) },
                    add_remove: null
                }
            });

            // build a new EE with one listener on each h3
            hook(testEmitter, events);
            expect(testEmitter._eventsCount).to.equal(n);
            log.h1('Before');
            log(util.inspect(testEmitter));

            // try to remove the sample events
            hook(testEmitter, objSampleEvents);
            // check that the removed events have no listeners
            expect(testEmitter._eventsCount).to.equal(n - m);
            log.h1('After');
            log(util.inspect(testEmitter));
            done();
        });
        it('should add or remove listeners depending on add_remove', function(done) {
            const objSampleEvents = sampleEvents.map(function(e) {
                return {
                    type: e,
                    action: function() { log(this.name) },
                    add_remove: null
                }
            });

            // build a new EE with one listener on each h3
            hook(testEmitter, events);
            expect(testEmitter._eventsCount).to.equal(n);

            // remove the sample events
            hook(testEmitter, objSampleEvents);
            // check that they were removed
            expect(testEmitter._eventsCount).to.equal(n - m);
            log.h1('Before');
            log(util.inspect(testEmitter));

            // remove the remaining listeners and add back the sample events
            var mixedEvents = events.map(function(e) {
                return {
                    type: e,
                    action: function() {log(this.name)},
                    add_remove: null
                }
            });
            sampleSet.forEach((s) => mixedEvents[s].add_remove = true);

            hook(testEmitter, mixedEvents);

            // check that the removed events have no listeners
            expect(testEmitter._eventsCount).to.equal(m);
            log.h1('After');
            log(util.inspect(testEmitter));
            done();
        });
        it('should replace existing, registered listeners', function(done) {
            hook(testEmitter, objEvents);
            log.h1('Before');
            log(util.inspect(testEmitter));
            hook(testEmitter, objEvents);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            log(util.inspect(testEmitter));
            done();
        });
        it('should not affect unregistered listeners', function(done) {
            hook(testEmitter, events);

            function unRegL(e) {log.h2('testEmitter', 0, `unregistered ${e}`)}

            events.forEach(e => testEmitter.on(e, unRegL));

            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 2)).to.equal(true);

            log.h1('Before');
            log(util.inspect(testEmitter));
            log.h1('Should log two of each');
            events.forEach(e => testEmitter.emit(e, e));

            hook(testEmitter, events.map(function(e) {
                return {type: e, add_remove: null}
            }));
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            log.h2('Should log one of each');
            events.forEach(e => testEmitter.emit(e, e));
            log(util.inspect(testEmitter));
            done();
        });
        it('should execute the passed action on the host object', function(done) {
            var objEvents = events.map(function(e) {
                return {
                    type: e,
                    action: function() { log.h2(`${this.name} ${e}`) }
                }
            });
            hook(testEmitter, objEvents);
            log.h1('Should print emitter name');
            events.forEach(e => testEmitter.emit(e, e));
            done();
        });
    });

    describe('output', function() {

        beforeEach(function() {
            //clear previous outputs
            glob.sync(outputDir + '/*.*').forEach(function(f) {
                fs.unlinkSync(f)
            })
        });

        var inStream = fs.createReadStream(path.join(baseDir, inputDir, 'input.txt'));
        var outStream = fs.createWriteStream(path.join(baseDir, outputDir, 'output.txt'));

        describe('binding output', function() {

            it('if the output is undefined, or falsey, it doesn\'t throw', function() {
                expect(() => LogEvents().open(testEmitter, events))
                    .to.not.throw();
            });
            it('if passed a write stream, it doesn\'t throw', function() {
                expect(() => LogEvents(outStream).open(testEmitter, events))
                    .to.not.throw();
            });
            it('if passed a read stream, it throws ' + LogEvents.errors.outputError, function() {
                expect(function() {LogEvents(inStream).open(testEmitter, events)})
                    .to.throw(LogEvents.errors.outputError);
            });
            it('if a valid path is provided, logs to a file', function() {
                expect(() => LogEvents(path.join(baseDir, outputDir, 'log.txt')).open(testEmitter, events))
                    .to.not.throw();
            })
        });

        describe('when the bound object emits events', function() {
            var unhook_stdout, _logOut, _stdout;
            beforeEach(function() {
                _stdout = Hook_stdout(x => '^' + x);
/*
                _logOut = "";
                unhook_stdout = HOOKstdout(function(txt) {
                    _logOut += `${txt}`;
                    return '^' + txt;
                });
*/
            });
            afterEach(function() {
                _stdout.unHook();
            });

            it('if the output is undefined, or falsey, logs to stdout', function() {
                testEmitter.name = 'output-to-stdout';
                LogEvents().open(testEmitter, events);
                events.forEach(e => testEmitter.emit(e, e));
                var outLines = _stdout.logOut.replace(/\n$/, "").split('\n');

                expect(outLines.length).to.equal(events.length);

                events.forEach((e, i) => {
                    expect(outLines[i]).to.include(e)
                });

                log(`\n\n${_stdout.logOut._logOut}`);
            });
            it('if passed a write stream, streams h3 logs', function() {

            });
            it('if a valid path is provided, logs to a file', function() {

            })
        })
    });
});

function Hook_stdout(transf) {
    var self;
    return self = {
        unHook: HOOKstdout(function(txt) {
            self.logOut += `${txt}`;
            if(transf) return transf(txt);
        }),
        logOut: ""
    }
}
