/*
 * PUBSUB mix-ins.
 */

exports.commands = function ( encode, error ) {
    var Abaco = require( 'abaco' )
        , parseIntArray = Abaco.parseIntArray
        , isArray = Array.isArray
        // handler for unsubscribe and punscubscripe
        , pubsub = function ( isPattern, isUnsub ) {
            var cname = ( isPattern ? 'P' : '' ) + ( isUnsub ? 'UN' : '' ) + 'SUBSCRIBE'
                ;
            return function ( list, cback ) {
                var result = null
                    ;
                if ( ! list ) result = encode( cname, null, cback );
                else if ( isArray( list ) ) {
                    if ( list.length ) result = encode( cname, list.slice( 0, 1 ), list.slice( 1 ), null, cback );
                    else result = encode( cname, null, cback );
                } else result = encode( cname, list, null, cback );
                // set special command shortcut
                result.isSubscription = 1;
                if ( isPattern ) result.isPunsubscribe = 1;
                else result.isUnsubscribe = 1;
                // set expected number of message replies
                result.expectedMessages = result.bulks - 1;
                return result;
            }
            ;
        }
        ;

    return {

        publish : function ( channel, message, cback ) {
            if ( ! channel ) {
                return error( 'PUBLISH', arguments );
            }
            return encode( 'PUBLISH', channel, message, parseIntArray, cback );
        }

        , psubscribe : pubsub( true, false )

        , punsubscribe : pubsub( true, true )

        , subscribe : pubsub( false, false )

        , unsubscribe : pubsub( false, true )

    };

};