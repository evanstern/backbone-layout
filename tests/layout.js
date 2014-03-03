/* global spyOn, $, Backbone, _, jasmine, beforeEach, window, expect, define, describe, it */
(function(root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['backbone-layout'], factory);
  } else {
    factory(root.BackboneLayout, root.Backbone);
  }
}(this, function(BackboneLayout) {
  'use strict';

  describe('Ensure dependencies are loaded', function() {
    it('Backbone exists', function() {
      expect(window.Backbone).not.toBe(undefined);
    });

    it('jQuery exists', function() {
      expect(window.jQuery).not.toBe(undefined);
    });

    it('Underscore exists', function() {
      expect(window._).not.toBe(undefined);
    });

    it('Layout exists', function() {
      expect(BackboneLayout).not.toBe(undefined);
    });
  });

  describe('Constructor', function() {
    var Layout,
        layout;

    beforeEach(function() {
      Layout = BackboneLayout.extend({
          defaults: { bar: 'foo' }
      });
      layout = new Layout({foo: 'bar'});
    });

    it('Stores options on `this`', function() {
      expect(layout.options).not.toBe(undefined);
    });

    it('Stores options with values', function() {
      expect(layout.options.foo).toBe('bar');
    });

    it('Adds `defaults` to `options`', function() {
      expect(layout.options.bar).toBe('foo');
    });

    it('Has a viewManager', function() {
      expect(typeof layout.viewManager).toBe('object');
    });

    describe('Serialize', function() {
      beforeEach(function() {
        layout = new Layout({
          serialize: function() {}
        });
      });

      it('Adds `serialize` to `this`', function() {
        expect(typeof layout.serialize).toBe('function');
      });
    });

    describe('_.result', function() {
      beforeEach(function() {
        Layout = BackboneLayout.extend({
          defaults: function() {
            return { barfoo: 'foobar' };
          }
        });
        layout = new Layout();
      });

      it('Allows _.result on `defaults`', function() {
        expect(layout.options.barfoo).toBe('foobar');
      });
    });
  });

    describe('Initialize', function() {
      var Layout,
          layout,
          callback;

      beforeEach(function() {
        Layout = BackboneLayout.extend();
        layout = new Layout();
      });

      describe('Events', function() {
        beforeEach(function() {
          layout.off();
          callback = jasmine.createSpy('callback');
          layout.on('testing', callback);
        });

        it('Bubbles up events from viewManager', function() {
          layout.viewManager.trigger('testing');
          expect(callback).toHaveBeenCalled();
        });

        it('Passes arguments upward', function() {
          layout.viewManager.trigger('testing', 'argument', {foo: 'bar'});
          expect(callback).toHaveBeenCalledWith('argument', {foo: 'bar'});
        });
      });
    });

    describe('ViewManager', function() {
      var Layout,
          layout,
          myView;

      beforeEach(function() {
        Layout = BackboneLayout.extend();
        layout = new Layout();
        myView = new Backbone.View();
      });

      it('registers a new view', function() {
        layout.registerView(myView);
        expect(layout.viewManager.getViews().length).toEqual(1);
      });

      it('stores the view correctly', function() {
        layout.registerView(myView);
        var view = layout.viewManager.getViews()[0];
        expect(view).toBe(myView);
      });

      it('registers a view with anchor', function() {
        layout.registerView(myView, {anchor: '.content'});
        var mView = layout.viewManager.getManagedViews()[0];
        expect(mView.anchor).toBe('.content');
      });

      it('registers a view with replace', function() {
        layout.registerView(myView, {replace: true});
        var mView = layout.viewManager.getManagedViews()[0];
        expect(mView.replace).toBe(true);
      });

      it('can call `each`', function() {
        layout.registerView(myView);
        var iterator = jasmine.createSpy('iterator');
        layout.viewManager.each(iterator, this);
        expect(iterator).toHaveBeenCalled();
      });

      it('stores views by their model', function() {
        var modelOne = new (Backbone.Model.extend())();
        var modelTwo = new (Backbone.Model.extend())();
        var viewOne = new (Backbone.View.extend())({model: modelOne});
        var viewTwo = new (Backbone.View.extend())({model: modelOne});
        var viewThree = new (Backbone.View.extend())({model: modelTwo});
        layout.registerView(viewOne);
        layout.registerView(viewTwo);
        layout.registerView(viewThree);

        var views = layout.viewManager.getViewsByModel(modelOne);
        expect(views.length).toEqual(2);
        expect(views[0].model).toBe(modelOne);
        expect(views[1].model).toBe(modelOne);

        views = layout.viewManager.getViewsByModel(modelTwo);
        expect(views.length).toEqual(1);
        expect(views[0].model).toBe(modelTwo);
      });

      describe('#unRegister', function() {
        it('removes the managed view from `views`', function() {
          layout.registerView(myView);
          layout.viewManager.unRegister(myView);
          expect(layout.viewManager.getViews().length).toEqual(0);

          // Also make sure it doesn't explode when we try to remove something
          // that isn't there.
          layout.viewManager.unRegister(myView);
          expect(layout.viewManager.getViews().length).toEqual(0);
        });

        it('removes the managed view from `viewsByModel`', function() {
          var modelOne = new (Backbone.Model.extend())();
          var modelTwo = new (Backbone.Model.extend())();
          var viewOne = new (Backbone.View.extend())({model: modelOne});
          var viewTwo = new (Backbone.View.extend())({model: modelOne});
          var viewThree = new (Backbone.View.extend())({model: modelTwo});
          layout.registerView(viewOne);
          layout.registerView(viewTwo);
          layout.registerView(viewThree);

          layout.viewManager.unRegister(viewOne);
          var views = layout.viewManager.getViewsByModel(modelOne);
          expect(views.length).toEqual(1);
          expect(views[0]).not.toBe(viewOne);
        });

        it('unbinds the view', function() {
          layout.registerView(myView);
          layout.viewManager.unRegister(myView);
          var callback = jasmine.createSpy('callback');
          layout.on('trigger', callback);
          myView.trigger('trigger');
          expect(callback.calls.length).toEqual(0);
        });

        it('is called via `layout.unRegisterView`', function() {
          spyOn(layout.viewManager, 'unRegister');
          layout.registerView(myView);
          layout.unRegisterView(myView);
          expect(layout.viewManager.unRegister).toHaveBeenCalledWith(myView);
        });
      });
    });

    describe('Simple renderer', function() {
      var Layout,
          layout,
          beforeRender,
          afterRender;

      beforeEach(function() {
        beforeRender = jasmine.createSpy('beforeRender');
        afterRender = jasmine.createSpy('afterRender');
        Layout = BackboneLayout.extend({
          template: _.template('foo')
          , beforeRender: beforeRender
          , afterRender: afterRender
        });
        layout = new Layout();
      });

      it('returns `this`', function() {
        expect(layout.render()).toBe(layout);
      });

      it('calls `beforeRender` once', function() {
        layout.render();
        expect(beforeRender.calls.length).toEqual(1);
      });

      it('renders itself to the DOM', function() {
        var div = $('<div>');
        div.append(layout.render().el);
        expect($('div', div)[0]).toBe(layout.el);
      });

      it('renders a template', function() {
        layout.render();
        expect(layout.$el.text()).toEqual('foo');
      });

      it('calls `afterRender` once', function() {
        layout.render();
        expect(afterRender.calls.length).toEqual(1);
      });
    });

    describe('Nested renderer', function() {
      var Layout,
          layout,
          renderCallback,
          view1,
          view2;

      beforeEach(function() {
        renderCallback = jasmine.createSpy('renderCallback');
        var MyView = Backbone.View.extend({
          render: renderCallback
        });

        view1 = new MyView();
        view2 = new MyView();
        Layout = BackboneLayout.extend({
          template: _.template(
            '<div class="view1"></div>' +
            '<div class="view2"></div>'
          )
        });
        layout = new Layout();
      });

      it('calls render on its children', function() {
        layout.registerView(view1);
        layout.registerView(view2);
        layout.render();
        expect(renderCallback.calls.length).toEqual(2);
      });

      it('adds its children to the anchor', function() {
        layout.registerView(view1, {anchor: '.view1'});
        layout.render();
        var anchor = $('.view1', layout.el)[0];
        expect(view1.el.parentNode).toBe(anchor);
      });

      it('does not lose the anchor when replacing', function() {
        layout.registerView(view1, {anchor: '.view1', replace: true});
        layout.render();
        expect(view1.el.parentNode).toBe(layout.el);
      });

      it('listens to its children', function() {
        layout.registerView(view1);
        var listener = jasmine.createSpy('listener');
        layout.on('test', listener);
        view1.trigger('test');
        expect(listener).toHaveBeenCalled();
      });
    });

    describe('Serialize', function() {
        var Layout,
            layout;

        beforeEach(function() {
          Layout = BackboneLayout.extend();
          layout = new Layout();
        });

        it('returns empty object if no model is present', function() {
          expect(layout.serialize()).toEqual({});
        });

        it('returns model.toJSON if a model is present', function() {
          var model = new Backbone.Model({foo: 'bar'});
          layout.model = model;
          expect(layout.serialize()).toEqual(model.toJSON());
        });

        it('can be specified via options', function() {
          var serializer = jasmine.createSpy('serializer');
          layout = new Layout({
            serialize: serializer
          });
          layout.serialize();
          expect(serializer).toHaveBeenCalled();
        });
    });

    describe('Close', function() {
      var Layout,
          layout;

      beforeEach(function() {
        Layout = BackboneLayout.extend();
        layout = new Layout();
      });

      it('triggers `close`', function() {
        var callback = jasmine.createSpy('callback');
        layout.on('close', callback);
        layout.close();
        expect(callback.calls.length).toEqual(1);
      });

      it('unbinds the view', function() {
        var callback = jasmine.createSpy('callback');
        layout.on('trigger', callback);
        layout.close(); // should no longer be bound
        layout.trigger('trigger');
        expect(callback).not.toHaveBeenCalled();
      });

      it('forces the view to stop listening', function() {
        var callback = jasmine.createSpy('callback');
        var myView = new Backbone.View();
        layout.listenTo(myView, 'trigger', callback);
        layout.close(); // should no longer be listening
        myView.trigger('trigger');
        expect(callback).not.toHaveBeenCalled();
      });

      it('removes itself to the DOM', function() {
        var div = $('<div>');
        div.append(layout.render().el);
        layout.close(); // should no longer be in the DOM
        expect($('div', div).length).toEqual(0);
      });

      it('calls onClose', function() {
        var callback = jasmine.createSpy('callback');
        var MyLayout = BackboneLayout.extend({
          onClose: callback
        });
        layout = new MyLayout();
        layout.close();
        expect(callback.calls.length).toEqual(1);
      });

      it('closes its children', function() {
        var callback = jasmine.createSpy('callback');
        var view1 = new (BackboneLayout.extend({
          onClose: callback
        }))();
        layout.registerView(view1);
        layout.close();
        expect(callback.calls.length).toEqual(1);
      });

      it('unregisters the view', function() {
        var View = Backbone.View.extend();
        var view = new View();
        layout.registerView(view);
        layout.close();

        expect(layout.viewManager.getViews().length).toEqual(0);
      });
    });
}));






