var Path = require('path')
var fs = require('fs')
var findUp = require('findup')

function getPackageJsonAtFolder(path) {
	try {
		const string = fs.readFileSync(Path.join(path, 'package.json'), 'utf8')
		return JSON.parse(string)
	} catch (e) {
		// No go
		return null
	}
}

// NOTE: This is kind of a hack because it makes general
// assumptions. If these prove not to be reliable enough,
// we may need to take a white-list approach where we only
// process projects that defined a flag in their package.json
// like { "precompiled": false } (or something better).
function isModulePreCompiled (path, packageJson) {
	// This worked in npm v3
	if (packageJson._npmVersion) {
		return true
	}

	// This is for npm v5
	if (packageJson._resolved) {
		// Ex https://registry.npmjs.org/react-chartist/-/react-chartist-0.13.1.tgz
		if (packageJson._resolved.indexOf('npmjs.org') >= 0) {
			return true
		}
	}

	// Packages installed with yarn don't have that flag, so
	// we resort to an even hackier assumption.
	if (packageJson.scripts && packageJson.scripts.prepublish) {
		return true
	}
	// Even hackier for Yarn, if the package doesn't have
	// that key (Needed for react-charting)
	if (typeof packageJson.main === 'string' && packageJson.main.indexOf('dist/') === 0) {
		return true
	}

	// console.log('not precompiled', path)

	return false
}

function hasBabelConfigAtFolder(path) {
	var packageJson = getPackageJsonAtFolder(path)

	// Don't compile npm modules. We assume they're already compiled.
	// This could be made an option if needed.
	//
	// REASON: We ran into an issue where the babylon package was providing
	// Babel 5 config in its .babelrc, but our babel (v6) was trying to
	// compile it.
	if (packageJson && isModulePreCompiled(path, packageJson)) {
		return false
	}

	// Compile files with a .babelrc
	if (fs.existsSync(Path.join(path, '.babelrc'))) {
		// console.log('path has .babelrc', path)
		return true
	}

	// Babel 7 will support a js rc file as well
	if (fs.existsSync(Path.join(path, '.babelrc.js'))) {
		return true
	}

	// Compile files with a 'babel' key in their package.json
	if (packageJson && packageJson.babel) {
		return true
	}

	return false
}

function isFileGovernedByBabelConfig(searchPath) {
	try {
		var path = findUp.sync(searchPath, function (path) {
			if (Path.basename(path) === 'node_modules') return true
			return hasBabelConfigAtFolder(path)
		})

		if (Path.basename(path) === 'node_modules') {
			// This file is not governed
			return false
		} else {
			// This file is governed
			return true
		}
	} catch (e) {
		// No node_modules or babel config encountered up the hierarchy
		return false
	}
}

module.exports = function (path) {
	if (isFileGovernedByBabelConfig(path)) {
		// console.log('babel-register will compile', path)
		return false
	} else {
		return true
	}
}
