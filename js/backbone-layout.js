// Backbone-Layout.js 0.1.2

// (c) 2013 Evan Stern
// Backbone-Layout may be freely distributed under the MIT license.

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["backbone"], factory);
    } else {
        root.BackboneLayout = factory();
    }
}(this, function() {

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
        this.replace = options.replace;
    };

    // ViewManager
    // -----------
    //
    // The view manager keeps track of the views that have been registered with
    // a BackboneLayout. It is the interface to those views.
    //
    // Views that are in the view manager will have their events bubbled up to
    // the parent view, they will be rendered when the parent is rendered and
    // closed when the parent is closed.
    //
    var ViewManager = function() {
        var views = [];

        // # register
        //
        // Register a view with the view manager.  This begins the management
        // of the view.
        //
        // Available options:
        //
        // * anchor
        //
        //     A jQuery selector string specifying the anchor element for the
        //     view relative to the parent view. (i.e. where the view will be
        //     rendered)
        //
        // * replace
        //
        //     A boolean flag specifying whether or not to replace the anchor
        //     with the view's element.
        //     Defaults to `false`
        //
        // If no anchor is given, the view will be managed as normal but the
        // view's element will not be added to the DOM.
        //
        // Examples:
        //
        //     // The view will be appended to $(".container", this.el)
        //     this.registerView(view, {anchor: ".container"})
        //
        //     // The view will replace $(".container", this.el)
        //     this.registerView(view, {anchor: ".container", replace: true});
        //
        //     // The view will be registered but not added to the DOM
        //     this.registerView(view);
        //
        this.register = function(view, options) {
            options || (options = {});

            // Bubble up all the events from this view.
            this.listenTo(view, "all", function() {
                this.trigger.apply(this, arguments);
            }, this);

            var mView = new ManagedView(view, options);
            views.push(mView);
        };

        this.each = function(iterator, context) {
            _.each(this.getViews(), iterator, context);
        };

        this.getViews = function() {
            return views;
        };

        _.bindAll(this, "register", "each");
    };
    _.extend(ViewManager.prototype, Backbone.Events);

    // BackboneLayout
    // --------------
    //
    // When extending BackboneLayout there are a few interface methods that can
    // optionally be defined.
    //
    // * `beforeRender`
    //   > This is the first function that is run during the `render()` call.
    // * `afterRender`
    //   > This is the last function that is run during the `render()` call.
    //
    // Examples:
    //
    //     var MyLayout = BackboneLayout.extend({
    //       beforeRender: function() {
    //         // executed before rendering itself or its children
    //       }
    //
    //       , afterRender: function() {
    //         // executed after rednering itself and its children
    //       }
    //     });
    //
    var BackboneLayout = Backbone.View.extend({

        // # constructor
        //
        // Pre-processing to make sure the BackboneLayout has all the data and
        // attributes we expect it to have.
        //
        constructor: function(options) {
            options || (options = {});
            this.viewManager = new ViewManager();

            // Process `defaults` similarly to `Backbone.Model`
            //
            //     var MyLayout = BackboneLayout.extend({
            //       defaults: {
            //         'foo': 'bar'
            //       }
            //     });
            //
            //     var layout = new MyLayout();
            //     layout.options.foo
            //     >> 'bar'
            //
            if (this.defaults) {
                _.defaults(options, _.result(this, "defaults"));
            }

            // Serialize can be overridden via the options
            //
            //     var layout = new BackboneLayout({
            //       serialize: function() {
            //         return {"foo": "bar"};
            //       }
            //     });
            //
            //     layout.serialize();
            //     >> {"foo": "bar"}
            //
            if (options.serialize) {
                this.serialize = options.serialize;
            }

            // Restore pre Backbone 1.1.0 `this.options` functionality
            this.options = options;

            Backbone.View.prototype.constructor.call(this, options);
        }

        // # initialize
        //
        // When initializing a `BackboneLayout` it is good practice to define
        // any nested views so that they can be rendered as soon as this view
        // is rendered.
        //
        // Example:
        //
        //     var MyLayout = BackboneLayout.extend({
        //       initialize: function(options) {
        //         BackboneLayout.prototype.initialize.call(this, options);
        //
        //         this.registerView(new NestedView(), {
        //           anchor: ".nested-view"
        //           , replace: true
        //         });
        //       }
        //     });
        //
        // See `ViewManager` and `BackboneLayout.render` for more details on
        // how nested views are rendered.
        //
        , initialize: function(options) {
            // Bubble up anything the view manager triggers
            this.listenTo(this.viewManager, "all", function() {
                this.trigger.apply(this, arguments);
            }, this);
            Backbone.View.prototype.initialize.call(this, options);
        }

        // # registerView
        //
        // Register a view with the `ViewManager`. This will specify an
        // explicit parent-child relationship between this view and the view
        // added.
        //
        // See `ViewManager.register` for more information.
        //
        , registerView: function(view, options) {
            options || (options = {});
            this.viewManager.register(view, options);
        }

        // # render
        //
        // Render this view and all child views registered with thie view
        // manager.
        //
        // The order of operations is:
        //
        // 1) Call `beforeRender`
        // 2) Add this view to the DOM (if we can)
        // 3) Recurse through all nested views and render them
        // 4) Call `afterRender`
        //
        , render: function() {
            this.beforeRender && this.beforeRender();

            if (this.template) {
                this.$el.empty().append(this.template(this.serialize()));
            }

            this.viewManager.each(function(managed, index, list) {
                var view = managed.view;
                view.render();
                if (managed.anchor) {
                    var anchor = $(managed.anchor, this.el);
                    if (managed.replace) {
                        anchor.replaceWith(view.el);
                    } else {
                        anchor.html(view.el);
                    }
                }
            }, this);

            this.afterRender && this.afterRender();
            return this;
        }

        // # close
        //
        // Before closing this view, close all the child views. This prevents
        // those views from becoming orphaned and prevents zombie binds from
        // persisting.
        //
        , close: function() {
            this.viewManager.each(function(managed, index, list) {
                view = managed.view;
                view.close && view.close();
            });

            this.trigger("close", this);

            this.unbind();
            this.stopListening();
            this.remove();

            this.onClose && this.onClose();

            return this;
        }

        // # serialize
        //
        // Returns an object of data. This becomes the template context object.
        // It is common practice to re-define this method as needed.
        //
        // Can be overridden via the `options` argument at instantiation time
        // (see `BackboneLayout.initialize`)
        //
        , serialize: function() {
            return this.model ? this.model.toJSON() : {};
        }
    });

    return BackboneLayout;
}));

