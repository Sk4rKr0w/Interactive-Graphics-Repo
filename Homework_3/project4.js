// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(
    projectionMatrix,
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    // Rotation around the X axis
    var rotX = [1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1,
    ];

    // Rotation around the Y axis
    var rotY = [Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1,
    ];

    // Translation
    var trans = [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1,
    ];

    // Compose the model matrix
    var modelMatrix = MatrixMult(rotY, rotX); // First Y rotation, then X rotation
    modelMatrix = MatrixMult(trans, modelMatrix); // Then apply translation

    // Apply the projection
    var mvp = MatrixMult(projectionMatrix, modelMatrix);
    return mvp;
}

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
    // The constructor is a good place for taking care of the necessary initializations.
    constructor() {
        // [TO-DO] initializations

        // Vertex shader
        const vertexShaderSource = `
                attribute vec3 aPosition;
                attribute vec2 aTexCoord;
                uniform mat4 mvp;
                uniform bool uSwapYZ;
                varying vec2 vTexCoord;
                void main(void) {
                    vec3 pos = aPosition;
                    if (uSwapYZ) {
                        pos = vec3(pos.x, pos.z, pos.y);
                    }
                    gl_Position = mvp * vec4(pos, 1.0);
                    vTexCoord = aTexCoord;
                }
            `;

        // Fragment shader
        const fragmentShaderSource = `
                precision mediump float;
                uniform sampler2D uSampler;
                uniform bool uShowTexture;
                varying vec2 vTexCoord;
                void main(void) {
                    if(uShowTexture) {
                        gl_FragColor = texture2D(uSampler, vTexCoord);
                    } else {
                        gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
                    }
                }
            `;

        // Shaders
        this.shaderProgram = InitShaderProgram(vertexShaderSource, fragmentShaderSource);

        // Vertex buffer objects (VBOs)
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        // Attribute and uniform locations
        this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
        this.aTexCoord = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
        this.uTransform = gl.getUniformLocation(this.shaderProgram, "mvp");  // Fixed uniform location
        this.uSwapYZ = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
        this.uShowTexture = gl.getUniformLocation(this.shaderProgram, "uShowTexture");

        // Create a texture object
        this.texture = gl.createTexture();
    }

    // This method is called every time the user opens an OBJ file.
    // The arguments of this function are arrays of 3D vertex positions
    // and 2D texture coordinates.
    // Every item in these arrays is a floating-point value, representing one
    // coordinate of the vertex position or texture coordinate.
    // Every three consecutive elements in the vertPos array form one vertex
    // position and every three consecutive vertex positions form a triangle.
    // Similarly, every two consecutive elements in the texCoords array
    // form the texture coordinate of a vertex.
    // Note that this method can be called multiple times.
    setMesh(vertPos, texCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
    }

    // This method is called when the user changes the state of the
    // "Swap Y-Z Axes" checkbox.
    // The argument is a boolean that indicates if the checkbox is checked.
    swapYZ(swap) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uSwapYZ, swap ? 1 : 0);
    }

    // This method is called to draw the triangular mesh.
    // The argument is the transformation matrix, the same matrix returned
    // by the GetModelViewProjection function above.
    draw(trans) {
        gl.useProgram(this.shaderProgram);

        // Bind the vertex position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

        // Bind the texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.aTexCoord);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);

        // Set the transformation matrix
        gl.uniformMatrix4fv(this.uTransform, false, trans);

        // Make sure to set the sampler uniform to 0 (TEXTURE0)
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);

        // Bind the texture to TEXTURE0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    // This method is called to set the texture of the mesh.
    // The argument is an HTML IMG element containing the texture data.
    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uShowTexture, true);

    }

    // This method is called when the user changes the state of the
    // "Show Texture" checkbox.
    // The argument is a boolean that indicates if the checkbox is checked.
    showTexture(show) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uShowTexture, show ? 1 : 0);
    }
}

