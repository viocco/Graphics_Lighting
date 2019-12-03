//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// BasicShapes.js  MODIFIED for EECS 351-1,
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--show how to extend to other attributes: color, surface normal, etc.
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO).
//		--create several canonical 3D shapes borrowed from 'GLUT' library:
//		--Demonstrate how to make a 'stepped spiral' tri-strip,
//					('Method 2' in the lecture notes) and use it to build a cylinder,
//					a sphere, and a torus.
//		--Demonstrate how to make a 'degenerate stepped spiral' tri-strip
//					('Method 3' in the lecture notes) and use it to build a cylinder,
//					a sphere, and a torus.
//
// 2015.05.28 J.Tumblin:
//		--Make 'gl' and 'canvas' into global vars; drop it from fcn argument lists.
//		--Revise to make tri-strip shapes with RIGHT-handed winding(not left)
//		--extend attributes: add surface normal & texture coords

//		--Improve object-oriented design:
//				--CWebGL (holds ALL current globals, animation, etc.) and holds:
//				--CVertBuf manages a vertex buffer object, holds its ID, specifies
//					how data was arranged; holds locations/IDs for buffer, uniforms,
//					and attributes used to access it...
//				--CShape object prototype; holds Javascript array of verts used by
//					the CVertBuf object, etc.
//				--Demonstrate how to use more than one CVertBuf object for drawing...
//	--JACK: COMPARE THIS TO-- Toji Webbook's basic classes
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
  //  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  //  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// X Y Z W | Position (4)
// R G B   | Color (3)
// I J K   | Normal (3)
var floatsPerVertex = 10;

function makeSphere2(r, g, b) {
  var slices = 12; // # of slices of the sphere along the z axis, including
  // the south-pole and north pole end caps. ( >=2 req'd)
  var sliceVerts = 21; // # of vertices around the top edge of the slice
  // (same number of vertices on bottom of slice, too)
  // (HINT: odd# or prime#s help avoid accidental symmetry)
  var topColr = new Float32Array([0.3, 0.3, 0.3]); // South Pole: dark-gray
  var botColr = new Float32Array([0.8, 0.8, 0.8]); // North Pole: light-gray.
  var errColr = new Float32Array([1.0, 0.2, 0.2]); // Bright-red trouble colr
  var sliceAngle = Math.PI / slices; // One slice spans this fraction of the
  // 180 degree (Pi radian) lattitude angle between south pole and north pole.

  // Create a (global) array to hold this sphere's vertices:
  var sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex); // modified to return local var
  // # of vertices * # of elements needed to store them.
  // Each end-cap slice requires (2*sliceVerts -1) vertices
  // and each slice between them requires (2*sliceVerts).
  // Create the entire sphere as one single tri-strip array. This first for() loop steps through each 'slice', and the for() loop it contains steps through each vertex in the current slice.
  // INITIALIZE:
  var cosBot = 0.0; // cosine and sine of the lattitude angle for
  var sinBot = 0.0; // 	the current slice's BOTTOM (southward) edge.
  // (NOTE: Lattitude = 0 @equator; -90deg @south pole; +90deg at north pole)
  var cosTop = 0.0; // "	" " for current slice's TOP (northward) edge
  var sinTop = 0.0;
  // for() loop's s var counts slices;
  // 				  its v var counts vertices;
  // 					its j var counts Float32Array elements
  //					(vertices * elements per vertex)
  var j = 0; // initialize our array index
  var isFirstSlice = 1; // ==1 ONLY while making south-pole slice; 0 otherwise
  var isLastSlice = 0; // ==1 ONLY while making north-pole slice; 0 otherwise
  for (s = 0; s < slices; s++) { // for each slice of the sphere,---------------------
    // For current slice's top & bottom edges, find lattitude angle sin,cos:
    if (s == 0) {
      isFirstSlice = 1; // true ONLY when we're creating the south-pole slice
      cosBot = 0.0; // initialize: first slice's lower edge is south pole.
      sinBot = -1.0; // (cos(lat) sets slice diameter; sin(lat) sets z )
    } else { // otherwise, set new bottom edge == old top edge
      isFirstSlice = 0;
      cosBot = cosTop;
      sinBot = sinTop;
    } // then compute sine,cosine of lattitude of new top edge.
    cosTop = Math.cos((-Math.PI / 2) + (s + 1) * sliceAngle);
    sinTop = Math.sin((-Math.PI / 2) + (s + 1) * sliceAngle);
    // (NOTE: Lattitude = 0 @equator; -90deg @south pole; +90deg at north pole)
    // (       use cos(lat) to set slice radius, sin(lat) to set slice z coord)
    // Go around entire slice; start at x axis, proceed in CCW direction
    // (as seen from origin inside the sphere), generating TRIANGLE_STRIP verts.
    // The vertex-counter 'v' starts at 0 at the start of each slice, but:
    // --the first slice (the South-pole end-cap) begins with v=1, because
    // 		its first vertex is on the TOP (northwards) side of the tri-strip
    // 		to ensure correct winding order (tri-strip's first triangle is CCW
    //		when seen from the outside of the sphere).
    // --the last slice (the North-pole end-cap) ends early (by one vertex)
    //		because its last vertex is on the BOTTOM (southwards) side of slice.
    //
    if (s == slices - 1) isLastSlice = 1; // (flag: skip last vertex of the last slice).
    for (v = isFirstSlice; v < 2 * sliceVerts - isLastSlice; v++, j += floatsPerVertex) { // for each vertex of this slice,
      if (v % 2 == 0) { // put vertices with even-numbered v at slice's bottom edge;
        // by circling CCW along longitude (east-west) angle 'theta':
        // (0 <= theta < 360deg, increases 'eastward' on sphere).
        // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
        // where			theta = 2*PI*(v/2)/capVerts = PI*v/capVerts
        sphVerts[j] = cosBot * Math.cos(Math.PI * v / sliceVerts); // x
        sphVerts[j + 1] = cosBot * Math.sin(Math.PI * v / sliceVerts); // y
        sphVerts[j + 2] = sinBot; // z
        sphVerts[j + 3] = 1;
      } else { // put vertices with odd-numbered v at the the slice's top edge
        // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
        // and thus we can simplify cos(2*PI* ((v-1)/2)*sliceVerts)
        // (why (v-1)? because we want longitude angle 0 for vertex 1).
        sphVerts[j] = cosTop * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
        sphVerts[j + 1] = cosTop * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
        sphVerts[j + 2] = sinTop; // z
        sphVerts[j + 3] = 1;
      }
      sphVerts[j + 4] = r;
      sphVerts[j + 5] = g;
      sphVerts[j + 6] = b;

      sphVerts[j + 7] = sphVerts[j];
      sphVerts[j + 8] = sphVerts[j + 1];
      sphVerts[j + 9] = sphVerts[j + 2];
      if (v == 10) {
        console.log(sphVerts);
      }
    }
  }
  return sphVerts;
}
