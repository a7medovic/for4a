(function ( $, window, document, undefined ){
    
/**
 * FemtoSlider - An open source jquery slider 
 * Beautiful smooth and nested slides
 * @author      Baianat
 * @copyright   2015 Baianat
 * @link        http://www.baianat.com
 * @license     MIT permissive license http://www.baianat.com
 * @version     1.0.0
 * @package     FemtoSlider
 * 
 */

    var pluginName = 'FemtoSlider',
        defaults = {
            startSlide     : 0,
            loop           : true,
            fixedHeight    : true,

            dots           : true,
            dotPosition    : 'bottom',    // top, bottom, right, left

            thumbs         : false,
            dragThumbs     : false,
            thumbsStyle    : 'h',         // h, v

            arrows         : true,
            arrowsPosition : 'h',         // h, v

            keys           : true,
            scroll         : true,
            swipe          : false,
            drag           : false,

            transition     : 'slideH',    // slideH, slideV, fade
            duration       : 600,
            interfere      : true,
            proportion     : .3,          // 0 : .5

            indicator      : false,
            indicatorStyle : 'h',         // h, v

            autoPlay       : false,
            delay          : 8000,        // Time in millisecond
            timer          : false,
            playButton     : false,
            playOnStart    : false,       // play on init

            onInit                : function () {},
            onChange              : function () {},
            afterChange           : function () {}
        };

    // add one navigator option

    function Plugin( element, options ) {

        this.options        = $.extend( {}, defaults, options);

        this.slider         = $(element).addClass('femtoSlider').css({'overflow'  : 'hidden'});
        this.slides         = this.slider.find('> .slides');
        this.slide          = this.slider.find('> .slide');
        this.num            = this.slide.length;
        this.height         = this.slider.height();
        this.width          = this.slider.width();

        this.go             = this.options.startSlide;
        this.transition     = this.options.transition;

        this.prefix         = this.getPrefix();

        this.timeStamp      = new Date().getTime();

        this.init();
    }

    Plugin.prototype = {

        init: function(){
            var that = this;

            this.setup();

            $(window).on('resize', function(){
                that.setCSS();

                var slider = that.slider;

                var ww = $(window).width(),
                    wh = $(window).height();

                (wh < ww) ?
                    slider.removeClass('portrait').addClass('landscape') :
                    slider.removeClass('landscape').addClass('portrait') ;


            }).resize();

            if( this.options.keys ) this.handleKeys();

            if( this.options.swipe || this.options.drag ) this.handleTouch();
 
            if( this.options.dots ) this.setDots();

            if( this.options.indicator ) this.setIndicator();

            if( this.options.arrows ) this.setArrows();

            if( this.options.scroll == true ) this.handleScroll();

            if( this.options.autoPlay ) this.setAutoPlay();



            var links    = this.slider.find('> ul.fs-links > li');
            var inLink   = this.slide.find('a.fs');



            links.on('click', function(){
                that.handleLinks($(this));
            });

            inLink.on('click', function(e){
                e.preventDefault();
                that.handleInLinks($(this));
            });

        },

        getPrefix: function(){
            var styles = window.getComputedStyle(document.documentElement, ''),
                pre = (Array.prototype.slice
                    .call(styles)
                    .join('')
                    .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                    )[1];
            return '-' + pre + '-';
        },

        setup: function(){

            this.slide.wrapAll( "<div class='slides' />");
            this.slides = this.slider.find('> .slides');

            var slide = this.slide;

            var g = this.go;

            if(this.transition == 'slideV'){
                slide.css({top: '100%'});
                slide.eq(g).css({top: 0});
            }else {
                slide.css({left: '100%'});
                slide.eq(g).css({left: 0});
            }


            this.reset(g);

            this.options.onInit(slide.eq(g));
        },

        setCSS: function(){
            this.height         = this.slider.height();
            this.width          = this.slider.width();

            var h = this.slider.height(),
                w = this.slider.width();
            console.log(this.slider.width()) ;    
            this.slide.css({
                position  : 'absolute',
                width     : w
            });

            if(this.options.fixedHeight || this.transition == 'slideV'){
                this.slide.css({ height: h });
            }

        },

        resetClasses: function(g){

            var slide      = this.slide,
                from       = this.go;


            var current = slide.eq(g);

            this[this.transition](from, g);


            this.options.onChange(current);
            this.reset(g);

        },

        reset: function(g){
            this.go = g;

            var n = this.num -1,
                next   = g + 1,
                prev   = g - 1;


            if ( g == 0 ) prev = n;
            else if( g == n ) next = 0;

            var slide  = this.slide,
                slider = this.slider,
                dots   = slider.find('> .dots.fs-controls > li'),
                link   = slider.find('> .fs-links > li');


            dots.removeClass('active').eq(g).addClass('active');
            link.removeClass('active').eq(g).addClass('active');

            slide.removeClass("current prev next").css({zIndex: 1});

            slide.eq(g).addClass('current').css({'zIndex': 100});
            slide.eq(next).addClass('next').css({'zIndex': 10});
            slide.eq(prev).addClass('prev').css({'zIndex': 10});

            this.timeStamp = new Date().getTime();


            this.handleIndicator();

            return true;
        },

        slideH: function(from, to){
            var that        = this,
                duration    = this.options.duration,
                n           = this.num - 1,
                slide       = this.slide.css({'zIndex': 1}),
                unit        = this.width,
                slideFrom   = slide.eq(from).css({zIndex: 10}),
                slideTo     = slide.eq(to).css({'zIndex': 100});

            var xduration;

            if(this.options.interfere) {
                var proportion = this.options.proportion;

                if(proportion >= 0 || proportion <= .5){
                    xduration = duration * ( 1 + proportion);
                } else {
                    xduration = duration * 1.3;
                }
            } else {
                xduration = duration;
            }

            if( from == n && to == 0) {

                slideTo.css({
                    left: unit
                })
                    .stop(true,true)
                    .animate({
                        left: 0
                    }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({
                        left: -unit
                    }, xduration);

            } else if( from == 0 && to == n) {

                slideTo.css({
                    left: -unit
                })
                    .stop(true,true)
                    .animate({
                        left: 0
                    }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom.stop(true,true)
                    .animate({
                        left: unit
                    }, xduration);

            } else if( from < to ) {

                slideTo.css({
                    left: unit
                })
                    .stop(true,true)
                    .animate({
                        left: 0
                    }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({
                        left: -unit
                    }, xduration);

            } else {

                slideTo.css({
                    left: -unit
                })
                    .stop(true,true)
                    .animate({
                        left: 0
                    }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom.stop(true,true)
                    .animate({
                        left: unit
                    }, xduration);

            }


        },

        slideV: function(from, to){
            var that        = this,
                duration    = this.options.duration,
                n           = this.num - 1,
                slide       = this.slide.css({'zIndex': 1}),
                unit        = this.height,
                slideFrom   = slide.eq(from).css({'zIndex': 10}),
                slideTo     = slide.eq(to).css({'zIndex': 100});

            var xduration;

            if(this.options.interfere) {
                var proportion = this.options.proportion;

                if(proportion >= 0 || proportion <= .5){
                    xduration = duration * ( 1 + proportion);
                } else {
                    xduration = duration * 1.3;
                }
            } else {
                xduration = duration;
            }

            if( from == n && to == 0) {
                slideTo.css({top: unit})
                    .stop(true,true)
                    .animate({
                        top: 0
                    }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({ top: -unit }, xduration);

            } else if( from == 0 && to == n) {

                slideTo.css({top: -unit})
                    .stop(true,true)
                    .animate({ top: 0 }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({ top: unit }, xduration);

            } else if( from < to ) {

                slideTo.css({top: unit})
                    .stop(true,true)
                    .animate({ top: 0 }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({ top: -unit }, xduration);


            } else {

                slideTo.css({top: -unit})
                    .stop(true,true)
                    .animate({ top: 0 }, duration, function(){
                        that.options.afterChange(slideTo);
                    });

                slideFrom
                    .stop(true,true)
                    .animate({ top: unit }, xduration);

            }




        },

        fade: function(from, to){
            var duration    = this.options.duration,
                that        = this,
                slide       = this.slide.css({left: 0, top: 0});

            slide.each(function(){
                var x = $(this).css({left:0}),
                    i = x.index();

                if(i == to){
                    x.css({zIndex: 99, opacity: 0})
                     .animate({ opacity: 1 }, duration, function(){
                        that.options.afterChange(x);
                    });
                } else if(i == from ) {
                    x.css({zIndex: 100, opacity: 1});
                } else {
                    x.css({zIndex: 1, opacity: 0});
                }

            });

        },

        forward: function(){
            var g    = this.go,
                n    = this.num - 1;

            if(this.options.loop) {
                g = (g == n) ? 0 : ++g;
                this.resetClasses(g);
            }else {
                if(g <= n){
                    ++g;
                    this.resetClasses(g);
                }
            }

        },

        backward: function(){
            var g    = this.go,
                n    = this.num - 1;

            if(this.options.loop){
                g = (g == 0) ? n : --g;
                this.resetClasses(g);
            } else {
                if(g >= 0){
                    --g;
                    this.resetClasses(g);
                }
            }

        },

        handleScroll: function(){

            var that = this,
                slides = this.slides;

            slides.on('mousewheel DOMMouseScroll MozMousePixelScroll', function (e) {

                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();

                var timeNow = new Date().getTime();

                if (timeNow - that.timeStamp >= that.options.duration) {

                    if(e.originalEvent.wheelDelta < 0 || e.originalEvent.detail > 0) {
                        // Scroll Down
                        that.forward();
                    } else {
                        // Scroll Up
                        that.backward();
                    }

                }

            });

        },

        handleKeys: function(){
            var that = this,
                transition = this.transition,
                slider = this.slider;

            slider.on('mouseenter', handle);
            slider.on('mouseleave', function(){
                slider.off('mouseenter', handle);
            });

            function handle(){
                $(document).on('keydown', function (e) {
                    var timeNow = new Date().getTime();

                    if (timeNow - that.timeStamp >= that.options.duration ) {

                        if(transition == 'slideV') {

                            if (e.keyCode === 38) {
                                // Up arrow key
                                that.backward();

                            } else if(e.keyCode === 40) {
                                // Down arrow key
                                that.forward();
                            }

                        } else {
                            if (e.keyCode === 37) {
                                // Left arrow key
                                that.backward();

                            } else if(e.keyCode === 39) {
                                // Right arrow key
                                that.forward();
                            }
                        }

                    }

                });

            }

        },

        handleTouch: function(){

            var slides     = this.slides,
                that       = this,
                transition = this.transition,
                u          = (transition == 'slideV') ? this.height : this.width,
                hold       = u / 2,
                direction  = (transition == 'slideV') ? 'v' : 'h';

            var xx, yy;


            var current = slides.find('> .current'),
                prev    = slides.find('> .prev'),
                next    = slides.find('> .next');

            var dragOptions = ({
                direction             : direction,
                resistance            : hold,
                onMove                : function (x, y) { move(x, y); },
                callback              : function (dir, x, y) { callback(dir, x, y); }
            });

            var callback = function(dir, x, y){
                if(that.options.drag) {
                    that.dragTo(dir, x, y);
                } else {
                    if(transition == 'slideV') {
                        if(dir == 'up' ){
                            that.forward();

                        }else if(dir == 'down'){
                            that.backward();
                        }
                    } else {

                        if(dir == 'left' ){
                            that.forward();

                        } else if(dir == 'right'){
                            that.backward();
                        }
                    }
                }
            };

            var move = function(x,y){
 
                if(that.options.interfere) {
                    var proportion = that.options.proportion;

                    if(proportion >= 0 || proportion <= .5){
                        yy = y * proportion;
                        xx = x * proportion;
                    } else {
                        yy = y * .3;
                        xx = x * .3;
                    }
                } else {
                    yy = y;
                    xx = x;
                }

                if(that.options.drag) {

                    current = slides.find('> .current').css({zIndex: 100});
                    prev    = slides.find('> .prev').css({zIndex: 101});
                    next    = slides.find('> .next').css({zIndex: 101});

                    if(transition == 'slideV'){

                        prev.css({top:-u, left:0});
                        next.css({top: u, left:0});

                        if( y < -5){

                            prev.css({top:-u });
                            next.css({top: u+y});

                        } else if( y > 5){

                            next.css({ top: u });
                            prev.css({ top: -u+y});
                        }

                        current.css({top: yy});

                    } else if(transition == 'slideH'){
                        prev.css({left:-u, top:0});
                        next.css({left: u, top:0});

                        if( x < 0){

                            prev.css({left:-u});
                            next.css({left: u+x});

                        } else {

                            next.css({left: u});
                            prev.css({left: -u+x});
                        }

                        current.css({left: xx});
                    }
                }

            };

            slides.onTouch(dragOptions);

        },

        dragTo: function(dir, x, y){
            var that       = this,
                transition = this.transition,
                u          = (transition == 'slideV') ? this.height : this.width,
                slides     = this.slides,
                d          = 500,
                g;

            var current = slides.find('> .current'),
                prev    = slides.find('> .prev'),
                next    = slides.find('> .next');

            if(transition == 'slideV') {
                if(dir == 'up'){
                    // next slide
                    g = next.index();

                    next.animate({top: 0 }, d, function(){
                        that.options.afterChange(next);
                        that.reset(g);
                    });

                    current.animate({top: -u }, d);

                } else if (dir == 'down'){
                    // prev slide
                    g = prev.index();

                    prev.animate({ top: 0 }, d, function(){
                        that.options.afterChange(prev);
                        that.reset(g);
                    });

                    current.animate({ top: u }, d);

                } else {
                    // reset all

                    if( y > 0) {
                        current.animate({top: 0 }, d,function(){
                            $(this).css({'zIndex': 100});
                        });

                        prev.animate({top: -u }, d,function(){
                            $(this).css({'zIndex': 10});
                        });
                    } else {
                        current.animate({top: 0 }, d,function(){
                            $(this).css({'zIndex': 100});
                        });

                        next.animate({top: u }, d,function(){
                            $(this).css({'zIndex': 10});
                        });
                    }

                }
            }else if(transition == 'slideH') {
                if(dir == 'left'){
                    // next slide
                    g = next.index();

                    next.animate({left: 0 }, d, function(){
                        that.options.afterChange(next);
                        that.reset(g);
                    });

                    current.animate({left: -u }, d);

                } else if (dir == 'right'){
                    // prev slide
                    g = prev.index();

                    prev.animate({ left: 0 }, d, function(){
                        that.options.afterChange(prev);
                        that.reset(g);
                    });

                    current.animate({ left: u }, d);

                } else {
                    // reset all

                    if( x > 0) {
                        current.animate({left: 0 }, d,function(){
                            $(this).css({'zIndex': 100});
                        });

                        prev.animate({left: -u }, d,function(){
                            $(this).css({'zIndex': 10});
                        });
                    } else {
                        current.animate({left: 0 }, d,function(){
                            $(this).css({'zIndex': 100});
                        });

                        next.animate({left: u }, d,function(){
                            $(this).css({'zIndex': 10});
                        });
                    }



                }
            } else {
                if(dir == 'left' || dir == 'up'){
                    // next slide
                    g = next.index();

                    next.animate({left: 0 }, d, function(){
                        that.options.afterChange(next);
                        that.reset(g);
                    });

                    current.animate({left: -u }, d);

                } else if (dir == 'right' || dir == 'down'){
                    // prev slide
                    g = prev.index();

                    prev.animate({ left: 0 }, d, function(){
                        that.options.afterChange(prev);
                        that.reset(g);
                    });

                    current.animate({ left: u }, d);

                }
            }

        },

        handleLinks: function(x){
            var i = x.index();

            if(! x.hasClass('active') ){
                this.resetClasses(i);
            }

        },

        handleInLinks: function(x){
            var id    = x.attr('href');
            var slide = this.slides.find(id),
                i     = slide.index();

            if(! slide.hasClass('current') ){
                this.resetClasses(i);
            }

        },

        setDots: function(){
            var dots, i,
                that = this,
                g = this.go,
                slider = this.slider,
                position = this.options.dotPosition;

            if(position == 'bottom'){
                slider.append('<ul class="dots fs-controls centerize bottom"></ul>');
            } else if(position == 'top'){
                slider.append('<ul class="dots fs-controls centerize top"></ul>');
            } else if(position == 'right'){
                slider.append('<ul class="dots fs-controls right"></ul>');
            } else if(position == 'left'){
                slider.append('<ul class="dots fs-controls left"></ul>');
            }

            dots = slider.find('> .dots.fs-controls');


            for(i=0; i < this.num; ++i){
                dots.append('<li></li>');
            }

            dots.find('> li').eq(g).addClass('active');

            var dot    = dots.find('> li');

            dot.on('click', function(){
                var x = $(this);
                var i = x.index();

                if(! x.hasClass('active') ){
                    that.resetClasses(i);
                }
            });

        },

        setIndicator: function(){
            var s = this.options.indicatorStyle;
            this.slider.append('<div class="indicator '+ s +'"></div>');
            var indicator = this.slider.find('> .indicator');

            indicator.css({
                position  : 'absolute',
                zIndex    : 10000000,
                bottom    : 0,
                left      : 0
            });

            var n = this.num;
            var g = this.go + 1;

            var p = (g / n) * 100;

            if(s == 'h'){
                indicator.css({
                    width: p+'%',
                    height: 2
                });
            } else {
                indicator.css({
                    height: p+'%',
                    top: 0,
                    width: 2
                });
            }
        },

        handleIndicator: function(){
            var indicator = this.slider.find('> .indicator');
            var s = this.options.indicatorStyle;
            var g = this.go + 1;
            var n = this.num;
            var d = this.duration;

            var p = (g / n) * 100;

            if(s == 'h'){
                indicator.animate({
                    width: p+'%',
                    height: 2
                }, d);
            } else {
                indicator.animate({
                    height: p+'%',
                    width: 2
                }, d);
            }
        },

        setArrows: function(){
            var that = this,
                arrowsPosition = this.options.arrowsPosition;

            if(arrowsPosition == 'h') {
                this.slider.append('<p data-dir="prev" class="arrows left fs-controls"></p>');
                this.slider.append('<p data-dir="next" class="arrows right fs-controls"></p>');

            } else {
                this.slider.append('<p data-dir="prev" class="arrows up fs-controls"></p>');
                this.slider.append('<p data-dir="next" class="arrows down fs-controls"></p>');
            }

            var arr = this.slider.find('> .arrows.fs-controls').css({'cursor': 'pointer'});

            arr.each(function(){

                $(this).on('click', function(e){
                    e.preventDefault();
                    var timeNow = new Date().getTime(),
                        dir = $(this).data('dir');

                    if (timeNow - that.timeStamp >= that.options.duration ) {

                        (dir == 'next') ? that.forward() : that.backward();

                    }
                });

            });


        },

        setAutoPlay: function(){

            if(this.options.timer) {
                this.slider.append('<div class="timer"></div>');
                var timer = this.slider.find('> .timer');
                timer.css({
                    position  : 'absolute',
                    padding   : 0,
                    margin    : 0,
                    zIndex    : 100000
                });
            }

            if(this.options.playButton){
                if(this.options.playOnStart){
                    this.slider.append('<div class="pause play"></div>');
                } else {
                    this.slider.append('<div class="pause"></div>');
                }
            }

            this.play();

        },

        play: function(){
            var that         = this,
                button       = this.slider.find('.pause'),
                timer        = this.slider.find('> .timer'),
                d            = this.options.delay;

            var func, replay;

            var next = function(){ that.forward(); };

            if(this.options.timer){
                func = play;
                if(this.options.playOnStart){play();}

            } else {
                func = next;
                if(this.options.playOnStart){replay = setInterval(next, d);}
            }


            button.on('click', function(){
                ($(this).hasClass('play')) ? pause() : resume();
            });

            function resume(){
                if(timer){
                    button.addClass('play');
                    func();
                } else {
                    replay = setInterval(next, d);
                }
            }

            function pause(){
                button.removeClass('play');

                if(timer){
                    timer.clearQueue().stop();
                } else {
                    clearInterval(replay);
                }
            }

            function reset(){
                timer.css({ left : '-100%' });
                that.forward();
                play();
            }

            function play(){
                timer.animate({ left : 0 }, d, reset);
            }

        }

    };




    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                    new Plugin( this, options ));
            }
        });
    }



})( jQuery, window, document, undefined );