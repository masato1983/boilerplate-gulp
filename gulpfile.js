const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass');
const Fiber = require('fibers');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const stylelint = require('gulp-stylelint');
const cleancss = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const sortMediaQueries = require('postcss-sort-media-queries');
const postcssColorHexAlpha = require('postcss-color-hex-alpha');
const postcssColornamesToHex = require('postcss-colornames-to-hex');
const autoprefixer = require('autoprefixer');
const postcssinlinesvg = require('postcss-inline-svg');
const postcsssvgo = require('postcss-svgo');
const postcssflexbugsfixes = require('postcss-flexbugs-fixes');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');
const prettify = require('gulp-prettify');
const prettier = require('gulp-prettier');
const linthtml = require('@linthtml/gulp-linthtml');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const zip = require('gulp-zip');
const del = require('del');
const plumber = require("gulp-plumber");
const notifier = require('gulp-notifier');
const rev = require('gulp-rev');
const rewrite = require('gulp-rev-rewrite');
const { readFileSync } = require('fs');
const gulpif = require('gulp-if');
const isProd = process.env.NODE_ENV === "production";

sass.compiler = require('sass'); // Explicitly configure the use of Dart Sass

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
    .pipe(pugLinter({ reporter: 'puglint-stylish' }))
    .pipe(pug())
    .pipe(gulpif(!isProd, prettify()))
    .pipe(prettier())
    .pipe(linthtml({
      configFile: './.linthtmlrc.json'
    }))
    .pipe(linthtml.format())
    .pipe(gulpif(isProd, htmlmin({
      collapseWhitespace: true
    })))
    .pipe(dest('./dist'))
}

// Sass

function sassTask() {
  return src([filesPath.sass, '!./src/sass/widget.scss'])
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(stylelint({
      configFile: './src/sass/.stylelintrc.json',
      reporters: [
        {formatter: 'verbose', console: true}
      ],
    }))
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass({outputStyle: 'expanded', fiber: Fiber}))
    .pipe(postcss([
      postcssColorHexAlpha(),
      postcssColornamesToHex(), // stylelint for wordpress disallow color name
      autoprefixer(),
      postcssinlinesvg(),
      postcsssvgo(),
      postcssflexbugsfixes(),
      sortMediaQueries({
        sort: 'mobile-first'
      })
    ]))
    .pipe(prettier()) // Resolved Quotes being removed around the value of an attribute selector without a dot character present, more info dart-sass issue #852
    .pipe(stylelint({
      configFile: '.stylelintrc.json',
      reporters: [
        {formatter: 'verbose', console: true}
      ],
      fix: true
    }))
    .pipe(gulpif(isProd, cleancss()))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(rename(function(path) {
      if (!path.extname.endsWith('.map')) {
        path.basename += '.min'
      }}))
    .pipe(gulpif(isProd, rev())) // Off during development: The file name changes on reload, causing the need to open a new file in the editor.
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
    .pipe(gulpif(isProd, uglify()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulpif(isProd, rev())) // Off during development: The file name changes on reload, causing the need to open a new file in the editor.
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

// Rewrite reference

function revRewrite() {
  const manifest = readFileSync('./rev-manifest.json');

  return src('./dist/**/*.{html,css}')
    .pipe(rewrite({ manifest }))
    .pipe(dest('./dist'))
}

// Watch task with BrowserSync
// デバッグ時は、`google chrome`の検証ツールの`Network`で、`Disable cache`にチェックを入れておく事

function serve() {
  browserSync.init({
    server: {
      baseDir: './dist',
      index: 'index.html'
    },
    browser: ['google chrome', 'firefox', 'safari'], // Open the site in Chrome & Firefox & Safari
    reloadDelay: 1000
  })
  watch([filesPath.pug, filesPath.sass, filesPath.js, filesPath.images], series(clean, pugTask, sassTask, jsTask, imagesTask, revRewrite)).on('change', browserSync.reload)
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
exports.revRewrite = revRewrite;

// Gulp build command
exports.build = series(clean, pugTask, sassTask, jsTask, imagesTask, revRewrite);

// Gulp default command

exports.default = series(exports.build, serve);
