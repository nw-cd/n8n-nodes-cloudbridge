module.exports = {
	env: { node: true, es2022: true },
	parser: '@typescript-eslint/parser',
	parserOptions: { sourceType: 'module' },
	plugins: ['n8n-nodes-base'],
	extends: ['plugin:n8n-nodes-base/community'],
	rules: {},
};
