/**
 * Created by cool.blue on 8/4/2016.
 */
const EE = require('events');
const util = require('util');
const random = require('random-js')();
const assert = require('assert');


// set up a emitter with n events
const n = 10;
const events = Array.apply(null, Array(n)).map((x, i) => 'event_' + i);

const log = require('..')().logger().prefix('none');


/*// get a reference to one of the listener functions
var host = new EE();
const target = 'event_' + (n-1);
var probe = host.listeners(target)[0];

function Factory(x, y){
    if(!(this instanceof Factory))
        return new Factory(x, y);
    this.x=x;
    this.y=y;
    this.instanceMethod = function(){
        console.log(`${this.x}\t${this.y}`)
    }
}
Factory.prototype.cb = function(){
    console.log(`${this.x}\t${this.y}`)
};

// check that instances share the method ref
var l1 = Factory('x1', 'y1');
var cb = l1.cb;
cb()

var l2 = Factory('x2', 'y2');
var cb2 = l2.cb;
cb2()

console.log('cb is cb2 ' + (cb === cb2));

// add unique instances, with instance state, as listeners
// cb cannot access the instance state unless called on
// or bound to the Factory instance.  So this doesn't work.
events.forEach(function(e, i){
    host.on(e, Factory('x' + i, 'y' + i).cb)
});

console.log(host.listeners('event_1')[0] === cb);

console.log(events.every(function(e){
    host.emit(e);
    return host.listeners(e)[0] === cb
}));*/
/**
 * Another approach
 **/
/*
host = new EE();

// Add a registry to the event emitter
host.__listener_reg = host.__listener_reg  ? host.__listener_reg : {};

// Apply the listeners.
// Limit to one watcher per event.
// and register them on the host
events.forEach(function(e, i){
    var l_0;
    function l(){
        console.log('x' + i + '\t' + 'y' + i)
    }
    // If a listener is already registered
    // attempt to remove it
    if(l_0 = host.__listener_reg[e])
        host.removeListener(e, l_0);
    // register the listener and bind it to the event
    host.__listener_reg[e] = l;
    host.on(e, l)
});

// check that the listener references stored match
// the events and emit the events to check their state.
events.forEach(function(e){
    host.emit(e);
    console.log(host.listeners(e)[0] === host.__listener_reg[e]);
});

// print out the host structure
console.log(util.inspect(host));

// now, try to remove specific listeners
// remove the events and de-register them
sampleEvents.forEach(function(e){
    host.removeListener(e, host.__listener_reg[e])
    delete host.__listener_reg[e];
});

// print out the host structure
console.log(util.inspect(host));

log.cls();
*/
/**
 * Encapsulate the solution and register listeners on the emitter
 **/
log.h1('Encapsulate the solution and register listeners on the emitter')
function WrappedHost(){
    EE.call(this);
    this.__listener_reg = {};

}
util.inherits(WrappedHost, EE);

WrappedHost.prototype.structure = function(){
    return util.inspect(this, null);
};
WrappedHost.prototype.watchEvents = function(events){
    // Apply the listeners.
    // Limit to one watcher per event.
    // and register them on the host
    events.forEach((e, i) => {
        var l_0;
        function l(){
            console.log('x' + i + '\t' + 'y' + i)
        }
        // If a listener is already registered
        // attempt to remove it
        if(l_0 = this.__listener_reg[e])
            this.removeListener(e, l_0);
        // register the listener and bind it to the event
        this.__listener_reg[e] = l;
        this.on(e, l)
    });
    return this
};
WrappedHost.prototype.unWatchEvents = function(events){
    events.forEach((e) => {
        this.removeListener(e, this.__listener_reg[e])
        delete this.__listener_reg[e];
    });
    return this
};

var wrappedHost = new WrappedHost();

console.log('new object:\n' + wrappedHost.structure());

wrappedHost.watchEvents(events);

console.log('watched object:\n' + wrappedHost.structure());

wrappedHost.unWatchEvents(sampleEvents);

console.log('modified, watched object:\n' + wrappedHost.structure());

/**
 * Encapsulate the solution local listeners register
 **/
console.log('\nEncapsulate the solution and the listeners register')

function Wrap(){
    if(!(this instanceof Wrap))
        return new Wrap();
    EE.call(this);
    this.l = function(a, b, e) {
        console.log(a + '\t' + b + '\t' + e );
    };
    this.register = {}
}
util.inherits(Wrap, EE);

Wrap.prototype.structure = function(){
    return util.inspect(this, null);
};
Wrap.prototype.watchEvents = function(events){
    // Apply the listeners.
    // Limit to one watcher per event.
    // and add them to the local register
    events.forEach((e, i) => {
        var l_0;
        // If a listener is already registered
        // attempt to remove it
        if(l_0 = this.register[e])
            this.removeListener(e, l_0);
        // register the listener and bind it to the event
        this.on(e, this.register[e] = this.l.bind(this, 'x' + i, 'y' + i))
    });
    return this
};
Wrap.prototype.unWatchEvents = function(events){
    events.forEach((e) => {
        this.removeListener(e, this.register[e]);
        delete this.register[e];
    });
    return this
};

var wrap = Wrap();

assert.equal(wrap._eventsCount, 0, 'no events');
console.log('\nnew object:\n' + wrap.structure() + '\n');

wrap.watchEvents(events);
events.forEach((e) => wrap.emit(e, e));

assert.equal(wrap._eventsCount, n, 'events added');
console.log('\nwatched object:\n' + wrap.structure());

var sampleEvents, m = 4;
wrap.unWatchEvents(sampleEvents = random.sample(events, m));
assert.equal(wrap._eventsCount, n - m);
console.log('\nremove some:\n' + wrap.structure());

wrap.watchEvents(sampleEvents);
assert.equal(wrap._eventsCount, n);
console.log('\nadd the same ones back:\n' + wrap.structure());

wrap.watchEvents(sampleEvents);
assert.equal(wrap._eventsCount, n);
console.log('\nadd the same ones again:\n' + wrap.structure());


(function manage(host){

    host.name = 'host';
    host.release = function(){
        console.log('released!')
    };

    function l(err) {
        onErr(err, host, l)
    }

    host.on('error', l);

    host.emit('error', new Error('oops!'));

    cleanUp(host, 'error', l);

})(new EE());

function onErr(e, h, l) {
    setImmediate(() => console.error(`\n${h.name}: ${e.message}`));
    h.release();
    cleanUp(h, e, l)
}

function cleanUp(h, e, l){
    console.log('\nbefore:\n' + util.inspect(h));
    h.removeListener(e, l)
    console.log('\nafter:\n' + util.inspect(h));
}