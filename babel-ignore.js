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

// Here we store paths that we know are either
// governed or not governed by a babel config.
//
// NOTE: we only keep that path of the folder with
// the babel config file in it. To check if an arbitrary
// path if governed we look up its hierarchy until we get
// to one of the folders in the cache (see the top of isFileGovernedByBabelConfig).
//
// We also cache folders that we know are not governed by a babel config.
// The way we know is that we looked up the entire hierarchy and reached a
// node_modules folder before finding any governed folders. When that happens
// we cache the name of the folder right after node_modules in the path.
const cache = new Map/*<string, boolean>*/()

function isFileGovernedByBabelConfig(searchPath) {

	// We try to cache as much information as we can
	// to avoid redundant HD access. This has reduced our
	// initial compile time by ~30%.
	if (searchPath) {
		let p = searchPath
		do {
			if (Path.basename(p) === 'node_modules') {
				// We don't keep searching because
				// we don't want to use the host project's
				// settings.
				break
			}
			if (cache.has(p)) {
				return cache.get(p)
			}
			p = Path.dirname(p)
		} while (p !== '/')
	}

	// console.log('cache miss', searchPath, cache)

	try {
		var path = findUp.sync(searchPath, function (path, ...args) {
			let out

			if (Path.basename(path) === 'node_modules') {
				// We don't keep searching because
				// we don't want to use the host project's
				// settings.
				return true
			} else {
				const out = hasBabelConfigAtFolder(path)
				return out
			}
		})

		if (Path.basename(path) === 'node_modules') {
			// This file is not governed

			// We want to cache that the folder right after
			// node_modules is not governed.
			//
			// Quick hack to grab the folder right before this
			// one in the chain. We could do this better but it works for now.
			let pp = searchPath
			while (Path.basename(Path.dirname(pp)) !== 'node_modules') {
				pp = Path.dirname(pp)
			}
			cache.set(pp, false)
			
			return false
		} else {
			// This file is governed
			// console.log('GOVERNED', path)
			
			// We want to cache that this current folder
			// is governed.
			cache.set(path, true)
			
			return true
		}
	} catch (e) {
		cache.set(path, false)
		// No node_modules or babel config encountered up the hierarchy
		return false
	}
}

let total = 0

module.exports = function (path) {
	if (isFileGovernedByBabelConfig(path)) {
		// console.log('babel-register will compile', path)
		return false
	} else {
		return true
	}
}
