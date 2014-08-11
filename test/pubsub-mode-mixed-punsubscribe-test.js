#!/usr/bin/env node

/* 
 * Deuces, pubsub mode events test.
 */

exports.test = function ( done ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , assert = require( 'assert' )
        , Bolgia = require( 'bolgia' )
        , test_utils = require( './deps/test-utils' )
        , inspect = test_utils.inspect
        , format = test_utils.format
        , Deuces = require( '../' )
        , client = Deuces()
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , channels = [ 1, 2, 3 ]
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Deuces client with custom options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {
        var i = 0
            ;

        log( '- now client is connected and ready to send.' );
        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready', 'listen' );

        log( '- subscribe client to "channel".' );

        // push expected event
        evts.push( 'message' );

        client.commands.subscribe( 'channels', function () {

            log( '- psubscribe client to "chan" pattern.' );

            // push expected event
            evts.push( 'message' );

            client.commands.psubscribe( 'chan*', function () {

                log( '- unsubscribe client from all channels (no args).' );

                // push expected event
                evts.push( 'message' );

                client.commands.unsubscribe( null, function () {
                    // push expected event
                    evts.push( 'message', 'shutup' );
                    log( '- punsubscribe client from all patterns (no args).' );
                    client.commands.punsubscribe( null, function () {
                        ++i;
                    } );
                } );
            } );
        } );

    } );

    log( '- now waiting 2 secs to collect events..' );

    setTimeout( function () {

        var i = 0
            ;

        log( '- now disconnecting client with QUIT.' );

        // push expected connection event
        evts.push( 'reply', 'offline', 'lost' );

        client.commands.quit( function ( is_err, reply, fn ) {
            log( '- QUIT callback.', fn( reply ) );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
            log( '- OK, client was disconnected.' );
        } );

        setTimeout( function () {
            log( '- check collected events for client, should be:', inspect( evts ) );
            assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

            exit();

        }, 1000 );

    }, 2000 );

};