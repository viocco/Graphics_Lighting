//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// TABS set to 2.
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// JT_MultiShader.js  for EECS 351-1,
//									Northwestern Univ. Jack Tumblin

// Global Variables
//   (These are almost always a BAD IDEA, but here they eliminate lots of
//    tedious function arguments.
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl; // WebGL rendering context -- the 'webGL' object
// in JavaScript with all its member fcns & data
var g_canvasID; // HTML-5 'canvas' element ID#
var aspect;

CreateVBO();
// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0(); // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
part1Box = new VBObox1(); // "  "  for first set of custom-shaded 3D parts
part2Box = new VBObox2(); // "  "  for second set of custom-shaded 3D parts

// For animation:---------------------
var g_lastMS = Date.now(); // Timestamp (in milliseconds) for our
// most-recently-drawn WebGL screen contents.
// Set & used by moveAll() fcn to update all
// time-varying params for our webGL drawings.
// All time-dependent params (you can add more!)
var g_angleNow0 = 0.0; // Current rotation angle, in degrees.
var g_angleRate0 = 45.0; // Rotation angle rate, in degrees/second.
//---------------
var g_angleNow1 = 100.0; // current angle, in degrees
var g_angleRate1 = 95.0; // rotation angle rate, degrees/sec
var g_angleMax1 = 150.0; // max, min allowed angle, in degrees
var g_angleMin1 = 60.0;
//---------------
var g_angleNow2 = 0.0; // Current rotation angle, in degrees.
var g_angleRate2 = -62.0; // Rotation angle rate, in degrees/second.

//---------------
var g_posNow0 = 0.0; // current position
var g_posRate0 = 0.6; // position change rate, in distance/second.
var g_posMax0 = 0.5; // max, min allowed for g_posNow;
var g_posMin0 = -0.5;
// ------------------
var g_posNow1 = 0.0; // current position
var g_posRate1 = 0.5; // position change rate, in distance/second.
var g_posMax1 = 1.0; // max, min allowed positions
var g_posMin1 = -1.0;
//---------------

// For mouse/keyboard:------------------------
var g_show0 = 1; // 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1; // 	"					"			VBO1		"				"				"
var g_show2 = 1; //  "         "     VBO2    "       "       "

// Camera vars
var g_perspective_eye = [15, 0, 0]; // where the camera is
var g_perspective_lookat = [14, 0, 0]; // where the camera is pointing
var g_perspective_up = [0, 0, 1];
var theta = 3.15;

function main() {
  g_canvasID = document.getElementById('webgl');
  g_canvasID.width = window.innerWidth;
  g_canvasID.height = window.innerHeight;
  aspect = g_canvasID.width / g_canvasID.height;
  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);

  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine, adjusted by big sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL func. call
  // will follow this format:  gl.WebGLfunctionName(args);
  //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID);
  // Here's a BETTER version:
  gl = g_canvasID.getContext("webgl", {
    preserveDrawingBuffer: true
  });
  // This fancier-looking version disables HTML-5's default screen-clearing, so
  // that our drawMain()
  // function will over-write previous on-screen results until we call the
  // gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize each of our 'vboBox' objects:
  worldBox.init(gl);
  part1Box.init(gl);
  part2Box.init(gl);

  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  window.addEventListener("keydown", myKeyDown, false);

  var tick = function() {
    requestAnimationFrame(tick, g_canvasID);
    timerAll();
    drawAll();
  };
  tick();
}

function timerAll() {
  var nowMS = Date.now();
  var elapsedMS = nowMS - g_lastMS;
  g_lastMS = nowMS;
  if (elapsedMS > 1000.0) {
    // Browsers won't re-draw 'canvas' element that isn't visible on-screen
    // (user chose a different browser tab, etc.); when users make the browser
    // window visible again our resulting 'elapsedMS' value has gotten HUGE.
    // Instead of allowing a HUGE change in all our time-dependent parameters,
    // let's pretend that only a nominal 1/30th second passed:
    elapsedMS = 1000.0 / 30.0;
  }
  // Find new time-dependent parameters using the current or elapsed time:
  // Continuous rotation:
  g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsedMS) / 1000.0;
  g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsedMS) / 1000.0;
  g_angleNow2 = g_angleNow2 + (g_angleRate2 * elapsedMS) / 1000.0;
  g_angleNow0 %= 360.0;
  g_angleNow1 %= 360.0;
  g_angleNow2 %= 360.0;
  if (g_angleNow1 > g_angleMax1) {
    g_angleNow1 = g_angleMax1;
    g_angleRate1 = -g_angleRate1;
  } else if (g_angleNow1 < g_angleMin1) {
    g_angleNow1 = g_angleMin1;
    g_angleRate1 = -g_angleRate1;
  }
  g_posNow0 += g_posRate0 * elapsedMS / 1000.0;
  g_posNow1 += g_posRate1 * elapsedMS / 1000.0;
  if (g_posNow0 > g_posMax0) {
    g_posNow0 = g_posMax0;
    g_posRate0 = -g_posRate0;
  } else if (g_posNow0 < g_posMin0) {
    g_posNow0 = g_posMin0;
    g_posRate0 = -g_posRate0;
  }
  if (g_posNow1 > g_posMax1) {
    g_posNow1 = g_posMax1;
    g_posRate1 = -g_posRate1;
  } else if (g_posNow1 < g_posMin1) {
    g_posNow1 = g_posMin1;
    g_posRate1 = -g_posRate1;
  }

}

function drawAll() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var b4Draw = Date.now();
  var b4Wait = b4Draw - g_lastMS;

  if (g_show0 == 1) {
    worldBox.switchToMe();
    worldBox.adjust();
    worldBox.draw();
  }
  if (g_show1 == 1) {
    part1Box.switchToMe();
    part1Box.adjust();
    part1Box.draw();
  }
  if (g_show2 == 1) {
    part2Box.switchToMe();
    part2Box.adjust();
    part2Box.draw();
  }
}

function VBO0toggle() {
  if (g_show0 != 1) g_show0 = 1; // show
  else g_show0 = 0; // hide
  console.log('g_show0: ' + g_show0);
}

function VBO1toggle() {
  if (g_show1 != 1) g_show1 = 1; // show
  else g_show1 = 0; // hide
  console.log('g_show1: ' + g_show1);
}

function VBO2toggle() {
  if (g_show2 != 1) g_show2 = 1; // show
  else g_show2 = 0; // hide
  console.log('g_show2: ' + g_show2);
}

function myKeyDown(kev) {
  var code;
  if (!kev.code) {
    code = "" + kev.keyCode;
  } else {
    code = kev.code;
  }
  switch (code) {
    case "KeyW":
    case "87":
    case "ArrowUp":
      // tracker.global_y_pos -= 0.01;
      var D = [
        (g_perspective_lookat[0] - g_perspective_eye[0]) * 0.5,
        (g_perspective_lookat[1] - g_perspective_eye[1]) * 0.5,
        (g_perspective_lookat[2] - g_perspective_eye[2]) * 0.5,
      ];
      g_perspective_eye[0] += D[0];
      g_perspective_lookat[0] += D[0];
      g_perspective_eye[1] += D[1];
      g_perspective_lookat[1] += D[1];
      g_perspective_eye[2] += D[2];
      g_perspective_lookat[2] += D[2];
      break;
    case "KeyA":
    case "65":
    case "ArrowLeft":
      // tracker.global_x_pos += 0.01;
      var D = [
        g_perspective_lookat[0] - g_perspective_eye[0],
        g_perspective_lookat[1] - g_perspective_eye[1],
        0
      ];
      // Cross Product
      var C = [
        (D[1] * 1 - D[2] * 0) * 0.5,
        (D[2] * 0 - D[0] * 1) * 0.5,
        0 // (D[0] * 0 - D[1] * 0) * 0.5
      ];
      g_perspective_eye[0] -= C[0];
      g_perspective_lookat[0] -= C[0];
      g_perspective_eye[1] -= C[1];
      g_perspective_lookat[1] -= C[1];
      break;
    case "KeyS":
    case "83":
    case "ArrowDown":
      // tracker.global_y_pos += 0.01;
      var D = [
        (g_perspective_lookat[0] - g_perspective_eye[0]) * 0.5,
        (g_perspective_lookat[1] - g_perspective_eye[1]) * 0.5,
        (g_perspective_lookat[2] - g_perspective_eye[2]) * 0.5,
      ];
      g_perspective_eye[0] -= D[0];
      g_perspective_lookat[0] -= D[0];
      g_perspective_eye[1] -= D[1];
      g_perspective_lookat[1] -= D[1];
      g_perspective_eye[2] -= D[2];
      g_perspective_lookat[2] -= D[2];
      break;
    case "KeyD":
    case "68":
    case "ArrowRight":
      // tracker.global_x_pos -= 0.01;
      var D = [
        g_perspective_lookat[0] - g_perspective_eye[0],
        g_perspective_lookat[1] - g_perspective_eye[1],
        0
      ];
      // Cross Product
      var C = [
        (D[1] * 1 - D[2] * 0) * 0.5,
        (D[2] * 0 - D[0] * 1) * 0.5,
        0 // (D[0] * 0 - D[1] * 0) * 0.5
      ];
      g_perspective_eye[0] += C[0];
      g_perspective_lookat[0] += C[0];
      g_perspective_eye[1] += C[1];
      g_perspective_lookat[1] += C[1];
      break;
    case "KeyI":
    case "73":
      g_perspective_lookat[2] += 0.05;
      break;
    case "KeyJ":
    case "74":
      theta += 0.05;
      g_perspective_lookat[0] = g_perspective_eye[0] + Math.cos(theta);
      g_perspective_lookat[1] = g_perspective_eye[1] + Math.sin(theta);
      break;
    case "KeyK":
    case "75":
      g_perspective_lookat[2] -= 0.05;
      break;
    case "KeyL":
    case "76":
      theta -= 0.05;
      g_perspective_lookat[0] = g_perspective_eye[0] + Math.cos(theta);
      g_perspective_lookat[1] = g_perspective_eye[1] + Math.sin(theta);
      break;
    default:
      console.log("Unused key: " + code);
      break;
  }
}
