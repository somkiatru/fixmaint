var gulp = require('gulp-help')(require('gulp'));
var gulpSequence = require('gulp-sequence');
var PluginError = require('plugin-error');
var cmd = require('node-cmd');
var config = require('./config.json');

/**
* Polls jobId. Callback is made without error if Job completes with CC < MaxRC in the allotted time
* @param {string}           jobId     jobId to check the completion of
* @param {number}           [maxRC=0] maximum allowable return code
* @param {awaitJobCallback} callback  function to call after completion
* @param {number}           tries     max attempts to check the completion of the job
* @param {number}           wait      wait time in ms between each check
*/
function awaitJobCompletion(jobId, maxRC=0, callback, tries = 30, wait = 1000) {
  if (tries > 0) {
    sleep(wait);
    cmd.get(
    'zowe jobs view job-status-by-jobid ' + jobId + ' --rff retcode --rft string',
    function (err, data, stderr) {
      if(err){
        callback(err);
      } else if (stderr){
        callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
      } else {
        retcode = data.trim();
        //retcode should either be null of in the form CC nnnn where nnnn is the return code
        if (retcode == "null") {
          awaitJobCompletion(jobId, maxRC, callback, tries - 1, wait);
        } else if (retcode.split(" ")[1] <= maxRC) {
          callback(null);
        } else {
          callback(new Error(jobId + " had a return code of " + retcode + " exceeding maximum allowable return code of " + maxRC));
        }
      }
    });
  } else {
    callback(new Error(jobId + " timed out."));
  }
}

/**
* Runs command and calls back without error if successful
* @param {string}           command   command to run
* @param {awaitJobCallback} callback  function to call after completion
*/
function simpleCommand(command, callback){
  cmd.get(command, function(err, data, stderr) { 
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      callback();
    }
  });
}

/**
 * Sleep function.
 * @param {number} ms Number of ms to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
* Submits job and verifies successful completion
* @param {string}           ds        data-set to submit
* @param {number}           [maxRC=0] maximum allowable return code
* @param {awaitJobCallback} callback  function to call after completion
*/
function submitJob(ds, maxRC=0, callback){
  var command = 'zowe jobs submit data-set "' + ds + '" --rff jobid --rft string'
  cmd.get(command, function(err, data, stderr) { 
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      // Strip unwanted whitespace/newline
      var jobId = data.trim();
      
      // Await the jobs completion
      awaitJobCompletion(jobId, maxRC, function(err){
        if(err){
          callback(err);
        } else{
          callback();
        }
      });
    }
   });
}

gulp.task('apply', 'Apply Maintenance', function (callback) {

});

gulp.task('apply-check', 'Apply Check Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.applyCheckMember + ')';
  submitJob(ds, 0, callback);
});

gulp.task('copy', 'Copy Maintenance to Runtime', function (callback) {
  // var command = 'zowe file-master-plus copy data-set "' + config.smpeEnv + '.' + config.maintainedPds + '" "' + config.runtimeEnv + '.' + config.maintainedPds + '"';
  // simpleCommand(command, callback);
  var ds = config.remoteJclPds + '(' + config.copyMember + ')';
  submitJob(ds, 0, callback);
});

gulp.task('receive', 'Receive Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.receiveMember + ')';
  submitJob(ds, 0, callback);
});

gulp.task('reject', 'Reject Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.rejectMember + ')';
  submitJob(ds, 0, callback);
});

gulp.task('restore', 'Restore Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.restoreMember + ')';
  submitJob(ds, 0, callback);
});

gulp.task('upload', 'Upload Maintenance to USS', function (callback) {
  var command = 'zowe files upload ftu "' + config.localFolder + '/' + config.localFile + '" "' + config.remoteFolder + '/' + config.remoteFile + '" -b';
  simpleCommand(command, callback);
});

gulp.task('delete', 'Delete Maintenance from USS', function (callback) {
  var command = 'zowe files delete uss "' + config.remoteFolder + '/' + config.remoteFile + '" -f';
  simpleCommand(command, callback);
});

gulp.task('deploy', 'Deploy Maintenance', gulpSequence('upload','receive','apply-check','apply', 'copy'));
gulp.task('reset', 'Reset Maintenance', gulpSequence('reject','restore','copy','delete'));