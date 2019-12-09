var gui;
var gui_open = true;
var GuiTracker = function() {
  // Shading
  this.gouraud = true;
  this.phong = false;
  // Lighting
  this.blinnphong = false;
  this.material = 11;
  // Lamps
  this.headlight = true;
  this.freelight = true;
  this.freelight_pos_x = 1;
  this.freelight_pos_y = 1;
  this.freelight_pos_z = 1;
  this.freelight_palette = {
    ambient: [255, 255, 255],
    diffuse: [255, 255, 255],
    specular: [255, 255, 255]
  };
  // Animation
  this.animate_toggle = true;
  this.cattail_sway = true;
  // Object Management
  this.addDragonfly = function() {
    tracker.animate_toggle = false;
    setTimeout(function() {
      dragonfly_count++;
      addDragonfly();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {
        g_cattails[i][4] = Date.now();
      }
      tick();
    }, 10);
  };
  this.addCattail = function() {
    tracker.animate_toggle = false;
    setTimeout(function() {
      cattail_count++;
      addCattail();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {
        g_cattails[i][4] = Date.now();
      }
      tick();
    }, 10);
  };
  this.removeDragonfly = function() {
    tracker.animate_toggle = false;
    setTimeout(function() {
      dragonfly_count--;
      removeDragonfly();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {
        g_cattails[i][4] = Date.now();
      }
      tick();
    }, 10);
  };
  this.removeCattail = function() {
    tracker.animate_toggle = false;
    setTimeout(function() {
      cattail_count--;
      removeCattail();
      tracker.animate_toggle = true;
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {
        g_cattails[i][4] = Date.now();
      }
      tick();
    }, 10);
  };
  // Reset
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
  gui = new dat.GUI({
    name: 'My GUI',
    hideable: false
  });
  var shading = gui.addFolder('Shading');
  shading.add(tracker, 'gouraud').name('Gouraud Shading').listen().onChange(function() {
    tracker.gouraud = true;
    tracker.phong = false;
  });
  shading.add(tracker, 'phong').name('Phong Shading').listen().onChange(function() {
    tracker.gouraud = false;
    tracker.phong = true;
  });
  shading.open();
  // var lighting = gui.addFolder('Lighting');
  gui.add(tracker, 'blinnphong').name('Blinn-Phong Lighting');
  gui.add(tracker, 'material',
          {
            MATL_RED_PLASTIC: 1,
            MATL_GRN_PLASTIC: 2,
            MATL_BLU_PLASTIC: 3,
            MATL_BLACK_PLASTIC: 4,
            MATL_BLACK_RUBBER: 5,
            MATL_BRASS: 6,
            MATL_BRONZE_DULL: 7,
            MATL_BRONZE_SHINY: 8,
            MATL_CHROME: 9,
            MATL_COPPER_DULL: 10,
            MATL_COPPER_SHINY: 11,
            MATL_GOLD_DULL: 12,
            MATL_GOLD_SHINY: 13,
            MATL_PEWTER: 14,
            MATL_SILVER_DULL: 15,
            MATL_SILVER_SHINY: 16,
            MATL_EMERALD: 17,
            MATL_JADE: 18,
            MATL_OBSIDIAN: 19,
            MATL_PEARL: 20,
            MATL_RUBY: 21,
            MATL_TURQUOISE: 22
          }).name('Sphere Material');
  // lighting.open();
  var lamps = gui.addFolder('Lamps');
  lamps.add(tracker, 'headlight').name('Head Lamp Toggle');
  lamps.add(tracker, 'freelight').name('Free Lamp Toggle');
  lamps.add(tracker, 'freelight_pos_x').name('Free Lamp x Position');
  lamps.add(tracker, 'freelight_pos_y').name('Free Lamp y Position');
  lamps.add(tracker, 'freelight_pos_z').name('Free Lamp z Position');
  lamps.addColor(tracker.freelight_palette, 'ambient');
  lamps.addColor(tracker.freelight_palette, 'diffuse');
  lamps.addColor(tracker.freelight_palette, 'specular');
  // lamps.open();
  var anim = gui.addFolder('Animations');
  anim.add(tracker, 'animate_toggle').name('Toggle Animation').listen().onChange(function(value) {
    if (value) {
      g_last = Date.now();
      for (var i = 0; i < g_cattails.length; i++) {
        g_cattails[i][4] = Date.now();
      }
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
  document.getElementsByClassName('close-bottom')[0].onclick = function() {
    gui_open = !gui_open;
  };
}

function toggle_gui() {
  gui_open = !gui_open;
  if (gui_open)
    gui.open();
  else
    gui.close();
}

function toggle_help() {
  help_visible = !help_visible;
  document.getElementById("help-menu-expanded").style.visibility = help_visible ? "visible" : "hidden";
  document.getElementById("help-menu").innerHTML = help_visible ? "Hide Help" : "Show Help";
}

initGui();
