const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const cleancss = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const pug = require('gulp-pug');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const zip = require('gulp-zip');
const del = require('del');
const plumber = require("gulp-plumber");
const notifier = require('gulp-notifier');
const rev = require('gulp-rev');

filesPath = {
  sass: './src/sass/**/*.scss',
  js: './src/js/**/*.js',
  images: './src/img/**/*.+(png|jpg|gif|svg)',
  pug:  './src/templates/**/*.pug'
}

// pug

function pugTask() {
  return src([filesPath.pug, '!./src/templates/includes/*.pug', '!./src/templates/extends/*.pug'])
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(pug())
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(dest('./dist'))
}

// Sass

function sassTask() {
  return src([filesPath.sass, '!./src/sass/widget.scss'])
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(sourcemaps.init())
    .pipe(autoprefixer())
    .pipe(sass())
    .pipe(cleancss())
    .pipe(sourcemaps.write('.'))
    .pipe(rename(function(path) {
      if (!path.extname.endsWith('.map')) {
        path.basename += '.min'
      }}))
    .pipe(rev())
    .pipe(dest('./dist/css'))
    .pipe(rev.manifest({
      merge: true
    }))
    .pipe(dest('.'))
}

// Javascript

function jsTask() {
  return src(['./src/js/project.js', './src/js/alert.js'])
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(concat({path: 'project.js', cwd: ''}))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(rev())
    .pipe(dest('./dist/js'))
    .pipe(rev.manifest({
      merge: true
    }))
    .pipe(dest('.'))
}

// Image Optimization

function imagesTask() {
  return src(filesPath.images)
    .pipe(cache(imagemin()))
    .pipe(rev())
    .pipe(dest('./dist/img/'))
    .pipe(rev.manifest({
      merge: true
    }))
    .pipe(dest('.'))
}
}

// Watch task with BrowserSync

function serve() {
  browserSync.init({
    server: './dist',
    browser: 'google chrome'
  })
  watch([filesPath.pug, filesPath.sass, filesPath.js, filesPath.images], parallel(pugTask, sassTask, jsTask, imagesTask)).on('change', browserSync.reload)
}

// Clear cache

function clearCache(done) {
  return cache.clearAll(done);
}

// Zip project

function zipTask() {
  return src(['./**/*', '!./node_modules/**/*'])
    .pipe(zip('project.zip'))
    .pipe(dest('./'))
}

// Clean "dist" folder

function clean() {
  return del(['./dist/**/*', 'rev-manifest.json'])
}

// Gulp individual tasks

exports.pugTask = pugTask;
exports.sassTask = sassTask;
exports.jsTask = jsTask;
exports.imagesTask = imagesTask;
exports.serve = serve;
exports.clearCache = clearCache;
exports.zipTask = zipTask;
exports.clean = clean;

// Gulp build command
exports.build = parallel(pugTask, sassTask, jsTask, imagesTask);

// Gulp default command

exports.default = series(clean, exports.build, serve);
