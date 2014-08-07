'use strict';

module.exports = function (grunt) {
    grunt.registerMultiTask('28', 'Upload queries to a 28.io project', function(){
        var Q = require('q');
        var $28 = new (require('28').$28)('https://portal.28.io/api');
        var done = this.async();
        var opt = this.options({
            overwrite: true,
            deleteOrphaned: true,
            simulate: false
        });
        var that = this;
        var sequence = [];

        //Login
        sequence.push(function(){
            grunt.log.writeln('Logging in as ' + opt.email);
            return $28.login(opt.email, opt.password).then(function(response){
                grunt.log.writeln('Logged in.');
                return response;
            });
        });

        //Create Project
        if(this.data.create) {
            sequence.push(function(lastResponse){
                var token = lastResponse.body.access_token;
                var projectName = that.data.project;
                grunt.log.writeln('Creating project ' + projectName);
                return $28.createProject(projectName, token).then(function(response){
                    grunt.log.writeln('Project created.');
                    return response;
                });
            });
        }

        //Upload Project
        if(this.data.upload) {
            sequence.push(function(lastResponse){
                var projectName = that.data.project;
                var projectToken = lastResponse.body.projectToken ? lastResponse.body.projectToken : lastResponse.body.project_tokens['project_' + projectName];
                if(!projectToken) {
                    grunt.fail.fatal('project not found ' + projectName);
                }
                var projectPath = that.data.upload.projectPath;
                var overwrite = that.data.upload.overwrite ? this.data.upload.overwrite : true;
                var deleteOrphaned = that.data.upload.deleteOrphaned ? this.data.upload.deleteOrphaned : true;
                var simulate = that.data.upload.simulate ? this.data.upload.simulate : false;
                grunt.log.writeln('Uploading queries.');
                return $28.upload(projectName, projectToken, projectPath, overwrite, deleteOrphaned, simulate, []).then(function(response){
                    grunt.log.writeln('Queries uploaded.');
                    return response;
                });
            });
        }

        //Execute commands sequentially
        sequence
        .reduce(Q.when, Q())
        .then(function(){
            done();
        })
        .catch(function(error){
            if(error instanceof Error) {
                grunt.fail.fatal(error);
            } else {
                grunt.fail.fatal(JSON.stringify(error, null, 2));
            }
        });
    });
};
