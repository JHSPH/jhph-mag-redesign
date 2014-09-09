/*global module:false*/
module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/* <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> - Written by <%= pkg.author %> (<%= pkg.contact %>) */\n'
		},
		sass: {
			dist: {
				options: {
					style: 'expanded'
				},
				files: {
					'assets/css/main.css': 'assets/scss/main.scss'       // 'destination': 'source'
				}
			}
		},
		// CSSMin
		cssmin: {
			options: {
				banner: '<%= meta.banner %>'
			},
			combine: {
				files: '<%= pkg.css %>'
			}
		},
		// Uglify
		uglify: {
			options: {
				banner: '<%= meta.banner %>',
				report: 'min'
			},
			target: {
				files: '<%= pkg.js %>'
			}
		},
		// Watch
		watch: {
			scss: {
				files: 'assets/**/*.scss',
				tasks: ['sass'],
				options: {
					livereload: true
				}
			},
			css: {
				files: [ 'assets/css/main.css', '!assets/css/main.min.css' ],
				tasks: [ 'cssmin' ]
			},
			js: {
				files: [ 'assets/js/*', '!assets/js/main.min.js' ],
				tasks: [ 'uglify' ]
			}
		}
	});

	// Load tasks
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task.
	grunt.registerTask('default', [ 'sass', 'uglify', 'cssmin' ]);

};