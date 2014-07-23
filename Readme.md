### Deuces

[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rootslab/deuces#mit-license)
[![GITTIP](http://img.shields.io/gittip/rootslab.svg)](https://www.gittip.com/rootslab/)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/deuces.svg)](http://npm-stat.com/charts.html?package=deuces)

[![NPM VERSION](http://img.shields.io/npm/v/deuces.svg)](https://www.npmjs.org/package/deuces)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/deuces.svg)](http://travis-ci.org/rootslab/deuces)
[![BUILD STATUS](http://img.shields.io/david/rootslab/deuces.svg)](https://david-dm.org/rootslab/deuces)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/deuces.svg)](https://david-dm.org/rootslab/deuces#info=devDependencies)

[![NPM GRAPH1](https://nodei.co/npm-dl/deuces.png)](https://nodei.co/npm/deuces/)

[![NPM GRAPH2](https://nodei.co/npm/deuces.png?downloads=true&stars=true)](https://nodei.co/npm/deuces/)

> 🂢 **_Deuces_**, a minimal __Redis__ client __specific for pubsub and monitor__ mode, then __no script cache__, __no db selection__, __no transactions support__.
> Code is heavily based on __[♠ Spade](https://github.com/rootslab/spade)__ module, a full-featured __Redis__ client, with a restricted set of features and event types.

> __Supported commands are__:
>  - __connection__: _auth, ping, quit_
>  - __pubsub__: _publish, subscribe, unsubscribe, psubscribe, punsubscribe_
>  - __server__: _monitor, time_

> _**Some features**_:
 - It implements a simple __delayed mechanism for re-connecting to socket__ when the client connection was
   not voluntarily interrupted.
 - It collects commands in the __queue__ also when the client is __offline__.
 - It implements an automatic __command rollback__ mechanism for __subscriptions__  when connection is lost and becames ready again.
 - It implements automatic __AUTH__ password sending on socket (re)connection, configurable via the _**security**_ constructor option.
 - It __correctly handles multiple (p)(un)subscriptions__ command execution as we will expect:
  1 command -> multiple replies -> multiple callback executions; it supports the new __PING__ command
  signature and it was well tested against some weird edge cases, see tests for pubsub.

> 🂢 __Deuces__ makes use of some __well tested__ modules:
 - Some commands mix-ins and reply formatters copied from __[Σ Syllabus](https://github.com/rootslab/syllabus)__ module.
 - __[Sermone](https://github.com/rootslab/sermone)__ to __encode commands__.
 - __[Abaco](https://github.com/rootslab/abaco)__ and __[Bolgia](https://github.com/rootslab/bolgia)__ modules to get some utilities.
 - __[β Bilanx](https://github.com/rootslab/bilanx)__  a __fast and simplified__ command queue with __rollback mechanism__ based on __[♎ Libra](https://github.com/rootslab/libra)__ code.
 - __[Cocker](https://github.com/rootslab/cocker)__ module to properly handle __socket reconnection__ when the connection is lost. 
 - __[Hiboris](https://github.com/rootslab/hiboris)__, a utility module to load  __[hiredis](https://github.com/redis/hiredis-node)__ _native parser_, or to fall back to __[Boris](https://github.com/rootslab/boris)__, a _pure js parser_ module for __Redis__ string protocol; internally _Boris_ uses __[Peela](https://github.com/rootslab/peela)__ as command stack.

--------------------------------------------------------------------------------------------------------------

###Table of Contents

- __[Install](#install)__
- __[Run Tests](#run-tests)__
- __[Constructor](#constructor)__
   - __[Options](#options)__
- __[Properties](#properties)__
- __[Methods](#methods)__
   - __[#connect](#connect)__
   - __[#disconnect](#disconnect)__
   - __[#cli](#cli)__
   - __[Redis Commands](#redis-commands)__
     - __[Connection](#connection)__
     - __[PubSub](#pubsub)__
     - __[Server](#server)__
   - __[Command Callback](#command-callback)__
- __[Events](#events)__
   - __[Events Sequence Diagram](#events-sequence-diagram)__
   - __[Error Events](#error-events)__
   - __[Auth Events](#auth-events)__
   - __[Socket Connection Events](#socket-connection-events)__
   - __[PubSub Events](#pubsub-events)__
   - __[Monitor Events](#monitor-events)__
   - __[Other Debug Events](#other-debug-events)__
- __[MIT License](#mit-license)__

-----------------------------------------------------------------------
###Install

> __NOTE:__ only __node__ engines **">=v0.10.x"** are supported.

```bash
$ npm install deuces [-g]
// clone repo
$ git clone git@github.com:rootslab/deuces.git
```
> __install and update devDependencies__:

```bash
 $ cd Deuces/
 $ npm install --dev
 # update
 $ npm update --dev
```
> __require__

```javascript
var Deuces = require( 'deuces' );
```
> See [examples](example/).

###Run Tests

```bash
$ cd deuces/
$ npm test
```
> __NOTE__: tests need a running __Redis__ server instance, with default/stock configuration.

###Run Benchmarks

> run benchmarks for __deuces__.

```bash
$ cd deuces/
$ npm run bench
```

> __NOTE__:
>  - benchmarks need a running __Redis__ server instance, with default/stock configuration.
>  - to switch to the faster __hiredis__ native parser, install **_devDependencies_** .

----------------------------------------------------------------------------------------------

###Constructor

> Create an instance.

```javascript
var l = Deuces()
// or
var l = new Deuces()
```
####Options

> Default options are listed.

```javascript
opt = {

    /*
     * Hiboris option. For default, the loading
     * of 'hiredis' native parser is disabled
     * in favour of ( the slower ) Boris JS parser.
     */
    , hiredis : false

    /*
     * Cocker socket options
     */
    , socket : {
        path : null
        , address : {
            // 'localhost'
            host : '127.0.0.1'
            , port : 6379
            , family : 'Ipv4'
        }
        , reconnection : {
            trials : 3
            , interval : 1000
            /*
             * A value to use for calculating the pause between two
             * connection attempts. Default value is the golden ratio.
             * Final value is calculated as:
             * interval * Math.pow( factor, curr.attempts + 1 )
             */
            , factor : ( Math.sqrt( 5 ) + 1 ) / 2
        }
        , connection : {
            /*
             * encoding could be: 'ascii', 'utf8', 'utf16le' or 
             * 'ucs2','buffer'. It defaults to null or 'buffer'.
             */
            encoding : null
            /*
             * keepAlive defaults to true ( it is false in net.Socket ).
             * Specify a number to set also the initialDelay.
             */
            , keepAlive : true
            /*
             * 'timeout' event delay, default is 0 ( no timeout ).
             */
            , timeout : 0
            /*
            * noDelay is true for default, it disables the Nagle
            * algorithm ( no TCP data buffering for socket.write ).
            */
            , noDelay : true
            /*
             * If true, the socket won't automatically send a FIN
             * packet when the other end of the socket sends a FIN
             * packet. Defaults to false.
             */
            , allowHalfOpen : false
        }
    }
    /*
     * Security options.
     *
     * Options for password sending when the client connects to a particular host.
     * An entry will be automatically added with the socket.address or socket.path
     * defined in the constructor option. However, two sample entries are already
     * present in the cache, holding default values from redis.conf. 
     *
     * Every entry should be a file path ('/path/to/file.sock'), or a network path
     * ('ip:port'), and should contain a:
     *
     * - 'requirepass' property, it contains the Redis password string for the current
     * host. It defaults to null. Whenever a client connection is established and if
     * an entry is found in the security hash. an AUTH command will be sent to Redis,
     * before any other command in the command queue.
     *
     * NOTE: If the AUTH reply is erroneous, an 'authfailed' event will be emitted,
     * then the client will be automatically disconnected to force re-AUTH on
     * reconnection; it also happens if AUTH isn't required by Redis, but was sent
     * by the client.
     * If authorization is granted by Redis, an 'authorize' event will be emitted,
     * then if the command queue is not empty, it will be processed.
     */
     , security : {
        // a network path (ip:port)
        '127.0.0.1:6379' : {
            requirepass : null
        }
        // a unix domain socket path
        , '/tmp/redis.sock' : {
            requirepass : null
        }
    }
}
```
_[Back to ToC](#table-of-contents)_

----------------------------------------------------------------------

###Properties

> Don't mess with these properties!

```javascript
/*
 * A property that holds the initial config object.
 */
Deuces.options : Object

/*
 * An Object that holds all Redis commands/methods mix-ins
 * from Syllabus. It is a shortcut for Deuces.mixins.commands.
 * See https://github.com/rootslab/syllabus#syllabus-commands.
 */
Deuces.commands : Object

/*
 * A flag to indicate if the connection to Redis Server
 * is currently active.
 */
Deuces.ready : Boolean

/*
 * Some shortcuts to internal modules.
 */

/*
 * Cocker module that inherits from net.Socket.
 */
Deuces.socket : Cocker

/*
 * Parser module, it could be an instance of Hiboris, a module
 * wrapper for the hiredis native parser, or the Boris JS parser.
 */
Deuces.parser : Hiboris | Boris

/*
 * Libra Queue Manager for Commands/Replies bindings.
 */
Deuces.queue : Bylanx

/*
 * Property that contains utilities and commands
 */
Deuces.mixins : Object

/*
 * An array containing all event listeners for logging to console.
 * See Deuces#cli.
 */
Deuces.cli_debug : Array

```
_[Back to ToC](#table-of-contents)_

----------------------------------------------------------------------

###Methods

> Arguments within [ ] are optional.

####connect

__Open a connection to the Redis Server__:
>  - When the connection is fully established, the __ready__ event will be emitted.
>  - You can optionally use a callback that will be executed on the __ready__ event.
>  - It accepts an optional socket confguration object.
>  - It returns the current Deuces instance.

> __NOTE__: You don't need to listen for the __ready__ event, commands
> will be queued in _"offline mode"_ and written to socket when the
> connection will be ready.

```javascript
/*
 * socket_opt = {
 *      address : {
 *          host : '127.0.0.1'
 *          , port : 6379
 *      }
 *      , reconnection : {
 *          trials : 3
 *          , interval : 1000
 *      }
 *      , connection : {
 *          ...
 *      }
 *  }
 */
Deuces#connect( [ Object socket_opt [, Function cback ] ] ) : Deuces
```

---------------------------------------------------------------------------------------

####disconnect

__Disconnect client from the Redis Server__:
>  - You can optionally use a cback that will be executed after socket
>    disconnection.
>  - It returns the current Deuces instance.

> __NOTE__: From the client point of view, executing disconnect has the same
> effect of sending and executing the Redis **_QUIT_** command. Connection will
> be closed and no other re-connection attempts will be made.

```javascript
Deuces#disconnect( [ Function cback ] ) : Deuces
```

---------------------------------------------------------------------------------------

####cli

__Enable event logging to console__.

> This method enables/logs some extra event for debugging/testing purpose:
>  - __reply__ for Redis replies.
>  - __scanqueue__ when the "offline" command queue is processed.
>  - __queued__ for commands executed when the client is offline.

> __NOTE__:
>  - the _'enable'_ option defaults to true.
>  - the default _'logger'_ prints event name and arguments to console.

```javascript
Deuces#cli( [ Boolean enable [, Function logger ] ] ) : undefined
```
> See "[Other Debug Events](#other-debug-events)" section.

_[Back to ToC](#table-of-contents)_

---------------------------------------------------------------------------------------

####Redis Commands

> The __Dueces.commands__ property contains methods to encode and send __Redis__ commands.

> Arguments within [ ] are optional, '|' indicates multiple type for argument.

#####CONNECTION

> _Redis [Connection](http://redis.io/commands#connection), 5 commands_.

> Arguments within [ ] are optional, '|' indicates multiple type for argument.

```javascript

'auth' : function ( String password [, Function cback ] ) : Object

// legacy ping
'ping' : function ( [ Function cback ] ) : Object

// Redis >= 2.8.x ping, available also in pubsub mode
'ping' : function ( [ String message, [ Function cback ] ] ) : Object

'quit' : function ( [ Function cback ] ) : Object
```

#####PUBSUB

> _Redis [PubSub](http://redis.io/commands#pubsub), 5 commands_.

```javascript

'publish' : function ( String channel, String message [, Function cback ] ) : Object

'psubscribe' : function ( String pattern | Array patterns [, Function cback ] ) : Object

'punsubscribe' : function ( String pattern | Array patterns [, Function cback ] ) : Object

'subscribe' : function ( Number channel | String channel | Array channels [, Function cback ] ) : Object

'unsubscribe' : function ( [ String channel | Array channels [, Function cback ] ] ) : Object
```
> __NOTE__: to (p)unsubscribe from all channels/patterns use null or [].

#####SERVER

> _Redis [Server](http://redis.io/commands#server), 2 commands_.

```javascript
'monitor' : function ( [ Function cback ] ) : Object

'time' : function ( [ Function cback ] ) : Object
```
_[Back to ToC](#table-of-contents)_

####Command Callback

> __Every command mix-in accepts a callback__ function as the last argument, it will get __3__ arguments:

```javascript
/*
 * 'is_err_reply' is a Boolean that signals an ERROR reply from Redis,
 * ( not a JS Error ), then reply data will contain the error message(s).
 *
 * 'data' is a list containing reply data Buffers ( or Strings if hiredis is used ).
 *
 * 'reveal' is a utility function that converts the raw Redis Reply in a simple
 * and usable form.
 *
 * NOTE: The utility function is not the same for all command replies, because,
 * as we surely know, some reply needs particular format and type conversions.
 */
'callback' : function ( Boolean is_err_reply, Array data, Function reveal ) : undefined
```
> __Example Code__:

```javascript
var log = console.log
    , Deuces = require( 'Deuces' )
    , client = Deuces( {} )
    ;

// start async connection to Redis
client.connect();

// execute TIME command
client.commands.time( function ( is_err_reply, reply_data_arr, reveal_fn ) {
    log( '- error reply:', is_err_reply );
    log( '- raw reply:', reply_data_arr );
    log( '- converted reply:', reveal_fn( reply_data_arr ) );
} );
```
_[Back to ToC](#table-of-contents)_

---------------------------------------------------------------------------------------

###Events

- __[Events Sequence Diagram](#events-sequence-diagram)__
- __[Error Events](#error-events)__
- __[Auth Events](#auth-events)__
- __[Socket Connection Events](#socket-connection-events)__
- __[PubSub Events](#pubsub-events)__
- __[Monitor Events](#monitor-events)__
- __[Other Debug Events](#other-debug-events)__

####Events Sequence Diagram

>  - the event emitted for first could be:
    - **_connect_** or **_offline_**, after the execution of __connect__ or __disconnect__ methods.
    - **_error_**, it _"simply"_ happens.

```javascript
                             +                              +
                             |                              |
                             v                              v
                          connect+------->(timeout)       error
                             +
                             |
                             +-------->(authorized)
                             |               +
                             V               |
              +         (authfailed)         |
              |              +               |
              v              |               v
  +------->offline<----+-----+------------+ready
  |           +        |                     +
  |           |        |                     |
  +           v        |                     |
lost<----+(*attempt*)  +----+(*monitor*)<----+---->(listen)
  +           +                                       +
  |           |                                       |
  |           |                                       v
  +->connect<-+                     (shutup)<---+(*message*)
        +
        |
        v
       ...
```

> __NOTE__:
>  - events between __(__ __)__ could never happen, most of them depends on client configuration.
>  - events within __*__ could be emitted more than once, namely __0__ or __k__ times with _k >= 1_.
>  - __timeout__ could happen in _"any"_ moment after the __connect__ event.
>  - __listen__ signals that client is entering in subscription mode
>  - __shutup__ signals that client is leaving subscription mode.
>  - __monitor__ mode could end only with a __QUIT__ command (then '_offline_').

_[Back to ToC](#table-of-contents)_

####Error Events

```javascript
/*
 * A parser or command encoding error has occurred.
 */
'error' : function ( Error err, Object command ) : undefined
```

####Auth Events

> These events are emitted on every client (re)connection to Redis and only if
> __AUTH is set to be mandatory__ for the current connected host; namely, should
> exist an entry, _'ip:port'_ or _'/path/to/file'_, in the options.security hash,
> with __requirepass__ property set to a non empty string.

```javascript
/*
 * The reply to AUTH command is an Error, then client will be disconnected; it also
 * happens when AUTH is not required by Redis but issued by the client. No 'ready'
 * event could be launched.
 */
'authfailed' : function ( String password, Array reply, Object address ) : undefined

/*
 * Client authorization is successful. After that the command queue will be processed.
 * and the 'ready' event could be launched.
 */
'authorized' : function ( String password, Array reply, Object address ) : undefined
```
_[Back to ToC](#table-of-contents)_

####Socket Connection Events

```javascript
/*
 * After that the client has established a connection to the Redis host,
 * it is now ready to write commands to the socket and to receive the
 * relative replies from Redis. It happens after processing AUTH and
 * SELECT commands and finally the offline queue.
 *
 * NOTE: Every commands executed by the client before the 'ready' event,
 * will be enqueued in 'offline mode' and sent/written to socket when
 * 'ready' will be emitted.
 */
'ready' : function ( Object address ) : undefined

/*
 * A client connection is fully established with Redis host. This event
 * happens before 'ready' and AUTH/SELECT related events.
 */
'connect' : function ( Object address ) : undefined

/*
 * Connection is currently down ( on the first 'close' event from the socket ).
 */
'offline' : function ( Object address ) : undefined

/*
 * Client is trying to reconnect to Redis server, k is the number of current
 * connection attempt.
 *
 * NOTE: 'millis' indicates the last interval of time between attempts.
 */
'attempt' : function ( Number k, Number millis, Object address ) : undefined

/*
 * The connection is definitively lost ( after opt.reconnection.trials times ).
 */
'lost' : function ( Object address ) : undefined

/*
 * The socket times out for inactivity.
 * It only notifies that the socket has been idle.
 */
'timeout' : function ( Number timeout,  Object address ) : undefined
```
_[Back to ToC](#table-of-contents)_

####PubSub Events

> __NOTE__: for multiple (__P__)(__UN__)__SUBSCRIBE__ commands, __callbacks are executed
> one time for every message reply__ those messages will be received also through the _Pub/Sub_
> system. However the first callback signals that the command is succesfully processed by Redis.
>
> For example:
>  - __subscribe( [ 'a', 'a', 'b', 'b', 'c', 'c' ], cback )__ :
>    - executes callback __6__ times
>    - produces __6__ messages
>    - __3__ actual subscriptions
>  - __unsubscribe( null, cback )__:
>    - executes cback __3__ times
>    - produces __3__ messages
>    - __0__ subscriptions.

```javascript
/*
 * A message was received through the PubSub system when the client is in PubSub mode.
 *
 * NOTE: the 'formatter' function converts the received 'message' to an obj/hash.
 * For example, a message reply to a (P)(UN)SUBSCRIBE command issued by the client,
 * could be:
 *
 * 'message' -> [ 'unsubscribe', 'channel', 0 ]
 *
 * will be converted to:
 *
 * {
 *  type : 'unsubscribe'
 *  , chan : 'channel'
 *  . subs : 0
 * }
 *
 * a typical message received from publisher(s):
 *
 * 'message' -> [ 'message', 'channel', 'Hello folks!' ]
 *
 * will be converted to:
 *
 * {
 *  type : 'message'
 *  , chan : 'channel'
 *  . msg : 'Hello folks!!'
 * }
 *
 * See also Syllabus.formatters.
 *
 */
'message' : function ( Array message, Function formatter ) : undefined

/*
 * An event to signal that the client is entering in PubSub mode after a
 * subscription command. From now, all replies to (un)subscription commands
 * will be received as messages.
 */
'listen' : function () : undefined

/*
 * An event to signal that client is leaving PubSub mode after a successfull
 * execution of a unsubscription command.
 * It doesn't happen if the client disconnects while in PubSub mode.
 */
'shutup' : function () : undefined
```
_[Back to ToC](#table-of-contents)_

####Monitor Events

```javascript
/*
 * A 'message' was received when the client is in Monitor mode.
 * 
 * NOTE: the 'formatter' function converts the 'message' to an obj/hash.
 * For example, with an input like:
 *
 * message = '1405478664.248185 [0 127.0.0.1:47573] "ping"',
 *
 * executing formatter( message ) will output:
 *
 * {
 *  ip: '127.0.0.1',
 *  port: 47573,
 *  db: 0,
 *  cmd: '"ping"',
 *  utime: 1405478664248,
 *  time: [ 1405478664, 248185 ]
 * }
 *
 * See also Syllabus.formatters.
 *
 */
'monitor' : function ( String message, Function formatter ) : undefined
```
_[Back to ToC](#table-of-contents)_

####Other Debug Events

> __NOTE__: to enable logging for events below, execute __Deuces#cli__ method.

```javascript
/*
 * When the client is offline, commands are not sent but queued.
 */
'queued' : function ( Object command, Number offline_queue_size ) : undefined

/*
 * When the client will be online once again, this event is emitted
 * before performing a scan for sending enqueued commands, then always
 * before the 'ready' event.
 */
'scanqueue' : function ( Number offline_queue_size ) : undefined

/*
 * The client receives a command reply from Redis. It always happens after
 * the 'ready' event.
 */
'reply' : function ( Object command, String reply ) : undefined

/*
 * The client receives an error reply from Redis. It always happens after
 * the 'ready' event.
 */
'error-reply' : function ( Object command, String err_reply ) : undefined
```
_[Back to ToC](#table-of-contents)_

-------------------------------------------------------------------------------

### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.