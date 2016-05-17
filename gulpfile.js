var gulp = require('gulp');
// bootstrap vars
var fs = require('fs');

// watch vars
var livereload = require('gulp-livereload');
var config = require('./config');
var http = require('http');
// copy_over vars
var changed = require('gulp-changed');
// less vars
var less = require('gulp-less');
var path = require('path');
//var minifyCSS = require('gulp-minify-css');

// browserify vars
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
// serve vars
var connect = require('connect');
// open vars
//var open = require('gulp-open');

var jshint = require('gulp-jshint');
var notifier = require('node-notifier');
var notify = require("gulp-notify");


var babelify = require('babelify');


// per project
var file_map = [
	{
		base : './src/counter/',
		paths : [
			//'js/global.js',
			'{index.js}'
		],
		src : 'counter/index.js',
		dest : './build/js/'
	}
];
var js_ignore = ['!./src/js/{mini.js,edited.js}'];
var ignore_bundle_files = function (target) {
	if (file_map) {
		for (var ki in file_map) {
			if (file_map.hasOwnProperty(ki)) {
				var item = file_map[ki];
				var path = item.base;
				for (var kj in item.paths) {
					if (item.paths.hasOwnProperty(kj)) {
						target.push('!' + path + item.paths[kj]);
					}
				};
			}
		};
	}
	if (js_ignore && js_ignore.length) {
		target = target.concat(js_ignore);
	}
	return target;
}

	
// Tasks
gulp.task('default', ['watch', 'build', 'serve']);//, 'open'


// Watch
gulp.task('watch', function() {
	var server = livereload();
	var reload = function(file) {
		//console.log(file.path);
		server.changed(file.path);
	};
	var ignore = '!./src/{less,less/**,images,images/**,js,js/*.js}';
	var target = '';
	
	target = 'counter/*.js';
	gulp.watch(target, ['browserify'])
	.on('change', reload);
	
	target = ['src/**', ignore];
	gulp.watch(target, ['copy_over'])
	.on('change', reload);
	
	//gulp.watch('src/less/**', ['less'])
	//.on('change', reload);
	
	//gulp.watch('build/**').on('change', reload);
	
	/*
	return gulp.watch('build/**', function () {
		console.log('build');
	}).on('change', reload);
	*/
	
	
	//gulp.watch('src/images/**', ['images'])
	//.on('change', reload);

	//gulp.watch(['build/**']).on('change', reload);
	
	return gulp;
});
// Build
gulp.task('build', ['browserify', 'less', 'copy_over']);//, 'images'
//'jshint', 

	// Copy Html Files
	gulp.task('copy_over', function () {
		var dest = './build/';
		///(\.(js|coffee)$)/i.test(path.extname(name));
		//'./src/js/'
		
		// iterate through js files
		function get_files(path) {
			var text_files = [];
			var files = fs.readdirSync(path);
			if (!files.length) return text_files;
			
			for (var i = 0; i < files.length; i++) {
				var new_path = path + files[i];
				var dir = fs.statSync(new_path).isDirectory();
				console.log(new_path, dir);
				if (dir) {
					var sub_files = get_files(new_path + '/');
					text_files = (sub_files && sub_files.length) ? text_files.concat(sub_files) : text_files;
				} else {
					text_files.push(new_path);
				}
			}
			return text_files;
		}
		
		/*
		var files = get_files('./src/js/').filter(function(name) {
			return /(\.(js|coffee)$)/i.test(path.extname(name));
		});
		*/
		//console.log(files);
		
		
		var ignore = '!./src/{less,less/**}';//js/lib,js/lib/**//images,images/**,
		// ignore files that will be bundled together
		var target = ['./src/**', ignore];
		target = ['src/**', ignore];
		target = ignore_bundle_files(target);
		return gulp.src(target).pipe(changed(dest)).pipe(gulp.dest(dest));
	});
	// Compile LESS
	gulp.task('less', function () {
		var src = './src/less/**/*.less';
		var dest = './build/css/';
		return gulp.src(src)
		.pipe(less({
			paths: [path.join(__dirname, 'less', 'includes')]
		}))
		.on('error', notify.onError(function (error) {
			return 'LESS error: ' + error.message;
			//console.log('LESS ERR:', error);
		}))
		//.pipe(minifyCSS({keepBreaks:false}))
		.pipe(changed(dest))
		.pipe(gulp.dest(dest));
	});
	// Jshint
	gulp.task('jshint', function () {
		if (!file_map) {
			notifier.notify({ title : 'Notice', message : 'file_map not defined' });
			return gulp;
			
		} else {
			for (var ki in file_map) {
				if (file_map.hasOwnProperty(ki)) {
					var item = file_map[ki];
					var path = item.base;
					var target = [];
					for (var kj in item.paths) {
						if (item.paths.hasOwnProperty(kj)) {
							target.push(path + item.paths[kj]);
						}
					};
					
					gulp.src(target)//, { base : path })
					.pipe(jshint())
					.pipe(notify(function (file) {
						if (file.jshint.success) {
							// Don't show something if success 
							return false;
						}
						
						var errors = file.jshint.results.map(function (data) {
							if (data.error) {
								return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
							}
						}).join("\n");
						
						return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
					}));
					
				}
			};
		}

		return gulp;
	});
	
	// Browserify
	gulp.task('browserify', function() {
		// iterate through js files
		
		
		var src = './src/counter/index.js';
		var dest = './build/counter/';
		
		// browserify & minification version
		return browserify(src, { debug : false })
			.transform(babelify)
			.bundle()
			.on('error', notify.onError(function (error) {
				//console.log('browserify error:', error);
				return 'Browserify Error: ' + error.message;
			}))
			.pipe(source('index.js'))
			//.pipe(streamify(jshint()))
			//.pipe(streamify(uglify()))
			//
			.pipe(gulp.dest(dest));		
		
		// gulp.src(src)
		// .pipe(browserify({ debug : true }))
		//.pipe(changed(dest))
		//.pipe(gulp.dest(dest));
		
	});
// Serve
gulp.task('serve', function(){
	var app = connect()
		.use(connect.logger('dev'))
		.use(connect.static(config.root));
	
	config.server = http.createServer(app).listen(config.port);
	config.app = app;
});
// Open
gulp.task('open', ['build'], function() {
	var options = {
		url: 'http://localhost:' + config.port,
		livereload : true//,
		//app: 'google chrome'
	};

	return gulp.src('./build/index.html').pipe(open('', options));
});


// bootstrap : copies all folders and files from bootstrap/ dir.
gulp.task('bootstrap', function () {
	var dest = './src/';// where to copy files to
	var path = '../bootstrap';
	fs.stat(path, function (err, stats) {

		// exist
		if (typeof stats !== 'undefined' && stats.isDirectory()) {
			gulp.src(path + '/**').pipe(gulp.dest(dest));
		} else {
			console.log('something went wrong', err, stats.isDirectory());
		}
	});

	return gulp;
});
