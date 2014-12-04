/* File: fluids.js
   Contains code to run the fluids simulation.
 */



/* Global variables: */
NDIM = 2; // 2d simulation - TODO make generic updateable to 3d
NX = 10;
NY = 10;
var canvas;
var ctx;
var sim;


/* Generates a preallocated array of size n filled with zeros. */
function zeros(n) {
    return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, 0);
}

/* Generates a preallocated 2D array of size n by m filled with zeros. */
function zeros2d(n, m) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros(m));
    return arr;
}

/* Generates a preallocated 3D array of size n by m by l filled with zeros. */
function zeros3d(n, m, l) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros2d(m, l));
    return arr;
}

/* A basic 2D or 3D Point object that contains an x, y, z position.
 * Z position can be ignored (defaults to 0).
 */
function Point(x, y, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
}


/* When document is loaded, initialze the simulation.
 */
$(document).ready(function() {
    canvas = document.getElementById("fluids_canvas");
    ctx = canvas.getContext("2d");

    // set up the simulation TODO diff and visc params
    var dT = 0.007;//30 / 1000; // visc, diff
    sim = new Simulator(50, canvas.width, canvas.height, 0.1, 0.1, dT);

    // set up user interaction
    canvas.onmousedown = function(event) {
        var x = Math.floor(event.pageX - $(canvas).position().left);
        var y = Math.floor(event.pageY - $(canvas).position().top);
        //var rect = canvas.getBoundingClientRect();
        //var x = event.pageX - rect.left;
        //var y = event.pageY - rect.top;
        sim.registerClick(x, y);
    }

    // run the simulation
    window.setInterval(function() {
        sim.step(ctx);
    }, 30);
});
