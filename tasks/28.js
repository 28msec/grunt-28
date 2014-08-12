/* jshint newcap: false, camelcase: false */
'use strict';

module.exports = function (grunt) {
    grunt.registerMultiTask('28', 'Upload queries to a 28.io project', function(){
        require('colors');
        var Q = require('q');
        var _ = require('lodash');
        var $28 = new (require('28').$28)('https://portal.28.io/api');
        var done = this.async();
        var opt = this.options({
            overwrite: true,
            deleteOrphaned: true,
            simulate: false
        });
        var that = this;
        var sequence = [];

        var  Options = {
            OVERWRITE_ALWAYS: 0,
            OVERWRITE_NEVER: 1,
            OVERWRITE_ASK: 2,
            OVERWRITE_IF_NEWER: 3
        };

        var projectName = this.data.project;

        //Login
        sequence.push(function() {
            grunt.log.writeln('Logging in as ' + opt.email);
            return $28.login(opt.email, opt.password).then(function(response){
                grunt.log.writeln('Logged in.');
                var credentials = response.body;
                return credentials;
            });
        });

        //Delete Project
        if(this.data.delete) {
            sequence.push(function(credentials) {
                var token = credentials.access_token;
                var isIdempotent = that.data.delete.idempotent === true;
                grunt.log.writeln('Deleting project ' + projectName);
                var defered = Q.defer();
                $28.deleteProject(projectName, token).then(function(){
                    grunt.log.writeln('Project deleted.');
                    defered.resolve(credentials);
                }).catch(function(error){
                    if(!isIdempotent) {
                        defered.reject(error);
                    } else {
                        defered.resolve(credentials);
                    }
                });
                return defered.promise;
            });
        }

        //Create Project
        if(this.data.create) {
            sequence.push(function(credentials) {
                var token = credentials.access_token;
                grunt.log.writeln('Creating project ' + projectName);
                return $28.createProject(projectName, token).then(function(response) {
                    grunt.log.writeln('Project created.');
                    credentials.project_tokens['project_' + projectName] = response.body.projectToken;
                    return credentials;
                });
            });
        }

        //Create Datasources
        if(this.data.datasources) {
            this.data.datasources.forEach(function(datasource){
                sequence.push(function(credentials){
                    grunt.log.writeln('Creating datasource ' + datasource.name);
                    var difault = datasource.default ? datasource.default : false;
                    var projectToken = credentials.project_tokens['project_' + projectName];
                    return $28.createDatasource(projectName, datasource.category, datasource.name, projectToken, difault, JSON.stringify(datasource.credentials)).then(function(){
                        grunt.log.writeln(datasource.name + ' created');
                        return credentials;
                    });
                });
            });
        }

        //Default MongoDB datasource
        if(this.data.defaultMongoDB) {
            sequence.push(function(credentials) {
                var token = credentials.access_token;
                var dbType = that.data.defaultMongoDB.dbType;
                var connString = that.data.defaultMongoDB.connString;
                var db = that.data.defaultMongoDB.db;
                var username = that.data.defaultMongoDB.username;
                var password = that.data.defaultMongoDB.password;
                var preDigested = that.data.defaultMongoDB.preDigested;
                grunt.log.writeln('Configuring default MongoDB datasource');
                return $28.updateDefaultMongoDBCredentials(
                    projectName, token, dbType, connString, db, username, password, preDigested
                ).then(function(){
                    grunt.log.writeln('Default MongoDB datasource configured');
                });
            });
        }

        //Upload Project
        if(this.data.upload) {
            sequence.push(function(credentials) {
                var projectToken = credentials.project_tokens['project_' + projectName];
                if(!projectToken) {
                    grunt.fail.fatal('project not found ' + projectName);
                }
                var projectPath = that.data.upload.projectPath;
                var overwrite = that.data.upload.overwrite ? Options['OVERWRITE_' + that.data.upload.overwrite.toUpperCase()] : Options.OVERWRITE_ALWAYS;
                var deleteOrphaned = that.data.upload.deleteOrphaned ? that.data.upload.deleteOrphaned : true;
                var simulate = that.data.upload.simulate ? that.data.upload.simulate : false;
                grunt.log.writeln('Uploading queries.');
                return $28.upload(projectName, projectToken, projectPath, overwrite, deleteOrphaned, simulate, []).then(function(){
                    grunt.log.writeln('Queries uploaded.');
                    return credentials;
                });
            });
        }

        //Run Queries
        if(this.data.runQueries) {
            var Queries = $28.api.Queries(projectName);
            this.data.runQueries.forEach(function(queries){
                queries = grunt.file.expand(queries);
                var batch = [];
                queries.forEach(function(query){
                    var queryPath = query.substring(opt.src.length + 1);
                    batch.push(function(projectToken) {
                        return Queries.executeQuery({
                            accept: 'application/28.io+json',
                            queryPath: queryPath,
                            format: '',
                            token: projectToken
                        }).then(function (data) {
                            grunt.log.writeln(('✓ '.green) + queryPath + ' returned with status code: ' + data.response.statusCode);
                        }).catch(function (error) {
                            grunt.log.errorlns(error.body);
                            grunt.log.errorlns(('✗ '.red) + queryPath + ' returned with status code: ' + error.response.statusCode);
                        });
                    });
                });

                sequence.push(function(credentials){
                    var projectToken = credentials.project_tokens['project_' + projectName];
                    var promises = [];
                    batch.forEach(function(unit){
                        promises.push(unit(projectToken));
                    });
                    return Q.all(promises).then(function(){
                        return credentials;
                    }).catch(function(error){
                        throw error;
                    });
                });
            });
        }

        //Execute commands sequentially
        sequence
        .reduce(Q.when, Q())
        .then(done)
        .catch(function(error) {
            var e;
            if(_.isObject(error) && error.body) {
                e = JSON.stringify(error.body, null, 2);
            } else if(_.isObject(error)) {
                e = JSON.stringify(error, null, 2);
            } else if(error instanceof Error || _.isString(error)) {
                e = error;
            } else {
                e = new Error('Unknown error');
            }
            grunt.fail.fatal(e);
        });
    });
};
