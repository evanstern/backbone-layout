//     Layout
//

(function(Backbone, _) {

    // ManagedView
    // -----------
    //
    // A managed view is simply a wrapper around a `Backbone.View`. It stores
    // meta information about the view so that it can be appropriately managed
    // by the `ViewManager`.
    //
    var ManagedView = function ManagedView(view, options) {
        options || (options = {});
        this.id = _.uniqueId("managed_");
        this.view = view;
        this.anchor = options.anchor;
    };

    // ViewManager
    // -----------
    var ViewManager = Backbone.ViewManager = function() {

        var managedViews = [];

        // # register
        //
        // Register a view with the view manager. This begins management of
        // the view. The view manager will handle bubbling events from the
        // view upward to the parent view.
        //
        // Available options are:
        //
        // * anchor
        //
        //     A jQuery selector specifying the anchor element
        //     for the view (i.e.  where this view will be
        //     rendered)
        //
        // * replace
        //
        //     A boolean value specifying whether or not to
        //     replace the anchor with the view. The default
        //     operation would append the view as a child element
        //     of the anchor
        //
        // If no anchor is given then the view will not be applied to the DOM.
        // The view will still be managed (events will bubble, clean rendering
        // and closing of child views will function normally) but since there
        // is no way to determine the actual location of this view in the DOM
        // it won't be applied. Instead, the view will have to be added to the
        // DOM manually; generally this would be done inside the parent view's
        // `afterRender` method.
        //
        this.register = function(view, options) {
            options || (options = {});

            // Bubble up all events from the view
            this.listenTo(view, "all", function() {
                this.trigger.apply(this, arguments);
            }, this);

            // Store this view
            var mView = new ManagedView(view, options);
            managedViews.push(mView);
        };

        // # each
        //
        // Just regular old underscore's `each` method applied to the managed
        // views list.
        this.each = function(iterator, context) {
            _.each(managedViews, iterator, context);
        };

        _.bindAll(this, "register", "each");
    };

    // Extend `ViewManager` with Backbone events.
    _.extend(ViewManager.prototype, Backbone.Events);

    // Layout
    // ------
    //
    // Extends `Backbone.View`
    //
    // When creating a sub class there are a few interface methods that can
    // optionally be defined.
    //
    // * `beforeRender`
    //    > This is the first function that is run during the
    //    > `render()` call.
    // * `afterRender`
    //    > This is the last function that is run during the
    //    `render()` call.
    //
    // For example:
    //
    //     var MyView = Layout.extend({
    //       beforeRender: function() {
    //         // executed before rendering of all views
    //       },
    //       afterRender: function() {
    //         // executed after rendering of all views
    //       }
    //     });
    var Layout = Backbone.Layout = Backbone.View.extend({

        // # tagName
        //
        tagName: "div"

        // # constructor
        //
        // Overloaded constructor adds a few extras.
        //
        // 1. Allow a `defaults` attribute (similar to `Backbone.Model`
        //    defaults attribute. The defaults will be applied to
        //    `options` as default values.
        //
        // 2. Allow `options` to specify the `this.serialize` method.
        //
        // 3. Restore pre Backbone 1.1.0 `this.options` functionality.
        //
        , constructor: function(options) {
            options || (options = {});
            if (this.defaults) {
                _.defaults(options, _.result(this, "defaults"));
            }
            if (options.serialize) {
                this.serialize = options.serialize;
            }
            this._viewManager = new ViewManager();
            this.options = options;
            Backbone.View.prototype.constructor.call(this, options);
        }

        // # initialize
        //
        // When initializing a `Layout` it is generally good practice to
        // define any nested views so that they can be rendered as soon as
        // this view is rendered.
        //
        // Here is an example of attaching a nested view to a `Layout`:
        //
        //     var MyLayout = Layout.extend({
        //       initialize: function(options) {
        //         Layout.prototype.initialize.call(this, options);
        //
        //         // Attach nested view
        //         this.registerView(new NestedView(), {
        //           anchor: ".nested-view"
        //           , replace: true
        //         });
        //       }
        //     });
        //
        //  See `ViewManager` and `Layout.render` for more details on how this
        //  is used to render nested views.
        //
        , initialize: function(options) {
            // Bubble up anything the viewmanager triggers.
            this.listenTo(this._viewManager, "all", function() {
                this.trigger.apply(this, arguments);
            }, this);
            Backbone.View.prototype.initialize.call(this, options);
        }

        // # registerView
        //
        // Register a view with the `ViewManager`. This will specify an
        // implicit parent-child relationship between this `Layout` and the
        // view added.
        //
        // Available options are:
        //
        // * anchor
        //     A jQuery selector specifyin the element to which
        //     this view will be appended.
        //
        // * replace
        //     A boolean flag telling the render method not to
        //     append this view to the anchor but to replace the
        //     anchor entirely.
        //
        // If `anchor` is not defined then this view will not be added to the
        // DOM (however it will remain managed by the `ViewManager`). See
        // `ViewManager.register` or `Layout.render` for more information.
        //
        , registerView: function(view, options) {
            options || (options = {});
            this._viewManager.register(view, options);
        }

        // # render
        //
        // Render this view and all child views registered with the
        // `ViewManager`.
        //
        // The order of operations is as follows:
        //
        // 1. Call `beforeRender`
        // 2. Render this view
        // 3. Loop through each child view in the `ViewManager` and render
        //    them
        // 4. Call `afterRender`
        //
        , render: function() {
            this.beforeRender && this.beforeRender();

            if (this.template) {
                this.$el.empty().append(this.template(this.serialize()));
            }

            this._viewManager.each(function(managed, index, list) {
                var view = managed.view;
                view.render();
                if (managed.anchor) {
                    // Otherwise, either replace the anchor with the view or
                    // replace the anchor's content with the view (depending on
                    // the `replace` flag).
                    if (managed.replace) {
                        this.replaceWith($(anchor, this.el), view.el);
                    } else {
                        $(anchor, this.el).html(view.el);
                    }
                }
            }, this);

            this.afterRender && this.afterRender();
            return this;
        }

        // # replaceWith
        //
        // Replace the anchor element with the element specified.
        , replaceWith: function(anchor, element) {
            anchor.replaceWith(element);
        }

        // # close
        //
        // Before closing the view, close all this view's child views. This
        // prevents those views from becoming orphaned and prevents zombie
        // model binds from persisting.
        //
        , close: function() {
            this._viewManager.each(function(managed, index, list) {
            }, this);

            // Notify that this view has closed.
            this.trigger('close', this);

            // Remove and unbind
            this.remove();
            this.unbind();
            this.stopListing();

            // Layouts should define this themselves (binding on the `close`
            // event isn't a good idea since the intent of `close` is to
            // unbind everything).
            this.onClose && this.onClose();

            return this;
        }

        // # serialize
        //
        // Returns a dictionary that will be passed to the template for
        // rendering. By default this method just serializes the associated
        // model. It is common practice to overload this method.
        //
        , serialize: function() {
            return this.model ? this.model.toJSON() : {};
        }
    });

}).call(this, Backbone, _);
