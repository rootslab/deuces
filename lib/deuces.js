/*
 * Deuces, a minimal Redis client, specific for pubsub and monitor mode.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Deuces = ( function () {
    var log = console.log
        , emitter = require( 'events' ).EventEmitter
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , Cocker = require( 'cocker' )
        , Hiboris = require( 'hiboris' )
        , Bilanx = require( 'bilanx' )
        , Syllabus = require( './commands' )
        , formatters = require( './formatters' )
        , inspect = util.inspect
        , mix = Bolgia.mix
        , improve = Bolgia.improve
        , update = Bolgia.update
        , clone = Bolgia.clone
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , ostr = ooo.str
        , onum = ooo.num
        , ofun = ooo.fun
        , emptyFn = function () {}
        // Deuces default opt
        , deuces_opt = {
            /*
             * Cocker socket options
             */
            socket : {
                path : null
                , address : {
                    // Redis default address 
                    host : '127.0.0.1'
                    , port : 6379
                    , family : 'Ipv4'
                }
                , reconnection : {
                    // Cocker default options..
                }
                , connection : {
                    // Cocker default options..
                }
            }
            , security : {
                // a network path (ip:port)
                '127.0.0.1:6379' : {
                    requirepass : ''
                }
                // a unix domain socket path
                , '/tmp/redis.sock' : {
                    requirepass : ''
                }
            }
            , hiredis : false
        }
        // events for CLI logging
        , events = [
            'error'
            ,'connect'
            , 'offline'
            , 'attempt'
            , 'lost'
            , 'ready'
            , 'authfailed'
            , 'authorized'
            , 'monitor'
            , 'message'
            , 'listen'
            , 'shutup'
            // debug events
            , 'queued'
            , 'scanqueue'
            , 'reply'
            , 'error-reply'
        ]
        , Deuces = function ( opt ) {
            var me = this
                ;
            if ( ! ( me instanceof Deuces ) ) {
                return new Deuces( opt );
            }
            var cfg = improve( clone( opt ), deuces_opt )
                , sopt = cfg.socket
                // when using hiredis parser, returning buffers will slowdown of aboout -60%
                , hiboris = Hiboris( { hiredis : cfg.hiredis, return_buffers : false } )
                , cocker = Cocker( sopt )
                , bilanx = Bilanx()
                , syllabus = Syllabus()
                , commands = syllabus.commands
                , status = bilanx.status
                , bsub = status.subscription
                , bmon = status.monitoring
                 // protocol parser match
                , onParserMatch = function ( err_reply, data, fn ) {
                    // get queue head
                    var cmd = null
                        , message = null
                        , subs = 0
                        , cli_debug = me.cli_debug
                        , llen = cli_debug.length
                        , mtype = null
                        , msubs = null
                        , csubs = null
                        , getMonitorMessage = function () {
                           // pop command from queue
                           cmd = bilanx.pop();
                           // if cmd.isMonitor then execute callback else emit 'monitor'
                            message = fn( data );
                            return cmd && cmd.isMonitor ?
                                   cmd.zn( false, message, cmd.fn ) :
                                   me.emit( 'monitor', message, formatters.monitor )
                                   ;
                        }
                        // process message reply to a (p)(un)subscription command
                        , getReplyMessages = function () {
                            // pop command from queue
                            cmd = bilanx.pop();
                            // get message reply
                            message = fn( data );
                            mtype = message[ 0 ];
                            msubs = message[ 2 ];
                            csubs = bilanx.subs();
                            // update current pubsub status
                            subs = bilanx.update( mtype, msubs );
                            // emit listen only if the client is actually entered in PubSub mode
                            if ( ! csubs && ( csubs !== subs ) ) me.emit( 'listen' );
                            cmd.zn( false, data, cmd.fn );
                            me.emit( 'message', message, formatters.message );
                            if ( subs === 0 && csubs !== 0 ) me.emit( 'shutup' );
                        }
                        , getReply = function ( is_err ) {
                            // pop command from queue
                            cmd = bilanx.pop();
                            // execute callback
                            cmd.zn( !! is_err, data, cmd.fn );
                            // if logging is active, emit 'reply'
                            if ( llen ) me.emit( !! is_err ? 'error-reply' : 'reply', cmd, cmd.fn( data ) );
                            // check if the client is quitting connection
                            return cmd.isQuit ? cocker.bye() : null;
                        }
                        , getMessage = function () {
                            // get message reply
                            message = fn( data );
                            // check message type
                            mtype = message[ 0 ];
                            // check for message and pmessage
                            if ( ~ mtype.indexOf( 'message' ) ) {
                                // get the message and don't pop command
                                return me.emit( 'message', message, formatters.message );
                            }
                            if ( ! cmd ) {
                                // command is undefined, a message was received
                                msubs = message[ 2 ];
                                // update current pubsub status
                                subs = bilanx.update( mtype, msubs );
                                me.emit( 'message', message, formatters.message );
                                if ( subs === 0 ) me.emit( 'shutup' );
                                return;
                            }
                            // command could be a subscription, then a message reply to a (un)subscription
                            return cmd.isSubscription ? getReplyMessages() : getReply();
                        }
                        ;
                    // an error reply from Redis
                    if ( err_reply ) return getReply( true );
                    // peek queue head, then if it is a QUIT command, return reply
                    if ( ( cmd = bilanx.head() ) && cmd.isQuit ) return getReply();
                    // check if monitor mode is active
                    if ( bmon.active ) return getMonitorMessage();
                    // check if pubsub mode is active
                    if ( bsub.active ) return getMessage();
                    // check if command is a subscription
                    return cmd.isSubscription ? getReplyMessages() : getReply();
                }
                , onParserError = function ( err, data ) {
                    // build and emit a custom error object
                    me.emit( 'error', {
                        cmd : null
                        , data : data
                        , err : err
                    } );
                    // reset connection (then also parser on offline), disconnect and reconnect
                    cocker.end();
                }
                , onConnectionLost = function ( address ) {
                    // reset bilanx status properties and its internal queue
                    bilanx.flush();
                    me.emit( 'lost', address );
                }
                , onConnectionOffline = function ( address ) {
                    me.ready = false;
                    // reset parser
                    hiboris.reset();
                    // reset queue status for subscriptions and transaztions
                    bilanx.reset();
                    // do rollback if rollUp is active
                    bilanx.rollBack();
                    me.emit( 'offline', address );
                }
                , processCommandQueue = function ( address ) {
                    if ( me.cli_debug.length ) me.emit( 'scanqueue', bilanx.cqueue.size() );
                    // iterate on queue if it's not empty
                    bilanx.iterate( function ( el, i, done ) {
                        cocker.write( el.ecmd );
                        done();
                    }, me, function ( err, cnt ) {
                        // final callback
                        me.ready = true;
                        me.emit( 'ready', address );
                    } );
                }
                , onConnectionEstablished = function ( address ) {
                    var opt = me.options
                        , path = opt.socket.path
                        , key = path && doString( path.fd ) === ostr ? path.fd : address.host + ':' + address.port
                        , osec = opt.security
                        , security = osec[ key ]
                        , password = security && doString( security.requirepass ) === ostr ? security.requirepass : null
                        , db = security ? security.db : 0
                        ;
                    // bubble up socket 'connect' event.
                    me.emit( 'connect', address );
                    /*
                     * If authorization is not mandatory for the current host, then immediately
                     * process the command queue; otherwise, set the authorization property,
                     * encoding the AUTH command with relative password.
                     */
                    return password ?
                           sendAuth( address, password, db ) : processCommandQueue( address );
                }
                , onConnectionReadable = function () {
                    var data = cocker.read()
                        ;
                    if ( data ) {
                        hiboris.parse( data );
                    }
                }
                , onReconnectionAttempt = function ( k, addr, ms ) {
                    me.emit( 'attempt', k, ms, addr );
                }
                , onConnectionTimeout = function () {
                    var scfg = me.options.socket
                        ;
                    me.emit( 'timeout', scfg.connection.timeout, scfg.address );
                }
                // send an encoded command
                , send = function ( ocmd ) {
                    // check first for command encoding error from Syllabus mix-in
                    if ( ocmd.err ) {
                        return me.emit( 'error', ocmd );
                    }
                    // push command to the queue, if no error occurs.
                    if ( ~ bilanx.push( ocmd ) ) {
                        // if client is ready, then write to socket.
                        return me.ready ?
                               cocker.write( ocmd.ecmd ) :
                               me.cli_debug.length ? me.emit( 'queued', ocmd, bilanx.cqueue.size() ) : null
                               ;
                    }
                    // command is not allowed and wasn't pushed to queue
                    me.emit( 'error', ocmd );
                }
                /*
                 * Send AUTH command before any other command on new connection.
                 * On AUTH error reply, the command queue will not be processed;
                 * it also happens when an AUTH command was sent, but the password
                 * is not required by Redis. The client will disconnects from server
                 * to force the sending of another AUTH command on re-connection.
                 */
                , sendAuth = function ( address, password, db ) {
                    var encode = syllabus.encode
                        , onAuthReply = function ( err, data, fn ) {
                            var reply = fn( data )
                                ;
                            if ( err ) {
                                me.emit( 'authfailed', password, reply, address );
                                return cocker.bye();
                            }
                            me.emit( 'authorized', password, reply, address );
                            return processCommandQueue( address );
                        }
                        , auth = encode( 'AUTH', password, null, onAuthReply );
                    // set special command shortcut
                    auth.isAuth = 1;
                    // signal/push special AUTH command to the command queue
                    bilanx.auth( auth );
                    // write to socket
                    return cocker.write( auth.ecmd );
                }
                // utility to add user defined options for address to security hash
                , add_security_entry = function () {
                    var opt = me.options
                        , sec_opt = opt.security
                        , sock_opt = opt.socket
                        , addr_opt = sock_opt.path || ( sock_opt.address.host + ':' + sock_opt.address.port )
                        , sopt = sec_opt[ addr_opt ] || ( sec_opt[ addr_opt ] = { requirepass : '' } )
                        ;
                    return sopt;
                }
                ;

            // parser error
            hiboris.on( 'error', onParserError );
            // parser returns some data
            hiboris.on( 'match', onParserMatch );

            // client connection is definitively lost
            cocker.on( 'lost', onConnectionLost );
            // client connection is down
            cocker.on( 'offline', onConnectionOffline );
            // client connection is fully established
            cocker.on( 'online', onConnectionEstablished );
            // cocker reconnection attempt
            cocker.on( 'attempt', onReconnectionAttempt );
            // socket is readable
            cocker.on( 'readable', onConnectionReadable );
            // socket times out
            cocker.on( 'timeout', onConnectionTimeout );

            // wrap syllabus commands
            syllabus.wrap( send );

            // set some internal properties
            me.options = cfg;
            me.ready = false;

            // modules shortcuts
            me.socket = cocker;
            me.parser = hiboris;
            me.queue = bilanx;
            me.mixins = syllabus;

            // syllabus commands shortcut
            me.commands = commands;

            // collect listeners for CLI logging
            me.cli_debug = [];

            /*
             * Add security entry for socket.address or socket.path, 
             * defined in the constructor options.
             */
            add_security_entry();
        }
        , dproto = null
        ;

    util.inherits( Deuces, emitter );

    dproto = Deuces.prototype;

    dproto.connect = function ( opt, cback ) {
        var me = this
           , sopt = update( me.options.socket, opt || {} )
           , next = doString( cback ) === ofun ? cback : emptyFn
           ;
        me.once( 'ready', next );
        me.socket.run( sopt );
        return me;
    };

    dproto.disconnect = function ( cback ) {
        var me = this
            , cocker = me.socket
            , next = doString( cback ) === ofun ? cback : emptyFn
            ;
        cocker.once( 'close', next );
        cocker.bye();
        return me;
    };

    dproto.cli = function ( enable, fn ) {
        var me = this
            , remove = me.removeListener
            , slice = Array.prototype.slice
            , cli_debug = me.cli_debug
            , llen = cli_debug.length
            , elen = events.length
            , ok = enable === undefined ? true : enable
            , lback = typeof fn === 'function' ? fn : function ( ename, args ) {
                log( '!%s: %s', ename, inspect( args, false, 3, true ) );
            }
            , clog = function ( ename ) {
                var logFn = function () {
                    lback( ename, slice.call( arguments ) );
                };
                cli_debug.push( ename, logFn );
                me.on( ename, logFn );
            }
            , i = 0
            ;
        if ( ok ) {
            if ( llen ) return;
            for ( ; i < elen; ++i ) clog( events[ i ] );
            return;
        }
        i = 0;
        // remove all listeners for logging
        for ( ; i < llen - 1; i += 2 ) me.removeListener( cli_debug[ i ], cli_debug[ i + 1 ] );
        me.cli_debug = [];
    };

    return Deuces;
} )();