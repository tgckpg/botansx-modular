const cl = global.botanLoader;
const Dragonfly = global.Dragonfly;

const Redis = require( "redis" );

const SessConf = cl.load( "config.sx.modular.session" );

var Client = Redis.createClient(
	SessConf.config.port
	, SessConf.config.host
	, SessConf.config.options
);

Client.addListener( "error", ( e ) => { throw e; } );

Client.select( SessConf.config.database, function( err, message )
{
	if( err ) throw err; 
	Dragonfly.Info( "[Session] Database connected. Ready." );
});

module.exports = Client;
