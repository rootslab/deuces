/*
 * Deuces, a module to handle Redis commands/replies queues.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Deuces = ( function () {
    var log = console.log
        , Deuces = function () {
            var me = this
                ;
            if ( ! ( me instanceof Deuces ) ) {
                return new Deuces();
            }
        }
        , dproto = null
        ;

    dproto = Deuces.prototype;

    dproto.pop = function () {
        var me = this
            ;
    };

    dproto.push = function () {
        var me = this
            ;
    };

    return Deuces;
} )();