(function( $, window, document, undefined ){

    var defaults = {
        activeClass           : 'touched',
        direction             : 'h', // h for horizontal || v for vertical
        resistance            : 100,
        onMove                : function () {},
        callback              : function () {}
    };

    $.fn.onTouch = function(options){

        this.options      = $.extend( {}, defaults, options);

        var el = $(this),
            that = this,
            dir = '',
            activeClass = this.options.activeClass,
            direction   = this.options.direction,
            hold        = this.options.resistance,
            duration    = 200,
            timeStamp,
            timeNow,
            startX,
            startY,
            distX,
            distY,
            touchable = is_touch_device();

        var focus = false;

        function is_touch_device() {
            return 'ontouchstart' in window
                || 'onmsgesturechange' in window;
        }

        el.off( "mouseup mouseleave touchend",  End);


        el.on( "mousedown touchstart",  function(){
            focus = true;
        });

        el.one( "mousedown touchstart",  Start);


        function Start(evt){ 
            evt.stopImmediatePropagation();
            evt.stopPropagation();
            evt.preventDefault();

            timeStamp   = new Date().getTime();

            if(touchable){
                startX = evt.pageX || evt.originalEvent.touches[0].pageX;
                startY = evt.pageY || evt.originalEvent.touches[0].pageY;
            } else {
                startX = evt.pageX;
                startY = evt.pageY;
            }
            el.on( "mouseup touchend",  End);
            el.on( "mousemove.dragging touchmove",  Move);
        }

        function Move(evt){   
            evt.stopImmediatePropagation();
            evt.stopPropagation();
            evt.preventDefault();


            el.css({
                'user-select': 'none'
            }).addClass(activeClass);

            if(touchable){
                distX = (evt.pageX || evt.originalEvent.changedTouches[0].pageX) - startX;
                distY = (evt.pageY || evt.originalEvent.changedTouches[0].pageY) - startY;
            } else {
                distX = evt.pageX - startX;
                distY = evt.pageY - startY;
            }

            if(distX > 1 || distX < -1 || distY > 1 || distY < -1 ) {

                that.options.onMove(distX,distY);
                el.one( "mouseup mouseleave touchend",  End);

            } else { 
                el.off( "mousedown touchstart",  Start);
                el.off( "mouseup touchend",  End);
            }

        }

        function End(evt){ 
            console.log(10 ) ;
            evt.stopImmediatePropagation();
            evt.stopPropagation();
            evt.preventDefault();
            if(touchable){
                distX = (evt.pageX || evt.originalEvent.changedTouches[0].pageX) - startX;
                distY = (evt.pageY || evt.originalEvent.changedTouches[0].pageY) - startY;
            } else {
                distX = evt.pageX - startX;
                distY = evt.pageY - startY;
            }

            timeNow = new Date().getTime();

            if(focus){

                if (timeNow - timeStamp >= duration ) {

                    el.off( "mousemove touchmove",  Move).removeClass(activeClass);

                    timeStamp = timeNow;

                    if(direction == 'v') {
                        if(distY > hold){
                            dir = 'down';
                        }else if(distY < -hold){
                            dir = 'up';
                        }else {
                            dir= '';
                        }
                    } else {
                        if(distX > hold){
                            dir= 'right';
                        } else if(distX < -hold){
                            dir= 'left';
                        } else {
                            dir= '';
                        }
                    }

                    that.options.callback(dir, distX,distY);
                    el.one( "mousedown touchstart",  Start);

                }

                focus = false;

            }

            el.off( "mousemove touchmove").removeClass(activeClass);
            el.one( "mousedown touchstart",  Start);
        }

    }

})( jQuery, window, document, undefined );
