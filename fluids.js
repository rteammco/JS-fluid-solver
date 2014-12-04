/* File: fluids.js
   Contains code to run the fluids simulation.
 */



/* Global variables: */

N_DIMS = 2;

X_DIM = 0;
Y_DIM = 1;
Z_DIM = 2;

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

/* Generates a preallocated 4D zero-array of size n by m by l by k. */
function zeros4d(n, m, l, k) {
    var arr = new Array();
    for(var i=0; i<n; i++)
        arr.push(zeros3d(m, l, k));
    return arr;
}

/* When document is loaded, initialze the simulation.
 */
$(document).ready(function() {
    canvas = document.getElementById("fluids_canvas");
    ctx = canvas.getContext("2d");

    // set up the simulation TODO diff and visc params
    var dT = 0.01;//30 / 1000; // visc, diff
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
