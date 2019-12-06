//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library:
  =====================
Note that you don't really need 'VBObox' objects for any simple,
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly
		the same attributes (e.g. position, color, surface normal), and use
		the same shader program (e.g. same Vertex Shader and Fragment Shader),
		then our textbook's simple 'example code' will suffice.

***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need
		different sets of vertices with  different sets of attributes rendered
		by different shader programs.  THUS a customized VBObox object for each
		VBO/shader-program pair will help you remember and correctly implement ALL
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.

One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO),
		as drawn by calls to one 'shader program' that runs on your computer's
		Graphical Processing Unit(GPU), along with changes to values of that shader
		program's one set of 'uniform' varibles.
The 'shader program' consists of a Vertex Shader and a Fragment Shader written
		in GLSL, compiled and linked and ready to execute as a Single-Instruction,
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex
		Shader for each vertex in every shape, and one 'instance' of the Fragment
		Shader for every on-screen pixel covered by any part of any drawing
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their
		values can't be changed while the shader program runs.
		Each VBObox object stores its own 'uniform' values as vars in JavaScript;
		its 'adjust()'	function computes newly-updated values for these uniform
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs.
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use.
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program,
  -- a DIFFERENT set of attributes that define a vertex for that shader program,
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.
  THUS:
		I don't see any easy way to use the exact same object constructors and
		prototypes for all VBObox objects.  Every additional VBObox objects may vary
		substantially, so I recommend that you copy and re-name an existing VBObox
		prototype object, and modify as needed, as shown here.
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and
		all its prototype functions, then modify their contents for VBObox3
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args;
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================

//GLOBAL VARIABLES
var ipos = icolors = inorms = 0;
var numVertices = 65536;
var vertexCount = 0;
var posDimensions = 4;
var colorsDimensions = 3;
var normalsDimensions = 3;
var positions  = new Float32Array(numVertices*posDimensions);
var float_colors = new Float32Array(numVertices*colorsDimensions);
var normals = new Float32Array(numVertices*normalsDimensions);
var g_step = 8.0; // [4, +inf]

// Ground Plane
function VBObox0() {

	this.VERT_SRC =	//--------------------- VERTEX SHADER source code
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' +
  '}\n';

	 // Ground Grid: Self-Explanatory
   var xcount = 1500;
   var zcount = 1500;
   var xzmax = 50.0;
   var v = 0;
   var j = 0;
	 verts = new Float32Array(8 * 2 * (xcount + zcount));

   var xgap = xzmax / (xcount - 1);
   var zgap = xzmax / (zcount - 1);
   for(v = 0, j = 0; v < 2 * xcount; v++, j += 7) {
     if (v % 2 == 0) {
       verts[j  ] = -xzmax + (v) * xgap;
       verts[j+1] = -xzmax;
       verts[j+2] = 0.0;
       verts[j+3] = 1.0;
     }
     else {
       verts[j  ] = -xzmax + (v - 1) * xgap;
       verts[j+1] = xzmax;
       verts[j+2] = 0.0;
       verts[j+3] = 1.0;
     }
   }
   for(v = 0; v < 2 * zcount; v++, j += 7) {
     if (v % 2 == 0) {
       verts[j  ] = -xzmax;
       verts[j+1] = -xzmax + (v) * zgap;
       verts[j+2] = 0.0;
       verts[j+3] = 1.0;
     }
     else {
       verts[j  ] = xzmax;
       verts[j+1] = -xzmax + (v - 1) * zgap;
       verts[j+2] = 0.0;
       verts[j+3] = 1.0;
     }
   }
   for (var i = 0; i < verts.length; i += 7) {
     verts[i+4] = 0 / 255;
     verts[i+5] = 40 / 255;
     verts[i+6] = 80 / 255;
  }

	this.vboContents = //---------------------------------------------------------
	verts;

	this.vboVerts = verts.length / 7;						// # of vertices held in 'vboContents' array
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) *
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts;
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO,
	                              // move forward by 'vboStride' bytes to arrive
	                              // at the same attrib for the next vertex.

	            //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values)
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets
	this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
	                              // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
                                // (4 floats * bytes/float)
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object,
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
	this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create VBO in GPU. Bye!');
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
  // (positions, colors, normals, etc), or
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management:
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name +
    						'.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name +
    						'.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs:
	this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) {
    console.log(this.constructor.name +
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the
									// number of bytes used to store one complete vertex.  If set
									// to zero, the GPU gets attribute values sequentially from
									// VBO, starting at 'Offset'.
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos0);
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
                        gl.FLOAT, false,
                        this.vboStride, this.vboOffset_a_Colr0);

// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name +
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name +
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.adjust() call you needed to call this.switchToMe()!!');
  }

  this.ModelMat.setPerspective(30 * aspect, aspect, 1, 100);
  this.ModelMat.lookAt(
    g_perspective_eye[0], g_perspective_eye[1], g_perspective_eye[2],
    g_perspective_lookat[0], g_perspective_lookat[1], g_perspective_lookat[2],
    g_perspective_up[0], g_perspective_up[1], g_perspective_up[2],
  );

	this.ModelMat.scale(1 * aspect, 1, 1);
  this.ModelMat.translate(0, 0, -0.8);
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								0, 								// location of 1st vertex to draw;
  								this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}

// Gouraud Shading
function VBObox1() {

	this.VERT_SRC = `
	// Required
	precision highp float;

	// Uniforms
	uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ModelMatrix;
	uniform mat4 u_NormalMatrix;

	// Attributes
	attribute vec4 a_Pos1;
  attribute vec3 a_Colr1;
  attribute vec3 a_Normal1;

	// Varyings
  varying vec3 v_Colr1;
	varying vec3 v_NormalInterp;
	varying vec3 v_VertPos;

	// Constants
	float Ka = 1.0; // Ambient reflection coefficient
	float Kd = 1.0; // Diffuse reflection coefficient
	float Ks = 1.0; // Specular reflection coefficient
	float shininess = 80.0;
	// Material color
	vec3 ambientColor = vec3(0.2, 0.1, 0.0);
	vec3 diffuseColor = vec3(1.0, 0.0, 0.0);
	vec3 specularColor = vec3(1.0, 1.0, 1.0);
	vec3 lightPos = vec3(1.0, 1.0, -1.0);

  void main() {
    vec4 vertPos = u_ModelMatrix * a_Pos1;
		v_VertPos = vec3(vertPos) / vertPos.w;
		v_NormalInterp = vec3(u_NormalMatrix * vec4(a_Normal1, 0.0));
		gl_Position = u_ProjectionMatrix * vertPos;

		vec3 N = normalize(v_NormalInterp);
		vec3 L = normalize(lightPos - v_VertPos);
		// Lambert stuff
		float lambertian = max(dot(N, L), 0.0);
		float specular = 0.0;
		if (lambertian > 0.0) {
			vec3 R = reflect(-L, N);
			vec3 V = normalize(-v_VertPos);
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, shininess);
		}

  	v_Colr1 = vec3(Ka * a_Colr1 * 0.15 +
									 Kd * lambertian * a_Colr1 +
								   Ks * specular * specularColor);

		// Testing defaults
		// v_Colr1 = a_Colr1;
		// gl_Position = u_ModelMatrix * a_Pos1;
		// u_ProjectionMatrix; a_Normal1; u_NormalMatrix;
  }`;

	this.FRAG_SRC = `
	precision mediump float;
  varying vec3 v_Colr1;
  void main() {
		gl_FragColor = vec4(v_Colr1, 1.0);
  }`;


  this.vboContents = Float32Concat(positions,Float32Concat(float_colors,normals));
  
  //--------------------- Attribute sizes
  this.vboFcount_a_Pos1 =  posDimensions;
  this.vboFcount_a_Colr1 = colorsDimensions;
  this.vboFcount_a_Normal1 = normalsDimensions;

  //console.assert((pos.length/4 == colors.length/3 && colors.length/3 == norms.length/3), 
  //           "Number of vertices across positions, colors, and normals vectors not equal");
  
	this.vboVerts = vertexCount / 4;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
  this.vboBytes = this.vboContents.length * this.FSIZE;
	this.vboStrideColors =  0; //this.vboFcount_a_Colr1 * this.FSIZE;
  this.vboStridePositions = 0; //this.vboFcount_a_Pos1 * this.FSIZE;
  this.vboStrideNormals = 0; //this.vboFcount_a_Normal1  * this.FSIZE;

 /* console.assert((this.vboFcount_a_Pos1 +
                  this.vboFcount_a_Colr1 +
                  this.vboFcount_a_Normal1) *
                  this.FSIZE == this.vboStride,
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!"); */

              //--------------------- Attribute offsets
	this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE * numVertices;
  this.vboOffset_a_Normal1 = (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE * numVertices;

	            //---------------------- GPU memory locations:
	this.vboLoc;
	this.shaderLoc;
						 //----------------------- Attribute locations in our shaders:
	this.a_Pos1Loc;
	this.a_Colr1Loc;
	this.a_Normal1Loc;

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMatrix = new Matrix4();
	this.u_ModelMatrixLoc;
	this.ProjectionMatrix = new Matrix4();
	this.u_ProjectionMatrixLoc;
	this.u_NormalMatrixLoc;
};

VBObox1.prototype.init = function() {
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }

	gl.program = this.shaderLoc;

	this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create VBO in GPU. Bye!');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if (this.a_Pos1Loc < 0) {
    console.log(this.constructor.name +
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;
  }
 	this.a_Colr1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if (this.a_Colr1Loc < 0) {
    console.log(this.constructor.name +
    						'.init() failed to get the GPU location of attribute a_Colr1');
    return -1;
  }
  this.a_Normal1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Normal1');
  if (this.a_Normal1Loc < 0) {
    console.log(this.constructor.name +
	    					'.init() failed to get the GPU location of attribute a_Normal1');
	  return -1;
  }
 	this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.u_ModelMatrixLoc) {
    console.log(this.constructor.name +
    						'.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }
	this.u_ProjectionMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ProjectionMatrix');
	if (!this.u_ProjectionMatrixLoc) {
	  console.log(this.constructor.name +
	   						'.init() failed to get GPU location for u_ProjectionMatrix uniform');
	  return;
	}
	this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  if (!this.u_NormalMatrixLoc) {
    console.log(this.constructor.name +
     						'.init() failed to get GPU location for u_NormalMatrix uniform');
    return;
  }
}

VBObox1.prototype.switchToMe = function () {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER w
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
										this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
		this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,		  // type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStridePositions,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the
									// number of bytes used to store one complete vertex.  If set
									// to zero, the GPU gets attribute values sequentially from
									// VBO, starting at 'Offset'.
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos1);
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (we start with position).
  gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                         gl.FLOAT, false,
  						           this.vboStrideColors,  this.vboOffset_a_Colr1);
  gl.vertexAttribPointer(this.a_Normal1Loc,this.vboFcount_a_Normal1,
                         gl.FLOAT, false,
							           this.vboStrideNormals,	this.vboOffset_a_Normal1);
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_Pos1Loc);
  gl.enableVertexAttribArray(this.a_Colr1Loc);
  gl.enableVertexAttribArray(this.a_Normal1Loc);
}

VBObox1.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name +
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name +
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function() {
  if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.adjust() call you needed to call this.switchToMe()!!');
  }

  this.ProjectionMatrix.setPerspective(30 * aspect, aspect, 1, 100);
  this.ProjectionMatrix.lookAt(
    g_perspective_eye[0], g_perspective_eye[1], g_perspective_eye[2],
    g_perspective_lookat[0], g_perspective_lookat[1], g_perspective_lookat[2],
    g_perspective_up[0], g_perspective_up[1], g_perspective_up[2],
  );

	this.ModelMatrix.setTranslate(0, 0, 0);
  this.ModelMatrix.scale(0.8, 0.8, 0.8);
	//this.ModelMatrix.rotate(g_angleNow0, 1, 1, 1);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
	gl.uniformMatrix4fv(this.u_ProjectionMatrixLoc, false, this.ProjectionMatrix.elements);
	gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.ModelMatrix.transpose().invert().elements);
}

VBObox1.prototype.draw = function() {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  //this.ModelMatrix.translate(0, 0, 2);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc, false, this.ModelMatrix.elements);
  // ----------------------------Draw the contents of the currently-bound VBO:
  this.vboVerts = vertexCount;
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts);
}

VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO
}

// Phong Shading
function VBObox2() {
  
	this.VERT_SRC =	`
  precision highp float;

  struct MatlT { // Describes one Phong material by its reflectances:
     vec3 emit;  // Ke: emissive -- surface 'glow' amount (r,g,b)
     vec3 ambi;  // Ka: ambient reflectance (r,g,b)
     vec3 diff;  // Kd: diffuse reflectance (r,g,b)
     vec3 spec;  // Ks: specular reflectance (r,g,b)
     int shiny;  // Kshiny: specular exponent (integer >= 1; typ. <200)
   };

  // ATTRIBUTES
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec3 a_Color;

  // UNIFORMS
  // uniform vec3 u_Kd;        // Phong diffuse reflectance for the entire shape
  uniform MatlT u_MatlSet[1];  // Array of all materials
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;  // Model matrix
  uniform mat4 u_NormalMatrix; // Inverse Transpose of ModelMatrix

  // VARYING
  varying vec3 v_Colr; // Phong Lighting: diffuse reflectance
  varying vec3 v_Position;
  varying vec3 v_Normal;

  void main() {
		vec4 vertPos = u_ModelMatrix * a_Position;
		v_Position = vec3(vertPos) / vertPos.w;
		// TODO: Use u_NormalMatrix
		//  Currently causes lambertian & specular to be < 0
		v_Normal = vec3(u_ModelMatrix * vec4(a_Normal, 0.0));
    gl_Position = u_ModelMatrix * a_Position;

    a_Color;
    u_MvpMatrix;
		a_Normal;
		u_NormalMatrix;
  }`;

	this.FRAG_SRC = `
  precision highp float;
  precision highp int;

  struct LampT { // Describes one point-like Phong light source
     vec3 pos;   // (x,y,z,w); w==1.0 for local light at x,y,z position
     vec3 ambi;  // Ia ==  ambient light source strength (r,g,b)
     vec3 diff;  // Id ==  diffuse light source strength (r,g,b)
     vec3 spec;  // Is == specular light source strength (r,g,b)
  };
  struct MatlT { // Describes one Phong material by its reflectances:
     vec3 emit;  // Ke: emissive -- surface 'glow' amount (r,g,b)
     vec3 ambi;  // Ka: ambient reflectance (r,g,b)
     vec3 diff;  // Kd: diffuse reflectance (r,g,b)
     vec3 spec;  // Ks: specular reflectance (r,g,b)
     int shiny;  // Kshiny: specular exponent (integer >= 1; typ. <200)
   };

  // UNIFORMS
  uniform LampT u_LampSet[1]; // Array of all light sources
  uniform MatlT u_MatlSet[1]; // Array of all materials
  uniform vec3 u_eyePosWorld; // Camera/eye location in world coords

  // VARYING
  varying vec3 v_Normal;   // Find 3D surface normal at each pix
  varying vec3 v_Position; // pixel's 3D pos too -- in 'world' coords
  varying vec3 v_Colr;     // Find diffuse reflectance K_d per pix

  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position);

		float lambertian = max(dot(normal, lightDirection), 0.0);
		float specular = 0.0;
		if (lambertian > 0.0) {
			vec3 R = reflect(-lightDirection, normal);
			vec3 V = normalize(-v_Position);
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, float(u_MatlSet[0].shiny));
		}

		gl_FragColor = vec4(
			u_MatlSet[0].ambi * u_LampSet[0].ambi +
			u_MatlSet[0].diff * u_LampSet[0].diff * lambertian +
			u_MatlSet[0].spec * specular * u_LampSet[0].spec,
			1.0
		);

		u_eyePosWorld;
  }`;

  //-------Vertices---------
          // X Y Z W | Position (4)
          // R G B   | Color (3)
          // I J K   | Normal (3)
  //pos = [];
  //colors = [];
  //norms = [];
  
  // Sphere
  //sphere = makeSphere2(1, 0, 0);
  //pos.push.apply(pos,sphere[0]);
  //colors.push.apply(colors,sphere[1]);
  //norms.push.apply(norms,sphere[2]);

  //appendPositions(pos); 
  //appendColors(colors);
  //appendNormals(norms);

  this.vboContents = Float32Concat(positions,Float32Concat(float_colors,normals));

  //--------------------- Attribute sizes
  this.vboFcount_a_Pos1 =  posDimensions;
  this.vboFcount_a_Colr1 = colorsDimensions;
  this.vboFcount_a_Normal1 = normalsDimensions;

  //console.assert((pos.length/4 == colors.length/3 && colors.length/3 == norms.length/3), 
  //            "Number of vertices across positions, colors, and normals vectors not equal");
  
  this.vboVerts = vertexCount / 4;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
                                // (#  of floats in vboContents array) *
                                // (# of bytes/float).
	
  //Attribute Strides
  this.vboStrideColors =  0; //this.vboFcount_a_Colr1 * this.FSIZE;
  this.vboStridePositions = 0; //this.vboFcount_a_Pos1 * this.FSIZE;
  this.vboStrideNormals = 0; //this.vboFcount_a_Normal1  * this.FSIZE;


	 
  //Attribute offsets
  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE * numVertices;
  this.vboOffset_a_Normal1 = (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE * numVertices;

	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object,
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
  this.a_Pos1Loc;
  this.a_Colr1Loc;
  this.a_Normal1Loc;

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
	this.uLoc_ModelMatrix;						// GPU location for u_ModelMat uniform

  // ------ Additions ------
  this.eyePosWorld = new Float32Array(3); //x,y,z in world coords
  this.u_eyePosWorldLoc; // GPU location for u_ModelMat uniform
  this.MvpMatrix = new Matrix4(); //Model-view-projection matrix
  this.u_MvpMatrixLoc;
  this.NormalMatrix = new Matrix4(); //Transformation matrix for normals
  this.u_NormalMatrixLoc;

  this.lamp0 = new LightsT();
  this.matlSel = MATL_GOLD_SHINY;
  this.matl0 = new Material(this.matlSel);
};

VBObox2.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)

  // a) Compile,link,upload shaders---------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

  // b) Create VBO on GPU, fill it----------------------------------------------
	this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create VBO in GPU. Bye!');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, 	gl.STATIC_DRAW);

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name +
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
 	this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
  if(this.a_ColorLoc < 0) {
    console.log(this.constructor.name +
    						'.init() failed to get the GPU location of attribute a_Color');
    return -1;	// error exit.
  }
  this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
  if(this.a_Normal < 0) {
    console.log(this.constructor.name +
	    					'.init() failed to get the GPU location of attribute a_Normal');
	  return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs:
  this.uLoc_ModelMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.uLoc_ModelMatrix) {
    console.log(this.constructor.name +
    						'.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }

   this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  if (!this.u_NormalMatrixLoc) {
    console.log(this.constructor.name +
                '.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }

  this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
  if (!this.u_MvpMatrixLoc) {
    console.log(this.constructor.name +
                '.init() failed to get GPU location for u_MvpMatrix uniform');
    return;
  }

  this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
  if (!this.u_eyePosWorldLoc) {
    console.log(this.constructor.name +
                '.init() failed to get GPU location for u_eyePosWorld uniform');
    return;
  }

  this.lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');
  this.lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi || !this.lamp0.u_diff || !this.lamp0.u_spec ) {
    console.log('Failed to get GPUs Lamp0 storage locations');
   return;
  }

  // ... for Phong material/reflectance:
  this.matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
  this.matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
  this.matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
  this.matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
  this.matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
  if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd
                    || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
     ) {
    console.log('Failed to get GPUs Reflectance storage locations');
    return;
  }
  // Position the camera in world coordinates:
  this.eyePosWorld.set([6.0, 0.0, 0.0]);
  gl.uniform3fv(this.uLoc_eyePosWorld, this.eyePosWorld);

  // Init World-coord. position & colors of first light source in global vars;
  this.lamp0.I_pos.elements.set([1.0, 1.0, 1.0]);
  this.lamp0.I_ambi.elements.set([1.0, 1.0, 1.0]);
  this.lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  this.lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);
}

VBObox2.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
										this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
    this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
    this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    this.vboStridePositions,// Stride == #bytes we must skip in the VBO to move from the
                  // stored attrib for this vertex to the same stored attrib
                  //  for the next vertex in our VBO.  This is usually the
                  // number of bytes used to store one complete vertex.  If set
                  // to zero, the GPU gets attribute values sequentially from
                  // VBO, starting at 'Offset'.
                  // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    this.vboOffset_a_Pos1);
                  // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (we start with position).
  gl.vertexAttribPointer(this.a_Colr1Loc, this.vboFcount_a_Colr1,
                         gl.FLOAT, false,
                         this.vboStrideColors,  this.vboOffset_a_Colr1);
  gl.vertexAttribPointer(this.a_Normal1Loc,this.vboFcount_a_Normal1,
                         gl.FLOAT, false,
                         this.vboStrideNormals, this.vboOffset_a_Normal1);
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_Pos1Loc);
  gl.enableVertexAttribArray(this.a_Colr1Loc);
  gl.enableVertexAttribArray(this.a_Normal1Loc);
}

VBObox2.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;
  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name +
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name +
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox2.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

  if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.adjust() call you needed to call this.switchToMe()!!');
  }

	//----------------For the Matrices: find the model matrix:
  // Calculate the view projection matrix
  this.ModelMatrix.setPerspective(30 * aspect, aspect, 1, 100);
  this.ModelMatrix.lookAt(
		g_perspective_eye[0], g_perspective_eye[1], g_perspective_eye[2],
		g_perspective_lookat[0], g_perspective_lookat[1], g_perspective_lookat[2],
		g_perspective_up[0], g_perspective_up[1], g_perspective_up[2]
		// this.eyePosWorld[0], this.eyePosWorld[1], this.eyePosWorld[2],
    // 0, 0, 0,
    // 0, 0, 1
	);

	this.ModelMatrix.translate(0, 0, 0);
  this.ModelMatrix.scale(0.8, 0.8, 0.8);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  // this.MvpMatrix.multiply(this.ModelMatrix);

  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
  gl.uniformMatrix4fv(this.uLoc_MvpMatrix, false, this.MvpMatrix.elements);
  gl.uniformMatrix4fv(this.uLoc_NormalMatrix, false, this.NormalMatrix.elements);

  this.reload();
}

VBObox2.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
  if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.draw() call you needed to call this.switchToMe()!!');
  }

 	// Send fresh 'uniform' values to the GPU:

  //---------------For the light source(s):
  gl.uniform3fv(this.lamp0.u_pos,  this.lamp0.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);   // ambient
  gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);   // diffuse
  gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);   // Specular

  //---------------For the Material object(s):
  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny
  //  == specular exponent; (parseInt() converts from float to base-10 integer).

  // ----------------------------Draw the contents of the currently-bound VBO:
  this.vboVerts = vertexCount;
  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts);
}

VBObox2.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO
}

function appendPositions(arr){
  positions = Float32Edit(positions,arr,ipos);
  ipos += arr.length;
  if(ipos > numVertices*posDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' positions to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
}

function appendColors(arr){
  float_colors = Float32Edit(float_colors,arr,icolors);
  icolors += arr.length;
  if(icolors > numVertices*colorsDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' positions to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
}

function appendNormals(arr){
  normals = Float32Edit(normals,arr,inorms);
  inorms += arr.length;
  if(inorms > numVertices*normalsDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' positions to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
}

//concatenate two Float32Arrays
function Float32Concat(first, second){
  var firstLength = first.length,
  result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

//overwrite the base float32Array with a smaller 'edit' float32array starting at some index
function Float32Edit(base,edit,startIdx){
  for(var i = 0; i < edit.length;i++){
    base[i+startIdx] = edit[i];
  }
  return base;
}

function lerp(a, b, l) {
  return (a * l + (b * (1 - l)));
}

//Concatenate all attributes into a single array
function CreateVBO(){

  //-------Vertices---------
          // X Y Z W | Position (4)
          // R G B   | Color (3)
          // I J K   | Normal (3)
  
  vertexCount = initVBO() / 4;  //From IoccoVittorio_ProC.js
  console.log(vertexCount);
}
