'use strict';

module.exports = function (grunt) {
  grunt.registerMultiTask('28', 'Upload queries to a 28.io project', function(){
      var $28 = new (require('./lib/28').$28)('https://portal.28.io/api');
      var done = this.async();
      var opt = this.options({
          overwrite: true,
          deleteOrphaned: true,
          simulate: false
      });
      grunt.log.writeln('Logging in...');
      $28
      .login(opt.email, opt.password)
      .then(function(response){
          grunt.log.writeln('Logged in.');
          var tokens = response.body;
          var projectToken = tokens.project_tokens['project_' + opt.projectName];
          if(!projectToken) {
              grunt.fail.fatal('project not found ' + opt.projectName);
          }
          $28
          .upload(opt.projectName, projectToken, opt.projectPath, opt.overwrite, opt.deleteOrphaned, opt.simulate, [])
          .then(function(){
              grunt.log.writeln('done');
              done();
          })
          .catch(function(error){
              grunt.fail.fatal(error);
          });
      })
      .catch(function(error){
          grunt.fail.fatal(error);
      });
  });
};
