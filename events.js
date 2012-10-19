(function( $, window, undefined ) {
    var support = {
        touch: "ontouchend" in document
    };

    // add new event shortcuts
    $.each( ( "touchstart touchmove touchend " +
        "tap taphold " +
        "swipe swipeleft swiperight " +
        "scrollstart scrollstop" ).split( " " ), function( i, name ) {

        $.fn[ name ] = function( fn ) {
            return fn ? this.bind( name, fn ) : this.trigger( name );
        };

        // jQuery < 1.8
        if ( $.attrFn ) {
            $.attrFn[ name ] = true;
        }
    });

    var supportTouch = support.touch,
        scrollEvent = "touchmove scroll",
        touchStartEvent = supportTouch ? "touchstart" : "mousedown",
        touchStopEvent = supportTouch ? "touchend" : "mouseup",
        touchMoveEvent = supportTouch ? "touchmove" : "mousemove";

    function triggerCustomEvent( obj, eventType, event ) {
        var originalType = event.type;
        event.type = eventType;
        $.event.handle.call( obj, event );
        event.type = originalType;
    }

    // also handles scrollstop
    $.event.special.scrollstart = {

        enabled: true,

        setup: function() {

            var thisObject = this,
                $this = $( thisObject ),
                scrolling,
                timer;

            function trigger( event, state ) {
                scrolling = state;
                triggerCustomEvent( thisObject, scrolling ? "scrollstart" : "scrollstop", event );
            }

            // iPhone triggers scroll after a small delay; use touchmove instead
            $this.bind( scrollEvent, function( event ) {

                if ( !$.event.special.scrollstart.enabled ) {
                    return;
                }

                if ( !scrolling ) {
                    trigger( event, true );
                }

                clearTimeout( timer );
                timer = setTimeout( function() {
                    trigger( event, false );
                }, 50 );
            });
        }
    };

    // also handles taphold
    $.event.special.tap = {
        tapholdThreshold: 750,

        tapXThreshold: 35,

        setup: function() {
            var thisObject = this,
                $this = $( thisObject );

            $this.bind( touchStartEvent, function( event ) {

                if ( event.which && event.which !== 1 ) {
                    return false;
                }

                var origTarget = event.target,
                    origEvent = event.originalEvent,
                    origX = (supportTouch) ? event.originalEvent.changedTouches[0].clientX : event.clientX,
                    timer;

                function clearTapTimer() {
                    clearTimeout( timer );
                }

                function clearTapHandlers() {
                    clearTapTimer();

                    $this.unbind( touchStopEvent, clickHandler )
                        .unbind( touchStopEvent, clearTapTimer );
                    $( document ).unbind( touchStopEvent, clearTapHandlers );
                }

                function clickHandler( e ) {
                    var endX = (supportTouch) ? e.originalEvent.changedTouches[0].clientX : e.clientX;

                    clearTapHandlers();
                    var xOK = (origX - endX > 0) ? (origX - endX) <= $.event.special.tap.tapXThreshold : (endX - origX) <= $.event.special.tap.tapXThreshold;
                    // ONLY trigger a 'tap' event if the start target is
                    // the same as the stop target and if the X coords
                    // haven't strayed too far.
                    if ( origTarget === e.target && xOK ) {
                        triggerCustomEvent( thisObject, "tap", e );
                    }
                }

                $this.bind( touchStopEvent, clearTapTimer )
                    .bind( touchStopEvent, clickHandler );
                $( document ).bind( touchStopEvent, clearTapHandlers );

                timer = setTimeout( function() {
                    triggerCustomEvent( thisObject, "taphold", $.Event( "taphold", { target: origTarget } ) );
                }, $.event.special.tap.tapholdThreshold );
            });
        }
    };

    // also handles swipeleft, swiperight
    $.event.special.swipe = {
        scrollSupressionThreshold: 30, // More than this horizontal displacement, and we will suppress scrolling.

        durationThreshold: 1000, // More time than this, and it isn't a swipe.

        horizontalDistanceThreshold: 30,  // Swipe horizontal displacement must be more than this.

        verticalDistanceThreshold: 75,  // Swipe vertical displacement must be less than this.

        setup: function() {
            var thisObject = this,
                $this = $( thisObject );

            $this.bind( touchStartEvent, function( event ) {
                var data = event.originalEvent.touches ?
                        event.originalEvent.touches[ 0 ] : event,
                    start = {
                        time: ( new Date() ).getTime(),
                        coords: [ data.pageX, data.pageY ],
                        origin: $( event.target )
                    },
                    stop;

                function moveHandler( event ) {

                    if ( !start ) {
                        return;
                    }

                    var data = event.originalEvent.touches ?
                        event.originalEvent.touches[ 0 ] : event;

                    stop = {
                        time: ( new Date() ).getTime(),
                        coords: [ data.pageX, data.pageY ]
                    };

                    // prevent scrolling
                    if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
                        event.preventDefault();
                    }
                }

                $this.bind( touchMoveEvent, moveHandler )
                    .one( touchStopEvent, function( event ) {
                        $this.unbind( touchMoveEvent, moveHandler );

                        if ( start && stop ) {
                            if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
                                Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
                                Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {

                                start.origin.trigger( "swipe" )
                                    .trigger( start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight" );
                            }
                        }
                        start = stop = undefined;
                    });
            });
        }
    };
    $.each({
        scrollstop: "scrollstart",
        taphold: "tap",
        swipeleft: "swipe",
        swiperight: "swipe"
    }, function( event, sourceEvent ) {

        $.event.special[ event ] = {
            setup: function() {
                $( this ).bind( sourceEvent, $.noop );
            }
        };
    });

})( jQuery, this );