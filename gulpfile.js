"use strict";

const gulp = require('gulp'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    del = require('del'),
    spawn = require('child_process').spawn,
    readline = require('readline'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    eslint = require('gulp-eslint'),
    flow = require('flow-bin'),
    tap = require('gulp-tap'),
    sass = require('gulp-sass'),
    livereload = require('gulp-livereload'),
    serverFactory = require('spa-server');

const config = {
    buildType: 'dev',
    cleanFlag: false
};


/*
  Top level tasks
*/
gulp.task('default', ['dev', 'watch']);
gulp.task('dev', ['init.dev', 'html', 'js', 'sass', 'test']);
gulp.task('prod', ['init.prod', 'html', 'js', 'sass', 'test']);
gulp.task('clean', clean);


/*
  Sub tasks
*/
gulp.task('init.dev', ['flowserver', 'webserver'], function () {
    config.buildType = 'dev';
    config.cleanFlag = true;
    livereload.listen();
});

gulp.task('init.prod', function() {
    config.buildType = 'prod';
    config.cleanFlag = true;
});

gulp.task('flowserver', function() {
    const p = spawn(flow);
    const log = d => logProgress('Flow', d);
    p.stdout.on('data', log);
    p.stderr.on('data', log);
    p.stderr.on('error', () => gutil.beep());
    p.on('close', () => console.log(' done.'));
});

gulp.task('webserver', function () {
    serverFactory.create({
        path: './dist',
        port: 8080,
        fallback: '/index.html'
    })
    .start();
});

gulp.task('preBuild', function(cb) {
// `cleanFlag` prevents clean during watch
    if (config.cleanFlag) {
        config.cleanFlag = false;
        clean(cb);
    }
    else cb();
});

gulp.task('typecheck', function() {
    const p = spawn(flow, ['check']);
    const log = d => {
        process.stdout.write('Flow: ' + d);
    };
    p.stdout.on('data', d => {
        if(!/\D0 errors/.test(d)) {
            gutil.beep();
            log(d);
        }
    });
    p.stderr.on('data', log);
    p.stderr.on('error', () => gutil.beep());
});

gulp.task('lint', () => {
    return gulp.src(['./src/js/**/*.js'])
        .pipe(plumber({
            errorHandler: errorHandler
        }))
        // eslint
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
});

gulp.task('html', ['preBuild'], function() {
    return gulp.src('./src/*.html')
        .pipe(gulp.dest('./dist/'))
        .pipe(livereload());
});

gulp.task('js', ['preBuild', 'typecheck', 'lint'], function() {
    const src = transpile('./src/js/app.js');

    if (config.buildType === 'prod') {
        return src.pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./dist/js/'));
    }
    else {
        return src.pipe(gulp.dest('./dist/js/'))
            .pipe(livereload());
    }
});

gulp.task('sass', ['preBuild'], function () {
    return gulp.src('./src/sass/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' })
            .on('error', sass.logError))
        .on('error', errorHandler)
        .pipe(gulp.dest('./dist/css'))
        .pipe(livereload());
});

gulp.task('test', ['preBuild'], function() {
    return transpile('./src/test/**/*.js')
        .pipe(gulp.dest('./dist/test/'));
});

gulp.task('watch', function() {
    gulp.watch('./src/*.html', ['html']);
    gulp.watch(['./src/js/**/*.js'], ['js']);
    gulp.watch('./src/sass/**/*.scss', ['sass']);
    gulp.watch('./src/test/**/*.js', ['test']);
});


/*
  Utils
*/
function errorHandler(err) {
    gutil.log(err.toString());
    if (err.codeFrame) {
        gutil.log('\r\n' + err.codeFrame);
    }
    gutil.beep();
    this.emit('end');
}

function logProgress(label, data) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(data);
}

function transpile(files) {
    return gulp.src(files)
        .pipe(plumber({
            errorHandler: errorHandler
        }))
        .pipe(tap(file => {
            file.contents = browserify(file.path, { debug: true })
                .transform('babelify')
                .bundle();
            }
        ));
}

function clean(cb) {
    del('./dist/**/*')
        .then(paths => {
            // paths.forEach(p => gutil.log(`Removed ${p}`));
            cb();
        })
        .catch(e => {
             gutil.log(`\nError! Clean task failed:`);
             gutil.log('\x1b[31m', e);
        });
}
