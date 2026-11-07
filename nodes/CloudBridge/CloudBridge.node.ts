import { NodeConnectionTypes } from 'n8n-workflow';
import type {
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

const CLOUDS_NOTE =
	'Cloud connection IDs come from the CloudBridge dashboard or ' +
	'CloudBridge → Cloud → Get Many.';

export class CloudBridge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudBridge',
		name: 'cloudBridge',
		icon: { light: 'file:cloudbridge.svg', dark: 'file:cloudbridge.svg' },
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Transfer and sync files between 19 cloud storages — Yandex Disk, ' +
			'Google Drive, VK Cloud, Dropbox, OneDrive, Telegram, S3, WebDAV, FTP',
		defaults: { name: 'CloudBridge' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'cloudBridgeApi', required: true }],
		requestDefaults: {
			baseURL: 'https://cloud-bridge.ru',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// -------------------------------------------------- resource ----
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Cloud', value: 'cloud' },
					{ name: 'File', value: 'file' },
					{ name: 'Remote Upload', value: 'remoteUpload' },
					{ name: 'Share Link', value: 'shareLink' },
					{ name: 'Sync', value: 'sync' },
					{ name: 'Transfer', value: 'transfer' },
					{ name: 'Usage', value: 'usage' },
				],
				default: 'transfer',
			},

			// ------------------------------------------------- cloud ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['cloud'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many clouds',
						description: 'Connected storage accounts: ID, provider, quota',
						routing: {
							request: { method: 'GET', url: '/api/v1/connections' },
						},
					},
				],
				default: 'getAll',
			},

			// -------------------------------------------------- file ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['file'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many files',
						description: 'Direct children of a folder in a cloud',
						routing: {
							request: {
								method: 'GET',
								url: '/api/v1/files',
								qs: {
									connection_id: '={{$parameter.connectionId}}',
									path: '={{$parameter.path || ""}}',
									key: '={{$parameter.key || undefined}}',
								},
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Connection ID',
				name: 'connectionId',
				type: 'number',
				required: true,
				default: 0,
				description: CLOUDS_NOTE,
				displayOptions: { show: { resource: ['file'], operation: ['getAll'] } },
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				description: 'Relative folder path — empty = cloud root',
				displayOptions: { show: { resource: ['file'], operation: ['getAll'] } },
			},
			{
				displayName: 'Folder Key',
				name: 'key',
				type: 'string',
				default: '',
				description:
					'Provider folder id — needed for key-based clouds (Google ' +
					'Drive, OneDrive); take `key` from a previous File → Get Many',
				displayOptions: { show: { resource: ['file'], operation: ['getAll'] } },
			},

			// ---------------------------------------------- transfer ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['transfer'] } },
				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						action: 'Cancel a transfer',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/transfers/{{$parameter.transferId}}',
							},
						},
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a transfer',
						description: 'Start a cloud-to-cloud file transfer (background job)',
						routing: {
							request: {
								method: 'POST',
								url: '/api/v1/transfers',
								body: '={{ (() => { const a = $parameter.additionalFields || {}; const f = {}; if (a.paths) f.paths = String(a.paths).split(",").map((s) => s.trim()).filter(Boolean); if (a.exclude) f.exclude = String(a.exclude).split(",").map((s) => s.trim()).filter(Boolean); if (a.targetPath) f.target_path = a.targetPath; if (a.syncMode && a.syncMode !== "copy") f.sync_mode = a.syncMode; if (a.autoRetry) f.auto_retry = true; const b = { source_connection_id: $parameter.sourceConnectionId, target_connection_id: $parameter.targetConnectionId }; if (Object.keys(f).length) b.filters = f; return b; })() }}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a transfer',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/transfers/{{$parameter.transferId}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many transfers',
						routing: {
							request: {
								method: 'GET',
								url: '/api/v1/transfers',
								qs: {
									limit: '={{$parameter.limit || 20}}',
									offset: '={{$parameter.offset || 0}}',
								},
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Transfer ID',
				name: 'transferId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['transfer'], operation: ['get', 'cancel'] },
				},
			},
			{
				displayName: 'Source Connection ID',
				name: 'sourceConnectionId',
				type: 'number',
				required: true,
				default: 0,
				description: CLOUDS_NOTE,
				displayOptions: {
					show: { resource: ['transfer'], operation: ['create'] },
				},
			},
			{
				displayName: 'Target Connection ID',
				name: 'targetConnectionId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['transfer'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['transfer'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Auto Retry',
						name: 'autoRetry',
						type: 'boolean',
						default: false,
						description: 'Whether to restart on transient failures (paid plans)',
					},
					{
						displayName: 'Exclude Paths',
						name: 'exclude',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Paths',
						name: 'paths',
						type: 'string',
						default: '',
						description:
							'Comma-separated relative source paths — empty = whole cloud',
					},
					{
						displayName: 'Sync Mode',
						name: 'syncMode',
						type: 'options',
						options: [
							{ name: 'Copy (New Files Only)', value: 'copy' },
							{ name: 'Mirror (Deletes Extras!)', value: 'mirror' },
							{ name: 'New Only (Skip Existing)', value: 'new' },
							{ name: 'Update Changed', value: 'update' },
						],
						default: 'copy',
					},
					{
						displayName: 'Target Path',
						name: 'targetPath',
						type: 'string',
						default: '',
						description: 'Destination folder — empty = cloud root',
					},
				],
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				description: 'Max number of results to return',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: {
					show: { resource: ['transfer'], operation: ['getAll'] },
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				displayOptions: {
					show: { resource: ['transfer'], operation: ['getAll'] },
				},
			},

			// ------------------------------------------ remote upload ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['remoteUpload'] } },
				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						action: 'Cancel a remote upload',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/remote/{{$parameter.jobId}}',
							},
						},
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Upload a file by URL',
						description:
							'Server downloads a URL straight into the cloud — no local bandwidth',
						routing: {
							request: {
								method: 'POST',
								url: '/api/v1/remote',
								body: '={{ (() => { const a = $parameter.additionalFields || {}; const b = { connection_id: $parameter.connectionId, url: $parameter.url }; if (a.targetPath) b.target_path = a.targetPath; if (a.fileName) b.file_name = a.fileName; if (a.extraConnectionIds) b.connection_ids = String(a.extraConnectionIds).split(",").map((s) => Number(s.trim())).filter((n) => n > 0); return b; })() }}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a remote upload',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/remote/{{$parameter.jobId}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many remote uploads',
						routing: {
							request: { method: 'GET', url: '/api/v1/remote' },
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['remoteUpload'], operation: ['get', 'cancel'] },
				},
			},
			{
				displayName: 'Connection ID',
				name: 'connectionId',
				type: 'number',
				required: true,
				default: 0,
				description: CLOUDS_NOTE,
				displayOptions: {
					show: { resource: ['remoteUpload'], operation: ['create'] },
				},
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['remoteUpload'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['remoteUpload'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Target Path',
						name: 'targetPath',
						type: 'string',
						default: '',
						description: 'Destination folder — empty = cloud root',
					},
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						description: 'Empty = derived from the URL',
					},
					{
						displayName: 'Extra Connection IDs',
						name: 'extraConnectionIds',
						type: 'string',
						default: '',
						description:
							'Comma-separated — fan the upload out to several clouds (paid plans)',
					},
				],
			},

			// -------------------------------------------- share link ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['shareLink'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a share link',
						routing: {
							request: {
								method: 'POST',
								url: '/api/v1/share-links',
								body: '={{ (() => { const a = $parameter.additionalFields || {}; const b = { kind: $parameter.kind }; for (const [k, v] of Object.entries({ connection_id: a.connectionId, download_id: a.downloadId, key: a.key || undefined, path: a.path || undefined, name: a.name || undefined, mime_type: a.mimeType || undefined, size: a.size || undefined, password: a.password || undefined, ttl_days: a.ttlDays || undefined, title: a.title || undefined })) { if (v !== undefined && v !== "" && v !== 0) b[k] = v; } if (a.targetConnectionIds) b.target_connection_ids = String(a.targetConnectionIds).split(",").map((s) => Number(s.trim())).filter((n) => n > 0); return b; })() }}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many share links',
						routing: {
							request: { method: 'GET', url: '/api/v1/share-links' },
						},
					},
					{
						name: 'Revoke',
						value: 'revoke',
						action: 'Revoke a share link',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/share-links/{{$parameter.linkId}}',
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				required: true,
				options: [
					{ name: 'File — Download Link', value: 'file' },
					{ name: 'Inbox — Receive Files', value: 'inbox' },
					{ name: 'Archive — Ready ZIP', value: 'archive' },
				],
				default: 'file',
				displayOptions: {
					show: { resource: ['shareLink'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['shareLink'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Connection ID',
						name: 'connectionId',
						type: 'number',
						default: 0,
						description: 'Required for kind file/inbox. ' + CLOUDS_NOTE,
					},
					{
						displayName: 'Download ID',
						name: 'downloadId',
						type: 'number',
						default: 0,
						description: 'Required for kind archive — ID of a finished ZIP job',
					},
					{
						displayName: 'File Key',
						name: 'key',
						type: 'string',
						default: '',
						description: 'Provider file ID — from File → Get Many `key`',
					},
					{
						displayName: 'File Name',
						name: 'name',
						type: 'string',
						default: '',
					},
					{
						displayName: 'File Path',
						name: 'path',
						type: 'string',
						default: '',
						description: 'Relative path — use Key or Path for file links',
					},
					{
						displayName: 'Inbox Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Public page heading for inbox links',
					},
					{
						displayName: 'MIME Type',
						name: 'mimeType',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Password',
						name: 'password',
						type: 'string',
						typeOptions: { password: true },
						default: '',
					},
					{
						displayName: 'Size (Bytes)',
						name: 'size',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Target Connection IDs',
						name: 'targetConnectionIds',
						type: 'string',
						default: '',
						description:
							'Comma-separated — inbox uploads fan out to several clouds',
					},
					{
						displayName: 'TTL (Days)',
						name: 'ttlDays',
						type: 'number',
						default: 0,
					},
				],
			},
			{
				displayName: 'Link ID',
				name: 'linkId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['shareLink'], operation: ['revoke'] },
				},
			},

			// -------------------------------------------------- sync ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['sync'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a scheduled sync',
						routing: {
							request: {
								method: 'POST',
								url: '/api/v1/syncs',
								body: '={{ (() => { const a = $parameter.additionalFields || {}; const b = { name: $parameter.name || ("Sync " + $parameter.sourceConnectionId + " → " + $parameter.targetConnectionId), source_connection_id: $parameter.sourceConnectionId, target_connection_id: $parameter.targetConnectionId, frequency: $parameter.frequency, direction: $parameter.direction }; if (a.scheduleTime) b.schedule_time = a.scheduleTime; if (a.scheduleDay !== undefined && a.scheduleDay !== "") b.schedule_day = Number(a.scheduleDay); if (a.filters) { try { b.filters = typeof a.filters === "string" ? JSON.parse(a.filters) : a.filters; } catch (e) { throw new Error("Filters must be valid JSON"); } } return b; })() }}',
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a sync',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/syncs/{{$parameter.syncId}}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a sync',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/syncs/{{$parameter.syncId}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many syncs',
						routing: {
							request: { method: 'GET', url: '/api/v1/syncs' },
						},
					},
					{
						name: 'Run Now',
						value: 'runNow',
						action: 'Run a sync immediately',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/v1/syncs/{{$parameter.syncId}}/run',
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a sync',
						routing: {
							request: {
								method: 'PUT',
								url: '=/api/v1/syncs/{{$parameter.syncId}}',
								body: '={{ (() => { const a = $parameter.updateFields || {}; const b = {}; if (a.name) b.name = a.name; if (a.frequency) b.frequency = a.frequency; if (a.isActive !== undefined && a.isActive !== "") b.is_active = a.isActive; if (a.direction) b.direction = a.direction; if (a.scheduleTime) b.schedule_time = a.scheduleTime; if (a.scheduleDay !== undefined && a.scheduleDay !== "") b.schedule_day = Number(a.scheduleDay); return b; })() }}',
							},
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Sync ID',
				name: 'syncId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['sync'],
						operation: ['get', 'update', 'delete', 'runNow'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
			},
			{
				displayName: 'Source Connection ID',
				name: 'sourceConnectionId',
				type: 'number',
				required: true,
				default: 0,
				description: CLOUDS_NOTE,
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
			},
			{
				displayName: 'Target Connection ID',
				name: 'targetConnectionId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
			},
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				required: true,
				options: [
					{ name: 'Daily', value: 'daily' },
					{ name: 'Every 5 Minutes (Pro)', value: 'every_5_min' },
					{ name: 'Hourly', value: 'hourly' },
					{ name: 'Monthly', value: 'monthly' },
					{ name: 'Once', value: 'once' },
					{ name: 'Weekly', value: 'weekly' },
				],
				default: 'daily',
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				options: [
					{ name: 'One Way', value: 'one_way' },
					{ name: 'Two Way', value: 'two_way' },
				],
				default: 'one_way',
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['sync'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Schedule Time',
						name: 'scheduleTime',
						type: 'string',
						default: '',
						description: 'HH:MM',
					},
					{
						displayName: 'Schedule Day',
						name: 'scheduleDay',
						type: 'number',
						default: 0,
						description:
							'Day of week 0-6 for weekly, day of month for monthly',
					},
					{
						displayName: 'Filters (JSON)',
						name: 'filters',
						type: 'json',
						default: '',
						description:
							'{"folders": ["Docs"], "exclude_folders": [...], ' +
							'"file_types": ["jpg"], "min_size": 0, "max_size": 0}',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['sync'], operation: ['update'] },
				},
				options: [
					{
						displayName: 'Active',
						name: 'isActive',
						type: 'boolean',
						default: true,
						description: 'Whether the schedule runs (false = paused)',
					},
					{
						displayName: 'Direction',
						name: 'direction',
						type: 'options',
						options: [
							{ name: 'One Way', value: 'one_way' },
							{ name: 'Two Way', value: 'two_way' },
						],
						default: 'one_way',
					},
					{
						displayName: 'Frequency',
						name: 'frequency',
						type: 'options',
						options: [
							{ name: 'Daily', value: 'daily' },
							{ name: 'Every 5 Minutes (Pro)', value: 'every_5_min' },
							{ name: 'Hourly', value: 'hourly' },
							{ name: 'Monthly', value: 'monthly' },
							{ name: 'Once', value: 'once' },
							{ name: 'Weekly', value: 'weekly' },
						],
						default: 'daily',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Schedule Day',
						name: 'scheduleDay',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Schedule Time',
						name: 'scheduleTime',
						type: 'string',
						default: '',
					},
				],
			},

			// ------------------------------------------------- usage ----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['usage'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get plan and quota usage',
						routing: {
							request: { method: 'GET', url: '/api/v1/usage' },
						},
					},
				],
				default: 'get',
			},
		] as INodeProperties[],
	};
}
