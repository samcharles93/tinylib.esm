import fs from 'fs';
import path from 'path';

function buildLibrary(name, className) {
    const srcCode = fs.readFileSync(`src/${name}.js`, 'utf8');
    
    // Strip the export default statement from the source
    const coreCode = srcCode.replace(/export default\s*\{[\s\S]*?\};/, '').trim();
    
    const factory = `{
    new: function (options = {}) {
        return new ${className}(options);
    }
}`;
    
    const esmCode = `${coreCode}

export default ${factory};
`;
    
    const globalCode = `(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.${name} = factory());
})(this, (function () { 'use strict';
${coreCode.split('\n').map(line => '    ' + line).join('\n')}

    return ${factory};
}));
`;
    
    fs.writeFileSync(`dist/${name}.mjs`, esmCode);
    fs.writeFileSync(`dist/${name}.global.js`, globalCode);
}

fs.mkdirSync('dist', { recursive: true });

buildLibrary('tinylib.router.esm', 'Router');
buildLibrary('tinylib.state.esm', 'Store');

console.log('Build complete: generated dist/tinylib.router.esm.mjs, dist/tinylib.router.esm.global.js, dist/tinylib.state.esm.mjs, dist/tinylib.state.esm.global.js');
;
