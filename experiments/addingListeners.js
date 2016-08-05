/**
 * Created by cool.blue on 8/5/2016.
 * http://stackoverflow.com/a/38758390/2670182
 */
const EE = require('events');
const util = require('util');

(function manage(host){

    var heads = Math.random() > 0.5;

    console.log(heads ? 'heads' : 'tails');

    host.name = 'host';
    host.release = function(){
        console.log('released!')
    };

    function l(err) {
        onErr(err, host, l)
    }
    l.e = 'error';

    host.on('error', l);

    if(heads)
        host.emit('error', new Error('oops!'));

    if(l.e)
        cleanUp(host, l, 'manage');

})(new EE());

function onErr(e, h, l) {
    console.error(`\n${h.name}: ${e.message}`);
    h.release();
    cleanUp(h, l, 'onError')
}

function cleanUp(h, l, context){
    console.log('\n\x1b[33m' + context + '\n'
        + 'before:\t' + h._eventsCount + '\x1b[0m\n' + util.inspect(h));
    h.removeListener(l.e, l);
    console.log('\n\x1b[33mafter:\t' + h._eventsCount + '\x1b[0m\n' + util.inspect(h));
    delete l.e
}