var Path = require('path')
var fs = require('fs')
var findUp = require('findup')

function hasBabelConfigAtFolder(path) {
	if (fs.existsSync(Path.join(path, '.babelrc'))) {
		// console.log('path has .babelrc', path)
		return true
	}
	try {
		const string = fs.readFileSync(Path.join(path, 'package.json'), 'utf8')
		const json = JSON.parse(string)
		if (json.babel) {
			// console.log('path has json.package.babel', path)
			return true
		}
	} catch (e) {
		// No go
		return false
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
			if (searchPath === '/Users/oz/projects/top-apps/node_modules/express/index.js') {
				console.log('has babel config', searchPath)
			}
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
