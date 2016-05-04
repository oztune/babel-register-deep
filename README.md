# babel-register-deep
Like babel-register, but also compiles files in the `node_modules` folder with the following rules:
- Modules with a `.babelrc` are included.
- Modules with a `package.json` with a `babel` key are included.
- Modules that were installed with npm are ignored.
