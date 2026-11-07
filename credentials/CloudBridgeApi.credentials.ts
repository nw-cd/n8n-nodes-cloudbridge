import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class CloudBridgeApi implements ICredentialType {
	name = 'cloudBridgeApi';

	displayName = 'CloudBridge API';

	icon: Icon = 'file:cloudbridge.svg';

	documentationUrl = 'https://cloud-bridge.ru/mcp';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'cb_live_… key — create it in the CloudBridge dashboard → API ' +
				'(requires the API access add-on)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://cloud-bridge.ru',
			url: '/api/v1/usage',
			method: 'GET',
		},
	};
}
