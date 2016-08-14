/**
 * Created by cool.blue on 25/07/2016.
 */
'use strict';

/**
 * SUT
 * */
const StyleLogger = require('../stylelogger.js');
/**
 * dependencies
 * */
const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const HOOKstdout = require('intercept-stdout');
const random = require('random-js')();

const ManagedReadStream = require('./lib/observable-streams')
    .ManagedReadStream;

function logger(logger) {

    var ESC = '\x1b[', gEND = "m", allOFF = `${ESC}0m`, BOLD = 1, ITALIC = 3, UNDERLINE = 4, IMAGENEGATIVE = 7, FONTDEFAULT = 10, FONT2 = 11, FONT3 = 12, FONT4 = 13, FONT5 = 14, FONT6 = 15, IMAGEPOSITIVE = 27, BLACK = 30, RED = 31, GREEN = 32, YELLOW = 33, BLUE = 34, MAGENTA = 35, CYAN = 36, WHITE = 37, BG_BLACK = 40, BG_RED = 41, BG_GREEN = 42, BG_YELLOW = 43, BG_BLUE = 44, BG_MAGENTA = 45, BG_CYAN = 46, BG_WHITE = 47, CLEAR_SCREEN = `${ESC}2J`;

    var ansiStyles = {
        h1: (m) => `${ESC}${BOLD};${RED}m${m}${allOFF}`,
        h2: (m) => `${ESC}${BOLD};${BLUE}m${m}${allOFF}`,
        h3: (m) => `${ESC}${BOLD};${YELLOW}m${m}${allOFF}`,
        cls: () => `${CLEAR_SCREEN}`
    };

    return StyleLogger(
        logger,
        ansiStyles
    )

}

describe('colourLog', function() {
    const content = "this is a test y89dpencjk";

    /**
     * asynchronous sinon spy
     * @factory
     * @accessor calls - how many times it should be called
     * @accessor context - what it should be called on
     * @accessor args - what arguments to expect
     * @returns {function} cb
     */
    function spyAsync() {
        var AsyncSpy = (function(options) {

            // private members
            var _calls, _context, _args;

            // constructor
            function AsyncSpy() {
                if(!(this instanceof AsyncSpy))
                    return new AsyncSpy();

                // init private state
                _calls = 1;
                _context = null;
                _args = [];

                // init public instance state

            }

            // static public members

            // accessors
            AsyncSpy.prototype.calls = function recalls(n) {
                if(typeof n === 'undefined') return this.n;
                _calls = n;
                return this;
            };
            AsyncSpy.prototype.context = function context(on) {
                if(typeof on === 'undefined') return this.context;
                _context = on;
                return this;
            };
            AsyncSpy.prototype.args = function args(args) {
                if(typeof args === 'undefined') return this.args;
                _args = args;
                return this;
            };

            // methods
            AsyncSpy.prototype.cb = function cb(done) {

                const CALLED_n = ['calledOnce', 'calledTwice', 'calledThrice'];

                var _cb = sinon.spy(completed);

                function completed(e) {

                    if(e)
                        console.dir(e);

                    if(_cb.callCount < _calls)
                        return;

                    var expectToHaveBeen = expect(_cb).to.have.been;

                    expectToHaveBeen[CALLED_n[_calls - 1]];
                    expectToHaveBeen.calledOn(_context);
                    expectToHaveBeen.calledWithExactly.apply(expectToHaveBeen, _args);

                    if(done) done()
                }

                return _cb;
            };

            return AsyncSpy

        })();

        return new AsyncSpy();
    }

    describe.skip('code re-use', function() {
        const log1 = logger();
        const log2 = logger();
        it('should re-use code', function() {
            expect(Object.keys(log1).reduce(function(res, p, a) {
                return res && (log1[p] === log2[p])
            }, true)).to.equal(true);
        })
    });
    describe('when logging to stdout', function() {
        describe('signalling', function() {
            it('calls back after logging is complete with no args', function(done) {
                const testLog = logger();
                var cbSpy = spyAsync();
                testLog(content, cbSpy.cb(done))
            });
            it('asynchronously emits finish after logging is complete', function(done) {
                const testLog = logger();

                var cb = spyAsync().calls(2).cb(done);

                testLog(content);   // lexical placement should not matter

                testLog.onfinish(cb);

                testLog(content);
            });
        });
        describe('output', function() {
            it('logs to stdout if no stream provided', function(done) {
                const testLog = logger();
                var _stdout = Hook_stdout();
                testLog(content);
                _stdout.unHook();
                expect(_stdout.logOut).to.contain(content);
                done()
            });
        });
    });
    describe('when logging to a stream', function() {
        describe('when passed a valid write stream', function(done) {
            const outFile = './test/output/out-file.txt';
            var outStream, testLog;

            beforeEach(function() {
                outStream = fs.createWriteStream(outFile);
                testLog = logger(outStream);
            });

            describe('signalling', function() {
                it('calls back after logging is complete with no args', function(done) {
                    var cb = spyAsync().calls(1).context(outStream).cb(done);

                    testLog(content, cb);

                });
                it('asynchronously emits finish after logging is complete', function(done) {
                    var cb = spyAsync().calls(2).context(outStream).cb(done);

                    testLog(content);   // lexical placement should not matter

                    testLog.onfinish(cb);

                    testLog(content);
                });
            });
            describe('output', function() {
                it('logs to a stream if provided', function(done) {
                    testLog(content);
                    testLog.onfinish(function() {
                        var s = new ManagedReadStream(outFile);
                        s.readAll(function(body) {
                            log.h1(body);
                            expect(body, "file contents").to.contain(content);
                        });
                        done()
                    })
                });
            });
            describe('write stream error handling', function(done) {
                it('it handles write errors', function(done) {
                    var cbSpy = spyAsync()
                        .context(outStream)
                        .args([sinon.match.instanceOf(Error)]);

                    testLog.onerror(cbSpy.cb(done));
                    testLog(content, then);
                    outStream.end();
                    function then() {
                        testLog(content);
                    }
                });
                it('calls back on write error', function(done) {

                    done();
                });

            });

        });
        describe('when the write stream throws', function() {
            const outFile = './nonexistent/output/out-file.txt';
            var outStream, cbSpy;

            beforeEach(function() {
                outStream = fs.createWriteStream(outFile);
                cbSpy = spyAsync()
                    .context(outStream)
                    .args([sinon.match.instanceOf(Error)]);
            });

            it('should catch file open error events', function(done) {
                var testLog = logger(outStream);

                testLog(content);   // will only cb once because error is from open

                testLog.onerror(cbSpy.cb(done));

                testLog(content);
            });
            it('should call back log with file open error', function(done) {
                var testLog = logger(outStream);
                testLog(content, cbSpy.cb(done));
            });
            it('the log cb should overwrite the logger cb', function(done) {
                var cbSpy2 = sinon.spy();
                var testLog = logger(outStream, cbSpy2);
                testLog(content, cbSpy.cb(function() {
                        expect(cbSpy2.callCount).to.equal(0);
                        done()
                    }
                ));
            });
        });
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

