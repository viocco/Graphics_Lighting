var gui;
var gui_open = true;
var GuiTracker = function() {
  this.gouraud = true;
  this.phong = false;
  this.blinnphong = false;
  this.global_x_pos = 0;
  this.global_y_pos = 0;
  this.global_z_pos = 0;
  this.global_x_scale = 1;
  this.global_y_scale = 1;
  this.global_z_scale = 1;
  this.global_x_rot = 0;
  this.global_y_rot = 0;
  this.global_z_rot = 0;
  this.animate_toggle = true;
  this.cattail_sway = true;
  this.addDragonfly = function() {
    tracker.animate_toggle = false;
    setTimeout(function(){
      dragonfly_count++;
      addDragonfly();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {g_cattails[i][4] = Date.now();}
      tick();
    }, 10);
  };
  this.addCattail = function() {
    tracker.animate_toggle = false;
    setTimeout(function(){
      cattail_count++;
      addCattail();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {g_cattails[i][4] = Date.now();}
      tick();
    }, 10);
  };
  this.removeDragonfly = function() {
    tracker.animate_toggle = false;
    setTimeout(function(){
      dragonfly_count--;
      removeDragonfly();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {g_cattails[i][4] = Date.now();}
      tick();
    }, 10);
  };
  this.removeCattail = function() {
    tracker.animate_toggle = false;
    setTimeout(function(){
      cattail_count--;
      removeCattail();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {g_cattails[i][4] = Date.now();}
      tick();
    }, 10);
  };
  this.reset = function() {
    this.global_x_pos = this.global_y_pos = this.global_z_pos = 0;
    this.global_x_rot = this.global_y_rot = this.global_z_rot = 0;
    this.global_x_scale = this.global_y_scale = this.global_z_scale = 1;
    g_xMdragTot = 0.0;
    g_yMdragTot = 0.0;
    draw();
  };
}
var tracker = new GuiTracker();
var help_visible = false;

/*
 * Initializes the GUI at startup, registers variable state listeners.
 */
function initGui() {
  gui = new dat.GUI({name: 'My GUI'});
  var shading = gui.addFolder('Shading');
  shading.add(tracker, 'gouraud').name('Gouraud Shading').listen().onChange(function(){tracker.gouraud = true; tracker.phong = false;});
  shading.add(tracker, 'phong').name('Phong Shading').listen().onChange(function(){tracker.gouraud = false; tracker.phong = true;});
  shading.open();
  var lighting = gui.addFolder('Lighting');
  lighting.add(tracker, 'blinnphong').name('Blinn-Phong Lighting');
  lighting.open();
  var anim = gui.addFolder('Animations');
  anim.add(tracker, 'animate_toggle').name('Toggle Animation').listen().onChange(function(value) {
    if (value) {
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {g_cattails[i][4] = Date.now();}
      tick();
    }
  });
  anim.add(tracker, 'cattail_sway').name('Toggle Cattail Sway').onChange(function(value) {
    if (value) {
      g_cattail_last = Date.now();
    }
  });
  // anim.open();
  var manage_objects = gui.addFolder('Manage Objects');
  manage_objects.add(tracker, 'addDragonfly').name('Add Dragonfly');
  manage_objects.add(tracker, 'removeDragonfly').name('Remove Dragonfly');
  manage_objects.add(tracker, 'addCattail').name('Add Cattail');
  manage_objects.add(tracker, 'removeCattail').name('Remove Cattail');
  // manage_objects.open();
  gui.add(tracker, 'reset').name('Reset');
  if (!gui_open)
    gui.close();
}

initGui();
