// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {

	// Defining the basic variables like the angle expressed in radians, the cos and sin of the angle
	let rad = (rotation * Math.PI) / 180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);

    // Defining the ScaleMatrix, the RotationMatrix, and the TranslationMatrix
    let scaleMatrix = [
        scale, 0, 0,
        0, scale, 0,
        0, 0, 1
    ];

    let rotationMatrix = [
        cos, sin, 0,
        -sin, cos, 0,
        0, 0, 1
    ];

    let translationMatrix = [
        1, 0, 0,
        0, 1, 0,
        positionX, positionY, 1
    ];

    // Combining the transformations as follows: Scale -> Rotate -> Translate
    let transformMatrix = MultiplyMatrices(scaleMatrix, rotationMatrix);
    transformMatrix = MultiplyMatrices(transformMatrix, translationMatrix);

    return transformMatrix;
}

// Auxiliary function to multiply two 3x3 matrices
function MultiplyMatrices(a, b) {
    let result = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            result[i * 3 + j] = 0;
            for (let k = 0; k < 3; k++) {
                result[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
            }
        }
    }
    return result;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
	// We utilize our previous helper function to multiply the two matrices provided as input
	return MultiplyMatrices(trans1, trans2);
}

