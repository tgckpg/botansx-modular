"use strict";

const cl = global.botanLoader;
const Dragonfly = global.Dragonfly;

const util = require( "util" );
const EventEmitter = require( "events" ).EventEmitter;

const Client = cl.load( "botansx.modular.redisclient" );
const rand = cl.load( "botansx.utils.random" );
const SessConf = cl.load( "config.sx.modular.session" );

class SessionEventArgs
{
	constructor( message )
	{
		this.message = message;
	}
}

class Session extends EventEmitter
{
	static create( args )
	{
		if( !args ) args = [];
		return new Session( args[0], args[1] );
	}

	constructor( hash, prefix, noIdReset )
	{
		super();
		var _self = this;

		if( hash && prefix )
			hash = hash.replace( new RegExp( "^" + prefix + "\\." ), "" );

		prefix = prefix ? prefix + "." : "";

		this.id = prefix + hash;
		this.ready = false;
		this.exists = false;

		Client.HGETALL( this.id, function( err, obj )
		{
			if( err ) throw err;

			if( _self.exists = !!obj )
			{
				_self.__sess = obj;
			}
			// Auto reset the session id if no match
			else if( !noIdReset )
			{
				_self.id = prefix + rand.uuid();
			}

			_self.ready = true;
			_self.emit( "ready", _self );
		} );

		this.__sess = {};
		this.__emitOk = ( e, m ) => {
			_self.__emit( e, "set", new SessionEventArgs( m ) );
		};
	}

	__emit( err, EventName, SessionArgs )
	{
		if( err ) throw err;
		this.emit( EventName || "set", this, SessionArgs );
	}


	// Spawn session with specified id
	spawn( expire, handler )
	{
		var ttl = ( expire === undefined ? SessConf.ttl : expire ) + 0;
		this.__sess[ "lifespan" ] = ttl;

		var _self = this;
		Client.multi()
			.HSET( this.id, "spawn", new Date() )
			.HSET( this.id, "lifespan", ttl )
			.EXPIRE( this.id, ttl )
			.exec( handler || this.__emitOk );
	}

	destroy( handler )
	{
		this.__sess = {};
		Client.DEL( this.id, handler || this.__emitOk );
	}

	set( name, val )
	{
		this.__sess[ name ] = val;
		Client.HSET( this.id, name, val, this.__emitOk );
	}

	get( name )
	{
		return this.__sess[ name ];
	}

	// Get value asynchronously
	aget( name, handler )
	{
		var _self = this;
		Client.HGET(
			this.id, name
			, function( err, rep )
			{
				_self.__emitOk( err );
				_self.__sess[ name ] = rep;
				handler && handler( rep );
			}
		);
	}

	remove( name )
	{
		delete this.__sess[ name ];
		Client.HDEL( this.id, name, this.__emitOk );
	}

	expire( seconds )
	{
		// expire > lifespan > SessConf.ttl
		var ttl = ( seconds === undefined
			? ( ( this.__sess[ "lifespan" ] === undefined )
				? SessConf.ttl
				: this.__sess[ "lifespan" ]
			) : seconds ) + 0
		;

		this.__sess[ "lifespan" ] = ttl;

		Client.multi()
			.HSET( this.id, "lifespan", ttl )
			.EXPIRE( this.id, ttl, this.__emitOk )
			.exec( this.__emitOk );
	}

	get busy()
	{
		return 0 < ( Client.command_queue.length + Client.offline_queue.length );
	}
}

Session.SessionEventArgs = SessionEventArgs;

module.exports = Session;
