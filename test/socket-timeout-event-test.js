#!/usr/bin/env node

/* 
 * Spade, auth failing test.
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
        , opt = {
            security : {
                '127.0.0.1:6379' : {
                    requirepass : null
                }
            }
            , socket : {
                connection : {
                    timeout : 2000
                }
            }
        }
        , client = Deuces( opt )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Spade client with custom options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );


    evts.push( 'connect', 'scanqueue', 'ready' );

    client.connect( null, function () {
        evts.push( 'timeout', 'reply' );
        setTimeout( function () {
            client.commands.ping( function () {
                evts.push( 'timeout' );
            } );
        }, 3000 );
    } );

    log( '- wait 6 seconds to collect events..' );

    setTimeout( function () {

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

    }, 6000 );

};