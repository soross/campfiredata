App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return App.Data.find();
  }
});

App.Store = DS.Store.extend({
  revision: 13,
  adapter: 'DS.RESTAdapter'
});

DS.RESTAdapter.configure("plurals", {
  data: "data"
});

App.Data = DS.Model.extend({
  messages: DS.hasMany('App.Message')
});

App.Message = DS.Model.extend({
  body: DS.attr('string')
});