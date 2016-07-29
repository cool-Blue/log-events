/**
 * Created by cool.blue on 25/07/2016.
 */
'use strict';

/**
 * SUT
 * */
const logEvents = require('..');
/**
 * dependencies
 * */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const expect = require('chai').expect;
const HOOKstdout = require('intercept-stdout');
const EventEmitter = require('events');

const n = 10;
const events = Array.apply(null, Array(n)).map((x, i) => `event_${i}`);
var testEmitter;

describe('log-events', function() {
    const baseDir = './test';
    const inputDir = '/fixtures';
    const outputDir = '/output';

    beforeEach(function() {
        testEmitter = new EventEmitter()
    });

    describe('when binding', function() {

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
            it('if passed a read stream, it doesn\'t throw', function() {
                expect(() => logEvents(inStream).open(testEmitter, events))
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
