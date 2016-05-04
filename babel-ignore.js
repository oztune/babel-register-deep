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

function hasBabelConfigAtFolder(path) {
	var packageJson = getPackageJsonAtFolder(path)

	// Don't compile npm modules. We assume they're already compiled.
	// This could be made an option if needed.
	//
	// REASON: We ran into an issue where the babylon package was providing
	// Babel 5 config in its .babelrc, but our babel (v6) was trying to
	// compile it.
	if (packageJson && packageJson._npmVersion) {
		return false
	}

	// Compile files with a .babelrc
	if (fs.existsSync(Path.join(path, '.babelrc'))) {
		// console.log('path has .babelrc', path)
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
