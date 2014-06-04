{"version":3,"file":"backbone-layout.min.js","sources":["js/backbone-layout.js"],"names":["root","factory","define","amd","BackboneLayout","Backbone","_","this","$","ManagedView","view","options","id","uniqueId","name","anchor","replace","ViewManager","views","viewsByModel","viewsByName","register","listenTo","trigger","apply","arguments","mView","push","model","cid","unRegister","filter","v","without","omit","each","mViews","mCid","obj","stopListening","iterator","context","getViews","map","getManagedViews","getViewsByModel","length","getViewByName","bindAll","extend","prototype","Events","View","constructor","clone","viewManager","defaults","result","serialize","call","initialize","registerView","unRegisterView","undefined","render","beforeRender","template","$el","empty","append","managed","el","replaceWith","html","afterRender","close","unbind","remove","onClose","toJSON"],"mappings":"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"}