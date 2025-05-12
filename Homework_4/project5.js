// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    // Rotation around the X axis
    var rotX = [
        1,
        0,
        0,
        0,
        0,
        Math.cos(rotationX),
        Math.sin(rotationX),
        0,
        0,
        -Math.sin(rotationX),
        Math.cos(rotationX),
        0,
        0,
        0,
        0,
        1,
    ];

    // Rotation around the Y axis
    var rotY = [
        Math.cos(rotationY),
        0,
        -Math.sin(rotationY),
        0,
        0,
        1,
        0,
        0,
        Math.sin(rotationY),
        0,
        Math.cos(rotationY),
        0,
        0,
        0,
        0,
        1,
    ];

    var trans = [
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        translationX,
        translationY,
        translationZ,
        1,
    ];

    var mv = MatrixMult(rotY, rotX);
    mv = MatrixMult(trans, mv);
    return mv;
}

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
    constructor() {
        // Vertex shader
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            attribute vec3 aNormal;

            uniform mat4 uMVP;
            uniform mat4 uMV;
            uniform mat3 uNormalMatrix;
            uniform bool uSwapYZ;

            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main(void) {
                vec3 pos = aPosition;
                if (uSwapYZ) {
                    pos = vec3(pos.x, pos.z, pos.y);
                }
                gl_Position = uMVP * vec4(pos, 1.0);
                vTexCoord = aTexCoord;
                vNormal = uNormalMatrix * aNormal;
                vPosition = (uMV * vec4(pos, 1.0)).xyz;
            }
        `;

        // Fragment shader
        const fragmentShaderSource = `
            precision mediump float;

            uniform sampler2D uSampler;
            uniform bool uShowTexture;
            uniform vec3 uLightDir;
            uniform float uShininess;

            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main(void) {
                vec3 N = normalize(vNormal);
                vec3 L = normalize(uLightDir);
                vec3 V = normalize(-vPosition);
                vec3 R = reflect(-L, N);

                float diff = max(dot(N, L), 0.0);
                float spec = pow(max(dot(R, V), 0.0), uShininess);

                vec3 color = vec3(1.0, 0.5, 0.0);
                if (uShowTexture) {
                    color = texture2D(uSampler, vTexCoord).rgb;
                }

                vec3 ambient = 0.1 * color;
                vec3 diffuse = diff * color;
                vec3 specular = spec * vec3(1.0);

                gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
            }
        `;

        this.shaderProgram = InitShaderProgram(
            vertexShaderSource,
            fragmentShaderSource
        );

        // Buffers
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        // Attribute locations
        this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
        this.aTexCoord = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
        this.aNormal = gl.getAttribLocation(this.shaderProgram, "aNormal");

        // Uniform locations
        this.uMVP = gl.getUniformLocation(this.shaderProgram, "uMVP");
        this.uMV = gl.getUniformLocation(this.shaderProgram, "uMV");
        this.uNormalMatrix = gl.getUniformLocation(
            this.shaderProgram,
            "uNormalMatrix"
        );
        this.uSwapYZ = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
        this.uShowTexture = gl.getUniformLocation(
            this.shaderProgram,
            "uShowTexture"
        );
        this.uLightDir = gl.getUniformLocation(this.shaderProgram, "uLightDir");
        this.uShininess = gl.getUniformLocation(
            this.shaderProgram,
            "uShininess"
        );

        // Texture
        this.texture = gl.createTexture();
    }

    setMesh(vertPos, texCoords, normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertPos),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(normals),
            gl.STATIC_DRAW
        );

        this.numTriangles = vertPos.length / 3;
    }

    swapYZ(swap) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uSwapYZ, swap ? 1 : 0);
    }

    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.shaderProgram);

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

        // Texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.aTexCoord);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.aNormal);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);

        // Set matrices
        gl.uniformMatrix4fv(this.uMVP, false, matrixMVP);
        gl.uniformMatrix4fv(this.uMV, false, matrixMV);
        gl.uniformMatrix3fv(this.uNormalMatrix, false, matrixNormal);

        // Texture binding
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uShowTexture, 1);
    }

    showTexture(show) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uShowTexture, show ? 1 : 0);
    }

    setLightDir(x, y, z) {
        gl.useProgram(this.shaderProgram);
        gl.uniform3f(this.uLightDir, x, y, z);
    }

    setShininess(shininess) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1f(this.uShininess, shininess);
    }
}
