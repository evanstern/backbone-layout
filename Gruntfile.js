module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json")
        , jshint: {
            options: {
                "laxcomma": true
            }
            , ignore_warning: {
                options: {
                    "-W030": true
                }
                , files: {
                    src: ["js/*js"]
                }
            }
        }
        , uglify: {
            options: {
                sourceMap: "dist/<%= pkg.name %>.map.js"
            }
            , build: {
                src: "js/<%= pkg.name %>.js"
                , dest: "dist/<%= pkg.name %>.min.js"
            }
        }
        , jasmine: {
            browser: {
                src: ["js/<%= pkg.name %>.js"]
                , options: {
                    specs: "tests/*js"
                    , vendor: [
                        "node_modules/jquery/tmp/jquery.js"
                        , "node_modules/backbone/node_modules/underscore/underscore.js"
                        , "node_modules/backbone/backbone.js"
                    ]
                }
            }
            , amd: {
                src: ["js/<%= pkg.name %>.js"]
                , options: {
                    specs: "tests/*js"
                    , template: require("grunt-template-jasmine-requirejs")
                    , templateOptions: {
                        requireConfig: {
                            baseUrl: "js/"
                            , paths: {
                                "backbone": "../node_modules/backbone/backbone"
                                , "underscore": "../node_modules/backbone/node_modules/underscore/underscore"
                                , "jquery": "../node_modules/jquery/tmp/jquery"
                            }
                            , shim: {
                                backbone: {
                                    deps: ["underscore", "jquery"]
                                    , exports: "Backbone"
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.registerTask("default", ["jshint", "uglify"]);

    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.registerTask("test", ["jasmine"]);
};

