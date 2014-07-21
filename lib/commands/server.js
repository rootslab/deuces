/*
 * SERVER mix-ins.
 */

exports.commands = function ( encode, error ) {
    var log = console.log
        , Abaco = require( 'abaco' )
        , parseIntArray = Abaco.parseIntArray
        , isArray = Array.isArray
        ;

    return {

        monitor : function ( cback ) {
            var me = this
                , result = encode( 'MONITOR', null, cback )
                ;
            // set special command shortcut
            result.isMonitor = 1;
            return result;
        }

        , time : function ( cback ) {
            var me = this
                ;
            return encode( 'TIME', parseIntArray, cback );
        }

    };

};