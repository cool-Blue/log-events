/**
 * Created by cool.blue on 25/07/2016.
 */
'use strict';

/**
 * SUT
 * */
delete require.cache[require.resolve('..')];
const logEvents = require('..');
/**
 * dependencies
 * */
const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const path = require('path');
const glob = require('glob');
const expect = require('chai').expect;
const HOOKstdout = require('intercept-stdout');
const random = require('random-js')();
const EventEmitter = require('events');

const n = 10;
const range = Array.apply(null, Array(n)).map((x, i) => i);
const events = range.map((x, i) => `event_${i}`);
var testEmitter;

const log = logEvents().logger().prefix('none');

describe('behaviour', function(){
    it('exports open, close and stamp', function(){
        expect(logEvents().open).to.be.a('function')
        expect(logEvents().close).to.be.a('function')
        expect(logEvents().stamp).to.be.a('function')
        expect(logEvents().logger).to.be.a('function')
    });
    it('should format the time stamp', function(){
        var l = logEvents().stamp();
        console.log(l);
        expect(l).to.match(/^\d{2}:\d{2}:\d{2}:\d{3}:\d{3}/)
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

    describe('when binding with an array of event types', function() {

        it('should add a listener to all events in the events array', function(done) {
            logEvents().open(testEmitter, events);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            done();
        });
        it('should use a unique execution context for each listener and handle [] for excludes', function(done) {
            logEvents().open(testEmitter, events, []);
            expect(events
                .map(ex => testEmitter.listeners(ex)[0])
                .every((x, i, a) => x === a[0])).to.equal(false);

            done();
        });
        it('should use the same source code for all listeners and handle undefined for excludes', function(done) {
            logEvents().open(testEmitter, events, undefined);
            expect(events
                .map(ex => testEmitter.listeners(ex)[0])
                .every((x, i, a) => x.toString() === a[0].toString())).to.equal(true);

            done();
        });
        it('should ignore any excluded single events passed as a string', function() {
            expect(events.reduce(function(res, e) {
                testEmitter = new EventEmitter();
                logEvents().open(testEmitter, events, e);
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
                // console.log(exclude);
                testEmitter = new EventEmitter();
                logEvents().open(testEmitter, a, exclude);
                return (
                    res && testEmitter._eventsCount == a.length - m
                    && exclude.reduce(
                        (res, excl) => res && !Object.keys(testEmitter._events).find(x => x === excl),
                        true)
                )
            }, true)).to.equal(true);
        })

    });

    describe('when binding with an array of descriptor objects', function(){
        var objEvents = events.map(function(e){
            return {
                type: e,
                action: function(){ console.log(this.name) }
            }
        });
        const m = 4;
        const sampleSet = random.sample(range, m);
        var sampleEvents = sampleSet.map(x => events[x]);

        it('should add a listener to all events with add_remove missing', function(done) {
            logEvents().open(testEmitter, objEvents);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            console.log(util.inspect(testEmitter));
            done();
        });
        it('should remove listeners with add_remove === false', function(done) {
            const objSampleEvents = sampleEvents.map(function(e){
                return {
                    type: e,
                    action: function(){ console.log(this.name) },
                    add_remove: false
                }
            });

            // build a new EE with one listener on each event
            logEvents().open(testEmitter, events);
            expect(testEmitter._eventsCount).to.equal(n);
            log.h1('Before');
            console.log(util.inspect(testEmitter));

            // try to remove the sample events
            logEvents().open(testEmitter, objSampleEvents);
            // check that the removed events have no listeners
            expect(testEmitter._eventsCount).to.equal(n - m);
            log.h1('After');
            console.log(util.inspect(testEmitter));
            done();
        });
        it('should add or remove listeners depending on add_remove', function(done) {
            const objSampleEvents = sampleEvents.map(function(e){
                return {
                    type: e,
                    action: function(){ console.log(this.name) },
                    add_remove: false
                }
            });

            // build a new EE with one listener on each event
            logEvents().open(testEmitter, events);
            expect(testEmitter._eventsCount).to.equal(n);

            // remove the sample events
            logEvents().open(testEmitter, objSampleEvents);
            // check that they were removed
            expect(testEmitter._eventsCount).to.equal(n - m);
            log.h1('Before');
            console.log(util.inspect(testEmitter));

            // remove the remaining listeners and add back the sample events
            var mixedEvents = events.map(function(e) {
                return {
                    type: e,
                    action: function() {console.log(this.name)},
                    add_remove: false
                }
            });
            sampleSet.forEach((s) => mixedEvents[s].add_remove = true);

            logEvents().open(testEmitter, mixedEvents);

            // check that the removed events have no listeners
            expect(testEmitter._eventsCount).to.equal(m);
            log.h1('After');
            console.log(util.inspect(testEmitter));
            done();
        });
        it('should replace existing, registered listeners', function(done) {
            logEvents().open(testEmitter, objEvents);
            log.h1('Before');
            console.log(util.inspect(testEmitter));
            logEvents().open(testEmitter, objEvents);
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            console.log(util.inspect(testEmitter));
            done();
        });
        it('should not affect unregistered listeners', function(done) {
            logEvents().open(testEmitter, events);

            function unRegL(e){log.event('testEmitter', 0, `unregistered ${e}`)}
            events.forEach( e => testEmitter.on(e, unRegL));

            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 2)).to.equal(true);

            log.h1('Before');
            console.log(util.inspect(testEmitter));
            log.h1('Should log two of each');
            events.forEach(e => testEmitter.emit(e, e));

            logEvents().open(testEmitter, events.map( function(e) {
                return {type: e, add_remove: false}
            }));
            expect(events.map(ex => testEmitter.listenerCount(ex)).every(x => x === 1)).to.equal(true);
            log.h1('After');
            log.h2('Should log one of each');
            events.forEach(e => testEmitter.emit(e, e));
            console.log(util.inspect(testEmitter));
            done();
        });
        it('should execute the passed action on the host object', function(done) {
            var objEvents = events.map(function(e){
                return {
                    type: e,
                    action: function(){ log.h2(`${this.name} ${e}`) }
                }
            });
            logEvents().open(testEmitter, objEvents);
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
                expect(() => logEvents().open(testEmitter, events))
                    .to.not.throw();
            });
            it('if passed a write stream, it doesn\'t throw', function() {
                expect(() => logEvents(outStream).open(testEmitter, events))
                    .to.not.throw();
            });
            it('if passed a read stream, it throws ' + logEvents.errors.outputError, function() {
                expect(function (){logEvents(inStream).open(testEmitter, events)})
                    .to.throw(logEvents.errors.outputError);
            });
            it('if a valid path is provided, logs to a file', function() {
                expect(() => logEvents(path.join(baseDir, outputDir, 'log.txt')).open(testEmitter, events))
                    .to.not.throw();
            })
        });

        describe('when the bound object emits events', function() {
            var unhook_stdout, _logOut;
            beforeEach(function(){
                _logOut = "";
                unhook_stdout = HOOKstdout(function(txt) {
                    _logOut += `${txt}`;
                    return '^' + txt;
                });
            });
            afterEach(function(){
                unhook_stdout();
            });

            it('if the output is undefined, or falsey, logs to stdout', function() {
                testEmitter.name = 'output-to-stdout';
                logEvents().open(testEmitter, events);
                events.forEach(e => testEmitter.emit(e, e));
                var outLines =  _logOut.replace(/\n$/,"").split('\n');

                expect(outLines.length).to.equal(events.length);

                events.forEach((e, i) => {
                    expect(outLines[i]).to.include(e)
                });

                console.log(`\n\n${_logOut}`);
            });
            it('if passed a write stream, streams event logs', function() {

            });
            it('if a valid path is provided, logs to a file', function() {

            })
        })
    })
});
