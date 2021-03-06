/*
  Digi Crush
  A game to crush the digits.
  Copyright (C) 2020 William Wong.  All rights reserved.
  williamw520@gmail.com
*/


// webgl util module
let wgl = (function() {
    const wgl = {};

    // Upload the data (mesh, color, texture, or others) to a newly allocated buffer in GPU.
    // Once uploaded, the data in the buffer can be used again and again.  It's identified by the buffer handle.
    // This should be called once during initialization.
    wgl.uploadToBuffer = (gl, dataArray, type, drawType) => {
        let buffer = gl.createBuffer();                 // Allocate a new buffer in GPU; save the buffer handle
        type = type || gl.ARRAY_BUFFER;                 // type can be gl.ELEMENT_ARRAY_BUFFER for indices data.
        drawType = drawType || gl.STATIC_DRAW;
        gl.bindBuffer(type, buffer);                    // Set the buffer as the current buffer for ARRAY_BUFFER.
        gl.bufferData(type, dataArray, drawType);       // Upload the model data to ARRAY_BUFFER and to the buffer.
        return buffer;                                  // The buffer can be used later to bind to an attribute of the vertex shader.
    }

    // Set up the buffer with the uploaded data to the attribute of a vertex shader.
    // This pipes the data items in the array of buffer to the vertex shader one at a time via the attribute.
    // After this call, it's ready to call gl.drawArrays(gl.TRIANGLES, offset-of-beginning, number-of-vertices) or its variants.
    // Call this after calling gl.useProgram(shaderProgram) to activate the current shader program.
    // This should be called every time the vertex data in the buffer changed.
    // It's called once during model setup if the vertex data don't change.
    // If the vertex data changes every frame, this should be called every time the frame is rendered in onDraw() in the game loop.
    wgl.assignBufferToAttr = (gl, buffer, attrLoc, componentsPerAttr, componentType, normalize, stride, offset) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)          // Set the buffer as the current buffer for ARRAY_BUFFER, to use the uploaded data in it.
        gl.enableVertexAttribArray(attrLoc);            // Turn on the vertex attribute array for the attribute location.
        gl.vertexAttribPointer(attrLoc,                 // Bind the current buffer of ARRAY_BUFFER to the attribute, linking it to buffer.
                               componentsPerAttr, componentType || gl.FLOAT,
                               normalize || false, stride || 0, offset || 0);
    }

    // Assign simple value to attribute of a vertex shader.  Value can be: [1f], [1f,2f], [1f,2f,3f], [1f,2f,3f,4f].
    // After this call, it's ready to call gl.drawArrays(gl.TRIANGLES, array-offset, number-of-vertices) or its variants.
    // Call this after calling gl.useProgram(shaderProgram) to activate the current shader program.
    // This should be called every time the attribute data in the buffer changed.
    // It's called once during model setup if the attribute data don't change.
    // If the attribute data changes every frame, this should be called every time the frame is rendered in onDraw() in the game loop.
    wgl.assignDataToAttr = (gl, attrLoc, attrValueTuple) => {
        gl.disableVertexAttribArray(attrLoc);           // Turn off vertex array for the attribute since data is simple value.
        let funcname = vafuncs[attrValueTuple.length];  // Look up the setter function name by the size of the tuple.
        gl[funcname](attrLoc, attrValueTuple);          // Call the setter by name.
    }
    let vafuncs = [null, "vertexAttrib1fv", "vertexAttrib2fv", "vertexAttrib3fv", "vertexAttrib4fv"];    // put null at 0th position to crash if index is out of range

    // Loads and compiles a shader.
    // gl - The WebGLRenderingContext.
    // src - he shader source.
    // type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
    wgl.loadShader = (gl, src, type) => {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
    }

    // Create a shader program from the vertex shader source code and the fragment shader source code
    wgl.createProgram = (gl, vertexSrc, fragmentSrc) => {
        let progam = gl.createProgram();
        gl.attachShader(progam, wgl.loadShader(gl, vertexSrc,   gl.VERTEX_SHADER));
        gl.attachShader(progam, wgl.loadShader(gl, fragmentSrc, gl.FRAGMENT_SHADER));
        gl.linkProgram(progam);
        return progam;
    }

    // Typical rendering loop:
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // onDraw() {
    //      gl.useProgram(shaderProgram1)
    //      wgl.assignBufferToAttr(gl, buffer1, ...)
    //      gl.uniformXX(...);
    //      gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount1)
    //
    //      gl.useProgram(shaderProgram2)
    //      wgl.assignBufferToAttr(gl, buffer2, ...)
    //      gl.uniformXX(...);
    //      gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount2)
    // }

    // Get all attributes in the shader program.  Return { attrib-name: attrib-location }
    // The attr locations returned can be used in assignBufferToAttr() or assignDataToAttr().
    wgl.getAttrMap = (gl, prog) => {
        let n = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES);
        return [...Array(n).keys()]
            .map(i              => gl.getActiveAttrib(prog, i) )                        // -> [ info ]
            .map(info           => info.name )                                          // -> [ name ]
            .reduce((m, name)   => (m[name] = gl.getAttribLocation(prog, name), m), {}) // -> { attr-name: attr-loc }
    }

    // Get all the uniform variables in the shader program.  Return { uniform-key : uniform-loc }
    // The uniform-loc returned can be used in gl.uniform1f(uniformLoc, v), gl.uniform2fv(uniformLoc, v), or variants.
    wgl.getUniformMap = (gl, prog) => {
        let n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
        return [...Array(n).keys()]
            .map(i              => gl.getActiveUniform(prog, i) )                       // -> [ info ]
            .map(info           => info.name )                                          // -> [ name ]
            .reduce((m, name)   => {
                let key = cleanUniName(name);
                m[key] = gl.getUniformLocation(prog, name);
                return m;
            }, {});                                                                     // -> { uniform-key : uniform-loc }
    }

    function cleanUniName(name) {
        return name.substr(-3) === "[0]" ? name.substr(0, name.length - 3) : name;
    }

    return wgl;
}());

export default wgl;


