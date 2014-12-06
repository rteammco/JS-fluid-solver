/* File: ui.js
 * Provides a method to track user interaction with the simulation and
 * an interface to query the GUI at any time.
 */


// GUI constants
ACT_DENSITY_SRC = 0;
ACT_VELOCITY_SRC = 1;
MOUSE_LEFT = 0;
MOUSE_RIGHT = 1;


// UI Class: interfaces with the GUI.
function UI(canvas_id) {
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // mouse action variables
    this.mouse_dragging = false;
    this.mouse_button = MOUSE_LEFT;
    
    // Getters:
    this.getContext = function() {
        return this.ctx;
    }

    // UI constants (call defaults() to change to default).
    this.defaults = function() {
        this.action_type = ACT_DENSITY_SRC;
        this.show_grid = false;
        this.show_vels = false;
        this.show_stats = false;
        this.visc = 0.1;
        this.diff = 0.1;
        this.dT = 0.01;
        this.grid_cols = Math.floor(this.width / 15);
        this.grid_rows = Math.floor(this.height / 15);
        this.solver_iters = 20;
    }
    this.defaults();

    // Sets the GUI parameters from internal values.
    this.setUI = function() {
        document.getElementById("show_grid").checked = this.show_grid;
        document.getElementById("show_vels").checked = this.show_vels;
        document.getElementById("show_stats").checked = this.show_stats;
        document.getElementById("visc_val").value = this.visc;
        document.getElementById("diff_val").value = this.diff;
        document.getElementById("time_step").value = this.dT;
        document.getElementById("grid_cols").value = this.grid_cols;
        document.getElementById("grid_rows").value = this.grid_rows;
        document.getElementById("solver_iters").value = this.solver_iters;
        var dens_drag_box = document.getElementById("action_dens_drag");
        var vel_drag_box = document.getElementById("action_vel_drag");
        if(this.action_type == ACT_DENSITY_SRC) {
            dens_drag_box.checked = true;
            vel_drag_box.checked = false;
        }
        else {
            dens_drag_box.checked = false;
            vel_drag_box.checked = true;
        }
    }
    this.setUI();

    // Reads simulation parameters from the GUI.
    this.readUI = function() {
        this.show_grid = document.getElementById("show_grid").checked;
        this.show_vels = document.getElementById("show_vels").checked;
        this.show_stats = document.getElementById("show_stats").checked;
        this.visc = parseFloat(document.getElementById("visc_val").value);
        this.diff = parseFloat(document.getElementById("diff_val").value);
        this.dT = parseFloat(document.getElementById("time_step").value);
        this.grid_cols = parseInt(document.getElementById("grid_cols").value);
        this.grid_rows = parseInt(document.getElementById("grid_rows").value);
        this.solver_iters = parseInt(document.getElementById("solver_iters").value);
        this.action_type = ACT_DENSITY_SRC;
        if(document.getElementById("action_vel_drag").checked)
            this.action_type = ACT_VELOCITY_SRC;
    }

    // Set up listeners for mouse events.
    this.canvas.onmousedown = function(event) {
        ui.mousedown(event, MOUSE_LEFT);
    }
    this.canvas.oncontextmenu = function(event) {
        event.preventDefault();
        ui.mousedown(event, MOUSE_RIGHT);
    }
    document.onmouseup = function(event) {
        ui.mouseup(event);
    }
    this.canvas.onmousemove = function(event) {
        ui.mousemove(event);
    }

    // Returns the x, y position on the canvas given the JavaScript event
    // containing an absolute window position.
    this.getPositionOnCanvas = function(event) {
        var x = Math.floor(event.pageX - $(this.canvas).position().left);
        var y = Math.floor(event.pageY - $(this.canvas).position().top);
        return {x:x, y:y};
    }

    // When the user clicks down the mouse, dragging starts. Left and right
    // buttons map to different actions.
    this.mousedown = function(event, button) {
        this.mouse_button = button;
        this.mouse_dragging = true;
        this.mousemove(event);
    }

    // When the user lifts the mouse, dragging ends.
    this.mouseup = function(event) {
        this.mouse_dragging = false;
    }

    // When the mouse moves, apply the appropriate source.
    this.mousemove = function(event) {
        if(!this.mouse_dragging)
            return;
        this.source = this.getPositionOnCanvas(event);
    }

    // If there is a source from user action, returns that x, y location.
    // Otherwise, returns null if user is not doing anything.
    this.getSource = function() {
        if(this.mouse_dragging)
            return this.source;
        else
            return null;
    }

    // Returns the mouse action type that the GUI is currently set to.
    this.getActionType = function() {
        if(   (this.action_type == ACT_DENSITY_SRC
               && this.mouse_button == MOUSE_LEFT)
           || (this.action_type == ACT_VELOCITY_SRC
               && this.mouse_button == MOUSE_RIGHT)
          )
            return ACT_DENSITY_SRC;
        else
            return ACT_VELOCITY_SRC;
    }
}
