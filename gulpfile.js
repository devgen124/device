'use strict';

const gulp =          require('gulp');
const del =           require('del');
const plumber =       require('gulp-plumber');
const sass =          require('gulp-sass');
const concat =        require('gulp-concat');
const bSync =         require('browser-sync').create();
const sassGlob =      require('gulp-sass-glob');
const postcss =       require('gulp-postcss')
const autoprefixer =  require('autoprefixer');
const sourcemaps =    require('gulp-sourcemaps');
const cleanCss =      require('gulp-clean-css');
const babel =         require('gulp-babel');
const uglify =        require('gulp-uglify');
const imagemin =      require('gulp-imagemin');
const webP =          require('gulp-webp');
const svgstore =      require('gulp-svgstore');
const rename =        require('gulp-rename');
const gulpif =        require('gulp-if');

const SRC_PATH = 'src';
const DIST_PATH = 'dist';
const CSS_LIBS = ['node_modules/normalize.css/normalize.css'];
const JS_LIBS = [];

const env = process.env.NODE_ENV;

const clean = () => del(DIST_PATH);

const html = () => {
  return gulp.src(`${SRC_PATH}/*.html`)
    .pipe(gulp.dest(DIST_PATH))
    .pipe(bSync.stream());
};

const css = () => {
  return gulp.src([...CSS_LIBS, `${SRC_PATH}/sass/style.scss`])
    .pipe(plumber())
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(concat('style.min.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer({
      grid: 'autoplace'
    })]))
    .pipe(gulpif(env === 'prod', cleanCss()))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(gulp.dest(`${DIST_PATH}/css`))
    .pipe(bSync.stream());
};

const js = () => {
  return gulp.src([...JS_LIBS, `${SRC_PATH}/js/**/*.js`])
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(gulpif(env === 'prod', babel({
      presets: ['@babel/env']
    })))
    .pipe(concat('script.min.js'))
    .pipe(gulpif(env === 'prod', uglify()))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(gulp.dest(`${DIST_PATH}/js`))
    .pipe(bSync.stream());
};

const img = () => {
  return gulp.src(`${SRC_PATH}/img/**/*.{png,jpg,svg}`)
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.mozjpeg({
        quality: 80,
        progressive: true
      }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(`${DIST_PATH}/img`));
};

const webp = () => {
  return gulp.src(`${SRC_PATH}/img/**/*.{png,jpg}`)
    .pipe(webP({
      quality: 90
    }))
    .pipe(gulp.dest(`${DIST_PATH}/img`));
};

const sprite = () => {
  return gulp.src(`${SRC_PATH}/img/icon-*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest(`${DIST_PATH}/img`));
};

const fonts = () => {
  return gulp.src(`${SRC_PATH}/fonts/**/*.{woff,woff2}`)
    .pipe(gulp.dest(`${DIST_PATH}/fonts`))
}

const server = () => {
  bSync.init({
    server: 'dist/',
    notify: false,
    open: false,
    cors: true,
    ui: false
  });
};

const watch = () => {
  gulp.watch(`${SRC_PATH}/*.html`, html);
  gulp.watch(`${SRC_PATH}/sass/**/*.scss`, css);
  gulp.watch(`${SRC_PATH}/js/**/*.js`, js);
};

const pics = exports.pics = gulp.series(img, webp, sprite);

exports.default = gulp.series(clean, gulp.parallel(pics, fonts, js, css, html), gulp.parallel(watch, server));

exports.build = gulp.series(clean, gulp.parallel(pics, fonts, js, css, html));