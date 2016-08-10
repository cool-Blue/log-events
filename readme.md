# log-events

A very basic event logger that lets you apply one hook to an event that will log to the provided stream in color.

For simplicity, any event on any emitter can only be hooked once with this app.  Multiple hooks on the same event simply result in the previous one being replaced.

## Usage

`npm install @cool-blue/logevents`

### Exports a constructor
    const  LogEvents = require('@cool-blue/logevents'),
    
    const logEvents = LogEvents()   // outputs to stdout
    const logEvents = LogEvents(_validPath_)   // outputs to a file
    const logEvents = LogEvents(_writeStream_)   // outputs to a stream

### Exposes some utility functions

**_\#.open_** applies hooks to an event emitter

    const logEvents  = require('@cool-blue/logevents')
    const events = ['event1', 'event2', 'event3'];
    const logger = logEvents().open;            // opens with default output to stdout
    
    const eventsLog  = fs.createWriteStream('./test/output/event-log.txt'),

    const logger = logEvents(eventsLog).open;   // opens with output to a WriteStream
    
    logger.output(eventsLog);                   // re-direct the output to a stream
    
    logger(eventEmitter, events)  // logs the specified events
    logger(eventEmitter, events, 'event2')  // logs all except event2
    logger(eventEmitter, events, ['event2'])  // logs all except event2
    logger(eventEmitter, 'event1')  // logs a single event
    
    const objEvents = events.map(function(e){
        return {
            type: e,
            action: function(){ console.log(this.name) },
        }
    });
    
    /**
     * logs the specified events and performs the specified action
     */
    logger(eventEmitter, objEvents)
    
    const objSomeEvents = someEvents.map(function(e){
        return {
            type: e,
            action: function(){ console.log(this.name) },
            add_remove: null
        }
    });
    
    /**
     * un-hooks/hooks events if add_remove is true/false
     */
    logger(eventEmitter, objSomeEvents)
    
    /**
     * log to a stream other than stdout
     */
    const fs         = require('fs'),
          eventsLog  = fs.createWriteStream('./test/output/event-log.txt'),
          logEvents  = require('@cool-blue/logevents')(eventsLog),
          logger     = logEvents.open
        
    /**
     * removing or adding ANSI escape sequences
     */
    logger.plain()      // switch to plain mode
    logger.fancy()      // switch to default, fancy mode
    
    /**
     * share globally
     */
    // app.js
    exports.log = log;
    log.off();                          // global switch off
    log.plain();                        // global formatting
    
     // do stuff...
     
     log.on()                           // global switch on
    
    // lib-a
    const log = require('../app').log;  // same format and mode as set in app.js


    

**_\#.open.defaultActions_**([{type: {function}])

  sets persistent default actions for indicated event types
  there are preset default actions on `data` and `end` event types to `unshift` the chunk returned to the listener.
    
  Setting the action to a falsey value will remove the default action for the event type.
  Adding an action that is already included will replace that action
  
**_\#.logger([{WriteStream}])_** provides a few color formatting options to help highlight the output

Builds a logger complex based on default state and returns a customisable, logger complex including customisation methods.  If no write stream is provided it will log to `stdout`.

    const log  = require('@cool-blue/logevents')().log()
    
    // connect to a WriteStream during init
    const log  = require('@cool-blue/logevents')().log(
            fs.createWriteStream('./test/output/event-log.txt')
          );
          
    // deferred connect to a WriteStream
    log.output(
        fs.createWriteStream('./test/output/event-log.txt')
      );
    
    // default styles...
    log.h1(_message_)
    log.h2(_message_)
    log.h3(_message_)
    
    // with or without escape sequences (for non-TTY output)
    log.plain();
    log.fancy();
    
    // enable or dissable
    log.om();
    log.off();
    
    // apply a transform to the message before it is wrapped
    log.transform(m => logEvents.stamp() + '\t' + m)   // 
    
The default behaviour is to issue [ANSI escape sequences](http://ascii-table.com/ansi-escape-sequences.php) to highlight the different styles.

