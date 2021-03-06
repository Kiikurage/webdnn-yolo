const webpack = require('webpack');
const { CheckerPlugin } = require('awesome-typescript-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const HTMLWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const path = require('path');

const PrerenderSpaPlugin = require('./libs/prerender-spa-plugin');

let hashMap = new Map();

/**
 *
 * @param entryFilePath {string}
 * @param htmlTemplatePath {string}
 * @param chunkName {string}
 * @param outputRoot {string}
 * @param htmlOutputPath {string}
 */
function generateConfiguration(entryFilePath, htmlTemplatePath, chunkName, outputRoot, htmlOutputPath) {
	if (path.basename(htmlOutputPath).split('.').length === 1) {
		htmlOutputPath = path.join(htmlOutputPath, '/');
	}
	if (htmlOutputPath.endsWith('/')) {
		htmlOutputPath = path.join(htmlOutputPath, 'index.html');
	}
	
	outputRoot = path.resolve(__dirname, outputRoot);
	
	let entry = {};
	entry[chunkName] = entryFilePath;
	
	return {
		entry: entry,
		output: {
			path: outputRoot,
			filename: '[name].js'
		},
		module: {
			rules: [{
				test: /\.tsx?$/,
				use: [{
					loader: 'awesome-typescript-loader',
				}]
			}, {
				test: /\.scss$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [{
						loader: 'typings-for-css-modules-loader',
						options: {
							modules: true,
							camelCase: true,
							namedExport: true,
							minimize: false,
							getLocalIdent: (context, localIdentName, localName, options) => {
								let fileName = context.resource;
								
								if (process.env.NODE_ENV === 'production') {
									if (!hashMap.has(fileName)) hashMap.set(fileName, hashMap.size.toString());
									if (!hashMap.has(localIdentName)) hashMap.set(localIdentName, hashMap.size.toString());
									return 'c' + hashMap.get(fileName) + '_' + hashMap.get(localIdentName)
									
								} else {
									return path.basename(fileName).split('.')[0] + '-' + localName;
								}
							}
						}
					}, {
						loader: 'postcss-loader'
					}, {
						loader: 'sass-loader'
					}]
				})
			}, {
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [{
						loader: 'typings-for-css-modules-loader',
						options: {
							modules: true,
							camelCase: true,
							namedExport: true,
							minimize: false,
							getLocalIdent: (context, localIdentName, localName, options) => {
								let fileName = context.resource;
								
								if (process.env.NODE_ENV === 'production') {
									if (!hashMap.has(fileName)) hashMap.set(fileName, hashMap.size.toString());
									if (!hashMap.has(localIdentName)) hashMap.set(localIdentName, hashMap.size.toString());
									return 'c' + hashMap.get(fileName) + '_' + hashMap.get(localIdentName)
									
								} else {
									return path.basename(fileName).split('.')[0] + '-' + localName;
								}
							}
						}
					}]
				})
			}, {
				test: /\.(png|jpg|ico|svg|json)/,
				use: {
					loader: 'file-loader',
					options: {
						name: '[name].[ext]'
					}
				}
			}]
		},
		resolve: {
			modules: [
				path.join(__dirname, './frontend'),
				path.join(__dirname, './node_modules'),
			],
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss', '.css']
		},
		plugins: ([
			process.env.DEBUG ? null : new webpack.DefinePlugin({
				'process.env': {
					NODE_ENV: JSON.stringify('production')
				}
			}),
			new ExtractTextPlugin({
				filename: getPath => getPath('[name].css'),
				allChunks: true
			}),
			new CheckerPlugin(),
			process.env.NODE_ENV === 'production' ? new webpack.optimize.UglifyJsPlugin() : null,
			new HTMLWebpackPlugin({
				filename: htmlOutputPath,
				inject: 'head',
				template: htmlTemplatePath,
				chunks: [chunkName],
				inlineSource: '.(css)$',
				minify: process.env.NODE_ENV === 'production'
			}),
			new HTMLWebpackInlineSourcePlugin(),
			new PrerenderSpaPlugin(
				outputRoot,
				[path.join('/', htmlOutputPath)],
				{
					ignoreJSErrors: true
				}
			),
			new CopyWebpackPlugin([{
				from: './frontend/static',
				to: './'
			}])
		]).filter(v => v),
		cache: false
	}
}

module.exports = [
	generateConfiguration('./frontend/page/index/script.tsx', './frontend/page/index/index.html.ejs', 'index', './docs', './')
];
