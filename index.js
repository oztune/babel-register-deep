require('@babel/register')({
	// NOTE: I tried moving this require to the
	// top of the file, but everything stopped working.
	// Keeping it inline for now.
	ignore: [require('./babel-ignore')],
	extensions: ['.js', '.ts', '.tsx'],
	// We need this so that babel will use the .babelrc (or package.json::"babel")
	// closest to the file it's transpiling.
	babelrcRoots: true
})
