var gulp = require('gulp'),
	args = require('yargs').argv,
	es = require('event-stream'),
	path = require('path'),
	plugins = require("gulp-load-plugins")();

console.log(plugins);
/**
-- JSHINT --
stuff
	.pipe(jshint('.jshintrc'))
	.pipe(jshint.reporter('jshint-stylish'));

-- UGLIFY (JS) --
https://www.npmjs.org/package/gulp-uglify

gulp.src('lib/*.js')
    .pipe(uglify({outSourceMap: true}))
    .pipe(gulp.dest('dist'))

-- IF --
gulp.src('./src/*.js')
    .pipe(gulpif(condition, uglify()))
    .pipe(gulp.dest('./dist/'));

-- OTHER --
https://www.npmjs.org/package/gulp-clean
https://www.npmjs.org/package/gulp-watch/
https://www.npmjs.org/package/gulp-replace/
https://www.npmjs.org/package/gulp-build/
https://www.npmjs.org/package/gulp-if/
https://www.npmjs.org/package/gulp-html-replace/
https://www.npmjs.org/package/gulp-minify-html/
https://www.npmjs.org/package/gulp-ngmin/
https://www.npmjs.org/package/gulp-less/
https://www.npmjs.org/package/gulp-ng-html2js/

-- RECIPES --
https://github.com/gulpjs/gulp/blob/master/docs/recipes/using-external-config-file.md
https://github.com/gulpjs/gulp/blob/master/docs/recipes/pass-params-from-cli.md
https://github.com/gulpjs/gulp/blob/master/docs/recipes/split-tasks-across-multiple-files.md
https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md

== TASKS ==
Compile JS (vendor + app)
ngmin (angular minify)
uglify
jshint
(karma)
**/

/**
 * Load in our build configuration file.
 */
var config = require( './build.config.js' );

/** Output configuration data **/
var isDebug = (typeof(args.profile) === "undefined" || args.profile === "debug");
var isRelease = !isDebug;
var out_dir = (isDebug ? config.build_dir : config.compile_dir);

/**
 * Clean the output folder (removes both "debug"- and "release"-folders)
 */
gulp.task('clean', function() {
	// Get the output directories
	var dirs = './obj/' + (isDebug ? 'debug' : 'release');

	// Clean output directories
	return gulp.src(dirs, {read: false})
		.pipe(plugins.clean());
});

/**
 * Copy static assets to output directory (images / fonts)
 */
gulp.task('copy-assets', ['clean'], function(){
	var base = './src/assets';

	return es.concat(
		gulp.src(config.app_files.images, {base: base})
			.pipe(gulp.dest(out_dir + '/assets')),
		gulp.src(config.app_files.fonts, {base: base})
			.pipe(gulp.dest(out_dir + '/assets')),
		gulp.src(config.app_files.js_static, {base: base})
			.pipe(gulp.dest(out_dir + '/assets'))
	);
});

/**
 * Compile main LESS file to CSS
 */
gulp.task('less', ['clean'], function(){
	var cssFileName = "main" + (isRelease ? ".min" : "" ) + ".css";
	var minifyOpts = {
		keepSpecialComments: 0,
		removeEmpty: true
	};

	return gulp.src(config.app_files.less)
    	.pipe(plugins.less({
      		paths: [ path.join(__dirname, 'less', 'includes') ]
    	}))
		.pipe(plugins.if(isRelease, plugins.minifyCss(minifyOpts)))
		.pipe(plugins.if(isRelease, plugins.concat(cssFileName)))
    	.pipe(gulp.dest(out_dir + '/assets/css'));
});

/**
 * The `build_js` target concatenates compiled CSS and vendor CSS
 * together.
 */
gulp.task('build-js', ['clean'], function(){
	return es.concat(
		plugins.bowerFiles()
    		.pipe(plugins.flatten()),
		gulp.src(config.app_files.js, {base: './src'})
    )
    .pipe(plugins.concat("main.js"))
    .pipe(plugins.if(isRelease, plugins.uglify()))
    .pipe(gulp.dest(out_dir + '/assets/js'));
});

/**
 * HTML2JS is a Gulp plugin that takes all of your template files and
 * places them into JavaScript files as strings that are added to
 * AngularJS's template cache. This means that the templates too become
 * part of the initial payload as one JavaScript file. Neat!
 */
gulp.task('html2js', ['clean'], function(){
	var fileName = "templates-app" + (isRelease ? ".min" : "" ) + ".js";
	return gulp.src(config.app_files.tpl)
		.pipe(plugins.minifyHtml({
	        empty: true,
	        spare: true,
	        quotes: true
	    }))
		.pipe(plugins.ngHtml2js({
			moduleName: 'jingle-templates-app',
			prefix: ''
		}))
    	.pipe(plugins.concat(fileName))
	    .pipe(plugins.if(isRelease, plugins.uglify()))
	    .pipe(gulp.dest(out_dir));
});

/**
 * Compile the index.html-file and inject JavaScript- and CSS-files
 */
gulp.task('index', ['less', 'build-js'], function(){
	var cssStream = gulp.src(out_dir + '/assets/css/*.css', {read: false});
	var jsStream = gulp.src(out_dir + '/**/*.js', {read: false});

	return gulp.src(config.app_files.html)
		.pipe(plugins.inject(
			es.merge(
				jsStream,
				cssStream
			),
			{
				ignorePath: out_dir
			}
		))
		.pipe(plugins.if(isRelease, plugins.minifyHtml({
	        empty: true,
	        spare: true,
	        quotes: true
	    })))
		.pipe(gulp.dest(out_dir));
});


gulp.task('default', ['clean', 'copy-assets', 'less', 'build-js', 'html2js', 'index']);