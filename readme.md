### log-events

A very basic event logger that lets you apply one hook to an event that will log to the provided stream in color.

For simplicity, any event on any emitter can only be hooked once with this app.  Multiple hooks on the same event simply result in the previous one being replaced.

#### Usage

`npm install @cool-blue/logevents`

Exports a constructor

    const  LogEvents = require('@cool-blue/logevents'),
    
    const logEvents = LogEvents()   // outputs to stdout
    const logEvents = LogEvents(_validPath_)   // outputs to a file
    const logEvents = LogEvents(_writeStream_)   // outputs to a stream

Exposes some utility functions

\#.open applies hooks to an event emitter

    const events = ['event1', 'event2', 'event3'];
    
    logEvents().open(eventEmitter, events)  // logs the specified events
    logEvents().open(eventEmitter, events, 'event2')  // logs all except event2
    logEvents().open(eventEmitter, events, ['event2'])  // logs all except event2
    logEvents().open(eventEmitter, 'event1')  // logs event1
    
    const objEvents = events.map(function(e){
        return {
            type: e,
            action: function(){ console.log(this.name) },
        }
    });
    
    // logs the specified events and performs the specified action
    logEvents().open(eventEmitter, objEvents)
    
    const objSomeEvents = someEvents.map(function(e){
        return {
            type: e,
            action: function(){ console.log(this.name) },
            add_remove: false
        }
    });
    
    // un-hooks/hooks events if add_remove is true/false
    logEvents().open(eventEmitter, objSomeEvents)

\#.logger provides a few color formatting options to help highlight the output    

    log.h1(_message_)
    log.h2(_message_)
    log.event(_message_)
    
The default behaviour is to prefix a time stamp and issue [ANSI escape sequences](http://ascii-table.com/ansi-escape-sequences.php) both of which can be turned off by providing a truthy value as follows:

    const log = logEvents().logger().prefix('none').color('none');
