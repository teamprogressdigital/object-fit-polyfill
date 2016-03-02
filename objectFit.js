/*

 object-fit-polyfill v1.1

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

	/* AVAILABLE OPTIONS */
	this.options = {
		selector: ".object-fit",
		forceFallbackMode: false,
		attachEvents: true,
		throttleEvents: true,
		throttleInterval: 100,
		autoAddParentClass: true,
		parentNodeClassName: 'object-fit-parent',
		fallbackClassName: 'object-fit-fallback'
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
				console.log("ObjectFit.prototype.validateOptions - selector must be a string (String).");
			}

			error = true;
		}

		if(typeof this.options.forceFallbackMode !== "boolean") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - forceFallbackMode must be either true of false (Boolean).");
			}

			error = true;
		}

		if(typeof this.options.attachEvents !== "boolean") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - attachEvents must be either true of false (Boolean).");
			}

			error = true;
		}

		if(typeof this.options.throttleEvents !== "boolean") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - throttleEvents must be either true of false (Boolean).");
			}

			error = true;
		}

		if(typeof this.options.throttleInterval !== "number") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - throttleInterval must be an integer (Number)");
			}
			
			error = true;
		}

		if(typeof this.options.autoAddParentClass !== "boolean") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - autoAddParentClass must be true of false (Boolean)");
			}
			
			error = true;
		}

		if(typeof this.options.parentNodeClassName !== "string") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - parentNodeClassName must be a valid class (String)");
			}
			
			error = true;
		}

		if(typeof this.options.fallbackClassName !== "string") {
			if("console" in window) {
				console.log("ObjectFit.prototype.validateOptions - fallbackClassName must be a valid class (String)");
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
			nodeListLen = nodeList.length,
			i;

		this.objects = [ ];

		/* we want to cache as much info as possible to speed up the script. */
		for(i = 0; i < nodeListLen; ++i) {
			var node = nodeList[i];

			var type = node.getAttribute('data-type'),
				className = ' ' + node.className + ' ';

			if("cover,fill,contain".indexOf(type) === -1) {
				type = "cover"; // default type
			}

			ObjectFit.addClass(node.parentNode, this.options.parentNodeClassName);

			// check if we need to cache the values, if on modern browser, the
			// object-fit css property is used.
			if(this.fallbackMode === true || ObjectFit.hasClass(node, this.options.fallbackClassName)) {
				var newNode = {
					width:	parseInt(node.getAttribute('width'), 10),
					height: parseInt(node.getAttribute('height'), 10),
					node:	node,
					type:	type
				};

				ObjectFit.addClass(node, this.options.fallbackClassName);

				if(isNaN(newNode.width) || isNaN(newNode.height)) {
					if(typeof console !== "undefined") {
						console.log("ObjectFit.prototype.setElements: node is missing required width/height attributes, or attribute value is invalid.");
					}

					continue;
				}

				node.style.objectFit = 'fill'; // set to default value

				this.objects.push(newNode);
			} else {
				node.style.objectFit = type;
				node.style.width = "100%";
				node.style.height = "100%";
				node.style.left = 0;
				node.style.top = 0;
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
			resizeHandler = onResize; // Throttled function
		} else {
			resizeHandler = function() {
				self.onResize();
			};
		}

		if(window.addEventListener) {
			window.addEventListener('resize', resizeHandler);
		} else {
			window.attachEvent('onresize', resizeHandler);
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

		for(i = 0; i < objectsLength; i++) {
			var node = objects[i];

			var info = this.getInfo(node);

			this.setInfo(info, this.types[info.type](info));
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
	}
};

ObjectFit.addClass = function(element, className) {
	'use strict';

	if(ObjectFit.hasClass(element, className)) {
		return;
	}

	element.className = element.className + ' ' + className;
};

ObjectFit.removeClass = function(element, className) {
	'use strict';

	element.className = (' ' + element.className + ' ').replace(' ' + className + ' ', ' ');
};

ObjectFit.hasClass = function(element, className) {
	'use strict';

	return (' ' + element.className + ' ').indexOf(' ' + className + ' ') !== -1;
};
