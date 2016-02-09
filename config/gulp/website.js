var gulp = require('gulp');
var dutil = require('./doc-util');
var process = require('child_process');
var spawn = process.spawn;
var cleanup = require('gulp-cleanup');
var runSequence = require('run-sequence');
var clean = require('gulp-clean');

var task = /([\w\d-_]+)\.js$/.exec(__filename)[ 1 ];
var taskBuild = task + ':build';
var taskServe = task + ':serve';
var taskDev = task + ':development';

// Remove the .bundle/config file generated by `local-gem`
//
gulp.task('local-bundle-clean', function (done) {

  return gulp.src([ './.bundle/*' ], { read: false })
    .pipe(clean());

});

// Wrapper task for `bundle config --local.us_web_design_standards [ path to local gem ]`
// This task is specifically used to aid in checking standards development against
// the Jekyll site and the ruby gem package.
//
gulp.task('local-bundle-config', function (done) {

  if (!cFlags.local) {
    dutil.logMessage(
      'local-bundle-config',
      'Using us_web_design_standards_gem from Github'
   );
    return done();
  }

  dutil.logMessage(
    'local-bundle-config',
    'Creating local us_web_design_standards_gem directory'
 );

  var DEFAULT_GEM_PATH = './dist-gem';

  dutil.logMessage(
    'local-bundle-config',
    'Cloning the us_web_design_standards_gem repository to ' + DEFAULT_GEM_PATH + '.'
  );

  var gitClone = spawn(
    'git',
    [
      'clone',
      'https://github.com/18f/us_web_design_standards_gem',
      DEFAULT_GEM_PATH,
    ],
    {
      stdio: 'inherit',
    }
  );

  gitClone.on('error', function (error) { done(error); });
  gitClone.on('close', function (code) {

    if (0 !== code) { return; }

    var bundleConfig = spawn('bundle', [
      'config',
      '--local',
      'local.us_web_design_standards',
      DEFAULT_GEM_PATH,
    ]);

    bundleConfig.stdout.on('data', function (data) {

      if (/[\w\d]+/.test(data)) {

        dutil.logData('local-bundle-config:bundle', data);

      }

    });

    bundleConfig.on('error', function (error) { done(error); });

    bundleConfig.on('close', function (code) {
      if (0 === code) {
        runSequence([ 'no-cleanup', 'build' ], done);
      }
    });


  });

});

// Wrapper task for `bundle install` which installs gems for the Jekyll site.
//
gulp.task('bundle-gems', [ 'local-bundle-config' ], function (done) {

  var bundle = spawn('bundle', [ 'update' ]);

  bundle.stdout.on('data', function (data) {

    if (/[\w\d]+/.test(data)) {

      dutil.logData('bundle-gems', data);

    }

  });

  bundle.on('error', function (error) { done(error); });

  bundle.on('close', function (code) { if (0 === code) { done(); } });

});

// Base task for `gulp website` prints helpful information about available commands.
//
gulp.task(task, function (done) {

  dutil.logIntroduction();

  dutil.logHelp(
    'gulp ' + task,
    'This is the default website task. Please review the available commands.'
 );

  dutil.logCommand(
    'gulp ' + taskBuild,
    'Build the website.'
 );

  dutil.logCommand(
    'gulp ' + taskServe,
    'Preview the website locally and rebuild it when files change.'
 );

  done();

});

// Wrapper task for `jekyll serve --watch` which runs after `gulp bundle-gems` to make sure
// the gems are properly bundled.
//
gulp.task(taskServe, [ 'bundle-gems' ], function (done) {

  var jekyll = spawn('jekyll', [ 'serve', '-w' ]);

  jekyll.stdout.on('data', function (data) {

    if (/[\w\d]+/.test(data)) {

      data += '';
      data = data.replace(/[\s]+/g, ' ');

      if (/done|regen/i.test(data)) {

        dutil.logMessage(taskServe, data);

      } else {

        dutil.logData(taskServe, data);

      }

    }

  });

  jekyll.on('error', function (error) { done(error); });

  jekyll.on('close', function (code) { if (0 === code) { done(); } });


});

// Wrapper task for `jekyll build` which runs after `gulp bundle-gems` to make sure
// the gems are properly bundled.
//
gulp.task(taskBuild, [ 'bundle-gems' ], function (done) {

  var jekyll = spawn('jekyll', [ 'build' ]);

  jekyll.stdout.on('data', function (data) {

    if (/[\w\d]+/.test(data)) {

      data += '';
      data = data.replace(/[\s]+/g, ' ');
      dutil.logData(taskBuild, data);

    }

  });

  jekyll.on('error', function (error) { done(error); });

  jekyll.on('close', function (code) { if (0 === code) { done(); } });

});
