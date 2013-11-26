backbone-layout
===============

This is what I generally use as an extension to Backbone's `View`.

By default, Backbone has no built in support for nested views. This can cause all sorts of headaches when you eventually need to have a view that contains other views. `BackboneLayout` attempts to help with these problems.

Usage
-----

`BackboneLayout` can be included as either an AMD module or it can be added via a `<script>` tag.

```javascript
BackboneLayout = require("backbone-layout");
Backbone.Layout = BackboneLayout;
```

```html
<script type="text/javascript" src="backbone-layout.js"></script>
<script type="text/javascript">
  Backbone.Layout = BackboneLayout;
</script>
```

Both `Backbone >= 1.1.0`  and `jQuery >= 1.7` are required for `BackboneLayout` so make sure to load those resources. If you `require` the module then `Backbone` will be automatically pulled back as well.

Zombies
-------

The biggest issue that I've encountered is that when a view is closed it can leave zombie binds behind. Backbone made this a little better with the introduction of the `View.listenTo` and `View.stopListening` methods and by calling `stopListening` when a view is removed via the `View.remove` method. However, it is still possible to leave binds around that execute once the view has been removed from the DOM.

`BackboneLayout` solves this by adding a `close` method to the view that ensures that the view is completely unbound once it is removed from the DOM.

Nested views
------------

This is a classic issue. Nested views are something that I almost **always** need in a Backbone project. Having a system that supports rendering nested views, bubbling up their events, and closing them appropriately is a necessity.

`BackboneLayout` adds support for nested views by introducing a `ViewManager` for each view. By registering a view with the BackboneLayout's `ViewManager` it is possible to specify the nested views as well as where they should be rendered.

The `ViewManager` also ensures that removal of the parent `BackboneLayout` will cascade and remove all the nested views first.

Infinite nested views
---------------------

Well, obviously you don't want to go truely infinite. But `BackboneLayout` allows you to specify a nested view that contains its own nested views (which, in turn, may contain their own nested views). All of it works seemlessly.

Other nice things
-----------------

There's more! Here are some other things that `BackboneLayout` provides:

* Adds support for a `defaults` attribute that functions similarly to `Backbone.Model.defaults`. The defaults will be applied directly to the options passed into the BackboneLayout's constructor.

        var MyBackboneLayout = BackboneLayout.extend({
          defaults: {
            foo: 'bar'
          }
        });

        var layout = new MyBackboneLayout();
        layout.options.foo;
        >> 'bar'

* Rendering is a snap! `BackboneLayout` assumes the most common rendering pattern `this.$el.html(this.template(this.model.toJSON()))` and applies it as long as a template is available.

        var MyBackboneLayout = BackboneLayout.extend({
          template: _.template("...")
        });

        var layout = new MyBackboneLayout();
        layout.render() // That's all you need to do!

* `BackboneLayout.serialize()` is available as the serialization method for templates. The returned results of `BackboneLayout.serialize` are what the template will get. Feel free to overload it to return custom data.

        BackboneLayout.extend({
          ...
          , serialize: function() {
            return {foo: this.bar};
          }
          ...
        })

* The serializer can be passed in as an attribute of the `options` object. This allows the BackboneLayout to gain some extra versatility without the need to extend BackboneLayout itself.

        var layout = new BackboneLayout({
          serialize: function() {
            return {foo: 'bar'};
          }
        });

* All events that are fired off by nested views will be bubbled up to the parent `BackboneLayout` view.

        var MyBackboneLayout = BackboneLayout.extend({
          initialize: function(options) {
            ...
            this.registerView(someView, {anchor: '.some-place'});
            this.listenTo(someView, "foo", function() { console.log('bar'); });
            ...
          }
        })
        var layout = new MyBackboneLayout();
        someView.trigger('foo');
        >> 'bar'

Examples
-------------

The above notes have some examples, but here are a few more.

### Basic layout usage

The most basic pattern is to just provide a template. The `BackboneLayout` base class knows what to do once it's provided the template and so rendering is very easy.

```javascript
var MyBackboneLayout = new BackboneLayout.extend({
  template: _.template("...")
});

var layout = new MyBackboneLayout();
layout.render();
```

### Nesting a view

Nesting views is accomplished by registering the child view. To register the view you need to specify an element in the `BackboneLayout` inside which the child view will be rendered.

```javascript
var MyBackboneLayout = new BackboneLayout.extend({
  template: _.template("<h1>This is the parent</h1>" +
                                  "<div class='child-view'></div>")
  , initialize: function(options) {
    BackboneLayout.prototype.initialize.call(this, options);
    this.registerView(childView, {anchor: '.child-view'});
  }
});
```

Rendering this view will cause the `childView` view to be rendered inside the `div.child-view` element.

### Replace the nested view's anchor

Sometimes you may want to replace the anchor with the new view rather than adding the new view to as the contents of the anchor. This is accomplished by passing `{replace: true}` as an option to `registerView`.

```javascript
this.registerView(someView, {anchor: '.child-view', replace: true});
```

**Be warned** if you replace the anchor either make sure that the child view's class is the same as the anchor's or the DOM may not match what your template assumes.

### A view without an anchor

There are times where a child view will be added dynamically without knowledge of the actual position inside its parent. An example would be a list of views where each child element is simply appended to the list.

Such a view can be registered as normal but without an anchor option. This means that the view won't be automatically rendered to the DOM but will still get the same management as any other nested view.

The only thing to keep in mind is that you will have to render the view yourself!

```javascript
this.registerView(someView);

// The view is now managed but will need to be manually rendered
```

Contributing
------------

To contribute, just fork the repo and submit pull requests. Please make sure to run the tests (see below) and use the same style as the rest of the codebase.

Getting started with a development environment is as simple as running `npm install` from the project directory.

Do not commit the contents of the `dist/` folder.

### Building and Testing

Everything can be run through `GruntJS`.

```bash
# Run jshint and minification
$ grunt

# Run tests
$ grunt test
```








