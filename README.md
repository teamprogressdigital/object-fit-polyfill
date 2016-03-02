# object-fit-polyfill
A flexible object-fit polyfill intended for rich internet applications

Here at PROGRESS, we build websites that are unique, and look good cross browser. And we always integrate our websites into a CMS, so the website must deal with imagery uploaded by clients and still look as good as it can. One way of doing that, is to use background images and set `background-size: cover;` on it. But that is not supported by all browsers, and it is not a physical <img> tag and was never meant to replace it. That's were the `object-fit` property comes into play. It's an incredibly handy property, but browser support is not optimal. We wanted a flexible, configurable polyfill that follows a minimal interference policy. Meaning it doesn't add/remove elements from the DOM, it expects them to be there already. This helps to avoid unexpected errors and improve compatibility with other code. The script does add/remove some classes by default, those are configurable.

## Usage

This guide is not fully formed, refer to demo.html for more details about usage. There are comments, too.

### HTML
```
<div>
    <img class="object-fit" src="/path/to/img.jpg" width="1024" height="768" alt="" title="Object-Fit" />
</div>
```

### JS
It is recommended that the ObjectFit instance is stored somewhere where it can be accessed later on.
```
(function() {
    window.objectFit = new ObjectFit();
})();
```

### HTML Attributes
Below, are all of the attributes `object-fit-polyfill` supports.
* #### width
    An integer referring to the image's width. This is used in tandom with the `height` attribute to determine the aspect ratio of the image.
* #### height
    An integer reffering to the image's height. This is used in tandom with the `width` attribute to determine the aspect ratio of the image.
* #### data-type
    * `contain` - will emulate the behaviour of `object-fit: contain;`
    * `cover` - will emulate the behaviour of `object-fit: cover;`
    * `fill` - will emulate the behaviour of `object-fit: fill;`

### Gotchas
A handy tip is to imagine that there is no `<img>` tag, and to treat the containing `<div>` AS the `<img>` tag.

Remember, if you change the size of the containing `<div>` without triggering a resize event, object-fit will not function correctly in fallback mode. You must call the `.onResize()` method after any change to the proportions of containing element that isn't caused by a resize event.
If there are two scripts working on the same elements, for example a carousel plugin and object-fit-polyfill for the background images, there may be issues in terms of resizing, since the carousel may adjust the size of it's slides after object-fit-polyfill's onResize event has been called. In fallback-mode, this may cause issues. Make sure that the onResize method is called AFTER the size of any containing elements has been determined, unless you have good reason not to.
