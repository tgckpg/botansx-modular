"use strict";

const cl = global.botanLoader;
const Dragonfly = global.Dragonfly;

const ProxyLocale = function( name, _locale, _parent )
{
	var _thisProxy = new Proxy( _locale, {

		get: ( target, prop ) => {

			switch( prop )
			{
				case Symbol.toPrimitive:
					return () => _locale( global.lang || "en-US" );

				case "name":
					return _parent ? `${_parent.name}.${name}` : name;

				case "inspect":
					return _parent
						? () => `LocaleString[ Locale${_parent.name}.${name} ]`
						: () => `LocaleString`
						;
			}

			if( target[ prop ] == undefined )
			{
				target[ prop ] = ProxyLocale(
					prop
					, function( lang, stack )
					{
						if( !stack )
						{
							stack = stack || [ prop, name ];
						}
						else
						{
							stack[1] = name + "." + stack[1];
						}

						return _locale( lang, stack );
					}
					, _thisProxy );
			}

			return Reflect.get( target, prop );
		}

	} );

	return _thisProxy;
};

const rLocale = function( lang, stack )
{
	var Zone = "LocaleSX." + lang + stack[1];

	try
	{
		var zoneFile = cl.load( Zone );

		var translated = zoneFile[ stack[0] ];
		if( translated == undefined )
		{
			throw new Error( `Translation does not exists: ${Zone}[ ${stack[0]} ]` );
		}

		return translated;
	}
	catch( e )
	{
		Dragonfly.Warning( e.message );
	}

	return Zone + "." + stack[0];
};

String.prototype.L = function( ...args )
{
	var i = 0;
	var j = -1;
	var str = "";

	var a = 0;
	while( ~( j = this.indexOf( "%s", i ) ) )
	{
		// handle %% => % literal
		if( this[ j - 1 ] == "%" )
		{
			// How many % in a row?
			var nump = -1;
			while( this[ j + ( -- nump ) ] == "%" );

			// If number of percent is even, this %s is escaped
			if( nump % 2 == 0 )
			{
				i ++;
				continue;
			}
		}

		str += this.substring( i, j ) + args[ a ++ ];

		i = j + 2;
	}

	if( str == "" ) return this.replace( "%%", "%" );
	else str += this.substring( i, this.length );

	return str;
};

module.exports = ProxyLocale( "", rLocale );
