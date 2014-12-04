/* File: grid.js
 * Definition for the Grid object that contains all of the current
 * velocity and density values on a 2D or 3D region.
 */


/* Grid Object Constants: */
GRID_COLOR = "white";
GRID_DENSITY_COLOR = "0, 0, 255";
GRID_VELOCITY_COLOR = "yellow";
GRID_LINE_WIDTH = 1;


/* The Grid object:
 * Maintains the current state of the simulation and keeps track
 * of all velocities and forces. Also provides an API for drawing
 * the grid itself and obtaining information about each grid cell.
 * Parameters:
 *     N = array with number of cells in each dimension (x, y, z) axis.
 *         for 2D, set this to 1.
 *     size = array with the size of each dimension (widht, height, depth).
 *         for 2D, set this to 0.
 *     nDims = the number of dimensions (2 or 3).
 */
function Grid(N, size, nDims = 2) {
    // set the number of cells in each axis
    this.N = N;
    this.size = size;
    this.nDims = nDims;

    // compute the length of each cell in each axis
    this.len_cells = new Array();
    for(var i=0; i<this.size.length; i++)
        this.len_cells.push(this.size[i] / (this.N[i] + 2));
    
    // allocate the velocity and density field arrays (3rd dim ignored for 2D).
    this.vel = zeros4d(3, this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    this.prev_vel = zeros4d(3, this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    this.dens = zeros3d(this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    this.prev_dens = zeros3d(this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);

    // Clears out the prev value arrays.
    this.clearPrev = function() {
        this.prev_vel = zeros4d(3, this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
        this.prev_dens = zeros3d(this.N[X_DIM]+2, this.N[Y_DIM]+2, this.N[Z_DIM]+2);
    }

    // Swaps the velocity array pointers (old and new).
    this.swapV = function() {
        var temp = this.vel;
        this.vel = this.prev_vel;
        this.prev_vel = temp;
    }

    // Swaps the density array pointers (old and new).
    this.swapD = function() {
        var temp = this.dens;
        this.dens = this.prev_dens;
        this.prev_dens = temp;
    }

    // Returns an object containing the i, j, k index of the cell that
    // contains the given x, y, z point.
    this.getContainerCell = function(x, y, z=0) {
        var i = Math.floor(x / this.len_cells[X_DIM]);
        var j = Math.floor(y / this.len_cells[Y_DIM]);
        var k = Math.floor(z / this.len_cells[Z_DIM]);
        return {i:i, j:j, k:k};
    }
    // Adds an immediate source to the clicked cell - TODO
    // TODO - only works for 2D
    this.registerClick = function(x, y, val) {
        var idx = this.getContainerCell(x, y);
        this.dens[idx.i][idx.j][1] = val;
    }

    // Renders this Grid using the given context.
    // Set flags show_grid to true to also render the grid itself,
    //  and show_vel to true to render the velocity vectors.
    // Render method is changed depending on Grid dimension.
    this.render = function(ctx, show_grid = false, show_vels = false) {
        if(this.nDims == 2)
            this.render2D(ctx, show_grid, show_vels);
        else
            alert("Dimension not supported.");
    }

    // Render a 2D representation of this Grid. Only works for 2D setup.
    this.render2D = function(ctx, show_grid, show_vels) {
        ctx.clearRect(0, 0, this.size[X_DIM], this.size[Y_DIM]);
        ctx.save();
        // draw the densities
        for(var i=0; i<this.N[X_DIM]+2; i++) {
            for(var j=0; j<this.N[Y_DIM]+2; j++) {
                var dens = this.dens[i][j][1];
                if(dens > 0) {
                    var x = Math.floor(i * this.len_cells[X_DIM]);
                    var y = Math.floor(j * this.len_cells[Y_DIM]);
                    dens *= 100;
                    ctx.fillStyle = "rgba(" + GRID_DENSITY_COLOR + ", " + dens + ")";
                    ctx.fillRect(x, y, this.len_cells[X_DIM], this.len_cells[Y_DIM]);
                }
            }
        }
        // if option is enabled, draw the grid
        if(show_grid) {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            // draw the x axis lines
            for(var i=0; i<this.N[X_DIM]+2; i++) {
                ctx.beginPath();
                var x = Math.floor(i * this.len_cells[X_DIM]);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            // draw the y axis lines
            for(var i=0; i<this.N[Y_DIM]+2; i++) {
                ctx.beginPath();
                var y = Math.floor(i * this.len_cells[Y_DIM]);
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        // if option is enabled, draw the velocity vectors
        if(show_vels) {
            ctx.strokeStyle = GRID_VELOCITY_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;
            for(var i=0; i<this.N[X_DIM]+2; i++) {
                for(var j=0; j<this.N[Y_DIM]+2; j++) {
                    var x = Math.floor(i * this.len_cells[X_DIM]);
                    var y = Math.floor(j * this.len_cells[Y_DIM]);
                    var vX = this.vel[X_DIM][i][j][1];
                    var vY = this.vel[Y_DIM][i][j][1];
                    vX *= 100;
                    vY *= 100;
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
