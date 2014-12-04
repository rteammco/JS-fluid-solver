/* File: fluids.js
   Contains code to run the fluids simulation.
 */



/* Global constants: */
N_DIMS = 2;

X_DIM = 0;
Y_DIM = 1;
Z_DIM = 2;

ACT_DENSITY_DRAG = 0;
ACT_DENSITY_SRC = 1;
ACT_VELOCITY_SRC = 2;


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


// Global variables:
var canvas;
var ctx;
var DIV = 50;
var sim;
var visc = 0.1;
var diff = 0.1;
var dT = 0.01;
var dragging = false;
var show_grid = false;
var show_vels = false;
var keep_prev = false;
var action = ACT_DENSITY_DRAG;
var vel_x = 500;
var vel_y = 0;


/* When document is loaded, initialze the simulation.
 */
$(document).ready(function() {
    // initialize canvas and GUI options
    canvas = document.getElementById("fluids_canvas");
    ctx = canvas.getContext("2d");
    resetGUIParams();
    resetSim();

    // set up user interaction
    canvas.onmousedown = function(event) {
        mouseAction(event);
        dragging = true;
    }
    document.onmouseup = function(event) {
        dragging = false;
    }
    canvas.onmousemove = function(event) {
        if(dragging) {
            mouseAction(event);
        }
    }

    // run the simulation
    window.setInterval(function() {
        sim.step(ctx);
        mouseAction(false);
    }, 30);
});


/* Resets all simulation parameters to their default values. */
function setDefaultParams() {
    visc = 0.1;
    diff = 0.1;
    dT = 0.01;
    dragging = false;
    show_grid = false;
    show_vels = false;
    keep_prev = false;
    action = ACT_DENSITY_DRAG;
    vel_x = 500;
    vel_y = 0;
    DIV = 50;
}


/* Resets all simulation parameter fields in the GUI to default. */
function resetGUIParams() {
    setDefaultParams();
    document.getElementById("show_grid").checked = show_grid;
    document.getElementById("show_vels").checked = show_vels;
    document.getElementById("keep_prev").checked = keep_prev;
    document.getElementById("visc_val").value = visc;
    document.getElementById("diff_val").value = diff;
    document.getElementById("action_dens_drag").checked = true;
    document.getElementById("action_dens_src").checked = false;
    document.getElementById("action_vel_src").checked = false;
    document.getElementById("vel_x").value = vel_x;
    document.getElementById("vel_y").value = vel_y;
    document.getElementById("grid_size").value = DIV;
}

/* Handles user mouse events. */
function mouseAction(event) {
    var x = 0;
    var y = 0;
    if(event) {
        x = Math.floor(event.pageX - $(canvas).position().left);
        y = Math.floor(event.pageY - $(canvas).position().top);
    }
    if(dragging)
        sim.insertDensity(lastX, lastY, 0.15);
    else if(event) {
        if(action == ACT_DENSITY_DRAG)
            sim.insertDensity(x, y, 1);
        else if(action == ACT_DENSITY_SRC)
            sim.addDensSource(x, y, 10);
        else
            sim.addVelSource(x, y, vel_x, vel_y);
    }
    if(event) {
        lastX = x;
        lastY = y;
    }
}


/* Resets and restarts the simulation. */
function resetSim() {
    sim = new Simulator(DIV, canvas.width, canvas.height, dT);
}


/* When the GUI is changed, update simulation parameters. */
function setParamsFromUI() {
    show_grid = document.getElementById("show_grid").checked;
    show_vels = document.getElementById("show_vels").checked;
    keep_prev = document.getElementById("keep_prev").checked;
    visc = parseFloat(document.getElementById("visc_val").value);
    diff = parseFloat(document.getElementById("diff_val").value);
    action = ACT_DENSITY_DRAG;
    if(document.getElementById("action_dens_src").checked)
        action = ACT_DENSITY_SRC;
    else if(document.getElementById("action_vel_src").checked)
        action = ACT_VELOCITY_SRC;
    vel_x = parseFloat(document.getElementById("vel_x").value);
    vel_y = parseFloat(document.getElementById("vel_y").value);
    DIV = parseInt(document.getElementById("grid_size").value);
}
