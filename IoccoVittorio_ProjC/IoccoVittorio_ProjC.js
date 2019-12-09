/**
 * Base logic for Project A.
 *
 * This file handles setting up, drawing, and animating dragonflies and
 * cattails in a 3D scene. It also handles user input events.
 *
 * @author Michael Huyler, Vittorio Iocco.
 */

/* Global Vars */

// Context vars
var gl;

// Canvas vars
var g_canvasID;
var g_aspect = window.innerHeight / window.innerWidth;

// Transformation vars
var ModelMatrix = new Matrix4();
var NormalMatrix = new Matrix4();
var g_step = 8.0; // [4, +inf]
var wing_start;
var sphereStart;
var sphereLen;
var gridStart;
var sphereStart2;
var sphereLen2;
var matSphereStart;
var matSphereLen;
var logStart;
var logCap;
var logEnd;
var rockStart;
var rockEnd;
var is_spinning = true;

// Camera vars
var g_perspective_eye = [0, 0, 0]; // where the camera is
var g_perspective_lookat = [1, 0, 0]; // where the camera is pointing
var g_perspective_up = [0, 0, 1];
var theta = 0;
var onDragonfly = false;

// Animation vars
var g_last = Date.now();
var g_angle = 0.0;
var g_angle_rate = 15.0;
// Cattails
var cattail_count = 25;
var g_cattails = [];
var g_cattail_max_sway = 7;
var g_cattail_rate = 4.8;
// Dragonflies
var dragonfly_count = 1;
var g_dragonflies = [];
var epsilon = 0.5;
// Wings
var g_wing_angle = 0;
var g_wing_angle_last = Date.now();
var g_wing_angle_rate = 450;
var g_wing_dir = 1;

// Lily Pads
var lily_count = 5;
var g_lilys = [];
// Logs
var log_count = 7;
var g_logs = [];
// Rocks
var rock_count = 9;
var g_rocks = [];

// Event handler vars
var g_isDrag = false;
var g_xMclik = 0.0;
var g_yMclik = 0.0;
var g_xMDown = 0.0;
var g_yMDown = 0.0;
var g_xMdragTot = 0.0;
var g_yMdragTot = 0.0;
var g_mouse_x = 1.0;
var g_mouse_y = 0.5;
var g_dragonfly_x = 0;
var g_dragonfly_y = 0;
var g_dragonfly_z = 0;

function addDragonfly() {
  g_dragonflies.push([
    Math.random() * 2 - 1, // x
    Math.random() * 2 - 1, // y
    Math.random() * 0.5, // offset x
    Math.random() * 0.5, // offset y
    Math.random() * 0.8 / g_aspect, // random point of interest x
    Math.random() * 0.8, // random point of interest y
    0, // timeout
    Math.random() * 2 - 1, // z
    Math.random() * 2 - 1, // random point of interest z
    1, // head vector x
    0, // head vector y
    0, // head vector z
  ]);
}

function removeDragonfly() {
  g_dragonflies.pop();
}

function addCattail() {
  g_cattails.push([
    Math.random() * 20 - 10, // x
    Math.random() * 20 - 10, // y
    0, // z
    Math.random() * g_cattail_max_sway, // starting angle
    Date.now(), // last tick
    Math.random() < 0.5 ? -1 : 1 // starting direction
  ]);
}

function removeCattail() {
  g_cattails.pop();
}

/**
 * Initializes the meta variables of each drawn item.
 */
function initObjects() {
  /* Randomize forest */
  for (var i = 0; i < cattail_count; i++) {
    addCattail();
  }
  /* Randomize Dragonflies */
  for (var i = 0; i < dragonfly_count; i++) {
    addDragonfly();
  }
  /* Randomize Lily Pads */
  for (var i = 0; i < lily_count; i++) {
    g_lilys.push([
      Math.random() * 40 - 20, // x
      Math.random() * 40 - 20, // y
      Math.random() * 360, // rot
      Math.random() + 1, // scale
    ]);
  }
  /* Randomize Logs */
  for (var i = 0; i < log_count; i++) {
    g_logs.push([
      Math.random() * 40 - 20, // x
      Math.random() * 40 - 20, // y
      Math.random() * 360, // rot
      Math.random() * 4 + 4, // scale
    ]);
  }
  /* Randomize Rocks */
  for (var i = 0; i < rock_count; i++) {
    g_rocks.push([
      Math.random() * 40 - 20, // x
      Math.random() * 40 - 20, // y
      Math.random() * 360, // rot
      Math.random() * 2 + 1, // scale
    ]);
  }
}

/*
 * Fills VBO with all of the data we will need.
 *
 * This function runs once on startup, and loads all of the necessary vertices
 * into the VBO, as well as all of their color information.
 */
function initVBO() {
  pos = [];
  colors = [];
  norms = [];

  /* CYLINDER */
  // Circle: {start: 0, len: (g_step * 2) + 2}
  pos.push(0, 0, 0, 1);
  colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
  norms.push(0, 0, 1);
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
    norms.push(0, 0, 1);
  }

  // Brown Tube: {start: (g_step * 2) + 2, len: (g_step * 4) + 2}
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    pos.push(Math.cos(theta), Math.sin(theta), 1, 1);
    colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
    colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
    norms.push(Math.cos(theta), Math.sin(theta), 0);
    norms.push(Math.cos(theta), Math.sin(theta), 1);
  }

  /* CONE */
  // Tip: {start: (g_step * 6) + 4, len: 1}
  pos.push(0, 0, 1, 1);
  colors.push(19.0 / 255.0, 120.0 / 255.0, 46.0 / 255.0);
  norms.push(0, 0, 1);
  // Circumfrence: {start: (g_step * 6) + 5, len: (g_step * 2) + 2}
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    colors.push(13.0 / 255.0, 173.0 / 255.0, 10.0 / 255.0);
    norms.push(Math.cos(theta), Math.sin(theta), Math.sqrt(2) / 2);
  }

  // Green Tube: {start: (g_step * 8) + 7, len: (g_step * 4) + 2}
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    pos.push(Math.cos(theta), Math.sin(theta), 1, 1);
    colors.push(13.0 / 255.0, 173.0 / 255.0, 10.0 / 255.0);
    colors.push(16.0 / 255.0, 163.0 / 255.0, 55.0 / 255.0);
    norms.push(Math.cos(theta), Math.sin(theta), 0);
    norms.push(Math.cos(theta), Math.sin(theta), 0);
  }

  /* Order of push:
     1. Top right wing (front/z+): 0-46
     2. Bottom right wing (front/z+): 47-93
     3. Bottom right wing (back/z-): 94-140
     4. Top right wing (back/z-): 141-187
     5. Abdomen (circle of cylinder): 188-205
     6. Abdomen (tube of cylinder): 206-239
     7. Abdomen (tip of cone): 240-240
     8. Abdomen (circumference of cone): 241- 258 */

  // The top right wing
  wing_start = pos.length / 4;
  pos.push(-1.0, 0.0, 0.0, 1.0, // vertex 1
    -0.97, -0.076, 0.0, 1.0, // vertex 2
    -0.97, 0.05, 0.0, 1.0, // vertex 3
    -0.95, -0.10, 0.0, 1.0, // vertex 4
    -0.95, 0.07, 0.0, 1.0, // vertex 5
    -0.90, -0.12, 0.0, 1.0, // vertex 6
    -0.90, 0.09, 0.0, 1.0, // vertex 7
    -0.80, -0.17, 0.0, 1.0, // vertex 8
    -0.80, 0.12, 0.0, 1.0, // vertex 9
    -0.70, -0.20, 0.0, 1.0, // vertex 10
    -0.70, 0.15, 0.0, 1.0, // vertex 11
    -0.60, -0.21, 0.0, 1.0, // vertex 12
    -0.60, 0.16, 0.0, 1.0, // vertex 13
    -0.50, -0.22, 0.0, 1.0, // vertex 14
    -0.50, 0.16, 0.0, 1.0, // vertex 15
    -0.40, -0.24, 0.0, 1.0, // vertex 16
    -0.40, 0.16, 0.0, 1.0, // vertex 17
    -0.30, -0.27, 0.0, 1.0, // vertex 18
    -0.30, 0.15, 0.0, 1.0, // vertex 19
    -0.20, -0.29, 0.0, 1.0, // vertex 20
    -0.20, 0.15, 0.0, 1.0, // vertex 21
    -0.10, -0.30, 0.0, 1.0, // vertex 22
    -0.10, 0.16, 0.0, 1.0, // vertex 23
    0.00, -0.30, 0.0, 1.0, // vertex 24
    0.00, 0.17, 0.0, 1.0, // vertex 25
    0.10, -0.29, 0.0, 1.0, // vertex 26
    0.10, 0.18, 0.0, 1.0, // vertex 27
    0.20, -0.27, 0.0, 1.0, // vertex 28
    0.20, 0.19, 0.0, 1.0, // vertex 29
    0.30, -0.24, 0.0, 1.0, // vertex 30
    0.30, 0.20, 0.0, 1.0, // vertex 31
    0.40, -0.20, 0.0, 1.0, // vertex 32
    0.40, 0.21, 0.0, 1.0, // vertex 33
    0.50, -0.15, 0.0, 1.0, // vertex 34
    0.50, 0.23, 0.0, 1.0, // vertex 35
    0.60, -0.12, 0.0, 1.0, // vertex 36
    0.60, 0.24, 0.0, 1.0, // vertex 37
    0.70, -0.09, 0.0, 1.0, // vertex 38
    0.70, 0.22, 0.0, 1.0, // vertex 39
    0.75, -0.06, 0.0, 1.0, // vertex 40
    0.75, 0.20, 0.0, 1.0, // vertex 41
    0.80, -0.03, 0.0, 1.0, // vertex 42
    0.80, 0.17, 0.0, 1.0, // vertex 43
    0.85, 0.00, 0.0, 1.0, // vertex 44
    0.85, 0.12, 0.0, 1.0, // vertex 45
    0.86, 0.02, 0.0, 1.0, // vertex 46
    0.86, 0.06, 0.0, 1.0); // vertex 47

  // The bottom right wing
  pos.push(-1.0, 0.0, 0.0, 1.0, // vertex 1
    -0.97, -0.03, 0.0, 1.0, // vertex 2
    -0.97, 0.05, 0.0, 1.0, // vertex 3
    -0.95, -0.20, 0.0, 1.0, // vertex 4
    -0.95, 0.07, 0.0, 1.0, // vertex 5
    -0.90, -0.22, 0.0, 1.0, // vertex 6
    -0.90, 0.09, 0.0, 1.0, // vertex 7
    -0.80, -0.24, 0.0, 1.0, // vertex 8
    -0.80, 0.12, 0.0, 1.0, // vertex 9
    -0.70, -0.26, 0.0, 1.0, // vertex 10
    -0.70, 0.15, 0.0, 1.0, // vertex 11
    -0.60, -0.28, 0.0, 1.0, // vertex 12
    -0.60, 0.16, 0.0, 1.0, // vertex 13
    -0.50, -0.30, 0.0, 1.0, // vertex 14
    -0.50, 0.16, 0.0, 1.0, // vertex 15
    -0.40, -0.32, 0.0, 1.0, // vertex 16
    -0.40, 0.16, 0.0, 1.0, // vertex 17
    -0.30, -0.34, 0.0, 1.0, // vertex 18
    -0.30, 0.15, 0.0, 1.0, // vertex 19
    -0.20, -0.34, 0.0, 1.0, // vertex 20
    -0.20, 0.15, 0.0, 1.0, // vertex 21
    -0.10, -0.34, 0.0, 1.0, // vertex 22
    -0.10, 0.16, 0.0, 1.0, // vertex 23
    0.00, -0.34, 0.0, 1.0, // vertex 24
    0.00, 0.17, 0.0, 1.0, // vertex 25
    0.10, -0.34, 0.0, 1.0, // vertex 26
    0.10, 0.18, 0.0, 1.0, // vertex 27
    0.20, -0.34, 0.0, 1.0, // vertex 28
    0.20, 0.19, 0.0, 1.0, // vertex 29
    0.30, -0.32, 0.0, 1.0, // vertex 30
    0.30, 0.20, 0.0, 1.0, // vertex 31
    0.40, -0.28, 0.0, 1.0, // vertex 32
    0.40, 0.21, 0.0, 1.0, // vertex 33
    0.50, -0.24, 0.0, 1.0, // vertex 34
    0.50, 0.23, 0.0, 1.0, // vertex 35
    0.60, -0.20, 0.0, 1.0, // vertex 36
    0.60, 0.24, 0.0, 1.0, // vertex 37
    0.70, -0.17, 0.0, 1.0, // vertex 38
    0.70, 0.22, 0.0, 1.0, // vertex 39
    0.75, -0.14, 0.0, 1.0, // vertex 40
    0.75, 0.20, 0.0, 1.0, // vertex 41
    0.80, -0.11, 0.0, 1.0, // vertex 42
    0.80, 0.17, 0.0, 1.0, // vertex 43
    0.85, -0.08, 0.0, 1.0, // vertex 44
    0.85, 0.12, 0.0, 1.0, // vertex 45
    0.86, 0.02, 0.0, 1.0, // vertex 46
    0.86, 0.06, 0.0, 1.0); // vertex 47

  // Push first two wings in reverse
  var pos_length = pos.length;
  for (var c = pos_length - 1; c >= wing_start * 4; c -= 4) {
    pos.push(pos[c - 3], pos[c - 2], pos[c - 1], pos[c]);
  }

  var pos_length2 = pos.length;
  for (var c = pos_length2 - 1; c >= wing_start * 4; c -= 64) {
    colors.push(.05, .10, .55);
    colors.push(0.5, 0.7, 1);
    colors.push(0.5, 0.7, 1);
    colors.push(.05, .10, .55);
    colors.push(51 / 255, 171 / 255, 249 / 255);
    colors.push(0.5, 0.7, 1);
    colors.push(0.5, 0.7, 1);
    colors.push(51 / 255, 171 / 255, 249 / 255);
    colors.push(.05, .10, .55);
    colors.push(.05, .10, .55);
    colors.push(51 / 255, 171 / 255, 249 / 255);
    colors.push(0.5, 0.7, 1)
    colors.push(.05, .10, .55);
    colors.push(0.5, 0.7, 1)
    colors.push(0.5, 0.7, 1)
    colors.push(.05, .10, .55);
  }
  // Compensate for the fact that wings only have 47 vertices
  while (colors.length / 3 > pos.length / 4) {
    colors.pop();
  }
  while (norms.length / 3 < pos.length / 4) {
    norms.push(0, 0, 1);
  }
  console.assert(pos.length / 4 == colors.length / 3 && colors.length / 3 == norms.length / 3,
    "Array lengths don't match: pos {" + pos.length / 4 + "}, colors {" + colors.length / 3 + "}, norms {" + norms.length / 3 + "}");

  /* ABDOMEN */

  // Circle: {start: 188, len: (g_step * 2) + 2}
  pos.push(0, 0, 0, 1);
  colors.push(.03, .13, .29);
  norms.push(0, 1, 0);
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), 0, Math.sin(theta), 1);
    colors.push(.03, .25, .68);
    norms.push(0, 1, 0);
  }

  // Brown Tube: {start: 206, len: (g_step * 4) + 2}
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), 0, Math.sin(theta), 1);
    pos.push(Math.cos(theta), 1, Math.sin(theta), 1);
    colors.push(.03, .13, (theta - .9 * theta) % 255);
    colors.push(.03, (.13 * theta) % 255, (theta - .7 * theta) % 255);
    norms.push(Math.cos(theta), 0, Math.sin(theta));
    norms.push(Math.cos(theta), 0, Math.sin(theta));
  }

  // Cone Tip: {start: (g_step * 6) + 4, len: 1}
  pos.push(0, 1, 0, 1);
  colors.push(.03, .13, .29);
  norms.push(0, 1, 0);

  // Cone Circumfrence: {start: (g_step * 6) + 5, len: (g_step * 2) + 2}
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), 0, Math.sin(theta), 1);
    colors.push(.03, .13, .29);
    norms.push(Math.cos(theta), Math.sqrt(2) / 2, Math.sin(theta));
  }

  // Head cube: {start: (g_step * 8) + 7, len: 9}
  pos.push(0, 1, 1, 1,
    0, 0, 1, 1,
    1, 1, 1, 1,
    1, 0, 1, 1,
    1, 1, 0, 1,
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 0, 1,
    0, 1, 1, 1,
    0, 0, 1, 1,
    0, 1, 1, 1,
    1, 1, 1, 1,
    0, 1, 0, 1,
    1, 1, 0, 1,
    1, 0, 0, 1,
    1, 0, 1, 1,
    0, 0, 0, 1,
    0, 0, 1, 1);
  norms.push(-1, 1, 1,
    -1, -1, 1,
    1, 1, 1,
    1, -1, 1,
    1, 1, -1,
    1, -1, -1,
    -1, 1, -1,
    -1, -1, -1,
    -1, 1, 1,
    -1, -1, 1,
    -1, 1, 1,
    1, 1, 1,
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, -1,
    -1, -1, 1, );
  for (var i = 0; i < 9; i++) {
    colors.push(.03, .13, .29);
    colors.push(.05, .40, .55);
  }

  // Sphere (brown fade): {start: sphereStart, len: sphereLen}
  var sphereVerts = makeSphere2(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
  sphereStart = (pos.length / 4) - 1;
  sphereLen = sphereVerts[0].length / 4;
  pos.push.apply(pos, sphereVerts[0]);
  colors.push.apply(colors, sphereVerts[1]);
  norms.push.apply(norms, sphereVerts[2]);

  // Sphere (eyes): {start: sphereStart2, len: sphereLen2}
  sphereVerts = makeSphere2(0, 0, 0);
  sphereStart2 = (pos.length / 4) - 1;
  sphereLen2 = sphereVerts.length / 7;
  pos.push.apply(pos, sphereVerts[0]);
  colors.push.apply(colors, sphereVerts[1]);
  norms.push.apply(norms, sphereVerts[2]);

  // Lilypad Circle: {start: lilyStart, len: (g_step * 2) + 2}
  lilyStart = pos.length / 4;
  lilyLen = (g_step * 2) + 2;
  pos.push(0, 0, 0, 1);
  colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
  norms.push(0, 0, 1);
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / g_step); theta += Math.PI / g_step) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    colors.push(20 / 255, (theta + 110) / 255, 10 / 255);
    norms.push(0, 0, 1);
  }

  //Lilypad Lily: {start: lilyStart + lilyLen}
  pos.push(.3, 1, .7, 1);
  pos.push(-.3, 1, .7, 1);
  pos.push(0, 0, 0, 1);
  pos.push(.3, 1, .4, 1);
  pos.push(-.3, 1, .4, 1);
  pos.push(0, 0, 0, 1);

  colors.push(127 / 255, 0 / 255, 43 / 255);
  colors.push(255 / 255, 20 / 255, 147 / 255);
  colors.push(255 / 255, 192 / 255, 203 / 255);
  colors.push(127 / 255, 0 / 255, 43 / 255);
  colors.push(255 / 255, 20 / 255, 147 / 255);
  colors.push(255 / 255, 192 / 255, 203 / 255);

  norms.push(0, -0.42, 0.6);
  norms.push(0, -0.42, 0.6);
  norms.push(0, -0.42, 0.6);
  norms.push(0, -0.24, 0.6);
  norms.push(0, -0.24, 0.6);
  norms.push(0, -0.24, 0.6);

  // Sphere Bulb: {start: lilyStart + lilyLen + 6, len: sphereLen3}
  var test = true;
  sphereVerts = makeSphere2(247.0 / 255.0, 246.0 / 255.0, 158.0 / 255.0);
  sphereStart3 = lilyStart + lilyLen + 6;
  sphereLen3 = sphereVerts[0].length / 4;
  pos.push.apply(pos, sphereVerts[0]);
  colors.push.apply(colors, sphereVerts[1]);
  norms.push.apply(norms, sphereVerts[2]);

  // Fallen log
  var logStep = g_step * 2;
  logStart = pos.length / 4;
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / logStep); theta += Math.PI / logStep) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    pos.push(Math.cos(theta), Math.sin(theta), 1, 1);
    var color_randomizer = Math.random();
    if (color_randomizer < 0.4) {
      colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
      colors.push(188.0 / 255.0, 119.0 / 255.0, 69.0 / 255.0);
    } else if (color_randomizer < 0.8) {
      colors.push(188.0 / 255.0, 119.0 / 255.0, 69.0 / 255.0);
      colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
    } else {
      colors.push(85.0 / 255.0, 53.0 / 255.0, 22.0 / 255.0);
      colors.push(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0);
    }
    norms.push(Math.cos(theta), Math.sin(theta), 0);
    norms.push(Math.cos(theta), Math.sin(theta), 0);
  }
  logCap = pos.length / 4;
  pos.push(0, 0, 0, 1);
  colors.push(0.87, 0.52, 0.21);
  norms.push(0, 0, 1);
  for (var theta = 0.0; theta < (2.0 * Math.PI) + (Math.PI / logStep); theta += Math.PI / logStep) {
    pos.push(Math.cos(theta), Math.sin(theta), 0, 1);
    var color_randomizer = Math.random();
    if (color_randomizer < 0.4) {
      colors.push(0.9, 0.63, 0.38);
    } else {
      colors.push(0.87, 0.52, 0.21);
    }
    norms.push(0, 0, 1);
  }
  logEnd = pos.length / 4;

  // Rocks
  rockStart = pos.length / 4;
  pos.push(
    0, 0, 0.4, 1, // Fan center
    0.75, 0, 0.2, 1,
    0.55, 0.25, 0.2, 1,
    0.1, 0.4, 0.2, 1,
    -0.25, 0.25, 0.2, 1,
    -0.3, -0.25, 0.2, 1,
    0.2, -0.4, 0.2, 1,
    0.65, -0.3, 0.2, 1,
    0.75, 0, 0.2, 1,
  );
  norms.push(
    0, 0, 0.4, // Fan center
    0.75, 0, 0.2,
    0.55, 0.25, 0.2,
    0.1, 0.4, 0.2,
    -0.25, 0.25, 0.2,
    -0.3, -0.25, 0.2,
    0.2, -0.4, 0.2,
    0.65, -0.3, 0.2,
    0.75, 0, 0.2,
  );
  rockMid = pos.length / 4;
  var len = rockMid - rockStart;
  for (var i = 0; i < len; i++) {
    var l = i * 2 / len;
    if (l <= 1) {
      colors.push(lerp(128, 102, l) / 255.0, lerp(132, 106, l) / 255.0, lerp(135, 108, l) / 255.0);
    } else {
      colors.push(lerp(102, 128, l - 1) / 255.0, lerp(106, 132, l - 1) / 255.0, lerp(108, 135, l - 1) / 255.0);
    }
  }
  pos.push(
    0.75, 0, 0.2, 1,
    0.7, 0, 0, 1,
    0.55, 0.25, 0.2, 1,
    0.45, 0.2, 0, 1,
    0.1, 0.4, 0.2, 1,
    0.1, 0.3, 0, 1,
    -0.25, 0.25, 0.2, 1,
    -0.15, 0.25, 0, 1,
    -0.3, -0.25, 0.2, 1,
    -0.2, -0.2, 0, 1,
    0.2, -0.4, 0.2, 1,
    0.2, -0.3, 0, 1,
    0.65, -0.3, 0.2, 1,
    0.55, -0.25, 0, 1,
    0.75, 0, 0.2, 1,
    0.7, 0, 0, 1,
  );
  norms.push(
    0.75, 0, 0.2,
    0.7, 0, 0,
    0.55, 0.25, 0.2,
    0.45, 0.2, 0,
    0.1, 0.4, 0.2,
    0.1, 0.3, 0,
    -0.25, 0.25, 0.2,
    -0.15, 0.25, 0,
    -0.3, -0.25, 0.2,
    -0.2, -0.2, 0,
    0.2, -0.4, 0.2,
    0.2, -0.3, 0,
    0.65, -0.3, 0.2,
    0.55, -0.25, 0,
    0.75, 0, 0.2,
    0.7, 0, 0,
  );
  rockEnd = pos.length / 4;
  len = rockEnd - rockMid;
  for (var i = 0; i < len; i++) {
    var l = i * 2 / len;
    if (l <= 1) {
      colors.push(lerp(128, 102, l) / 255.0, lerp(132, 106, l) / 255.0, lerp(135, 108, l) / 255.0);
    } else {
      colors.push(lerp(102, 128, l - 1) / 255.0, lerp(106, 132, l - 1) / 255.0, lerp(108, 135, l - 1) / 255.0);
    }
  }

  // Sphere (Lighting test)
  var sphereVerts = makeSphere2(1.0, 1.0, 1.0);
  matSphereStart = (pos.length / 4) - 1;
  matSphereLen = sphereVerts[0].length / 4;
  pos.push.apply(pos, sphereVerts[0]);
  colors.push.apply(colors, sphereVerts[1]);
  norms.push.apply(norms, sphereVerts[2]);

  appendPositions(pos); //From VBObox-Lib.js
  appendColors(colors); //From VBObox-Lib.js
  appendNormals(norms); //From VBObox-Lib.js
  return pos.length / 4; //From VBObox-Lib.js
}

function lerp(a, b, l) {
  return (a * l + (b * (1 - l)));
}

/*
 * Main draw handler, sets up global matrix and calls other draw functions.
 */
function draw() {
  pushMatrix(ModelMatrix);

  ModelMatrix.setIdentity(0, 0, 0);
  updateModelMatrix(ModelMatrix);

  drawSphere();
  for (var i = 0; i < lily_count; i++) {
    drawLilyPads(g_lilys[i][0], g_lilys[i][1], g_lilys[i][2], g_lilys[i][3]);
  }
  for (var i = 0; i < rock_count; i++) {
    drawRocks(g_rocks[i][0], g_rocks[i][1], g_rocks[i][2], g_rocks[i][3]);
  }
  for (var i = 0; i < log_count; i++) {
    drawLogs(g_logs[i][0], g_logs[i][1], g_logs[i][2], g_logs[i][3]);
  }
  for (var i = 0; i < dragonfly_count; i++) {
    drawDragonfly(i);
  }
  for (var i = 0; i < cattail_count; i++) {
    drawCattail(g_cattails[i][0], g_cattails[i][1], g_cattails[i][2], g_cattails[i][3]);
  }

  ModelMatrix = popMatrix();
}

function drawSphere() {
  updateMaterial(tracker.material);

  pushMatrix(ModelMatrix);

  ModelMatrix.translate(6, 4, 3);
  ModelMatrix.rotate(g_angle, 0, 0, 1);
  ModelMatrix.scale(2, 2, 2);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, matSphereStart, matSphereLen + 1);

  ModelMatrix = popMatrix();
}

/*
 * Draws a cattail at a given position.
 *
 * A cattail is located at an arbitrary point in space, and will sway depending
 * on the wind speed.
 *
 * @param c_x    x position of cattail.
 * @param c_y    y position of cattail.
 * @param c_z    z position of cattail.
 * @param c_sway current angle of sway.
 */
function drawCattail(c_x, c_y, c_z, c_sway) {
  /* Group: Cattail */
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0, 3);
  ModelMatrix.scale(4, 4, 4);
  ModelMatrix.translate(c_x / 4, c_y / 4, c_z / 4);
  ModelMatrix.rotate(90, 1, 0, 0);

  drawCattailHead(c_sway);
  updateMaterial(MATL_GRN_PLASTIC);
  drawStalk(c_sway);

  /* End Group: Cattail */
  ModelMatrix = popMatrix();
}

function drawCattailHead(c_sway) {
  // Group: Head
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, -1, 0);
  ModelMatrix.rotate(-c_sway, 0, 0, 1);
  ModelMatrix.translate(0, 1.01, 0);
  ModelMatrix.rotate(-c_sway, 0, 0, 1);
  ModelMatrix.scale(1, 1, -1);

  // Group: Tip
  updateMaterial(MATL_GRN_PLASTIC);
  pushMatrix(ModelMatrix);

  // Object: Tip
  ModelMatrix.translate(0, 0.36, 0);
  ModelMatrix.rotate(270, 1, 0, 0);
  ModelMatrix.scale(0.01, 0.01, 0.25); // w, d, h
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, (g_step * 6) + 4, (g_step * 2) + 2);
  ModelMatrix.rotate(180, 1, 0, 0);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, (g_step * 6) + 5, (g_step * 2) + 2);

  // End Group: Tip
  ModelMatrix = popMatrix();

  // Object: Head
  updateMaterial(MATL_COPPER_DULL);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(270, 1, 0, 0);
  ModelMatrix.scale(0.05, 0.05, 0.3);
  ModelMatrix.translate(0, 0, 0.05);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, (g_step * 2) + 2, (g_step * 4) + 2);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0.025, 0);
  ModelMatrix.rotate(90, 1, 0, 0);
  ModelMatrix.scale(0.049, 0.049, 0.049);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart, sphereLen);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0.3125, 0);
  ModelMatrix.rotate(90, 1, 0, 0);
  ModelMatrix.scale(0.049, 0.049, 0.049);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart, sphereLen);
  ModelMatrix = popMatrix();

  // End Group: Head
  ModelMatrix = popMatrix();
}

function drawStalk(c_sway) {
  // Group: Stalk
  pushMatrix(ModelMatrix);

  // Object: Stem
  var stalk_divisions = 12.0;
  var stalk_height = 1.0;
  ModelMatrix.translate(0, -1, 0);

  for (var i = 0; i < stalk_divisions; i++) {
    pushMatrix(ModelMatrix);
    ModelMatrix.rotate(270, 1, 0, 0);
    ModelMatrix.rotate(c_sway / stalk_divisions * i, 0, 1, 0);
    ModelMatrix.translate(0, 0, 0.99 / stalk_divisions * i);
    ModelMatrix.rotate(c_sway / stalk_divisions * i, 0, 1, 0);
    ModelMatrix.scale(0.02, 0.02, stalk_height / stalk_divisions);
    updateModelMatrix(ModelMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, (g_step * 8) + 6, (g_step * 4) + 2);
    ModelMatrix = popMatrix();
  }

  // End Group: Stalk
  ModelMatrix = popMatrix();
}

/*
 * Draws a dragonfly at a given position.
 *
 * @param d the dragonfly to draw.
 */
function drawDragonfly(d) {
  updateMaterial(MATL_BLU_PLASTIC);

  // Chase random on-screen positions
  var magnitude = Math.sqrt((Math.pow(g_dragonflies[d][4] - g_dragonflies[d][0]), 2) + Math.pow((g_dragonflies[d][5] - g_dragonflies[d][1]), 2) + Math.pow((g_dragonflies[d][8] - g_dragonflies[d][7]), 2));
  var dragonfly_x_move;
  var dragonfly_y_move;
  var dragonfly_z_move;

  // Catch NaN error by checking if the current spot and randomly generated point are the same
  if (magnitude != 0) {
    dragonfly_x_move = (g_dragonflies[d][4] - g_dragonflies[d][0]) / (magnitude * 10);
    dragonfly_y_move = (g_dragonflies[d][5] - g_dragonflies[d][1]) / (magnitude * 10);
    dragonfly_z_move = (g_dragonflies[d][8] - g_dragonflies[d][7]) / (magnitude * 10);
  } else {
    dragonfly_x_move = 0.003; // small amount that will still trigger new point generation
    dragonfly_y_move = 0.003; // small amount that will still trigger new point generation
    dragonfly_z_move = 0.003; // small amount that will still trigger new point generation
  }

  g_dragonflies[d][0] += dragonfly_x_move;
  g_dragonflies[d][1] += dragonfly_y_move;
  g_dragonflies[d][7] += dragonfly_z_move;

  // Generate new random point when the dragonfly approaches the current one
  if ((Math.abs(g_dragonflies[d][4] - g_dragonflies[d][0]) < epsilon) && (Math.abs(g_dragonflies[d][5] - g_dragonflies[d][1]) < epsilon) && (Math.abs(g_dragonflies[d][8] - g_dragonflies[d][7]) < epsilon)) {
    g_dragonflies[d][4] = Math.random() * 25 - 12.5;
    g_dragonflies[d][5] = Math.random() * 25 - 12.5;
    g_dragonflies[d][8] = Math.random() * 4 + Math.random() * 13;
  }

  // Find rotation in xy plane of the dragonfly direction vector
  var hypotenuse = Math.sqrt((Math.pow(g_dragonflies[d][4] - g_dragonflies[d][0]), 2) + Math.pow((g_dragonflies[d][5] - g_dragonflies[d][1]), 2));
  var legy = g_dragonflies[d][5] - g_dragonflies[d][1];
  var moveRotation = Math.acos(legy / hypotenuse) * 180 / Math.PI;

  /* Group: Dragonfly */
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(g_dragonflies[d][0], g_dragonflies[d][1], g_dragonflies[d][7]);
  ModelMatrix.rotate(moveRotation, 0, 0, 1)
  ModelMatrix.scale(.5, .5, .5);
  updateModelMatrix(ModelMatrix);

  drawAbdomen();
  drawWings();
  drawTail();

  /* End Group: Dragonfly */
  ModelMatrix = popMatrix();
}

function drawAbdomen() {
  // Group: Abdomen

  // Object: Body
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(0.15, 1.1, 0.15);
  ModelMatrix.translate(0, -.05, 0);
  ModelMatrix.scale(1, .6, -1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 206, 34);
  ModelMatrix = popMatrix();

  // Object: Cone (near head)
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, .6, 0);
  ModelMatrix.scale(0.15, .15, 0.15);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, wing_start + 240, 18);
  ModelMatrix = popMatrix();

  // Group: Head

  // Object: Square
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.15, .2, -.15);
  ModelMatrix.translate(-.5, 3.5, -.5);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 258, 18);
  ModelMatrix = popMatrix();

  // Object: Left eye
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(270, 1, 0, 0);
  ModelMatrix.translate(0.064, 0.05, 0.8);
  ModelMatrix.scale(0.08, 0.08, 0.08);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart2, sphereLen2);
  ModelMatrix = popMatrix();

  // Object: Right eye
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(270, 1, 0, 0);
  ModelMatrix.translate(-0.064, 0.05, 0.8);
  ModelMatrix.scale(0.08, 0.08, 0.08);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart2, sphereLen2);
  ModelMatrix = popMatrix();

  // End Group: Head

  // Object: Cone (near tail)
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(180, 0, 0, 1);
  ModelMatrix.scale(0.15, .3, 0.15);
  ModelMatrix.translate(0, .1, 0);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, wing_start + 240, 18);
  ModelMatrix = popMatrix();

  // End Group: Abdomen
}

function drawTail() {
  // Group: Tail

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(0.05, .1, 0.05);
  ModelMatrix.translate(0, -3, 0);
  ModelMatrix.scale(1, 1, -1);
  updateModelMatrix(ModelMatrix);

  // First cylinder of tail
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 206, 34);

  // Rest of the cylinders on the tail
  for (var i = 0; i < 12; i++) {
    ModelMatrix.translate(0, -1, 0);
    updateModelMatrix(ModelMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 206, 34);
  }

  // Cone on the tip of the tail
  ModelMatrix.scale(1, -.4, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, wing_start + 240, 18);
  ModelMatrix = popMatrix();

  // End Group: Tail
}

function drawWings() {
  // Group: Wings

  // Object: Front and back of lower right wing
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(-1.0, 0, 0);
  ModelMatrix.rotate(g_wing_angle, 0, 1, 0);
  ModelMatrix.translate(Math.cos(g_wing_angle * Math.PI / 180), 0, Math.sin(g_wing_angle * Math.PI / 180));
  ModelMatrix.translate(1.1, 0, 0);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 47, 47);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 94, 47);
  ModelMatrix = popMatrix();

  // Object: Front and back of lower left wing
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(-1, 0, 0);
  ModelMatrix.rotate(-g_wing_angle, 0, 1, 0);
  ModelMatrix.translate(Math.cos(-g_wing_angle * Math.PI / 180), 0, Math.sin(-g_wing_angle * Math.PI / 180));
  ModelMatrix.translate(-1.1, 0, 0);
  ModelMatrix.scale(-1, 1, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 47, 47);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 94, 47);
  ModelMatrix = popMatrix();

  // Object: Front and back of upper left wing
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(-1, 0, 0);
  ModelMatrix.rotate(-g_wing_angle, 0, 1, 0);
  ModelMatrix.translate(Math.cos(-g_wing_angle * Math.PI / 180), 0, Math.sin(-g_wing_angle * Math.PI / 180));
  ModelMatrix.translate(1, .55, 0);
  ModelMatrix.rotate(14, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start, 47);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 141, 47)
  ModelMatrix = popMatrix();

  // Object: Front and back of upper right wing
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(-1, 0, 0);
  ModelMatrix.rotate(g_wing_angle, 0, 1, 0);
  ModelMatrix.translate(Math.cos(g_wing_angle * Math.PI / 180), 0, Math.sin(g_wing_angle * Math.PI / 180));
  ModelMatrix.translate(-1, .55, 0);
  ModelMatrix.rotate(-14, 0, 0, 1);
  ModelMatrix.scale(-1, 1, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start, 47);
  gl.drawArrays(gl.TRIANGLE_STRIP, wing_start + 141, 47);
  ModelMatrix = popMatrix();

  // End Group: Wings
}

function drawLogs(x, y, rot, scale) {
  updateMaterial(MATL_COPPER_DULL);

  pushMatrix(ModelMatrix);
  ModelMatrix.translate(x, y, -1);
  ModelMatrix.rotate(g_xMdragTot * 50, 0, -1 * Math.sin(theta), Math.cos(theta));
  ModelMatrix.rotate(g_yMdragTot * 50, -1 * Math.sin(theta), Math.cos(theta), 0);
  ModelMatrix.rotate(rot, 0, 0, 1);
  ModelMatrix.scale(scale, scale, scale);
  ModelMatrix.rotate(90, 0, 1, 0);

  // Group: Log
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(0.1, 0.1, 0.5);
  ModelMatrix.translate(-1, 0, 0);

  // Object End Cap
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, logCap, logEnd - logCap);
  ModelMatrix = popMatrix(ModelMatrix);

  // Object End Cap
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0, -1);
  ModelMatrix.rotate(180, 1, 0, 0);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, logCap, logEnd - logCap);
  ModelMatrix = popMatrix(ModelMatrix);

  // Object Tube
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(1, 1, -1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, logStart, logCap - logStart);
  ModelMatrix = popMatrix(ModelMatrix);

  // End Group: Log
  ModelMatrix = popMatrix(ModelMatrix);

  // Group: Stick
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(0.2, 0.2, 0.2);
  ModelMatrix.translate(-0.9, 0, -0.5);
  ModelMatrix.rotate(34, 0, 1, 0);
  ModelMatrix.scale(0.1, 0.1, 0.5);

  // Object End Cap
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, logCap, logEnd - logCap);
  ModelMatrix = popMatrix(ModelMatrix);

  // Object End Cap
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0, -1);
  ModelMatrix.rotate(180, 1, 0, 0);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, logCap, logEnd - logCap);
  ModelMatrix = popMatrix(ModelMatrix);

  // Object Tube
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(1, 1, -1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, logStart, logCap - logStart);
  ModelMatrix = popMatrix(ModelMatrix);

  // End Group: Stick
  ModelMatrix = popMatrix(ModelMatrix);

  ModelMatrix = popMatrix(ModelMatrix);
}

function drawRocks(x, y, rot, scale) {
  updateMaterial(MATL_OBSIDIAN);

  // Group: Rocks
  pushMatrix(ModelMatrix);

  ModelMatrix.translate(x, y, -1);
  ModelMatrix.rotate(rot, 0, 0, 1);
  ModelMatrix.scale(scale, scale, scale);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, rockStart, rockMid - rockStart);
  gl.drawArrays(gl.TRIANGLE_STRIP, rockMid, rockEnd - rockMid);

  // End Group: Rocks
  ModelMatrix = popMatrix();
}

function drawGroundGrid() {
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, 0, -1);
  ModelMatrix.scale(0.5, 0.5, 0.5);
  gridStart = sphereStart2 + sphereLen2;
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.LINES, 1384, gndVerts.length / 4);
  ModelMatrix = popMatrix();
}

function drawLilyPads(x, y, rot, scale) {
  // GROUP: Lily Pad
  pushMatrix(ModelMatrix)

  // Object: Pad
  updateMaterial(MATL_GRN_PLASTIC);
  ModelMatrix.translate(x, y, -.99);
  ModelMatrix.rotate(rot, 0, 0, 1);
  ModelMatrix.scale(scale, scale, scale);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, lilyStart, lilyLen);

  // Group: Petals
  updateMaterial(MATL_RUBY);
  pushMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.5, -.5, .5);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen, 3);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.25, .25, .25);
  ModelMatrix.rotate(30, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.25, -.25, .25);
  ModelMatrix.rotate(30, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.5, .5, .5);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix = popMatrix();

  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.5, -.5, .5);
  ModelMatrix.rotate(75, 0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix.rotate(70, 0, 0, 1);
  updateModelMatrix(ModelMatrix)
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 3, 3);
  ModelMatrix = popMatrix();
  // END GROUP: Petals

  // OBJECT: Center bulb
  updateMaterial(MATL_BRASS);
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(.035, .035, .035);
  ModelMatrix.translate(0, 0, 1);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, lilyStart + lilyLen + 6, sphereLen3);
  ModelMatrix = popMatrix();

  // END GROUP: Lily Pad
  ModelMatrix = popMatrix();
}

function drawAxes() {
  pushMatrix(ModelMatrix);
  ModelMatrix.scale(2, 2, 2);
  updateModelMatrix(ModelMatrix);
  gl.drawArrays(gl.LINES, sphereStart3 + sphereLen3, 6);
  ModelMatrix = popMatrix();
}

function animate(angle) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = angle + (g_angle_rate * elapsed) / 1000.0 * is_spinning;
  if (newAngle > 180.0) newAngle = newAngle - 360.0;
  if (newAngle < -180.0) newAngle = newAngle + 360.0;
  return newAngle;
}

function animateWings(angle) {
  var now = Date.now();
  var elapsed = now - g_wing_angle_last;
  g_wing_angle_last = now;
  var newAngle = angle + (g_wing_angle_rate * elapsed * g_wing_dir) / 1000.0;
  if (newAngle > 30.0) {
    newAngle = 30;
    g_wing_dir = -g_wing_dir;
  }
  if (newAngle < -30.0) {
    newAngle = -30;
    g_wing_dir = -g_wing_dir;
  }
  return newAngle;
}

function sway(cattail) {
  var angle = g_cattails[cattail][3];
  var now = Date.now();
  var elapsed = now - g_cattails[cattail][4];
  g_cattails[cattail][4] = now;
  var newAngle = angle + (g_cattail_rate * elapsed * g_cattails[cattail][5]) / 1000.0;
  if (newAngle > g_cattail_max_sway) {
    newAngle = g_cattail_max_sway;
    g_cattails[cattail][5] = -g_cattails[cattail][5];
  }
  if (newAngle < -g_cattail_max_sway / 3) {
    newAngle = -g_cattail_max_sway / 3;
    g_cattails[cattail][5] = -g_cattails[cattail][5];
  }
  g_cattails[cattail][3] = newAngle;
}

function randomize_sway() {
  for (var i = 0; i < cattail_count; i++) {
    // g_cattails[i][3] = Math.random() * g_cattail_max_sway;
    g_cattails[i][4] = Date.now();
    g_cattails[i][5] = Math.random() < 0.5 ? -1 : 1;
  }
}
