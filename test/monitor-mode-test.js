#!/usr/bin/env node

/* 
 * Deuces, monitor mode events test.
 * Send monitor commands on 'cacheready', specifying the callback.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Deuces = require( '../' )
    , client = Deuces()
    , another_client = Deuces()
    // expected events
    , evts = []
    // collected events
    , collected = client.logger.collected
    ;

log( '- created new Deuces client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
}, true );

log( '- now connecting client.' );

client.connect( null, function () {

    log( '- execute MONITOR command when client is ready.' );

    client.commands.monitor( function ( is_err, reply, fn ) {
        log( '- MONITOR callback should execute and get OK.' );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
    } );

    log( '- try to execute a ping command in monitor mode.' );

    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );
    log( '- connecting another client to Redis for sending commands.' );

    log( '- the other client will automatically send "SELECT db" command.' );

    another_client.connect( null, function ( address ) {

        log( '- the other client is sending PING.' );
        another_client.commands.ping();

        // push expected monitor message
        evts = [ 'PING', 'PING' ];

        log( '- wait 1 second to collect monitor events' );

        setTimeout( function () {
            var i = 0
                , r = null
                , el = null
                , isArray = Array.isArray
                ;
            // check received monitor messages
            for ( r in collected.events ) {
                el = collected.events[ r ];
                if ( isArray( el ) ) {
                    log( '- check if %s exists in monitor messages.', evts[ i ] );
                    log( el [ 0 ])
                    assert.ok( ~ el[ 0 ].indexOf( evts[ i++ ] ), 'monitor messages should contain these commands: ' + evts );
                }
            };

            log( '- disconnect other client.' );
            another_client.disconnect();

        }, 1000 );

    } );

} );

log( '- wait 3 seconds to collect events' );

setTimeout( function () {

    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function () {
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        // end test
        log( '- check collected events for client disconnection.' );
        assert.ok( ~ collected.events.indexOf( 'offline' ) );
        assert.ok( ~ collected.events.indexOf( 'lost' ) );
    }, 1000 );

}, 3000 );