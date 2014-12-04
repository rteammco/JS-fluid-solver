/* File: grid.js
 * Definition for the Grid object that contains all of the current
 * velocity and density values on a 2D or 3D region.
 */


/* Grid Object Constants: */
GRID_COLOR = "white";
GRID_POINT_COLOR = "white";
GRID_ORIGIN_COLOR = "yellow";
GRID_VELOCITY_COLOR = "yellow";
GRID_LINE_WIDTH = 1;
GRID_POINT_SIZE = 3;
GRID_ORIGIN_SIZE = 5;


/* The Grid object:
   Maintains the current state of the simulation and keeps track
   of all velocities and forces. Also provides an API for drawing
   the grid itself and obtaining information about each grid cell.
   Parameters:
       nX = number of cells in the x-axis.
       nY = number of cells in the y-axis.
       width = the width of the space.
       height = the height of the space.
 */
function Grid(nX, nY, width, height) {
    // set the number of cells in each axis
    this.nX = nX;
    this.nY = nY;
    this.num_cells = (this.nX + 2) * (this.nY + 2);

    // compute the length of each cell in each axis
    this.len_cell_x = width / (this.nX + 2);
    this.len_cell_y = height / (this.nY + 2);

    // allocate the velocity and density field arrays
    this.velocities = zeros3d(2, this.nX + 2, this.nY + 2); // TODO - 2 is dimension, need 4d arr for 3D
    this.prev_velocities = zeros3d(2, this.nX + 2, this.nY + 2); // TODO - 2 is dimension
    this.densities = zeros2d(this.nX + 2, this.nY + 2);
    this.prev_densities = zeros2d(this.nX + 2, this.nY + 2);

    // Swaps the velocity array pointers (old and new).
    this.swapV = function() {
        var temp = this.velocities;
        this.velocities = this.prev_velocities;
        this.prev_velocities = temp;
    }

    // Swaps the density array pointers (old and new).
    this.swapD = function() {
        var temp = this.densities;
        this.densities = this.prev_densities;
        this.prev_densities = temp;
    }

    // Adds an immediate source to the clicked cell - TODO
    this.registerClick = function(x, y) {
        var i = Math.floor(x / this.len_cell_x);
        var j = Math.floor(y / this.len_cell_y);
        this.densities[i][j] = 1;
    }

    // Renders this Grid using the given context.
    // Set flags show_grid to true to also render the grid itself,
    //  and show_vel to true to render the velocity vectors.
    // TODO - overwrite for 3D
    this.render = function(ctx, show_grid = false, show_vels = false) {
        ctx.save();
        // draw the densities
        for(var i=0; i<this.nX+2; i++) {
            for(var j=0; j<this.nY+2; j++) {
                var dens = this.densities[i][j];
                if(dens > 0) {
                    var x = Math.floor(i * this.len_cell_x);
                    var y = Math.floor(j * this.len_cell_y);
                    ctx.fillStyle = "rgba(255, 0, 0, " + dens + ")";
                    ctx.fillRect(x, y, this.len_cell_x, this.len_cell_y);
                }
            }
        }
        // if option is enabled, draw the grid
        if(show_grid) {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            // draw the x axis lines
            for(var i=0; i<this.nX+2; i++) {
                ctx.beginPath();
                var x = Math.floor(i * this.len_cell_x);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            // draw the y axis lines
            for(var i=0; i<this.nY+2; i++) {
                ctx.beginPath();
                var y = Math.floor(i * this.len_cell_y);
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        // if option is enabled, draw the velocity vectors
        if(show_vels) {
            ctx.strokeStyle = GRID_VELOCITY_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            for(var i=0; i<this.nX+2; i++) {
                for(var j=0; j<this.nY+2; j++) {
                    var x = Math.floor(i * this.len_cell_x);
                    var y = Math.floor(j * this.len_cell_y);
                    var vX = this.velocities[X_DIM][i][j];
                    var vY = this.velocities[Y_DIM][i][j];
                    vX *= 1000;
                    vY *= 1000;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x+vX, y+vY);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
}
