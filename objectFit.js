/**
 * Function.prototype.bind polyfill, compliments of Mozilla Developer Network
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 */

if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) {
		if (typeof this !== 'function') {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		var aArgs   = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP    = function() {},
			fBound  = function() {
				return fToBind.apply(this instanceof fNOP
						? this
						: oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

/**
 * ObjectFit class, used to replicate the behaviour of the CSS "background-size" property.
 * @type {{init: Function, setElements: Function, setEvents: Function, onResize: Function, getInfo: Function, setInfo: Function, backgroundCover: Function, backgroundContain: Function}}
 * @license

 The MIT License (MIT)

 Copyright (c) 2015 Caelan Stewart

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */

/**
 * Init function
 * @param {object} options - Custom options
 */
var ObjectFit = function(options) {
	"use strict";

	this.options = {
		selector: ".object-fit",
		forceFallbackMode: false,
		attachEvents: true,
        throttleEvents: true
	};

    for(var key in options) {
        if(options.hasOwnProperty(key)) {
            this.options[key] = options[key];
        }
    }

    if(this.validateOptions()) {
        if(typeof document.body.style.objectFit !== "string" || this.options.forceFallbackMode) {
            this.fallbackMode = true;
        }

        this.setElements();

        if(this.options.attachEvents !== false) {
            this.setEvents();
        }

        if(this.objects.length > 0) {
            this.onResize();
        }
    }
};

ObjectFit.prototype = {
    /**
     *
     * @param {object} userOptions - An object containing user-provided options
     * @returns {object|null} If the options passed were valid, a new object
     * containing this options and defaults is returned. Otherwise, null is returned.
     */
	validateOptions: function() {
        var error = false;

		if(typeof this.options.selector !== "string") {
            if("console" in window) {
                console.log("ObjectFit.prototype.useOptions - selector must be a string.");
            }

            error = true;
        }

        if(typeof this.options.forceFallbackMode !== "boolean") {
            if("console" in window) {
                console.log("ObjectFit.prototype.useOptions - forceFallbackMode must be either true of false.");
            }

            error = true;
        }

        if(typeof this.options.attachEvents !== "boolean") {
            if("console" in window) {
                console.log("ObjectFit.prototype.useOptions - attachEvents must be either true of false.");
            }

            error = true;
        }

        if(typeof this.options.throttleEvents !== "boolean") {
            if("console" in window) {
                console.log("ObjectFit.prototype.useOptions - throttleEvents must be either true of false.");
            }

            error = true;
        }

        return !error;
	},

	/**
	 * Gets the required information to make calculations to size the background
	 * @param node
	 * @returns object
	 */
	getInfo: function(node) {
		node.parentWidth    = node.node.parentNode.offsetWidth;
		node.parentHeight   = node.node.parentNode.offsetHeight;

		return node;
	},

	/**
	 * Sets new, calculated size information to "node"
	 * @param node object
	 * @param info object
	 */
	setInfo: function(info) {
		"use strict";

		var node = info.node;

		node.style.width    = info['new'].width + "px";
		node.style.height   = info['new'].height + "px";
		node.style.left     = info['new'].left + "px";
		node.style.top      = info['new'].top + "px";
	},

	/**
	 * Selects all elements with a selector matching "this.selector"
	 */
	setElements: function() {
		"use strict";

		var nodeList = document.querySelectorAll(this.options.selector),
            i;

		this.objects = [ ];

		/* we want to cache as much info as possible to speed up the script. */
		for(i = 0; i < nodeList.length; ++i) {
			var node = nodeList[i];

			var type = node.getAttribute('data-type'),
                className = ' ' + node.className + ' ';

			if("cover,fill,contain".indexOf(type) === -1) {
				type = "cover"; // default type
			}

			// check if we need to cache the values, if on modern browser, the
			// object-fit css property is used.
			if(this.fallbackMode === true || className.indexOf(' fallback-mode ') !== -1) {
				var newNode = {
					width:	parseInt(node.getAttribute('width'), 10),
					height: parseInt(node.getAttribute('height'), 10),
					node:	node,
					type:	type
				};

				if(isNaN(newNode.width) || isNaN(newNode.height)) {
					if(typeof console !== "undefined") console.log("ObjectFit.prototype.setElements: node is missing required attributes or attribute value is invalid ('width' or 'height')");
					continue;
				}

				this.objects.push(newNode);
			} else {
				node.style.objectFit = type;
				node.style.width = "100%";
				node.style.height = "100%";
			}
		}
	},

	/**
	 * Sets resize events
	 */
	setEvents: function() {
		"use strict";

        var throttle = null,
            self = this,
            resizeHandler;

        function onThrottleTimeout() {
            self.onResize();

            throttle = null;
        }

        function onResize() {
            if(throttle !== null) {
                return;
            }

            throttle = setTimeout(onThrottleTimeout, 100);
        };

        if(this.options.throttleEvents) {
            resizeHandler = onResize;
        } else {
            resizeHandler = this.onResize.bind(this);
        }

        if(window.addEventListener) {
            window.addEventListener('resize', onResize);
        } else {
            window.attachEvent('onresize', onResize);
        }
	},

	/**
	 * Sizes all of the elements in the NodeList "this.backgrounds"
	 */
	onResize: function() {
		"use strict";

		var i,
			objects = this.objects,
			objectsLength = objects.length;

		if(objectsLength !== 0) {
            for(i = 0; i < objectsLength; i++) {
                var node = objects[i];

                var info = this.getInfo(node);

                this.setInfo(info, this.types[info.type](info));
            }
        }
	},

	types: {
		/**
		 * Sizes "node" in a way that mimicks the CSS "background-size: cover;" property setting.
		 * @param node object This should be a HTML DOM Element Object
		 */
		cover: function(info) {
			var settings = { };

			if((info.parentWidth / info.width) * info.height < info.parentHeight) {
				settings.height = info.parentHeight;
				settings.width = Math.ceil((info.parentHeight / info.height) * info.width);
				settings.left = (info.parentWidth * 0.5) - (settings.width *  0.5);
				settings.top = 0;
			} else {
				settings.height = Math.ceil((info.parentWidth / info.width) * info.height);
				settings.width = info.parentWidth;
				settings.left = 0;
				settings.top = (info.parentHeight * 0.5) - (settings.height * 0.5);
			}

			info['new'] = settings;

			return info;
		},

		/**
		 * Sizes "node" in a way that mimicks the CSS "background-size: contain;" property setting.
		 * @param node object This should be a HTML DOM Element Object
		 */
		contain: function(info) {
			var settings = { };

			if((info.parentWidth / info.width) * info.height < info.parentHeight) {
				settings.height = Math.ceil((info.parentWidth / info.width) * info.height);
				settings.width = info.parentWidth;
				settings.left = 0;
				settings.top = (info.parentHeight * 0.5) - (settings.height * 0.5);
			} else {
				settings.height = info.parentHeight;
				settings.width = Math.ceil((info.parentHeight / info.height) * info.width);
				settings.left = (info.parentWidth * 0.5) - (settings.width * 0.5);
				settings.top = 0;
			}

			info['new'] = settings;

			return info;
		},

		fill: function(info) {
			var settings = { };

			settings.height = info.parentHeight;
			settings.width = info.parentWidth;
			settings.left = 0;
			settings.top = 0;

			info['new'] = settings;

			return info;
		}
	},

	helpers: {
		/*
		 * Courtesy of Lorenzo Polidori
		 * http://stackoverflow.com/a/12621264/2529423
		 */
		has3d: function() {
			if (!window.getComputedStyle) {
				return false;
			}

			var el = document.createElement('p'),
				has3d,
				transforms = {
					'webkitTransform':'-webkit-transform',
					'OTransform':'-o-transform',
					'msTransform':'-ms-transform',
					'MozTransform':'-moz-transform',
					'transform':'transform'
				};

			// Add it to the body to get the computed style.
			document.body.insertBefore(el, null);

			for (var t in transforms) {
				if (el.style[t] !== undefined) {
					el.style[t] = "translate3d(1px,1px,1px)";
					has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
				}
			}

			document.body.removeChild(el);

			return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
		}
	}
};
