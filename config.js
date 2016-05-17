var path = require('path');

module.exports = {
	port: '8080',
	root: path.resolve('./build/'),
	isWatching: false,
	app: null,
	http: null
};
