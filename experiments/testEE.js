/**
 * Created by cool.blue on 8/4/2016.
 * http://stackoverflow.com/q/38700859/2670182
 */
const EE = require('events');
const util = require('util');

var host = new EE();

// set up a emitter with n events
const n = 10;
const events = Array.apply(null, Array(n)).map((x, i) => 'event_' + i);

events.forEach(function(e){
    host.on(e, function g() {console.log(e)})
});

console.log(util.inspect(host));

// get a reference to one of the listener functions
const target = 'event_' + (n-1);
var probe = host.listeners(target)[0];

// add a method to only add unique listeners
host.onUnique = function (type, listener){
    var slot = this.listeners(type).find(function(l) {
        return l === listener
    });

    if(slot)
        return this;

    console.log('adding');
    return this.on(type, listener)
};

// try to add it
var count0 = host.listenerCount(target);
var count1 = host.onUnique(target, probe).listenerCount(target);

console.log('added ' + (count1 - count0) + ' listeners');   // added 0 listeners
console.log(util.inspect(host));

// try to add a new listener
count0 = host.listenerCount(target);
count1 = host.onUnique(target, function h(){ console.log('different cb')}).listenerCount(target);

console.log('added ' + (count1 - count0) + ' listeners');   // added 1 listeners
console.log(util.inspect(host));


connpool.getConnection(function(err, connection) {

    var querystr = "Some valid SQL query";

    connection.execute(querystr, data, function(err, rows) {
        if (err) {
            console.error(err);
        }
        connection.on('error', onErr);
        // do some stuff
        cleanup(connection);
    });

    var onErr = function(err) {
        console.error({"Error message"});
        connection.release();
        cleanup(connection);
    };

    var cleanup = function(conn) {
        conn.removeListener('error',onErr);
    };
});
