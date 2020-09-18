'use strict';
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const WorkerPlugin = require('worker-plugin');

const browsers = {
	'production': [
		'> 1%',
		'last 2 versions',
		'Firefox ESR'
	],
	'legacyBrowsers': [
		'> 1%',
		'last 2 versions',
		'Firefox ESR'
	],
	'modernBrowsers': [
		'last 2 Chrome versions',
		'not Chrome < 60',
		'last 2 Safari versions',
		'not Safari < 10.1',
		'last 2 iOS versions',
		'not iOS < 10.3',
		'last 2 Firefox versions',
		'not Firefox < 54',
		'last 2 Edge versions',
		'not Edge < 15'
	]
};

const configureTerser = () => {
	return {
		cache: true,
		parallel: true,
		sourceMap: true,
		extractComments: true,
		terserOptions: {
			compress: { warnings: false, drop_console: false },
			output: { comments: /(?:^!|@(?:license))/ }
		}
	};
};

module.exports = (env, argv) => {
	const DEV_MODE = argv.mode !== 'production';
	const MODERN = argv.modern;
	if (!DEV_MODE) {
		console.log('Building production');
	}
	let config = {
		mode: DEV_MODE ? 'development' : 'production',
		devtool: DEV_MODE ? 'sourcemap' : 'hidden-source-map', //https://webpack.js.org/configuration/devtool/#production
		entry: {
			'main': ['./app/src/Main.ts']
		},
		watch: DEV_MODE,
		stats: {
			timings: true,
			assets: false
		},
		node: {
			fs: 'empty'
		},
		optimization: {
			splitChunks: {
				cacheGroups: {
					vendors: false, // not needed for a single entry app
				},
			},
			minimizer: [
				MODERN ?
					new TerserPlugin(configureTerser())
					: new UglifyJsPlugin({
						cache: true,
						parallel: true,
						sourceMap: true,
						uglifyOptions: {
							compress: { warnings: false, drop_console: false },
							output: { comments: /(?:^!|@(?:license))/ }
							/*						mangle: {
                                          safari10: true
                                        }*/
						},
						extractComments: true
					})

			]
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								transpileOnly: true,
								experimentalWatchApi: true
							}
						}
					]
				}
			]
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js']
		},

		output: {
			filename: MODERN ? '[name].js' : '[name].legacy.js', // DEV_MODE ? '[name].js' : '[name].[chunkhash:8].js'
			chunkFilename:  MODERN ? '[name].chunk.js' : '[name].chunk.legacy.js',
			publicPath: '/build/js/'
			// path: path.resolve(__dirname, 'public/build')
		},
		plugins: [
			new ForkTsCheckerWebpackPlugin(), new WorkerPlugin()
		]
	};
	if (!DEV_MODE) {


		if (!MODERN) {
			//Add further polyfills to legacy release build:
			config.entry.main.unshift('./app/src/polyfills.legacy.js');
		} else {
			//Add polyfills to release build:
			config.entry.main.unshift('./app/src/polyfills.modern.js');
		}

		config.module.rules[0].use.unshift({
			loader: 'babel-loader',
			options: {
				cacheDirectory: true,
				presets: [
					[
						'@babel/preset-env', {
						modules: false,
						useBuiltIns: MODERN ? 'usage' : 'entry', //entry is possible too, but then an import to: import "@babel/polyfill"; must be added in polyfill.*.js files.
						targets: {
							browsers: MODERN ? browsers.modernBrowsers : browsers.legacyBrowsers
						}
					}
					]
				],
				plugins: [
					'@babel/proposal-object-rest-spread',
					'@babel/plugin-syntax-dynamic-import'
				]
			}

		});
		if (MODERN) {
			config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
		}

		config.plugins.push(new BundleAnalyzerPlugin({
			analyzerMode: 'static',
			openAnalyzer: false,
			reportFilename: MODERN ? 'bundle-report-modern.html' : 'bundle-report-legacy.html'
		}));
	}
	return config;
};
