(function ($, window, document) {

    /**
     * Main slider function 
     * @team Baianat
     * @copyrights Baianat
     * @param {type} elem
     * @param {type} options
     * @returns {slider_L1.Turbo}
     */
    
    
   // @todo add center item + padding !


    var normalized = null;


    function log(v)
    {

        console.log(v);

    }

    function getTouchCoords(event)
    {

        var coords = {};

        if (event.touches != undefined)
        {
            coords.x = event.touches[0].pageX;
            coords.y = event.touches[0].pageY;
        }
        else
        {
            if (event.pageX !== undefined)
            {
                coords.x = event.pageX;
                coords.y = event.pageY;
            }
            else
            {
                coords.x = event.clientX;
                coords.y = event.clientY;
            }
        }

        return coords;

    }





    function Turbo(elem, options)
    {   
        /**
         * extending default options in case of missing options
         */



        /**
         *  element of the slider
         */
        this.element = elem;

        /**
         * width of the element
         */
        this.width = null;

        /**
         * The whole width of our mask wrapper
         */
        this.volume = null;


        /**
         * current slide item of the slider
         */
        this.current = null;

        /**
         * cache of the clonning items when loop option is enabled
         */
        this.clonesContainer = [];

        /**
         * the position of the slider mask in each slide
         */
        this.positionsContainer = [];

        /**
         * caching slider items in this array
         */
        this.itemsContainer = [];

        /**
         * slider mask main item of the process
         */
        this.maskWrapper = null;


        /**
         * slider speed in millseconds
         */
        this.speed = null;


        /**
         * Is the slide mode vertical or horizontal 
         */
        this.verticalSlide = false;

        /**
         * Current slide property
         */
        this.activeProp = "width";

        /**
         * Clonned items volume 
         */
        this.clonnedPropVolume = null;

        /**
         * Autoloop option 
         */
        this.autoPlayLoop = null;

        this.touch = {};

        /**
         * Is touch enabled !
         */
        this.isTouch = false;



        this.processes = {};



        this.Objs = [];


        this.resizeHandle = null;



        $.each(Turbo.Obj, $.proxy(function (c, worker) {
            this.Objs.push(
                    {
                        type: worker.type,
                        update: $.proxy(worker.update, this)
                    }
            );
        }, this));


        /**
         * start the main process
         */
        this.initiate(options);


        if (this.options.resize)
        {
            $(window).on('resize', $.proxy(function () {
                clearTimeout(this.resizeHandle);
                this.resizeHandle = setTimeout($.proxy(this.reset, this), this.options.resizeRefresh);
            }, this));
        }

    }


    Turbo.Obj = [
        {
            type: ['items', 'width', 'all'],
            update: function ()
            {
                this.element.find('.cloned').remove();
                this.clonesContainer = [];
                this.positionsContainer = [];
            }
        }
        ,
        {
            type: ['clones'],
            update: function ()
            {
                var $clonnedItem;

                var clonesLength = this.clonesContainer.length - Math.max(this.options.items * 2, 4);

                clonesLength = Math.abs(clonesLength / 2);

                var css = this.getItemCss();

                var clonnedProp = 0, item;

                for (var i = 0, n = clonesLength; i < n; i++) {

                    this.clonesContainer.push(this.clonesContainer.length / 2);

                    item = $(this.itemsContainer[this.clonesContainer[this.clonesContainer.length - 1]]);

                    $clonnedItem = item.clone();

                    this.maskWrapper.append($clonnedItem.css(css).addClass('cloned'));

                    clonnedProp += this.verticalSlide ? $clonnedItem.outerHeight(true) : $clonnedItem.outerWidth(true);

                    this.clonesContainer.push(this.itemsContainer.length - 1 - (this.clonesContainer.length - 1) / 2);

                    item = $(this.itemsContainer[this.clonesContainer[this.clonesContainer.length - 1]]);

                    $clonnedItem = item.clone();

                    this.maskWrapper.prepend($clonnedItem.css(css).addClass('cloned'));

                    clonnedProp += this.verticalSlide ? $clonnedItem.outerHeight(true) : $clonnedItem.outerWidth(true);
                }

                this.clonnedPropVolume = clonnedProp;
            }
        },
        {
            type: ['items', 'width'],
            update: function ()
            {
                var item, count, position = 0, prop, dir;

                dir = this.options.direction == "rtl" ? 1 : -1;

                if (this.options.direction == "rtl" && this.options.vertical)
                {
                    dir = -1;
                }

                prop = (this.verticalSlide ? this.getHeight() / this.options.items : (this.getWidth())) / this.options.items;

                for (item = 0, count = this.clonesContainer.length + this.itemsContainer.length; item < count; item++) {

                    if (this.verticalSlide)
                    {
                        position += ($(this.itemsContainer[this.relativePos(item)]).height() + this.options.margin) * dir;
                    }
                    else
                    {
                        position += this.options.fixWidth ? prop * dir : ($(this.itemsContainer[this.relativePos(item)]).width() + this.options.margin) * dir;
                    }

                    this.positionsContainer.push(position);
                }
            }
        }
        ,
        {
            type: ['items', 'width', 'height'],
            update: function ()
            {

                var maskCss = {};

                this.volume = this.getVolume(this.activeProp, 0, this.itemsContainer.length);

                maskCss[this.activeProp] = this.options.circular ? Math.abs(this.getPosition(this.positionsContainer.length)) : Math.abs(this.getPosition(this.positionsContainer.length));

                maskCss["overflow"] = "hidden";

                this.maskWrapper.css(maskCss);
            }
        }
        ,
        {
            type: ['items', 'width', 'position'],
            update: function ()
            {
                var targetPos = this.getPosition(this.normalizePos(this.current)) || 0;
                this.animate(targetPos);
            }
        },
        {
            type: ['items', 'width', 'position'],
            update: function ()
            {

                var dir = (this.options.direction == "rtl") ? 1 : -1;

                var current, prev, limit;

                var activeList = [];

                var currentStart = this.getPosition(this.current);

                var currentEnd = currentStart + this.getWidth('inner') * dir;

                for (var c = 0, limit = this.positionsContainer.length; c < limit; c++)
                {
                    var current = Math.abs(this.positionsContainer[c]) * dir;
                    var prev = this.positionsContainer[c - 1] || 0;

                    if (this.compare(prev, currentStart, '<=') && this.compare(prev, currentEnd, '>')
                            ||
                            this.compare(current, currentStart, '<') && this.compare(current, currentEnd, '>'))
                    {
                        activeList.push(c);
                    }
                }

                this.maskWrapper.children('.' + this.options.activeClass).removeClass(this.options.activeClass);

                var activeElems = '(' + activeList.join('), :eq(') + ')';

                this.maskWrapper.children(':eq' + activeElems).addClass(this.options.activeClass);

                if (!this.options.fixHeight)
                {
                    var h = this.maskWrapper.children('.' + this.options.activeClass).height();
                    this.maskWrapper.css('height', h + 'px');
                }

            }
        }
    ];



    Turbo.prototype.getViewPort = function ()
    {
        var w;
        w = $(window).width();
        return w;
    }



    /**
     * Main method of our turbo object 
     * it updates the whole components for our slider
     * @returns {undefined}
     */

    Turbo.prototype.update = function ()
    {
        var c = 0;
        var t = this.Objs.length;
        var type = $.proxy(function (i) {
            return this[i]
        }, this.processes);

        while (c < t)
        {
            if (this.processes.updateAll || $.grep(this.Objs[c].type, type).length)
            {
                this.Objs[c].update();
            }
            c++;
        }

        this.processes = {};

    }

    Turbo.prototype.queueProcess = function (process)
    {
        this.processes[process] = true;
    }

    /**
     * start the main process of the slider 
     * @returns {undefined}
     */
    Turbo.prototype.initiate = function (options)
    {
        var items;


        this.options = $.extend({}, Turbo.defaultOptions, options);


        this.mainOptions = this.options;


        this.resize = this.options.resize;

        var vp = this.getViewPort();

        var matched_vp = 0;

        if (this.resize)
        {
            $.each(this.resize, function (num)
            {
                if (num <= vp && num > -1)
                {
                    matched_vp = num;
                }
            });

            this.options = matched_vp ? $.extend({}, this.options, this.resize[matched_vp]) : this.options;

        }

        this.options.init();

        /**
         * add a class to the main element of the slider
         */
        this.element.addClass(this.options.elemClass);

        /**
         * Append mask 
         */
        this.maskWrapper = $('<div class="TurboMask ' + this.options.maskClass + '"></div>');


        this.sliderWrapper = $('<div class="TurboWrapper"></div>');


        new Turbo.videos(this);


        /**
         * Set default element css attributes
         */
        this.element.css({
            'overflow': 'hidden',
            'visibility': 'hidden',
            'position': this.element.css('position') == "static" ? "relative" : this.element.css('position'),
            'direction': this.options.direction == 'rtl' ? 'rtl' : 'ltr'
        });

        items = this.element.children();

        //Move items to the mask
        this.maskWrapper.append(items);
        //append the mask to the main element
        this.element.append(this.maskWrapper);

        this.element.after(this.sliderWrapper);

        this.sliderWrapper.append(this.element);

        //store slider items
        this.storeItems(items);
        //caching the element width
        this.width = this.element.width();

        this.height = this.element.height();

        this.cacheFirst();

        this.mode();

        this.currentSlide(this.options.startSlide);

        this.activeProp = this.verticalSlide ? "height" : "width";

        if (this.options.circular)
        {
            this.queueProcess("clones");
        }

        this.options.startSlide = $.isNumeric(this.options.startSlide) ? this.options.startSlide : 0;

        this.setItemsCss();

        this.element.css("visibility", "visible");

        this.attach();

        if (this.options.autoPlay)
        {
            this.autoPlay();
        }


        if (this.options.wheel)
        {
            this.element.on('mousewheel DOMMouseScroll MozMousePixelScroll', $.proxy(this.mouseWheel, this));
        }

        if (this.options.prevTrigger && $(this.options.prevTrigger).length)
        {
            $(this.options.prevTrigger).on('click', $.proxy(this.prev, this));
        }

        if (this.options.nextTrigger && $(this.options.nextTrigger).length)
        {
            $(this.options.nextTrigger).on('click', $.proxy(this.next, this));
        }

        this.queueProcess("items");

        this.update();

        this.resetSlide(this.maskWrapper.children().index(this.firstSlide));

        this.navigation();

    }


    Turbo.prototype.reset = function ()
    {

        this.sliderWrapper.before(this.element);

        this.sliderWrapper.remove();

        this.element.append(this.element.find('.TurboMask').children());

        this.element.find('.TurboMask').remove();

        this.element.find('.cloned').remove();

        this.initiate(this.mainOptions);


    }



    Turbo.prototype.unbind = function ()
    {

        if (this.options.wheel)
        {
            this.element.off('DOMMouseScroll', $.proxy(this.mouseWheel, this));
        }

        if (this.options.prevTrigger && $(this.options.prevTrigger).length)
        {
            $(this.options.prevTrigger).off('click', $.proxy(this.prev, this));
        }

        if (this.options.nextTrigger && $(this.options.nextTrigger).length)
        {
            $(this.options.nextTrigger).off('click', $.proxy(this.next, this));
        }



    }


    Turbo.prototype.eventTarget = function (e)
    {
        var type = e.type;
        switch (type)
        {
            case 'mousedown':
            case 'touchstart':
                this.dragStart(e);
                break;
            case 'mousemove':
            case 'touchmove':
                this.dragMove(e);
                break;
            case 'mouseup':
            case 'touchend':
                this.dragEnd(e);
                break;
        }

    }



    Turbo.prototype.attach = function ()
    {

        this.maskWrapper.on('transitionend', $.proxy(this.transitionEnd, this));

        if (this.options.drag)
        {
            //dragStart
            this.maskWrapper.on(Turbo.events.drag.start, $.proxy(this.eventTarget, this));
            this.maskWrapper.on('dragstart', function () {
                return false
            });
        }
    }

    /**
     * set or get the current slide position
     * @param {type} position
     * @returns {unresolved}
     */
    Turbo.prototype.currentSlide = function (position)
    {

        if (typeof position == "undefined")
            return this.current;

        var $current, $min, $max;

        $current = this.current;

        $min = this.getMin();

        $max = this.getMax();

        position = this.normalizePos(position);
        
        $.proxy(this.options.before, this)();

        if (!this.options.circular)
        {
            if (position > $max)
            {
                if ($current > $max)
                {
                    position = $min;
                }
                else
                {
                    position = $max;
                }
            }
            else
            {
                if (position < $min)
                {
                    position = $max;
                }
            }
        }


        this.current = position;

        this.trigger('changed_position', {
            'value':
                    {
                        'position': this.current,
                        'previous': $current
                    }
        });

    }


    Turbo.prototype.trigger = function (evnt, data)
    {

        var evnt_prefix = 'Turbo-evnt-';

        data["time"] = new Date();

        data["type"] = evnt_prefix + evnt;

        return this.element.trigger(evnt_prefix + evnt, data);

    }

    Turbo.prototype.cacheFirst = function ()
    {
        this.firstSlide = this.itemsContainer[this.relativePos(this.current)];
    }


    Turbo.prototype.slideTo = function (type)
    {
        var pos = this.relativePos(this.current);

        type ? pos += this.options.slideCount : pos -= this.options.slideCount;

        return pos;
    }


    Turbo.prototype.next = function ()
    {
        this.slide(this.slideTo(true), this.options.slideSpeed);
    }



    Turbo.prototype.prev = function ()
    {
        this.slide(this.slideTo(false), this.options.slideSpeed);
    }


    Turbo.prototype.destroy = function ()
    {

        this.sliderWrapper.before(this.element);

        this.sliderWrapper.remove();
        
        this.element.append(this.maskWrapper.children());
        
        this.maskWrapper.remove();

        this.element.removeData('Turbo');

        this.element.find('.cloned').remove();
        
        this.element.find('div').removeClass('active');
        
        this.element.css({
            marginTop : '',
            display   : '',
            overflow  : '',
            visibility: '',
            position: '',
            direction: ''
        });
        
        this.element.removeClass('active');
        

    }


    Turbo.prototype.autoPlay = function ()
    {
        var $target = this.next;


        if (!this.vertical && this.options.direction == "rtl")
        {
            $target = this.next;
        }

        if (!this.vertical && this.options.direction == "ltr")
        {
            $target = this.next;
        }


        window.clearInterval(this.autoPlayLoop);

        this.autoPlayLoop = window.setInterval($.proxy($target, this), this.options.timeout);

        if (this.options.pauseOnHover)
        {
            this.element.hover($.proxy(this.stop, this), $.proxy(this.autoPlay, this));
        }


    }

    Turbo.prototype.stop = function ()
    {
        window.clearInterval(this.autoPlayLoop);
        window.clearTimeout(this.anim);
    }

    Turbo.prototype.pause = function ()
    {
        window.clearInterval(this.autoPlayLoop);
    }

    Turbo.prototype.transitionEnd = function ()
    {
        if (this.options.autoPlay)
        {
            this.autoPlay();
        }
    }


    Turbo.prototype.getVolume = function (type, start, end)
    {
        var sum = 0;
        var i = start;
        var elem;
        for (; i < end; i++)
        {
            elem = $(this.itemsContainer[i]);

            if (type == "width")
            {
                sum += elem.outerWidth(true);

            }
            else
            {
                sum += elem.outerHeight(true);
            }
        }

        return sum;

    }



    Turbo.prototype.getItemCss = function ()
    {

        var itemCss, width, height;

        if (this.verticalSlide)
        {
            itemCss = {display: 'block', float: 'none', 'width': '100%'};
            height = (this.getHeight() / this.options.items).toFixed(3);
            itemCss['margin-bottom'] = this.options.margin + 'px';
            itemCss['height'] = height - this.options.margin + 'px';
        }
        else
        {

            itemCss = {display: 'block', float: this.options.direction == "ltr" ? "left" : "right"};

            var d = this.options.direction == "rtl" ? "left" : "right";

            itemCss['margin-' + d] = this.options.margin + 'px';

            width = ((this.getWidth()) / this.options.items).toFixed(3);

            if (this.options.fixWidth)
            {
                itemCss['width'] = Math.abs(width) - this.options.margin + 'px';
            }

        }

        return itemCss;

    }

    Turbo.prototype.setItemsCss = function ()
    {

        var i, n, itemCss, width;

        itemCss = this.getItemCss();

        for (i = 0; n = this.itemsContainer.length, i < n; i++)
        {
            $(this.itemsContainer[i]).css(itemCss);
        }

    }


    Turbo.prototype.mode = function ()
    {

        var mode = Turbo.modes;

        if (this.options.vertical)
        {
            this.verticalSlide = true;
        }

    }


    Turbo.prototype.slide = function (position, speed)
    {

        var next_elem, prev_elem, distance, items;

        normalized = this.current;

        items = this.itemsContainer.length + this.clonesContainer.length;

        distance = position - this.relativePos(this.current);

        this.stop();

        if (this.options.circular)
        {
            next_elem = distance + this.current;

            prev_elem = this.current;

            if (next_elem < this.options.items)
            {
                normalized = prev_elem + this.itemsContainer.length;

                this.resetSlide(normalized);

            }
            else if (next_elem >= items - this.options.items)
            {
                normalized = prev_elem - this.itemsContainer.length;

                this.resetSlide(normalized);

            }

            this.anim = setTimeout($.proxy(function ()
            {
                this.speed = this.normalizeSpeed(this.current, normalized + distance, speed) || 0;

                this.currentSlide(normalized + distance);

                this.queueProcess("position");

                this.update();

            }, this), 30);
        }
        else
        {
            this.speed = this.options.slideSpeed || 0;

            this.currentSlide(position);

            this.queueProcess("position");

            this.update();
        }

    }


    Turbo.prototype.animate = function (position)
    {
        var css = {}, speed;

        if (this.verticalSlide)
        {
            css["transform"] = "translate3d(0px," + position + "px,0px)";
        }
        else
        {
            css["transform"] = "translate3d(" + position + "px,0px,0px)";
        }

        speed = this.speed / 1000;

        css["transition"] = speed + "s";

        this.maskWrapper.css(css);

        this.trigger('slideEnd', {
            index: this.current
        });
        
       $.proxy(this.options.after, this)();

    }




    /**
     * it defaults the slide to any position given in the argument
     * @param {type} position
     * @returns {undefined}
     */
    Turbo.prototype.resetSlide = function (position)
    {
        position = this.normalizePos(position);
        this.speed = 0;
        this.current = position;
        this.queueProcess("position");
        this.update();
    }


    /**
     * Get slide based on index by a position argument
     * @param {type} position
     * @returns {Array}
     */
    Turbo.prototype.getPosition = function (position)
    {

        if (typeof position == "undefined")
        {
            var $positions = $.map(this.positionsContainer, $.proxy(function (val, i) {
                return this.getPosition(i);
            }, this));

            return $positions;
        }

        return this.positionsContainer[position - 1] || 0;
    }

    /**
     * Getter for slider element width
     * @returns {slider_L1.Turbo.prototype@pro;element@call;width}
     */
    Turbo.prototype.getWidth = function (t)
    {
        if (t == "inner")
        {
            return this.width;
        }
        else if (t == "outer")
        {
            return this.width;
        }

        return this.width + this.options.margin;
    }


    Turbo.prototype.getHeight = function ()
    {
        return this.height;
    }


    Turbo.prototype.getMin = function (relative)
    {
        return relative ? 0 : this.clonesContainer.length / 2;
    }

    Turbo.prototype.getMax = function (relative)
    {
        var $max;

        if (relative)
        {
            return this.itemsContainer.length - 1;
        }

        if (!this.options.circular)
        {
            $max = this.itemsContainer.length - this.options.items;
        }
        else if (this.options.circular)
        {
            $max = this.itemsContainer.length + this.options.items;
        }

        return $max;

    }


    Turbo.prototype.normalizePos = function (position, relative)
    {
        if (this.options.circular)
        {
            var n = relative ? this.itemsContainer.length : this.itemsContainer.length + this.clonesContainer.length;
            position = ((position % n) + n) % n;
        }
        else
        {
            position = Math.max(this.getMin(relative), Math.min(this.getMax(relative), position));
        }

        return position;

    }


    Turbo.prototype.relativePos = function (pos)
    {
        pos = this.normalizePos(pos);
        pos = pos - this.clonesContainer.length / 2;
        return this.normalizePos(pos, true);
    }


    Turbo.prototype.storeItems = function (items)
    {

        this.itemsContainer = [];

        items.each($.proxy(function (index, item) {

            this.itemsContainer.push(item);
            this.trigger('item-ready', {
                'value':
                        {
                            'item': item,
                            'index': index
                        }
            });

        }, this));

    }


    Turbo.prototype.normalizeSpeed = function (current, target, factor)
    {
        return Math.min(Math.max(Math.abs(current - target), 1), 6) * Math.abs((factor));
    }




    Turbo.prototype.navigation = function ()
    {

        var $isUsingNavi = false;

        var navigation = $('<div class="slider-navigation"><div class="dotsClass ' + this.options.dotsClass + '" style="list-style:none;direction: ' + this.options.direction + '"></div></div>');


        if (this.options.hasDots)
        {

            this.list = [];

            this.createList();

            var index = this.current;

            for (var i = 0; i < this.list.length; i++)
            {
                navigation.find('.dotsClass').append('<span class="dotClass ' + this.options.dotClass + '"></span>');
            }

            this.navgationContainer = navigation;

            this.navgationDots = navigation.find('.dotsClass');

            this.navgationDots.children().eq($.inArray(this.getDotNavigationPos(), this.list)).addClass('active');

            this.sliderWrapper.on('Turbo-evnt-changed_position', $.proxy(function (e, data) {

                this.navgationDots.find('.active').removeClass('active');

                this.navgationDots.children().eq($.inArray(this.getDotNavigationPos(), this.list)).addClass('active');

            }, this));

            navigation.on('click', '.dotsClass span', $.proxy(function (e) {
                var $obj = $(this);
                var index = $(e.target).index();
                this.slideToDotPage(index);
            }, this));

            $isUsingNavi = true;

        }

        if (this.options.hasNav)
        {

            navigation.append('<div class="turbo-nav"><div class="turbo-prev">' + this.options.navPrevLabel + '</div><div class="turbo-next">' + this.options.navNextLabel + '</div></div>');

            navigation.on('click', '.turbo-nav .turbo-prev', $.proxy(function (e) {
                this.prev();
            }, this));

            navigation.on('click', '.turbo-nav .turbo-next', $.proxy(function (e) {
                this.next();
            }, this));

            $isUsingNavi = true;

        }

        if ($isUsingNavi)
        {
            this.sliderWrapper.append(navigation);
        }

    };



    Turbo.prototype.dragStart = function (e)
    {

        var pageX, pageY, event, coords, offset = {};

        event = e.originalEvent || window.event || e;

        this.isTouch = true;

        if (this.isTouch)
        {
            this.stop();
        }

        this.speed = 0;

        coords = getTouchCoords(event);

        pageX = coords.x;

        pageY = coords.y;

        offset.x = this.maskWrapper.position().left;

        offset.y = this.maskWrapper.position().top;

        this.touch.target = event.target || event.srcElement;

        if (this.options.direction == "rtl")
        {
            offset.x = offset.x + this.maskWrapper.width() - this.getWidth() + this.options.margin;
        }

        this.touch.start = {
            x: pageX - offset.x,
            y: pageY - offset.y
        };

        this.touch.offsetX = offset.x;

        this.touch.offsetY = offset.y;

        this.touch.start.start = this.verticalSlide ? pageY - this.touch.start.y : pageX - this.touch.start.x;

        var $forbiddenItems = ['img', 'a'];

        if ($.inArray(this.touch.target.tagName.toLowerCase(), $forbiddenItems) !== -1)
        {
            this.touch.target.draggable = false;
        }

        this.maskWrapper.addClass('turbo-drag');

        $(document).on(Turbo.events.drag.move + ' ' + Turbo.events.drag.end, $.proxy(this.eventTarget, this));

    };

    Turbo.prototype.dragMove = function (e)
    {

        var pageX, pageY, event, coords, offset = {}, distance, type, direction, destProperty;

        event = e.originalEvent || window.event || e;

        coords = getTouchCoords(event);

        pageX = coords.x;

        pageY = coords.y;

        this.touch.destX = pageX - this.touch.start.x;

        this.touch.destY = pageY - this.touch.start.y;

        destProperty = this.verticalSlide ? this.touch.destY : this.touch.destX;

        distance = this.verticalSlide ? this.touch.destY - this.touch.offsetY : this.touch.destX - this.touch.offsetX;

        direction = this.options.direction;

        if (distance > 0)
        {

            if (direction == "rtl")
            {
                type = "left";
            }
            else
            {
                type = "right";
            }


        }
        else
        {

            if (direction == "rtl")
            {
                type = "right";
            }
            else
            {
                type = "left";
            }

        }

        this.touch.directionType = type;

        if (this.options.circular)
        {

            if (this.compare(destProperty, this.getPosition(this.getMin()), '>') && type == "right")
            {
                destProperty -= this.getPosition(0) - this.getPosition(this.itemsContainer.length);
            }

            else if (this.compare(destProperty, this.getPosition(this.getMax()), '<') && type == "left")
            {
                destProperty += this.getPosition(0) - this.getPosition(this.itemsContainer.length);
            }


        }
        else
        {

        }

        this.animate(destProperty);

        this.verticalSlide ? this.touch.destY = destProperty : this.touch.destX = destProperty;

    };


    Turbo.prototype.dragEnd = function ()
    {

        var dest, coords, pos;

        this.maskWrapper.removeClass('turbo-drag');

        dest = this.verticalSlide ? this.touch.destY : this.touch.destX;

        coords = this.getPosition();

        this.touch.target.removeAttribute('draggable');

        $.each(coords, $.proxy(function (i, val) {

            if (dest > val - 30 && dest < val + 30)
            {
                pos = i;
            }
            else if (this.compare(dest, val, '<') && this.compare(dest, coords[i + 1], '>'))
            {
                pos = this.touch.directionType == "left" ? i + 1 : i;
            }

        }, this));

        this.speed = this.options.dragSpeed;

        this.currentSlide(pos);

        this.queueProcess("position");

        this.update();

        $(document).off(Turbo.events.drag.move);

        $(document).off(Turbo.events.drag.end);

    };


    Turbo.prototype.mouseWheel = function (e)
    {
        var destX, destY = 0, destItem;

        var evt, origEvt;

        e.preventDefault();

        evt = e || window.event;

        origEvt = e.originalEvent;

        if ('wheelDeltaX' in origEvt) {
            destX = origEvt.wheelDeltaX;
            destY = origEvt.wheelDeltaY;
        } else if ('wheelDelta' in origEvt) {
            destY = origEvt.wheelDelta;
        } else if ('detail' in origEvt) {
            destY = -origEvt.detail;
        } else {
            return;
        }




        if (this.verticalSlide)
        {
            destItem = (destY);
            destItem > 0 ? this.next() : this.prev();
        }
        else
        {
            destItem = (destY);
            destItem > 0 ? this.prev() : this.next();
        }


    }


    Turbo.prototype.compare = function (a, b, operator)
    {
        var t = this.options.direction == "rtl" ? true : false;
        var res;

        switch (operator)
        {
            case '<':
                res = t ? a > b : a < b;
                break;
            case '>':
                res = t ? a < b : a > b;
                break;
            case '>=':
                res = t ? a <= b : a >= b;
                break;
            case '<=':
                res = t ? a >= b : a <= b;
                break;
        }

        return res;
    }

    Turbo.prototype.getDotNavigationPos = function ()
    {
        var current = this.relativePos(this.current);

        var filterList = $.grep(this.list, function (page)
        {
            return (page.first <= current && page.last >= current);
        }).pop();

        return filterList;

    }


    Turbo.prototype.slideToDotPage = function (position)
    {
        var page_count, current_page;
        page_count = this.list.length;
        current_page = this.list[((position % page_count) + page_count) % page_count];
        $.proxy(this.slide, this)(current_page.first, this.options.dotSpeed);
    }




    Turbo.prototype.createList = function ()
    {
        var options = this.options;
        var items = this.options.circular ? options.items : 1;
        var clones = this.clonesContainer.length / 2 || 0;
        var all = clones + this.itemsContainer.length;
        var num, counter;

        for (num = clones, counter = 0; num < all; num++)
        {
            if (counter >= items || counter == 0)
            {
                this.list.push({
                    first: num - clones,
                    last: num - clones + items - 1
                });
                counter = 0;
            }
            counter += 1;
        }

    }



    Turbo.videos = function (turbo)
    {
        this.turbo = turbo;
        this.videos = {};
        this.register();
    };






    Turbo.videos.prototype.register = function ()
    {

        this.turbo.sliderWrapper.on('Turbo-evnt-item-ready', $.proxy(function (e, c) {

            var c = c.value;

            var item = c.item;

            if ($(item).hasClass('_video'))
            {
                this.parse($(item), $(item).find('.item_video').attr('href'));
            }

        }, this));


        this.turbo.sliderWrapper.on('click', '.turbo-video-play', $.proxy(function (e)
        {
            var p = $(e.target).parent('.turbo-video-wrapper');
            if (this.videos[p.attr('data-video')])
            {
                this.stop();
                this.play(p.parent(), this.videos[p.attr('data-video')]);
            }
            return false;

        }, this));


        this.turbo.sliderWrapper.on('Turbo-evnt-changed_position', $.proxy(function (e, c) {
            var c  = c.value ;
         //   console.log(c) ;
 
            if(c.previous != c.position)
            {
               this.stop();
            }


        }, this));


    }
    
    
    Turbo.videos.prototype.stop = function()
    {
         var $videos = this;
         var p = this.turbo.element.find('.item.playing');
         var url;
            p.each(function () {
            url = $(this).find('.turbo-video-wrapper').attr('data-video');
            console.log(url);
            $(this).find('iframe').remove();
            $videos.getThumb($(this), $videos.videos[url]);
        });
    }


    Turbo.videos.prototype.parse = function (item, url)
    {

        var patternList = /(http:|https:)\/\/(www.)?(youtube\.com|vimeo\.com)\/(watch\?v=|embed)?([A-Za-z0-9._%-]*)(\&\S+)?/;

        var id, type;

        id = url.match(patternList);

        if (id)
        {

            if (id[3].indexOf('youtube') > -1)
            {
                type = 'youtube';
            }
            else if (id[3].indexOf('vimeo') > -1)
            {
                type = 'vimeo';
            }

            this.videos[url] =
                    {
                        type: type,
                        id: id[5],
                        width: item.attr('data-width') || this.turbo.videoWidth,
                        height: item.attr('data-height') || this.turbo.videoHeight,
                        url: url
                    };

            this.getThumb(item, this.videos[url]);

        }

    }



    Turbo.videos.prototype.createThumb = function (elem, url, video)
    {

        var th;

        var wrapper = $('<div class="turbo-video-wrapper"></div>');

        wrapper.append('<div class="turbo-video-play"></div>');

        th = '<div class="turbo-video-thumb" style="background-image:url(' + url + ')"></div>';

        wrapper.append(th);

        wrapper.attr('data-video', video.url);

        elem.append(wrapper);

    }

    Turbo.videos.prototype.getThumb = function (elem, video)
    {

        var type = video.type;

        var url;

        switch (type)
        {

            case 'youtube':
                url = "http://img.youtube.com/vi/" + video.id + "/hqdefault.jpg";
                this.createThumb(elem, url, video);
                break;
            case 'vimeo':
                $.ajax({
                    type: 'GET',
                    url: 'http://vimeo.com/api/v2/video/' + video.id + '.json',
                    jsonp: 'callback',
                    dataType: 'jsonp',
                    success: $.proxy(function (data) {
                        url = data[0].thumbnail_large;
                        this.createThumb(elem, url, video);
                    }, this)
                });

        }

    }


    Turbo.videos.prototype.play = function (item, video)
    {

        if (!video.width)
        {
            video.width = '100%';
        }

        if (!video.height)
        {
            video.height = '100%';
        }

        item.find('.turbo-video-wrapper').hide();

        if (video.type == 'youtube')
        {
            item.append('<iframe width="' + video.width + '" height="' + video.height + '" src="http://www.youtube.com/embed/' + video.id + '?autoplay=1" frameborder="0" allowfullscreen></iframe>');
        }
        else if (video.type == 'vimeo')
        {
            item.append('<iframe src="http://player.vimeo.com/video/' + video.id + '?autoplay=1" width="' + video.width
                    + '" height="' + video.height
                    + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
        }

        item.addClass('playing');

    }


    Turbo.videos.prototype.output = function ()
    {


    }

    Turbo.modes =
            {
                vertical: 'vertical',
                horizontal: 'horizontal'
            };


    Turbo.events =
            {
                drag:
                        {
                            start: 'mousedown touchstart',
                            move: 'mousemove touchmove',
                            end: 'mouseup touchend'
                        }
            };


    Turbo.defaultOptions =
            {
                items: 4,
                autoPlay: false,
                pauseOnHover: false,
                startSlide: 0,
                circular: true,
                direction: 'ltr',
                vertical: false,
                elemClass: 'sliderClass',
                maskClass: 'maskClass',
                activeClass: 'active',
                hasDots: true,
                hasNav: false,
                dotsClass: '',
                dotClass: '',
                navNextLabel: 'Next',
                navPrevLabel: 'Prev',
                nextTrigger: false,
                prevTrigger: false,
                dotSpeed: 250,
                slideSpeed: 500,
                dragSpeed: 250,
                slideCount: 1,
                timeout: 500,
                margin: 0,
                fixWidth: true,
                fixHeight: true,
                drag: true,
                wheel: false,
                resize: false,
                resizeRefresh: 200,
                hasVideo: false,
                videoWidth: false,
                videoHeight: false,
                before: function () {
                },
                after: function () {
                },
                init: function () {
                }
            };


    $.fn.Turbo = function (options) {
        return this.each(function () {
            if (!$(this).data('Turbo')) {
                $(this).data('Turbo', new Turbo($(this), options));
            }
        });
    };


}(jQuery, window, document));


//Relative is first real item !
//Abs is first clone item