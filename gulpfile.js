const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}
const path = require('path');
const postcss = require('gulp-postcss');
const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sassGlob = require('gulp-sass-glob');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const nodeNotifier = require('node-notifier');
const webpackStream = require('webpack-stream');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const del = require('del');
const {exec} = require('child_process');
const inject = require('gulp-inject');
const print = require('print');
const fs = require('fs');

var browserSync = require('browser-sync').create();

var compilationFailed = false;

function checkCompilationFailure() {
	if (compilationFailed) {
		nodeNotifier.notify({
			title: 'Sass',
			'message': 'Compilation success',
			sound: 'Submarine',
			contentImage: path.join(__dirname, 'lib/hello-monday/icons/success.png')
		});
	}

	compilationFailed = false;
}

// Compile Sass
function css(done, production = false) {
	checkCompilationFailure();
	var processors = [autoprefixer({
		cascade: false
	})];
	if (production) {
		processors.push(cssnano({preset: 'default'}));
	}

	return gulp.src('app/index.scss')
		.pipe(sassGlob())
		.pipe(sourcemaps.init())
		.pipe(sass({ /*outputStyle: 'compressed'*/}))
		.on('error', function (e) {

			compilationFailed = true;

			nodeNotifier.notify({
				'title': 'Sass',
				'message': 'Compilation failed',
				sound: 'Ping',
				contentImage: path.join(__dirname, 'lib/hello-monday/icons/error.png')
			});

			sass.logError.bind(this)(e);
		})
		.pipe(postcss(processors))
		.pipe(rename('bundle.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('www/build/css'))
		.pipe(browserSync.stream());
}

function revAssets() {
	return gulp.src(['www/build/css/bundle.css', 'www/build/js/main.js'], {base: 'www'})
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(rev())
		.pipe(sourcemaps.write('.', {addComment: false})) // For js source maps in production also checkout webpack.config.js, devtool setting.
		.pipe(gulp.dest('www'))
		.pipe(rev.manifest({
			path: 'www/build/manifest.json',
			base: 'www/build'
		}))
		.pipe(gulp.dest('www/build'));
}

function rewrite() {
	const manifest = gulp.src('www/build/manifest.json');

	return gulp.src('www/**/*.html')
		.pipe(revRewrite({ manifest }))
		.pipe(gulp.dest('www'));
}
function scripts(done, production = false, modern = true) {
	const config = require('./webpack.config')(undefined, {
		modern: modern,
		mode: production ? 'production' : 'development'
	});
	return gulp.src(['app/src/Main.ts'])
		.pipe(webpackStream(config))
		.pipe(gulp.dest('www/build/js/'))
		.pipe(browserSync.stream());
}

function injectHtmlTemplates() {

	var target = gulp.src('./app/src/base.html');
	var sources = gulp.src(['./app/src/views/**/*.html']);

	return target.pipe(inject(sources, {
		transform: function (filepath, file) {
			return file.contents.toString();
		}
	}))
		.pipe(rename('index.html'))
		.pipe(gulp.dest('./www/'));
}

// Watch Files For Changes
function watch(done) {
	if (!process.env.BROWSERSYNC_PROXY) {
		console.error('Please make sure you have BROWSERSYNC_PROXY=http://localhost:8888 or similar defined in your .env-file');
	}
	browserSync.init({
		ghostMode: false, proxy: process.env.BROWSERSYNC_PROXY, open: false, https: false
	});


	gulp.watch('app/src/**/*.html', gulp.series(injectHtmlTemplates));
	gulp.watch('app/**/*.scss', gulp.series(css));

	// gulp.watch('www/**/*', () => {
	// 	console.log('== Copy files ==');
	// 	exec('npx cap copy');
	// });

	//Uncomment this if you browsersync to reload on template changes:
	// gulp.watch('templates/*.html.twig').on('change', browserSync.reload);
}

function deleteBuildFolder(done) {
	del('www/build').then(() => done());
}

function createdDevManifestFile(done) {
	return gulp.src('app/manifest.json').pipe(gulp.dest('www/build'));
}

const devTasks = gulp.parallel(createdDevManifestFile, scripts, css, injectHtmlTemplates, watch);
const buildTasks = gulp.series(gulp.parallel((done) => scripts(done, true), (done) => css(done, true)), (done) => scripts(done, true, true), revAssets, rewrite);
const cleanTasks = gulp.series(deleteBuildFolder);

module.exports = {
	default: buildTasks,
	build: buildTasks,
	watch: devTasks,
	clean: cleanTasks,
	inject: gulp.parallel(injectHtmlTemplates)
};

