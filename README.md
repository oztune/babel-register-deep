# babel-register-deep
Like babel-register, but also applies to node-modules with the following rules:
- Modules with a `.babelrc` are included.
- Modules with a `package.json` with a `babel` key are included.
- Modules that were installed with npm are ignored.
