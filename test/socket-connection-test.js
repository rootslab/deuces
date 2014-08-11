#!/usr/bin/env node

/* 
 * Deuces, socket connection events test.
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
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- created new Deuces client with default options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {
        log( '- now client is connected and ready to send.' );
        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready' );
    } );

    log( '- wait 1 second to collect events..' );

    setTimeout( function () {
        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'something goes wrong with client connection! got: ' + collected.events );

        log( '- now disconnecting client.' );
        client.disconnect( function () {
            log( '- client disconnected.' );
     
            // push expected events
            evts.push( 'offline', 'lost' );

            log( '- check collected events from client, should be: %s.', inspect( evts ) );
            assert.deepEqual( collected.events, evts, 'something goes wrong with client disconnection! got: ' + inspect( collected.events ) );

            exit();

        } );

    }, 1000 );

};